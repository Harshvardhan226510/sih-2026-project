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
 * Returns null when SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.
 * Callers must guard:
 *
 *   const client = getSupabaseClient();
 *   if (!client) { return; }  // sync silently skipped
 *
 * This keeps the local Alerts pipeline functioning normally in environments
 * where Supabase credentials have not been configured.
 */

import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let _client = null;
let _initialized = false;

/**
 * Returns the Supabase service-role client, or null if not configured.
 *
 * Initialised lazily on first call so that missing credentials do not cause
 * a startup crash — they simply disable Supabase sync.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabaseClient() {
  if (_initialized) return _client;
  _initialized = true;

  const { url, serviceRoleKey } = config.supabase;

  if (!url || !serviceRoleKey) {
    logger.warn(
      'supabase_sync: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — ' +
      'Supabase sync is disabled. Local alerts pipeline is unaffected.'
    );
    _client = null;
    return null;
  }

  try {
    _client = createClient(url, serviceRoleKey, {
      auth: {
        // Disable auto-refresh token — we are running as a server process
        // with a static service-role key, not as an interactive user session.
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    logger.info('supabase_sync: Supabase client initialised');
  } catch (err) {
    logger.error({ err: err.message }, 'supabase_sync: failed to create Supabase client');
    _client = null;
  }

  return _client;
}

/**
 * Reset the singleton — used only by tests to allow re-initialisation with
 * different config values without restarting the process.
 *
 * @internal
 */
export function _resetSupabaseClient() {
  _client = null;
  _initialized = false;
}
