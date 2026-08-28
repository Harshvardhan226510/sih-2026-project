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
 * RELIABILITY GUARANTEES:
 *  - QoS 1 (at-least-once delivery) for all alert publications.
 *  - Outbox pattern: if the broker is offline when publishAlert() is called,
 *    the message is written to mqtt_outbox (persistent SQLite table).
 *  - On reconnect, flushOutbox() automatically publishes all PENDING entries.
 *  - MQTT failure NEVER causes the alert database transaction to fail.
 *  - Multiple concurrent client instances are prevented by the `if (client) return` guard.
 *  - reconnectPeriod is handled by the mqtt library automatically.
 *
 * RETAINED MESSAGES: disabled (retain: false).
 *  Retained messages are inappropriate here because:
 *  1. A newly connected subscriber might receive an already-expired alert.
 *  2. Alert state is authoritative in SQLite; subscribers should sync via REST on connect.
 *
 * QoS 1 DUPLICATE HANDLING:
 *  Subscribers must deduplicate by alertId (present in every payload).
 *  The server-side pipeline uses source_id for its own deduplication.
 *
 * MQTT TOPIC STRUCTURE:
 *  weathergpt/alerts/{state}/{district}
 *  - state and district are normalized: lowercase, spaces→hyphens, non-alphanum stripped
 *  - Extreme alerts use 'all' as district: weathergpt/alerts/{state}/all
 *  - MQTT topic values never contain user PII or credentials
 *
 * SECURITY:
 *  MQTT credentials (username/password) are NEVER logged.
 *  MQTT credentials are NEVER sent to the browser.
 *
 * CONFIGURATION (env vars):
 *  MQTT_ENABLED=true
 *  MQTT_BROKER_URL=mqtts://broker.example.com:8883
 *  MQTT_USERNAME=...
 *  MQTT_PASSWORD=...    (never logged)
 *  MQTT_CLIENT_ID=weathergpt-server
 *  MQTT_TOPIC=weathergpt/alerts/#
 *  MQTT_KEEPALIVE=60
 *  MQTT_RECONNECT_PERIOD=5000
 */

import mqtt from 'mqtt';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AlertRepository } from '../repositories/alertRepository.js';
import { MqttOutboxRepository } from '../repositories/mqttOutboxRepository.js';
import { normalizeIMDAlert } from './normalization.js';
import { processAlerts } from './processing.js';
import { expireAlerts } from './expiry.js';
import { saveDb } from '../db/connection.js';
import { notificationRouter } from './notificationRouter.js';
import { parseCAP } from '../utils/xml.js';

const repo        = new AlertRepository();
const outboxRepo  = new MqttOutboxRepository();

let client          = null;
let connectionState = 'disconnected';
let lastMessageAt   = null;
let messageCount    = 0;
let errorCount      = 0;
let outboxPending   = 0; // snapshot for observability

// ── Connection ─────────────────────────────────────────────────────────────────

/**
 * Connect to the MQTT broker.
 * If MQTT_ENABLED is false, this is a no-op (existing IMD ingestion continues).
 * Idempotent: calling connect() when already connected is safe (logs a warning).
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
    // Already connected or reconnecting — do not create a second client.
    // The mqtt library manages reconnection internally via reconnectPeriod.
    logger.warn('MQTT connect() called but client already exists — ignoring duplicate call');
    return;
  }

  // Note: password is never logged (only brokerUrl, clientId, topic are safe to log)
  logger.info(
    { brokerUrl: config.mqtt.brokerUrl, clientId: config.mqtt.clientId, topic: config.mqtt.topic },
    'MQTT connecting'
  );

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

    // Flush any pending outbox entries that accumulated while offline
    flushOutbox().catch(err =>
      logger.error({ err: err.message }, 'mqtt_outbox_flush_error on reconnect')
    );
  });

  client.on('reconnect', () => {
    connectionState = 'reconnecting';
    logger.info('mqtt_reconnect');
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

// ── Inbound Message Handling ───────────────────────────────────────────────────

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
 * This ensures MQTT CAP delivery is idempotent — receiving the same alert twice
 * via MQTT produces no duplicate DB record and no duplicate notification.
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

  const normalized     = normalizeIMDAlert(cap);
  const existingMap    = repo.getExistingBySourceIds([normalized.sourceId]);
  const { toCreate, toUpdate } = processAlerts([normalized], existingMap);

  let revision = repo.getCurrentRevision();

  for (const alert of toCreate) {
    revision++;
    const inserted = repo.create(alert, revision);
    if (inserted) {
      logger.info({ alertId: alert.id, source: 'mqtt-cap' }, 'MQTT: new alert created');
      await notificationRouter.route(alert, alert.lifecycleEvent);
    } else {
      logger.debug({ alertId: alert.id }, 'MQTT CAP: duplicate — INSERT OR IGNORE prevented insert');
    }
  }

  for (const alert of toUpdate) {
    revision++;
    repo.update(alert, revision);
    logger.info({ alertId: alert.id, source: 'mqtt-cap' }, 'MQTT: alert updated');
    await notificationRouter.route(alert, alert.lifecycleEvent);
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
  await notificationRouter.route(alert, 'alert_updated');
}

// ── Outbound Publishing ────────────────────────────────────────────────────────

/**
 * Build the MQTT topic for an alert.
 * Topic structure: {baseTopic}/{state}/{district}
 * - Extreme alerts use 'all' as district.
 * - State/district values are normalized for topic safety.
 */
