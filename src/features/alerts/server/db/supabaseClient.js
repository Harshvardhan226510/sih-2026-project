/**
 * Supabase Client — lazy singleton
 *
 * PURPOSE
 * ───────
 * Provides a single @supabase/supabase-js client instance configured with the
 * service-role key so the server can write to Supabase tables that are protected
 * by RLS.
 *
 * IMPORTANT SECURITY NOTE
 * ───────────────────────
 * This module must ONLY be imported by server-side code.
 * The SUPABASE_SERVICE_ROLE_KEY bypasses all RLS policies and must NEVER be:
 *   · sent to the browser
 *   · exposed in API responses
 *   · committed to source control
 *
 * AVAILABILITY CONTRACT
 * ─────────────────────
 * Throws a structured error if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing,
 * as Supabase is now the authoritative source of truth.
 */

import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let _client = null;
let _initialized = false;

export function getSupabaseClient() {
  if (_initialized && _client) return _client;
  
  const { url, serviceRoleKey } = config.supabase;

  if (!url || !serviceRoleKey) {
    const missing = [];
    if (!url) missing.push('SUPABASE_URL');
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    
    logger.error(
      `supabase_client: Missing required server configuration: ${missing.join(', ')}`
    );
    
    const err = new Error(`Missing required server environment variables: ${missing.join(', ')}`);
    err.status = 503;
    err.isConfigError = true;
    err.missingVars = missing;
    throw err;
  }

  try {
    _client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    _initialized = true;
    logger.info('supabase_client: Supabase client initialised');
  } catch (err) {
    logger.error({ err: err.message }, 'supabase_client: failed to create Supabase client');
    throw err;
  }

  return _client;
}

export function _resetSupabaseClient() {
  _client = null;
  _initialized = false;
}
