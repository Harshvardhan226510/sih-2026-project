import { AlertRepository } from '../repositories/alertRepository.js';
import { getSyncData, getBootstrapData } from '../services/sync.js';
import { ingestFromProvider } from '../services/ingestion.js';
import { IMDAlertProvider } from '../providers/imd.js';
import { PushRepository } from '../repositories/pushRepository.js';
import { getVapidPublicKey as vapidKey, getPushStats } from '../services/webPush.js';
import { getMqttStatus } from '../services/mqttService.js';
import { reverseGeocode } from '../services/location.js';
import { WeatherProvider } from '../providers/base.js';
import { getSupabaseClient } from '../db/supabaseClient.js';
import logger from '../utils/logger.js';

class MockCapProvider extends WeatherProvider {
  constructor(alerts) {
    super();
    this._alerts = alerts;
  }
  get name() { return 'imd'; }
  get type() { return 'alert'; }
  async fetchAlerts() { return this._alerts; }
}
const repo = new AlertRepository();
const pushRepo = new PushRepository();

export async function listAlerts(req, res) {
  const { severity, event, area, status, page, limit, updatedSince } = req.query;
  const result = await repo.getAll({
    severity, event, area, status,
    page: parseInt(page) || 1,
    limit: Math.min(parseInt(limit) || 50, 100),
    updatedSince,
  });
  const etag = `"alerts-${result.total}-${result.page}"`;
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.set('ETag', etag);
  res.json(result);
}

export async function getAlert(req, res) {
  const alert = await repo.getById(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  const etag = `"alert-${alert.id}-${alert.updatedAt}"`;
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.set('ETag', etag);
  res.json(alert);
}

export async function getAlertHistory(req, res) {
  const history = await repo.getAlertHistory(req.params.id);
  if (!history || history.length === 0) return res.status(404).json({ error: 'Alert not found or no history' });
  res.json(history);
}

export async function syncAlerts(req, res) {
  const since = parseInt(req.query.since);
  if (isNaN(since)) return res.status(400).json({ error: 'since parameter required' });
  const { state, district, networkProfile, deviceId } = req.query;
  
  // getSyncData uses repo, so we need to await it
  const data = await repo.getSyncData(since, { state, district, networkProfile });
  
  if (deviceId) {
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    const pending = await deliveryRepo.getPendingAlerts(deviceId);
    data.pendingDeliveries = pending;
  }

  const etag = `"sync-${data.revision}"`;
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.set('ETag', etag);
  res.json(data);
}

export async function bootstrapAlerts(req, res) {
  const data = await repo.getBootstrapData();
  res.json(data);
}

export async function alertSummary(req, res) {
  const summary = await repo.getSummary();
  const etag = `"summary-${summary.revision}"`;
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.set('ETag', etag);
  res.json(summary);
}

export async function healthCheck(req, res) {
  const imdStatus = await repo.getProviderStatus('imd');
  const summary = await repo.getSummary();
  const activeCount = summary.total;
  const allAlerts = await repo.getAll({ limit: 1000 });
  const expiredCount = allAlerts.alerts.filter(a => a.status === 'EXPIRED').length;
  const imdHealthy = imdStatus && imdStatus.consecutive_failures === 0;
  const pushStats = await getPushStats();
  const mqttStatus = getMqttStatus();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    revision: await repo.getCurrentRevision(),
    database: { status: 'ok', type: 'supabase' },
    ingestion: { enabled: (await import('../config/index.js')).default.ingestion.enabled },
    imd: {
      status: imdHealthy ? 'healthy' : (imdStatus ? 'degraded' : 'unknown'),
      lastSuccessAt: imdStatus?.last_success_at || null,
      lastFailureAt: imdStatus?.last_failure_at || null,
      lastError: imdStatus?.last_error || null,
      consecutiveFailures: imdStatus?.consecutive_failures || 0,
      alertCount: imdStatus?.alert_count || 0,
      activeAlerts: activeCount,
      expiredAlerts: expiredCount,
    },
    mqtt: {
      enabled: mqttStatus.enabled,
      state: mqttStatus.state,
      topic: mqttStatus.topic,
      lastMessageAt: mqttStatus.lastMessageAt,
      messageCount: mqttStatus.messageCount,
      brokerUrl: mqttStatus.brokerUrl,
    },
    push: {
      subscriptions: pushStats.total,
      withLocation: pushStats.withDistrict,
      recentSuccess: pushStats.recentSuccess,
      recentFailure: pushStats.recentFailure,
    },
  });
}

export async function triggerIngestion(req, res) {
  const startTime = new Date().toISOString();
  try {
    const provider = new IMDAlertProvider();
    const result = await ingestFromProvider(provider);
    res.json({
      provider: 'imd',
      fetchTime: startTime,
      feedStatus: result.error ? 'error' : 'ok',
      result,
    });
  } catch (err) {
    res.status(500).json({
      provider: 'imd',
      fetchTime: startTime,
      feedStatus: 'error',
      error: err.message,
    });
  }
}

export async function injectTestAlerts(req, res) {
  try {
    const { alerts } = req.body;
    if (!Array.isArray(alerts)) {
      return res.status(400).json({ error: 'Body must contain an alerts array' });
    }
    const provider = new MockCapProvider(alerts);
    const result = await ingestFromProvider(provider);
    res.json({ status: 'ok', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function cleanupTestAlerts(req, res) {
  try {
    const client = getSupabaseClient();
    // Delete from Supabase. Revisions and other dependencies cascade deleted.
    const { data: alerts, error: err1 } = await client.from('alerts').select('id').or("id.ilike.%test-%,source_id.ilike.test-%");
    const ids = alerts ? alerts.map(a => a.id) : [];
    
    if (ids.length > 0) {
       await client.from('alerts').delete().in('id', ids);
    }
    
    res.json({
      status: 'ok',
      cleanedAlerts: ids.length
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to cleanup test alerts');
    res.status(500).json({ error: err.message });
  }
}

export async function registerDevice(req, res) {
  const { deviceId, state, district } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
  
  try {
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    await deliveryRepo.registerDevice(deviceId, state || null, district || null);
    res.json({ status: 'ok', deviceId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateLocation(req, res) {
  const { deviceId, latitude, longitude, accuracy } = req.body;
  
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'latitude and longitude must be numbers' });
  }

  try {
    const { state, district } = await reverseGeocode(latitude, longitude);
    
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    await deliveryRepo.registerDevice(deviceId, state, district);
    await pushRepo.updateLocation(deviceId, state, district);

    res.json({ status: 'ok', state, district, accuracy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function acknowledgeAlert(req, res) {
  const { deviceId, alertId } = req.body;
  if (!deviceId || !alertId) return res.status(400).json({ error: 'deviceId and alertId required' });
  
  try {
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    await deliveryRepo.acknowledgeAlert(deviceId, alertId);
    res.json({ status: 'ok', alertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function subscribePush(req, res) {
  const { deviceId, subscription, state, district } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: 'subscription with endpoint, keys.p256dh, keys.auth required' });
  }

  try {
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    await deliveryRepo.registerDevice(deviceId, state || null, district || null);

    await pushRepo.upsert(
      deviceId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      state || null,
      district || null
    );
    res.json({ status: 'ok', deviceId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function unsubscribePush(req, res) {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
  try {
    await pushRepo.remove(endpoint);
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getVapidPublicKey(req, res) {
  const key = vapidKey();
  if (!key) {
    return res.status(503).json({ error: 'Web Push not configured on server' });
  }
  res.json({ publicKey: key });
}