function buildTopic(alert) {
  const isExtreme  = alert.severity === 'Extreme';
  const area       = alert.area || '';
  const parts      = area.split(',').map(p => p.trim());
  const district   = parts[0] || 'unknown';
  const state      = parts[parts.length - 1] || 'unknown';
  const safeState  = state.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const safeDist   = isExtreme ? 'all' : district.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const baseTopic  = (config.mqtt.topic || 'weathergpt/alerts/#').replace(/#$/, '');
  return { topic: `${baseTopic}${safeState}/${safeDist}`, state, district };
}

/**
 * Build the MQTT payload for an alert.
 * Payload is intentionally minimal — no PII, no credentials.
 * Subscribers use alertId to deduplicate QoS 1 duplicates.
 */
function buildPayload(alert, eventType) {
  return {
    type:      eventType || 'alert.updated',
    revision:  alert.revision,
    alertId:   alert.id,
    severity:  alert.severity,
    event:     alert.event,
    issuedAt:  alert.issuedAt,
    expiresAt: alert.expiresAt,
  };
}

/**
 * Publish an alert event to the MQTT broker.
 *
 * RELIABILITY:
 *  - Uses QoS 1 (at-least-once delivery).
 *  - retain: false — no stale expired alerts for new subscribers.
 *  - If the broker is unavailable, writes to mqtt_outbox for later retry.
 *  - Publish failure is always non-fatal: the alert remains safely in SQLite.
 *
 * @param {object} alert      — The normalized alert record
 * @param {string} eventType  — Lifecycle event type (alert_created, alert_updated, etc.)
 */
export async function publishAlert(alert, eventType) {
  if (!config.mqtt.enabled) return;

  const { topic, state, district } = buildTopic(alert);
  const payload                    = buildPayload(alert, eventType);

  // If not connected, persist to outbox for retry on reconnect
  if (!client || connectionState !== 'connected') {
    outboxRepo.enqueue(alert.id, topic, payload, 1);
    outboxPending = (outboxRepo.getStats().pending) || outboxPending + 1;
    logger.warn(
      { alertId: alert.id, topic, connectionState },
      'mqtt_publish_failure: broker unavailable — queued to outbox'
    );
    return;
  }

  return new Promise((resolve) => {
    client.publish(topic, JSON.stringify(payload), { qos: 1, retain: false }, (err) => {
      if (err) {
        errorCount++;
        // Outbox the failed message for retry
        outboxRepo.enqueue(alert.id, topic, payload, 1);
        logger.error(
          { alertId: alert.id, topic, err: err.message },
          'mqtt_publish_failure: publish error — queued to outbox'
        );
      } else {
        logger.info({ alertId: alert.id, topic }, 'mqtt_publish_success');
      }
      resolve();
    });
  });
}

/**
 * Flush the MQTT outbox.
 * Called automatically on broker reconnect and by the scheduler every 2 minutes.
 * Publishes all PENDING outbox entries at QoS 1.
 * Marks each entry PUBLISHED on success or increments failure count on error.
 *
 * Idempotent: safe to call at any time. If broker is offline, entries remain PENDING.
 */
export async function flushOutbox() {
  if (!client || connectionState !== 'connected') return;

  const pending = outboxRepo.getPending(50);
  if (pending.length === 0) return;

  logger.info({ count: pending.length }, 'mqtt_outbox_retry: flushing pending entries');

  for (const entry of pending) {
    let payload;
    try {
      payload = typeof entry.payload === 'string' ? entry.payload : JSON.stringify(entry.payload);
    } catch {
      outboxRepo.markFailed(entry.id, 'payload serialization error');
      continue;
    }

    await new Promise((resolve) => {
      client.publish(entry.topic, payload, { qos: entry.qos || 1, retain: false }, (err) => {
        if (err) {
          outboxRepo.markFailed(entry.id, err.message);
          logger.warn(
            { outboxId: entry.id, alertId: entry.alert_id, err: err.message },
            'mqtt_outbox_retry: publish failed'
          );
        } else {
          outboxRepo.markPublished(entry.id);
          logger.info(
            { outboxId: entry.id, alertId: entry.alert_id, topic: entry.topic },
            'mqtt_outbox_retry: published successfully'
          );
        }
        resolve();
      });
    });
  }

  outboxPending = outboxRepo.getStats().pending || 0;
}

// ── Observability ──────────────────────────────────────────────────────────────

/**
 * Returns current MQTT status for the health endpoint.
 * Credentials are never included.
 * Outbox stats are included for future admin dashboard use.
 */
export function getMqttStatus() {
  return {
    enabled:        config.mqtt.enabled,
    state:          connectionState,
    brokerUrl:      config.mqtt.brokerUrl || null, // URL is safe to expose; credentials are not
    topic:          config.mqtt.topic || null,
    clientId:       config.mqtt.clientId || null,
    lastMessageAt,
    messageCount,
    errorCount,
    outbox:         outboxRepo.getStats(),
  };
}
