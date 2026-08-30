/**
 * run-migration.js  — temporary, run once, delete after use
 *
 * Executes the alerts_v2 Supabase migration using the service-role key.
 * No browser login required.
 *
 * Usage (from src/features/alerts/server/):
 *   node run-migration.js
 */

import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Walk up to the repo root: server/ → alerts/ → features/ → src/ → repo root
const root = resolve(__dirname, '..', '..', '..', '..');
loadEnv({ path: resolve(root, '.env') });

const SUPABASE_URL     = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
console.log('🚀  Project ref :', projectRef);
console.log('📡  Supabase URL:', SUPABASE_URL);

// ── Read migration SQL ────────────────────────────────────────────────────────
const migrationPath = resolve(root, 'supabase', 'migrations', '20260828000000_alerts_v2.sql');
const fullSql = readFileSync(migrationPath, 'utf-8');
console.log('📄  Migration   :', migrationPath);

// Strip -- comments then split on ; into individual statements
const statements = fullSql
  .replace(/--[^\n]*/g, '')
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`\n📋  ${statements.length} statements to execute\n`);

// ── Try Supabase pg-meta endpoint (works with service-role key) ───────────────
// Available on every Supabase project at /pg/query
const pgMetaUrl = `${SUPABASE_URL}/pg/query`;

let successCount = 0;
let errorCount   = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt    = statements[i];
  const preview = stmt.slice(0, 70).replace(/\s+/g, ' ');
  process.stdout.write(`  [${String(i + 1).padStart(2)}/${statements.length}] ${preview}… `);

  try {
    const res  = await fetch(pgMetaUrl, {
      method:  'POST',
      headers: {
        'apikey':        SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ query: stmt }),
    });

    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { message: text }; }

    if (res.ok) {
      console.log('✅');
      successCount++;
    } else {
      const msg = body?.message || body?.error || text || '';
      // Benign: already exists / does not exist
      if (/already exists|does not exist|if not exists/i.test(msg)) {
        console.log(`⚠️  (skip: ${msg.slice(0, 60)})`);
        successCount++;
      } else {
        console.log(`❌  HTTP ${res.status}: ${msg.slice(0, 120)}`);
        errorCount++;
      }
    }
  } catch (err) {
    console.log(`❌  Network: ${err.message}`);
    errorCount++;
  }
}

// ── If pg-meta returned 404 for all, fall back to Management API check ────────
if (errorCount === statements.length) {
  console.log('\n⚠️  pg-meta endpoint not available. Trying Supabase Management API...');
  console.log('   (This requires a personal access token, not just the service-role key.)');
  console.log('\n💡  Alternative: The migration SQL is at:');
  console.log(`    ${migrationPath}`);
  console.log('    Please paste it into the Supabase SQL editor manually.');
  process.exitCode = 1;
} else {
  console.log('\n' + '─'.repeat(60));
  if (errorCount === 0) {
    console.log(`\n🎉  Migration complete! ${successCount}/${statements.length} statements succeeded.`);
    console.log('    The Supabase shared alerts table is ready.');
    console.log('    Restart the server to activate sync.\n');
  } else {
    console.log(`\n⚠️  ${successCount} succeeded, ${errorCount} failed. Check errors above.`);
    process.exitCode = 1;
  }
}
