import { createClient } from '@supabase/supabase-js';
import { config, missingServerConfig } from './config.js';

let client;
export function supabase() {
  if (client) return client;
  const missing = missingServerConfig();
  if (missing.length) throw new Error(`Server configuration missing: ${missing.join(', ')}`);
  client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } });
  return client;
}
