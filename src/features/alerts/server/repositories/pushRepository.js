/**
 * Push Subscription Repository
 *
 * Manages Web Push subscription records in the push_subscriptions table.
 * Each record links a browser push endpoint to a device and its geographic location
 * (state/district) for targeted alert fan-out.
 *
 * Security notes:
 *  - p256dh and auth are client public keys used by the web-push library only.
 *  - These values are never logged.
 *  - Subscriptions are removed when the push service returns 410 (Gone).
 */

import { runQuery, runExec, runGet } from '../db/connection.js';

export class PushRepository {
  upsert(deviceId, endpoint, p256dh, auth, state, district) {
    const now = new Date().toISOString();
    const existing = runGet(
      'SELECT id FROM push_subscriptions WHERE endpoint = ?',
      [endpoint]
    );
    if (existing) {
      runExec(
        `UPDATE push_subscriptions
         SET device_id = ?, p256dh = ?, auth = ?, state = ?, district = ?, updated_at = ?
         WHERE endpoint = ?`,
        [deviceId, p256dh, auth, state || null, district || null, now, endpoint]
      );
    } else {
      // Limit subscriptions per device to prevent abuse
      const count = runGet('SELECT COUNT(*) as count FROM push_subscriptions WHERE device_id = ?', [deviceId]).count;
      if (count >= 5) {
        // Remove the oldest subscription for this device
        runExec(`
          DELETE FROM push_subscriptions
          WHERE id IN (
            SELECT id FROM push_subscriptions
            WHERE device_id = ?
            ORDER BY updated_at ASC
            LIMIT 1
          )
        `, [deviceId]);
      }
      runExec(
        `INSERT INTO push_subscriptions
           (device_id, endpoint, p256dh, auth, state, district, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [deviceId, endpoint, p256dh, auth, state || null, district || null, now, now]
      );
    }
  }

  /**
   * Update the location for all subscriptions belonging to a specific device.
   */
  updateLocation(deviceId, state, district) {
    const now = new Date().toISOString();
    runExec(
      `UPDATE push_subscriptions
       SET state = ?, district = ?, updated_at = ?
       WHERE device_id = ?`,
      [state || null, district || null, now, deviceId]
    );
  }

  /**
   * Get all subscriptions for a device.
   */
  getByDeviceId(deviceId) {
    return runQuery(
      'SELECT * FROM push_subscriptions WHERE device_id = ?',
      [deviceId]
    );
  }

  /**
   * Get subscriptions matching state OR district.
   * Used for location-targeted alert fan-out.
   */
  getForLocation(state, district) {
    const conditions = [];
    const params = [];
    if (state) {
      conditions.push('state LIKE ?');
      params.push(`%${state}%`);
    }
    if (district) {
      conditions.push('district LIKE ?');
      params.push(`%${district}%`);
    }
    if (conditions.length === 0) {
      return this.getAll();
    }
    return runQuery(
      `SELECT * FROM push_subscriptions WHERE ${conditions.join(' OR ')}`,
      params
    );
  }

  /**
   * Get all subscriptions (used for Extreme/broadcast alerts).
   */
  getAll() {
    return runQuery('SELECT * FROM push_subscriptions');
  }

  /**
   * Record a successful push delivery.
   */
  markSuccess(endpoint) {
    runExec(
      `UPDATE push_subscriptions
       SET last_success_at = ?, failure_count = 0, updated_at = ?
       WHERE endpoint = ?`,
      [new Date().toISOString(), new Date().toISOString(), endpoint]
    );
  }

  /**
   * Record a failed push delivery (transient).
   */
  markFailure(endpoint) {
    runExec(
      `UPDATE push_subscriptions
       SET last_failure_at = ?, failure_count = failure_count + 1, updated_at = ?
       WHERE endpoint = ?`,
      [new Date().toISOString(), new Date().toISOString(), endpoint]
    );
  }

  /**
   * Permanently remove a subscription — called when push service returns 410/404
   * indicating the subscription is no longer valid.
   */
  remove(endpoint) {
    runExec(
      'DELETE FROM push_subscriptions WHERE endpoint = ?',
      [endpoint]
    );
  }

  /**
   * Observability: return subscription counts.
   */
  getStats() {
    const total = runGet('SELECT COUNT(*) as count FROM push_subscriptions')?.count || 0;
    const withState = runGet('SELECT COUNT(*) as count FROM push_subscriptions WHERE state IS NOT NULL')?.count || 0;
    const withDistrict = runGet('SELECT COUNT(*) as count FROM push_subscriptions WHERE district IS NOT NULL')?.count || 0;
    const recentSuccess = runGet(
      "SELECT COUNT(*) as count FROM push_subscriptions WHERE last_success_at > datetime('now', '-1 hour')"
    )?.count || 0;
    const recentFailure = runGet(
      "SELECT COUNT(*) as count FROM push_subscriptions WHERE last_failure_at > datetime('now', '-1 hour')"
    )?.count || 0;
    return { total, withState, withDistrict, recentSuccess, recentFailure };
  }

  /**
   * Count of subscriptions whose failure_count exceeds threshold (potential invalids).
   */
  getHighFailureCount(threshold = 5) {
    return runGet(
      'SELECT COUNT(*) as count FROM push_subscriptions WHERE failure_count >= ?',
      [threshold]
    )?.count || 0;
  }
}
