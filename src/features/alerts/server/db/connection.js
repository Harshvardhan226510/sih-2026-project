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

  const migration005 = resolve(__dirname, 'migrations', '005_reliability.sql');
  const sql005 = readFileSync(migration005, 'utf-8')
    // Strip single-line SQL comments (-- ...) before splitting on semicolons
    // to prevent inline comment examples (e.g. cleanup queries) from producing
    // orphaned statement fragments.
    .replace(/--[^\n]*/g, '');
  sql005.split(';').filter(s => s.trim()).forEach(stmt => {
    try {
      db.run(stmt + ';');
    } catch (err) {
      // UNIQUE index creation may fail if duplicate (source, source_id) rows exist.
      // Log the issue but do not abort — dedup is enforced at application level as fallback.
      logger.warn({ err: err.message }, 'migration 005: statement skipped (check for duplicate source+source_id pairs)');
    }
  });

  const migration006 = resolve(__dirname, 'migrations', '006_alert_version.sql');
  const sql006 = readFileSync(migration006, 'utf-8').replace(/--[^\n]*/g, '');
  sql006.split(';').filter(s => s.trim()).forEach(stmt => {
    try {
      db.run(stmt + ';');
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        logger.error({ err: err.message }, 'migration 006 failed');
      }
    }
  });

  const migration007 = resolve(__dirname, 'migrations', '007_mock_cleanup.sql');
  const sql007 = readFileSync(migration007, 'utf-8').replace(/--[^\n]*/g, '');
  sql007.split(';').filter(s => s.trim()).forEach(stmt => {
    try {
      db.run(stmt + ';');
    } catch (err) {
      logger.error({ err: err.message }, 'migration 007 failed');
    }
  });

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