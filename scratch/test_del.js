import { initDb, runExec, runQuery } from '../src/features/alerts/server/db/connection.js';

async function testDel() {
  await initDb();
  
  const before = runQuery("SELECT id, source_id FROM alerts WHERE id LIKE '%test-%'");
  console.log('Before:', before);
  
  const del = runExec("DELETE FROM alerts WHERE id LIKE '%test-%'");
  console.log('Deleted changes:', del.changes);
  
  const after = runQuery("SELECT id, source_id FROM alerts WHERE id LIKE '%test-%'");
  console.log('After:', after);
  
  process.exit(0);
}

testDel().catch(console.error);
