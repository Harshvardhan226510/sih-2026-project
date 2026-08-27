/**
 * MQTT Service
 *
 * Manages the server-side MQTT connection for real-time alert event propagation.
 *
 * ARCHITECTURE NOTES:
 *  - The browser NEVER connects directly to the MQTT broker.
 *  - This service is server-side only.
 *  - MQTT is NOT the source of truth. SQLite remains authoritative.
 *  - MQTT is NOT WIS2. MQTT is the selected real-time transport framework.
 *    WIS2 integration, if desired, can extend this ingestion abstraction later.
 *  - If MQTT is unavailable, the existing IMD RSS/CAP ingestion continues normally.
 *  - MQTT delivery is idempotent: duplicate messages produce no duplicate records.
 *
 * MQTT role:
 *  Real-time alert event propagation only.
 *  The Notification Router handles OS-level push delivery.
 *
 * Message format expected on MQTT topic:
 *  {
 *    "type": "ALERT_CAP",          // CAP XML message
 *    "capXml": "<?xml ...>",       // raw CAP XML
 *    "source": "imd"               // optional source hint
 *  }
 *  OR:
 *  {
 *    "type": "ALERT_SIGNAL",       // signal only — alert already in DB
 *    "alertId": "imd-...",
 *    "revision": 42,
 *    "severity": "Extreme"
 *  }
 *
 * Configuration (env vars):
 *  MQTT_ENABLED=true
 *  MQTT_BROKER_URL=mqtts://broker.example.com:8883
 *  MQTT_USERNAME=...
 *  MQTT_PASSWORD=...  (never logged)
 *  MQTT_CLIENT_ID=weathergpt-server
 *  MQTT_TOPIC=weathergpt/alerts/#
 *  MQTT_KEEPALIVE=60
 *  MQTT_RECONNECT_PERIOD=5000
 *
 * Security:
 *  MQTT credentials (username/password) are NEVER logged.
 *  MQTT credentials are NEVER sent to the browser.
 */

import mqtt from 'mqtt';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AlertRepository } from '../repositories/alertRepository.js';
import { normalizeIMDAlert } from './normalization.js';
import { processAlerts } from './processing.js';
import { expireAlerts } from './expiry.js';
import { saveDb } from '../db/connection.js';
import { notificationRouter } from './notificationRouter.js';
import { parseCAP } from '../utils/xml.js';

const repo = new AlertRepository();

let client = null;
let connectionState = 'disconnected';
let lastMessageAt = null;
let messageCount = 0;
let errorCount = 0;

/**
 * Connect to the MQTT broker.
 * If MQTT_ENABLED is false, this is a no-op (existing IMD ingestion continues).
 */
export function connect() {
  if (!config.mqtt.enabled) {
    logger.info('MQTT disabled (MQTT_ENABLED != true). Using IMD RSS/CAP ingestion only.');
    return;
  }

  if (!config.mqtt.brokerUrl) {
    logger.warn('MQTT_BROKER_URL not set. MQTT will not connect. IMD RSS/CAP ingestion continues.');
    return;
  }

  if (client) {
    logger.warn('MQTT connect() called but client already exists');
    return;
  }

  logger.info(
    { brokerUrl: config.mqtt.brokerUrl, clientId: config.mqtt.clientId, topic: config.mqtt.topic },
    'MQTT connecting'
  );

  // Note: password is never logged (only brokerUrl, clientId, topic are safe to log)
  client = mqtt.connect(config.mqtt.brokerUrl, {
    clientId:        config.mqtt.clientId,
    username:        config.mqtt.username || undefined,
    password:        config.mqtt.password || undefined,
    keepalive:       config.mqtt.keepalive,
    reconnectPeriod: config.mqtt.reconnectPeriod,
    clean:           true,
    connectTimeout:  30_000,
  });

  client.on('connect', () => {
    connectionState = 'connected';
    logger.info({ topic: config.mqtt.topic }, 'MQTT connected');

    client.subscribe(config.mqtt.topic, { qos: 1 }, (err, granted) => {
      if (err) {
        logger.error({ err: err.message }, 'MQTT subscription failed');
      } else {
        logger.info({ granted }, 'MQTT subscribed');
      }
    });
  });

  client.on('reconnect', () => {
    connectionState = 'reconnecting';
    logger.info('MQTT reconnecting');
  });

  client.on('error', (err) => {
    errorCount++;
    logger.error({ err: err.message }, 'MQTT error');
  });

  client.on('close', () => {
    connectionState = 'disconnected';
    logger.info('MQTT disconnected');
  });

  client.on('offline', () => {
    connectionState = 'offline';
    logger.warn('MQTT client offline');
  });

  client.on('message', (topic, rawBuffer) => {
    lastMessageAt = new Date().toISOString();
    messageCount++;
    logger.info({ topic, bytes: rawBuffer.length }, 'MQTT message received');
    handleMessage(topic, rawBuffer).catch(err => {
      logger.error({ topic, err: err.message }, 'MQTT processing failure');
    });
  });
}

/**
 * Gracefully disconnect from the MQTT broker.
 * Called on server shutdown (SIGTERM/SIGINT).
 */
export function disconnect() {
  if (!client) return;
  logger.info('MQTT disconnecting (graceful shutdown)');
  client.end(false, {}, () => {
    logger.info('MQTT connection closed');
    client = null;
    connectionState = 'disconnected';
  });
}

/**
 * Process an incoming MQTT message.
 * Routes to the appropriate ingestion handler.
 * Invalid/malformed messages are logged and discarded — never thrown.
 */
