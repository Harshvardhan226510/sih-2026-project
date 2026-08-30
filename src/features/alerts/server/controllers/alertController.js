import { AlertRepository } from '../repositories/alertRepository.js';
import { getSyncData, getBootstrapData } from '../services/sync.js';
import { ingestFromProvider } from '../services/ingestion.js';
import { IMDAlertProvider } from '../providers/imd.js';
import { PushRepository } from '../repositories/pushRepository.js';
import { getVapidPublicKey as vapidKey, getPushStats } from '../services/webPush.js';
import { getMqttStatus } from '../services/mqttService.js';
import { reverseGeocode } from '../services/location.js';
import { WeatherProvider } from '../providers/base.js';
import { runExec } from '../db/connection.js';

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
export function listAlerts(req, res) {
  const { severity, event, area, status, page, limit, updatedSince } = req.query;
  const result = repo.getAll({
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
export function getAlert(req, res) {
  const alert = repo.getById(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  const etag = `"alert-${alert.id}-${alert.updatedAt}"`;
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.set('ETag', etag);
  res.json(alert);
}
export function getAlertHistory(req, res) {
  const history = repo.getAlertHistory(req.params.id);
  if (!history || history.length === 0) return res.status(404).json({ error: 'Alert not found or no history' });
  res.json(history);
}
export async function syncAlerts(req, res) {
  const since = parseInt(req.query.since);
  if (isNaN(since)) return res.status(400).json({ error: 'since parameter required' });
  const { state, district, networkProfile, deviceId } = req.query;
  const data = getSyncData(since, { state, district, networkProfile });
  
  if (deviceId) {
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    const pending = deliveryRepo.getPendingAlerts(deviceId);
    data.pendingDeliveries = pending;
  }

  const etag = `"sync-${data.revision}"`;
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.set('ETag', etag);
  res.json(data);
}
export function bootstrapAlerts(req, res) {
  const data = getBootstrapData();
  res.json(data);
}
export function alertSummary(req, res) {
  const summary = repo.getSummary();
  const etag = `"summary-${summary.revision}"`;
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.set('ETag', etag);
  res.json(summary);
}
export function healthCheck(req, res) {
  const imdStatus = repo.getProviderStatus('imd');
  const activeCount = repo.getSummary().total;
  const allAlerts = repo.getAll({ limit: 1000 });
  const expiredCount = allAlerts.alerts.filter(a => a.status === 'EXPIRED').length;
  const imdHealthy = imdStatus && imdStatus.consecutive_failures === 0;
  const pushStats = getPushStats();
  const mqttStatus = getMqttStatus();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    revision: repo.getCurrentRevision(),
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
      // brokerUrl is safe to expose; credentials (username/password) are never included
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

export function cleanupTestAlerts(req, res) {
  try {
    const delRevs = runExec("DELETE FROM alert_revisions WHERE alert_id IN (SELECT id FROM alerts WHERE id LIKE '%test-%' OR source_id LIKE 'test-%')");
    const delAlerts = runExec("DELETE FROM alerts WHERE id LIKE '%test-%' OR source_id LIKE 'test-%'");
    res.json({
      status: 'ok',
      cleanedRevisions: delRevs.changes,
      cleanedAlerts: delAlerts.changes
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
    deliveryRepo.registerDevice(deviceId, state || null, district || null);
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
    
    // Register or update device with new location
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    deliveryRepo.registerDevice(deviceId, state, district);

    // If the device has a push subscription, update its target location
    pushRepo.updateLocation(deviceId, state, district);

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
    deliveryRepo.acknowledgeAlert(deviceId, alertId);
    res.json({ status: 'ok', alertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/push/subscribe
 * Registers or updates a Web Push subscription for a device.
 * Associates the subscription with a state/district for location-targeted alerts.
 *
 * Body: { deviceId, subscription: { endpoint, keys: { p256dh, auth } }, state?, district? }
 *
 * Security: Only stores endpoint and client keys (p256dh, auth).
 * VAPID private key is never involved in this handler.
 */
export async function subscribePush(req, res) {
  const { deviceId, subscription, state, district } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: 'subscription with endpoint, keys.p256dh, keys.auth required' });
  }

  try {
    // Also ensure device is registered in devices table
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    deliveryRepo.registerDevice(deviceId, state || null, district || null);

    pushRepo.upsert(
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

/**
 * DELETE /api/push/subscribe
 * Removes a push subscription.
 * Body: { endpoint }
 */
export async function unsubscribePush(req, res) {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
  try {
    pushRepo.remove(endpoint);
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/push/vapid-public-key
 * Returns only the VAPID public key for the browser to use when subscribing.
 * The VAPID private key is NEVER returned here or anywhere in the API.
 */
export function getVapidPublicKey(req, res) {
  const key = vapidKey();
  if (!key) {
    return res.status(503).json({ error: 'Web Push not configured on server' });
  }
  res.json({ publicKey: key });
}