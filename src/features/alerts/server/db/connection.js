import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import logger from '../utils/logger.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
let db = null;
let SQL = null;
export async function initDb() {
  if (db) return db;
  SQL = await initSqlJs();
  const dbDir = dirname(config.db.path);
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
  if (existsSync(config.db.path)) {
    const buffer = readFileSync(config.db.path);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  runMigrations();
  saveDb();
  logger.info({ path: config.db.path }, 'database connected');
  return db;
}
export function getDb() {
  if (!db) throw new Error('database not initialized — call initDb() first');
  return db;
}
export function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(config.db.path, buffer);
}
function runMigrations() {
  const migration001 = resolve(__dirname, 'migrations', '001_initial.sql');
  const sql001 = readFileSync(migration001, 'utf-8');
  db.run(sql001);

  const migration003 = resolve(__dirname, 'migrations', '003_delivery_system.sql');
  const sql003 = readFileSync(migration003, 'utf-8');
  sql003.split(';').filter(s => s.trim()).forEach(stmt => db.run(stmt + ';'));

  const migration004 = resolve(__dirname, 'migrations', '004_push_subscriptions.sql');
  const sql004 = readFileSync(migration004, 'utf-8');
  sql004.split(';').filter(s => s.trim()).forEach(stmt => db.run(stmt + ';'));

  // =========================================================
  // TEMPORARY: SUSPENDED FOR DASHBOARD UI TESTING
  // =========================================================
  // The following migration and DELETE statement are intentionally 
  // commented out to allow a temporary mock dataset to exist for 
  // UI testing of the Alert Dashboard.
  // 
  // DO NOT DELETE THIS MIGRATION.
  // When UI testing is complete and the mock dataset is cleared, 
  // uncomment these lines to restore production-only IMD data enforcement.
  // =========================================================
  
  /*
  const migration002 = resolve(__dirname, 'migrations', '002_remove_mock_alerts.sql');
  const sql002 = readFileSync(migration002, 'utf-8');
  sql002.split(';').filter(s => s.trim()).forEach(stmt => db.run(stmt + ';'));
  
  // Ensure absolute absence of mock data
  db.run("DELETE FROM alerts WHERE source = 'mock'");
  */

  logger.info('database migrations applied');
}
export function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}
export function runQuery(sql, params = []) {
  const stmt = getDb().prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}
export function runExec(sql, params = []) {
  const d = getDb();
  if (params.length) {
    const stmt = d.prepare(sql);
    stmt.bind(params);
    stmt.step();
    const changes = d.getRowsModified();
    stmt.free();
    saveDb();
    return { changes };
  }
  d.run(sql);
  saveDb();
  return { changes: d.getRowsModified() };
}
export function runGet(sql, params = []) {
  const results = runQuery(sql, params);
  return results.length > 0 ? results[0] : null;
}