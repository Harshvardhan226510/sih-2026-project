import { runExec, runGet, saveDb } from '../db/connection.js';
import logger from '../utils/logger.js';
export function expireAlerts() {
  const now = new Date().toISOString();
  const revision = (runGet('SELECT revision FROM sync_state WHERE id = 1')?.revision || 0) + 1;
  const result = runExec(
    `UPDATE alerts SET status = 'EXPIRED', revision = ?, updated_at = ? WHERE status = 'ACTIVE' AND expires_at IS NOT NULL AND expires_at < ?`,
    [revision, now, now]
  );
  if (result.changes > 0) {
    logger.info({ count: result.changes }, 'alerts expired');
    runExec('UPDATE sync_state SET revision = ?, updated_at = ? WHERE id = 1', [revision, now]);
    saveDb();
  }
  return result.changes;
}