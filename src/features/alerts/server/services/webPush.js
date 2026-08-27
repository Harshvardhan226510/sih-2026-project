/**
 * Web Push Service
 *
 * Sends OS-level browser push notifications via the Web Push protocol (RFC 8030).
 * Uses VAPID authentication (RFC 8292) via the `web-push` library.
 *
 * Responsibilities:
 *  - Initialize VAPID keys from config
 *  - Send a single push to a subscription endpoint
 *  - Fan out alert notifications to all matching subscriptions (location filter)
 *  - Handle expired subscriptions (410/404 → auto-remove)
 *  - Retry transient failures (tracked via failure_count)
 *
 * Security:
 *  - VAPID_PRIVATE_KEY is never logged or returned to the browser.
 *  - push payload is kept compact (< 3 KB) per Web Push spec guidance.
 *
 * Architecture note:
 *  MQTT is for real-time backend event propagation.
 *  Web Push is for OS/browser notification delivery to the user.
 *  These are separate channels with separate responsibilities.
 */

import webpush from 'web-push';
import config from '../config/index.js';
import { PushRepository } from '../repositories/pushRepository.js';
import logger from '../utils/logger.js';

const pushRepo = new PushRepository();

/** Severity → human-readable notification title */
const SEVERITY_TITLES = {
  Extreme:  'EXTREME WEATHER ALERT',
  Severe:   'SEVERE WEATHER ALERT',
  Moderate: 'MODERATE WEATHER ALERT',
  Minor:    'MINOR WEATHER ALERT',
  Unknown:  'WEATHER ALERT',
};

let vapidConfigured = false;

/**
 * Initialize VAPID keys. Must be called once at server startup.
 * If keys are missing the Web Push service is disabled (non-fatal).
 */
export function initWebPush() {
  const { subject, publicKey, privateKey } = config.vapid;
  if (!publicKey || !privateKey) {
    logger.warn(
      'VAPID keys not configured. Web Push notifications are disabled. ' +
      'Run: node scripts/generate-vapid.js to generate keys.'
    );
    return false;
  }
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    logger.info({ subject }, 'Web Push VAPID configured');
    return true;
  } catch (err) {
    logger.error({ err: err.message }, 'Web Push VAPID configuration failed');
    return false;
  }
}

/**
 * Send one push notification to a single subscription.
 *
 * @param {{ endpoint, keys: { p256dh, auth } }} subscription
 * @param {object} payload — compact JSON object (< 3 KB)
 * @returns {{ success: boolean, removed: boolean }}
 */
export async function sendPush(subscription, payload) {
  if (!vapidConfigured) {
    return { success: false, removed: false };
  }

  const payloadStr = JSON.stringify(payload);

  try {
    await webpush.sendNotification(subscription, payloadStr, {
      TTL: 86400, // 24h — alert remains relevant for one day
    });
    pushRepo.markSuccess(subscription.endpoint);
    return { success: true, removed: false };
  } catch (err) {
    const statusCode = err.statusCode;
    if (statusCode === 410 || statusCode === 404) {
      // Subscription definitively expired or invalid — remove permanently
      logger.info(
        { endpoint: subscription.endpoint.substring(0, 40) + '…', statusCode },
        'Push subscription expired — removing'
      );
      pushRepo.remove(subscription.endpoint);
      return { success: false, removed: true };
    }

    // Transient failure — mark and let retry handle it
    pushRepo.markFailure(subscription.endpoint);
    logger.warn(
      { statusCode, endpoint: subscription.endpoint.substring(0, 40) + '…', err: err.message },
      'Push delivery failed (transient)'
    );
    return { success: false, removed: false };
  }
}

/**
 * Build a compact push payload for an alert.
 * Kept intentionally small (< 3 KB) for 2G compatibility.
 * The Service Worker uses alertId to open the correct detail page on click.
 */
function buildPayload(alert) {
  const severity = alert.severity || 'Unknown';
  return {
    alertId:  alert.id,
    severity,
    event:    alert.event,
    area:     alert.area || '',
    title:    SEVERITY_TITLES[severity] || 'WEATHER ALERT',
    // No description, instruction, polygon, rawData — keep small
  };
}

/**
 * Extract state and district from an alert's area field for location matching.
 * IMD area strings are typically: "District, State" or "District".
 */
function extractLocationFromAlert(alert) {
  const area = alert.area || '';
  const parts = area.split(',').map(p => p.trim());
  // Heuristic: last part is usually state for IMD alerts
  return {
    district: parts[0] || null,
    state:    parts[parts.length - 1] || null,
  };
}

/**
 * Fan out a push notification to all subscriptions matching the alert's location.
 * Extreme severity alerts are additionally sent to ALL subscriptions (broadcast).
 *
 * @param {object} alert — normalized alert from the database
 * @returns {{ sent: number, failed: number, removed: number }}
 */
export async function sendAlertToMatchingSubscriptions(alert) {
  if (!vapidConfigured) {
    logger.debug('Web Push not configured — skipping push fan-out');
    return { sent: 0, failed: 0, removed: 0 };
  }

  let subscriptions;

  if (alert.severity === 'Extreme') {
    // Extreme alerts broadcast to all registered subscriptions
    subscriptions = pushRepo.getAll();
    logger.info(
      { alertId: alert.id, severity: alert.severity, count: subscriptions.length },
      'Push: Extreme alert — broadcasting to all subscriptions'
    );
  } else {
    const { state, district } = extractLocationFromAlert(alert);
    subscriptions = pushRepo.getForLocation(state, district);
    logger.info(
      { alertId: alert.id, severity: alert.severity, state, district, count: subscriptions.length },
      'Push: location-filtered fan-out'
    );
  }

  if (subscriptions.length === 0) {
    logger.debug({ alertId: alert.id }, 'Push: no matching subscriptions');
    return { sent: 0, failed: 0, removed: 0 };
  }

  const payload = buildPayload(alert);
  let sent = 0, failed = 0, removed = 0;

  for (const sub of subscriptions) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    const result = await sendPush(subscription, payload);
    if (result.success) sent++;
    else if (result.removed) removed++;
    else failed++;
  }

  logger.info(
    { alertId: alert.id, sent, failed, removed },
    'Push fan-out complete'
  );
  return { sent, failed, removed };
}

/**
 * Retry push delivery for subscriptions with transient failures.
 * Called by the delivery scheduler — not the main alert path.
 */
export async function retryFailedPushes(threshold = 5) {
  // Subscriptions with repeated failures that haven't been cleaned up yet
  const highFailure = pushRepo.getHighFailureCount(threshold);
  if (highFailure > 0) {
    logger.warn({ count: highFailure }, 'Push subscriptions with high failure count detected');
  }
}

/**
 * Returns the VAPID public key for browser subscription.
 * NEVER returns the private key.
 */
export function getVapidPublicKey() {
  return config.vapid.publicKey || null;
}

/**
 * Returns current push observability stats.
 */
export function getPushStats() {
  return pushRepo.getStats();
}
