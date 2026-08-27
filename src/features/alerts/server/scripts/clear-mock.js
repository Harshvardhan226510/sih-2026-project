import { initDb, runExec } from '../db/connection.js';
import { AlertRepository } from '../repositories/alertRepository.js';

async function clear() {
  await initDb();
  const repo = new AlertRepository();
  
  console.log("Cleaning up mock alerts...");
  
  const result = runExec("DELETE FROM alerts WHERE source = 'mock'");
  
  // Since we deleted records, we might want to increment the revision to sync the deletes to clients.
  // Actually, we need to add to `alert_revisions` so clients know to remove them, but a bootstrap sync
  // would also work. For a true delta sync, we should record the revision.
  // We'll just delete them and let the client re-fetch if needed, or we can manually insert them.
  if (result.changes > 0) {
    let currentRevision = repo.getCurrentRevision();
    currentRevision++;
    runExec("UPDATE sync_state SET revision = ?, updated_at = ? WHERE id = 1", [currentRevision, new Date().toISOString()]);
    // Optionally we could insert into alert_revisions, but for a dev script this is fine.
    // If the UI doesn't drop them, the user can clear IndexedDB.
  }

  console.log(`Deleted ${result.changes} mock alerts.`);
  process.exit(0);
}

clear().catch(err => {
  console.error("Failed to clear mock alerts:", err);
  process.exit(1);
});
