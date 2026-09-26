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
import { MOCK_ALERTS } from '../utils/mockAlerts.js';

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

function handleConfigError(err, res) {
  if (err.isConfigError) {
    return res.status(503).json({
      error: 'Backend Configuration Missing',
      message: 'The authoritative Supabase backend is not configured.',
      requiredVariables: {
        serverOnly: err.missingVars,
        frontend: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
        location: '.env file at the project root'
      },
      instructions: 'Please configure the required environment variables in your .env file and restart the server using `npm run dev:all`. Never expose the server-only service-role key to the frontend.'
    });
  }
  return res.status(500).json({ error: err.message });
}

export async function listAlerts(req, res) {
  try {
    const { severity, event, area, status, page, limit, updatedSince } = req.query;
    const result = await repo.getAll({
      severity, event, area, status,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
      updatedSince,
    });
    // --- MOCK INJECTION FOR PROTOTYPE VIDEO ---
    if (result.alerts.length === 0) {
      result.alerts = [...MOCK_ALERTS];
      result.total = MOCK_ALERTS.length;
    }
    // ------------------------------------------

    const etag = `"alerts-${result.total}-${result.page}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.set('ETag', etag);
    res.json(result);
  } catch (err) {
    handleConfigError(err, res);
  }
}

export async function getAlert(req, res) {
  try {
    const alert = await repo.getById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    const etag = `"alert-${alert.id}-${alert.updatedAt}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.set('ETag', etag);
    res.json(alert);
  } catch (err) {
    handleConfigError(err, res);
  }
}

export async function getAlertHistory(req, res) {
  try {
    const history = await repo.getAlertHistory(req.params.id);
    if (!history || history.length === 0) return res.status(404).json({ error: 'Alert not found or no history' });
    res.json(history);
  } catch (err) {
    handleConfigError(err, res);
  }
}

export async function syncAlerts(req, res) {
  try {
    const since = parseInt(req.query.since);
    if (isNaN(since)) return res.status(400).json({ error: 'since parameter required' });
    const { state, district, networkProfile, deviceId } = req.query;
    
    const data = await repo.getSyncData(since, { state, district, networkProfile });
    
    if (deviceId) {
      const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
      const pending = await deliveryRepo.getPendingAlerts(deviceId);
      data.pendingDeliveries = pending;
    }

    // --- MOCK INJECTION FOR PROTOTYPE VIDEO ---
    if (data.alerts.length === 0) {
      data.alerts = [...MOCK_ALERTS];
      data.revision = (data.revision || 1) + 1000; 
    }
    // ------------------------------------------

    const etag = `"sync-${data.revision}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.set('ETag', etag);
    res.json(data);
  } catch (err) {
    handleConfigError(err, res);
  }
}

export async function bootstrapAlerts(req, res) {
  try {
    const data = await repo.getBootstrapData();
    // --- MOCK INJECTION FOR PROTOTYPE VIDEO ---
    if (data.alerts.length === 0) {
      data.alerts = [...MOCK_ALERTS];
      data.activeIds = MOCK_ALERTS.map(a => a.id);
    }
    // ------------------------------------------
    res.json(data);
  } catch (err) {
    handleConfigError(err, res);
  }
}

export async function alertSummary(req, res) {
  try {
    const summary = await repo.getSummary();
    const etag = `"summary-${summary.revision}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.set('ETag', etag);
    res.json(summary);
  } catch (err) {
    handleConfigError(err, res);
  }
}

export async function healthCheck(req, res) {
  try {
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
  } catch (err) {
    if (err.isConfigError) {
      return res.status(503).json({
        status: 'error',
        error: 'Missing Backend Configuration',
        database: { status: 'unconfigured', type: 'supabase' },
        requiredVariables: {
          serverOnly: err.missingVars,
          frontend: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
        },
        message: 'The Supabase backend is not configured correctly in .env.'
      });
    }
    return res.status(500).json({ status: 'error', error: err.message });
  }
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
    if (err.isConfigError) return handleConfigError(err, res);
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
    handleConfigError(err, res);
  }
}

export async function cleanupTestAlerts(req, res) {
  try {
    const client = getSupabaseClient();
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
    handleConfigError(err, res);
  }
}

export async function registerDevice(req, res) {
  try {
    const { deviceId, state, district } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
    
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    await deliveryRepo.registerDevice(deviceId, state || null, district || null);
    res.json({ status: 'ok', deviceId });
  } catch (err) {
    handleConfigError(err, res);
  }
}

export async function updateLocation(req, res) {
  try {
    const { deviceId, latitude, longitude, accuracy } = req.body;
    
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude and longitude must be numbers' });
    }

    const { state, district } = await reverseGeocode(latitude, longitude);
    
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    await deliveryRepo.registerDevice(deviceId, state, district);
    await pushRepo.updateLocation(deviceId, state, district);

    res.json({ status: 'ok', state, district, accuracy });
  } catch (err) {
    handleConfigError(err, res);
  }
}

export async function acknowledgeAlert(req, res) {
  try {
    const { deviceId, alertId } = req.body;
    if (!deviceId || !alertId) return res.status(400).json({ error: 'deviceId and alertId required' });
    
    const deliveryRepo = new (await import('../repositories/deliveryRepository.js')).DeliveryRepository();
    await deliveryRepo.acknowledgeAlert(deviceId, alertId);
    res.json({ status: 'ok', alertId });
  } catch (err) {
    handleConfigError(err, res);
  }
}

export async function subscribePush(req, res) {
  try {
    const { deviceId, subscription, state, district } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'subscription with endpoint, keys.p256dh, keys.auth required' });
    }

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
    handleConfigError(err, res);
  }
}

export async function unsubscribePush(req, res) {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
    await pushRepo.remove(endpoint);
    res.json({ status: 'ok' });
  } catch (err) {
    handleConfigError(err, res);
  }
}

export function getVapidPublicKey(req, res) {
  const key = vapidKey();
  if (!key) {
    return res.status(503).json({ error: 'Web Push not configured on server' });
  }
  res.json({ publicKey: key });
}