/**
 * Notification Router
 *
 * Single entry point for routing alert notifications to delivery channels.
 * Currently routes to Web Push.
 *
 * Future channels (not implemented in this task):
 *  - Cell Broadcast (requires telecom integration)
 *  - SMS (requires SMS gateway)
 *
 * This abstraction ensures the ingestion pipeline and MQTT service
 * are decoupled from notification channel details.
 *
 * Usage:
 *   import { notificationRouter } from './notificationRouter.js';
 *   await notificationRouter.route(alert);
 */

import { sendAlertToMatchingSubscriptions } from './webPush.js';
import { publishAlert } from './mqttService.js';
import logger from '../utils/logger.js';

/**
 * Route a new/updated alert to all appropriate notification channels.
 *
 * @param {object} alert — normalized alert record from the database
 */
async function route(alert) {
  logger.info(
    { alertId: alert.id, severity: alert.severity, event: alert.event },
    'Notification Router: routing alert'
  );

  // Channel 1: Web Push (OS-level background notifications)
  try {
    const result = await sendAlertToMatchingSubscriptions(alert);
    logger.info(
      { alertId: alert.id, ...result },
      'Notification Router: Web Push complete'
    );
  } catch (err) {
    // Push failure must never prevent ingestion from completing
    logger.error(
      { alertId: alert.id, err: err.message },
      'Notification Router: Web Push error'
    );
  }

  // Channel 2: MQTT Real-time Event Propagation
  try {
    await publishAlert(alert);
  } catch (err) {
    // MQTT publish failure must never prevent ingestion from completing
    logger.error(
      { alertId: alert.id, err: err.message },
      'Notification Router: MQTT publish error'
    );
  }

  // Channel 3: Cell Broadcast — NOT implemented in this task
  // Future: if (alert.severity === 'Extreme') { cellBroadcast.send(alert); }
}

export const notificationRouter = { route };