async function handleMessage(topic, rawBuffer) {
  let parsed;
  try {
    parsed = JSON.parse(rawBuffer.toString('utf-8'));
  } catch (err) {
    logger.warn({ topic, err: err.message }, 'MQTT malformed message — not valid JSON, discarding');
    return;
  }

  if (!parsed || typeof parsed !== 'object') {
    logger.warn({ topic }, 'MQTT malformed message — not an object, discarding');
    return;
  }

  const messageType = parsed.type;

  if (messageType === 'ALERT_CAP') {
    await handleCapMessage(parsed);
  } else if (messageType === 'ALERT_SIGNAL') {
    await handleSignalMessage(parsed);
  } else {
    logger.warn({ topic, type: messageType }, 'MQTT unknown message type — discarding');
  }
}

/**
 * Handle a CAP XML message from MQTT.
 * Runs through the same normalization + deduplication pipeline as IMD RSS ingestion.
 * This ensures MQTT delivery is idempotent.
 */
async function handleCapMessage(msg) {
  if (!msg.capXml || typeof msg.capXml !== 'string') {
    logger.warn('MQTT ALERT_CAP message missing capXml field — discarding');
    return;
  }

  let cap;
  try {
    cap = parseCAP(msg.capXml);
  } catch (err) {
    logger.warn({ err: err.message }, 'MQTT CAP parse failure — discarding');
    return;
  }

  if (!cap) {
    logger.warn('MQTT CAP parse returned null — discarding');
    return;
  }

  const normalized = normalizeIMDAlert(cap);

  // Deduplication: use the same source_id check as the RSS pipeline
  const existingMap = repo.getExistingBySourceIds([normalized.sourceId]);
  const { toCreate, toUpdate } = processAlerts([normalized], existingMap);

  let revision = repo.getCurrentRevision();

  for (const alert of toCreate) {
    revision++;
    repo.create(alert, revision);
    logger.info({ alertId: alert.id, source: 'mqtt-cap' }, 'MQTT: new alert created');
    await notificationRouter.route(alert);
  }

  for (const alert of toUpdate) {
    revision++;
    repo.update(alert, revision);
    logger.info({ alertId: alert.id, source: 'mqtt-cap' }, 'MQTT: alert updated');
    await notificationRouter.route(alert);
  }

  if (toCreate.length || toUpdate.length) {
    repo.updateSyncRevision(revision);
    expireAlerts();
    saveDb();
  }

  if (!toCreate.length && !toUpdate.length) {
    logger.debug({ sourceId: normalized.sourceId }, 'MQTT CAP: duplicate — no action');
  }
}

/**
 * Handle an ALERT_SIGNAL message (alert already in DB, just need to fan-out push).
 * Looks up the alert by ID and routes it through the notification router.
 */
async function handleSignalMessage(msg) {
  if (!msg.alertId) {
    logger.warn('MQTT ALERT_SIGNAL missing alertId — discarding');
    return;
  }

  const alert = repo.getById(msg.alertId);
  if (!alert) {
    logger.warn({ alertId: msg.alertId }, 'MQTT ALERT_SIGNAL: alert not found in DB — discarding');
    return;
  }

  logger.info({ alertId: alert.id, severity: alert.severity }, 'MQTT signal: routing to notification router');
  await notificationRouter.route(alert);
}

/**
 * Observability: current MQTT status for health endpoint.
 */
export function getMqttStatus() {
  return {
    enabled:         config.mqtt.enabled,
    state:           connectionState,
    brokerUrl:       config.mqtt.brokerUrl || null, // URL is safe to expose; credentials are not
    topic:           config.mqtt.topic || null,
    clientId:        config.mqtt.clientId || null,
    lastMessageAt,
    messageCount,
    errorCount,
  };
}

/**
 * Publish an alert event to the MQTT broker.
 * Used for real-time propagation of alerts.
 * Topic structure: weathergpt/alerts/{state}/{district} or {state}/all
 *
 * @param {object} alert — The normalized alert record
 */
export async function publishAlert(alert) {
  if (!config.mqtt.enabled || !client || connectionState !== 'connected') {
    return;
  }

  try {
    const isExtreme = alert.severity === 'Extreme';
    const area = alert.area || '';
    const parts = area.split(',').map(p => p.trim());
    const district = parts[0] || 'unknown';
    const state = parts[parts.length - 1] || 'unknown';

    // Format for topic: lowercase, replace spaces with hyphens
    const safeState = state.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let safeDistrict = district.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    if (isExtreme) {
      safeDistrict = 'all';
    }

    // Base topic is config.mqtt.topic (e.g. weathergpt/alerts/# -> weathergpt/alerts/)
    const baseTopic = (config.mqtt.topic || 'weathergpt/alerts/#').replace(/#$/, '');
    const topic = `${baseTopic}${safeState}/${safeDistrict}`;

    const payload = {
      type: 'alert.updated', // Or alert.created, but updated acts as both for clients
      revision: alert.revision,
      alertId: alert.id,
      severity: alert.severity,
      event: alert.event,
      state,
      district,
      issuedAt: alert.issuedAt,
      expiresAt: alert.expiresAt
    };

    client.publish(topic, JSON.stringify(payload), { qos: 1, retain: false }, (err) => {
      if (err) {
        logger.error({ alertId: alert.id, err: err.message }, 'MQTT publish failed');
        errorCount++;
      } else {
        logger.info({ alertId: alert.id, topic }, 'MQTT alert published');
      }
    });
  } catch (err) {
    logger.error({ alertId: alert.id, err: err.message }, 'MQTT publish error');
    errorCount++;
  }
}

