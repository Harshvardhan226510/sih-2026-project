/**
 * Alert Expiry Service
 *
 * Scans the alerts table for records where:
 *   status = 'ACTIVE' AND expires_at IS NOT NULL AND expires_at < now
 *
 * For each such alert:
 *   1. Sets status = 'EXPIRED'
 *   2. Increments revision
 *   3. Records action='expired' in alert_revisions (for delta sync)
 *   4. Updates sync_state.revision so clients receive the expiration event
 *
 * IMPORTANT: This function is idempotent. Running it multiple times
 * on already-expired alerts does nothing (status != 'ACTIVE' guard).
 *
 * IMPORTANT: This function must NOT be called when IMD ingestion fails.
 * A failed ingestion run must never cause valid alerts to be expired prematurely.
 * The caller (ingestion.js) is responsible for only calling expireAlerts()
 * after a successful provider fetch.
 */

import { runExec, runGet, runQuery, saveDb } from '../db/connection.js';
import logger from '../utils/logger.js';

export function expireAlerts() {
  const now = new Date().toISOString();

  // Find all alerts that need to be expired BEFORE we update them,
  // so we can record individual alert_revisions entries.
  const toExpire = runQuery(
    `SELECT id FROM alerts
     WHERE status = 'ACTIVE'
       AND expires_at IS NOT NULL
       AND expires_at < ?`,
    [now]
  );

  if (toExpire.length === 0) return 0;

  // Get the current revision to assign sequential revisions to each expiry
  let revision = (runGet('SELECT revision FROM sync_state WHERE id = 1')?.revision || 0);

  for (const { id } of toExpire) {
    revision++;
    runExec(
      `UPDATE alerts SET status = 'EXPIRED', revision = ?, updated_at = ? WHERE id = ?`,
      [revision, now, id]
    );
    // Record expiry in alert_revisions so delta sync can communicate removal to clients
    runExec(
      'INSERT INTO alert_revisions (alert_id, revision, action, diff, created_at) VALUES (?, ?, ?, NULL, ?)',
      [id, revision, 'expired', now]
    );
    logger.info({ alertId: id, revision }, 'alert_expired');
  }

  // Advance the global sync revision
  runExec(
    'UPDATE sync_state SET revision = ?, updated_at = ? WHERE id = 1',
    [revision, now]
  );

  logger.info({ count: toExpire.length }, 'alerts expired');
  saveDb();
  return toExpire.length;
}