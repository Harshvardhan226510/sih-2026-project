/**
 * Notification Router
 *
 * Single entry point for routing alert lifecycle events to delivery channels.
 *
 * CHANNELS:
 *  1. Web Push  — OS-level browser notifications (RFC 8030 / VAPID)
 *  2. MQTT      — Real-time event propagation to external subscribers
 *
 * Future channels (not implemented in this task):
 *  - Cell Broadcast (requires telecom integration)
 *  - SMS (requires SMS gateway)
 *
 * DEDUPLICATION CONTRACT:
 *  This function is only called for alert_created and alert_updated events.
 *  alert_unchanged events must NOT be passed to this function.
 *  The ingestion pipeline (ingestion.js) is responsible for this guard.
 *
 * FAILURE ISOLATION:
 *  A failure in Web Push must not prevent MQTT propagation.
 *  A failure in MQTT must not prevent Web Push delivery.
 *  Neither failure must cause the alert database transaction to fail.
 *  All downstream errors are caught and logged individually.
 *
 * USAGE:
 *   import { notificationRouter } from './notificationRouter.js';
 *   await notificationRouter.route(alert, eventType);
 */

import { sendAlertToMatchingSubscriptions } from './webPush.js';
import { publishAlert } from './mqttService.js';
import logger from '../utils/logger.js';

/**
 * Route a new/updated alert to all appropriate notification channels.
 *
 * @param {object} alert      — normalized alert record from the database
 * @param {string} eventType  — lifecycle event type (alert_created | alert_updated | alert_cancelled)
 */
async function route(alert, eventType = 'alert_updated') {
  logger.info(
    { alertId: alert.id, severity: alert.severity, event: alert.event, eventType },
    'Notification Router: routing alert'
  );

  // ── Channel 1: Web Push (OS-level background notifications) ─────────────────
  try {
    const result = await sendAlertToMatchingSubscriptions(alert);
    logger.info(
      { alertId: alert.id, eventType, ...result },
      'push_attempt: Web Push fan-out complete'
    );
  } catch (err) {
    // Push failure must never prevent ingestion or MQTT from completing
    logger.error(
      { alertId: alert.id, eventType, err: err.message },
      'push_attempt: Web Push error (non-fatal)'
    );
  }

  // ── Channel 2: MQTT Real-time Event Propagation ──────────────────────────────
  try {
    await publishAlert(alert, eventType);
  } catch (err) {
    // MQTT publish failure must never prevent ingestion from completing
    logger.error(
      { alertId: alert.id, eventType, err: err.message },
      'mqtt_publish_failure: notification router MQTT error (non-fatal)'
    );
  }

  // ── Channel 3: Cell Broadcast — NOT implemented in this task ─────────────────
  // Future: if (alert.severity === 'Extreme') { cellBroadcast.send(alert); }
}

export const notificationRouter = { route };
