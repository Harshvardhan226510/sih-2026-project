/**
 * Supabase Alert Sync Service
 *
 * PURPOSE
 * ───────
 * One-way synchronisation from the local sql.js Alerts database into the shared
 * Supabase `alerts` table so other WeatherGPT modules can access current alerts
 * via Supabase Realtime or direct queries — without polling the Alerts API.
 *
 * ARCHITECTURE
 * ────────────
 * This service sits OUTSIDE the existing notification and dashboard paths:
 *
 *   Existing Alerts pipeline
 *   ↓
 *   Local sql.js DB  (source of truth — UNTOUCHED)
 *   ├──→ Dashboard           (UNTOUCHED)
 *   ├──→ MQTT / Web Push     (UNTOUCHED)
 *   └──→ supabaseSync        (THIS MODULE — fire-and-forget only)
 *           ↓
 *       Supabase alerts table
 *           ↓
 *       Other WeatherGPT modules
 *
 * FAILURE CONTRACT
 * ────────────────
 * · All errors are caught here. This module NEVER throws.
 * · Supabase unavailable / misconfigured → logs a warning, returns early.
 * · Network or API error → logs the error, returns early.
 * · The caller (ingestion.js) calls this as a fire-and-forget .catch(log) so
 *   even an unexpected throw would not break the local pipeline.
 *
 * IDENTITY
 * ────────
 * · Supabase `id`           — auto-generated UUID (independent of local DB)
 * · Supabase `external_id`  — local alert `id` (e.g. "imd-IMD_CAP_001")
 * · UNIQUE constraint on `external_id` prevents duplicate rows on re-sync.
 * · Uses upsert (INSERT … ON CONFLICT DO UPDATE) keyed on `external_id`.
 *
 * FIELD MAPPING  (local field name → Supabase column)
 * ────────────────────────────────────────────────────
 *   alert.id          → external_id
 *   alert.source      → source
 *   alert.sourceId    → source_id
 *   alert.event       → type
 *   alert.headline    → title
 *   alert.description → description
 *   alert.severity    → severity   (Extreme|Severe|Moderate|Minor|Unknown)
 *   alert.status      → status     (ACTIVE|EXPIRED|CANCELLED)
 *   alert.area        → area
 *   alert.areaCode    → area_code
 *   alert.latitude    → latitude
 *   alert.longitude   → longitude
 *   alert.polygon     → region_geom (converted JSON→WKT, nullable on failure)
 *   alert.language    → language
 *   alert.effectiveAt → valid_from
 *   alert.expiresAt   → valid_to
 *   alert.issuedAt    → issued_at
 *   alert.createdAt   → created_at
 *   now()             → updated_at  (always refreshed on sync)
 *
 * NOT SYNCED (internal/operational — not needed by other modules):
 *   instruction, urgency, certainty, rawData, revision, version,
 *   capMsgType, capReferences
 */

import { getSupabaseClient } from '../db/supabaseClient.js';
import logger from '../utils/logger.js';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Synchronise a single alert into the Supabase shared alerts table.
 *
 * Uses upsert on `external_id` so the same local alert can be synced multiple
 * times without creating duplicate Supabase rows.
 *
 * @param {object} alert     - Normalised alert object from the local DB.
 *                             May include camelCase (from normalization.js) or
 *                             snake_case-aliased fields (from repository queries).
 *                             Both are handled — see _mapAlertToSupabase().
 * @param {string} eventType - Lifecycle event type string (for logging only).
 *                             Not stored in Supabase.
 * @returns {Promise<void>}  - Always resolves. Never rejects.
 */
export async function syncAlertToSupabase(alert, eventType = 'unknown') {
  const client = getSupabaseClient();
  if (!client) {
    // Credentials not configured — sync disabled, local pipeline unaffected.
    return;
  }

  const payload = _mapAlertToSupabase(alert);
  if (!payload) {
    logger.warn(
      { alertId: alert?.id, eventType },
      'supabase_sync: alert could not be mapped — skipping'
    );
    return;
  }

  try {
    const { error } = await client
      .from('alerts')
      .upsert(payload, { onConflict: 'external_id' });

    if (error) {
      logger.error(
        { alertId: alert.id, eventType, supabaseError: error.message, code: error.code },
        'supabase_sync: upsert failed (non-fatal)'
      );
      return;
    }

    logger.debug(
      { alertId: alert.id, externalId: payload.external_id, eventType },
      'supabase_sync: alert synced'
    );
  } catch (err) {
    // Unexpected error (network failure, library bug, etc.) — must never propagate.
    logger.error(
      { alertId: alert.id, eventType, err: err.message },
      'supabase_sync: unexpected error (non-fatal)'
    );
  }
}

/**
 * Batch-sync multiple alerts into Supabase.
 *
 * Used after expiry runs to update expired alert statuses in Supabase.
 * Skips alerts that cannot be mapped.
 *
 * @param {object[]} alerts   - Array of normalised alert objects.
 * @param {string}   eventType - Lifecycle event type (for logging).
 * @returns {Promise<void>}
 */
export async function syncAlertsToSupabase(alerts, eventType = 'unknown') {
  if (!alerts || alerts.length === 0) return;

  const client = getSupabaseClient();
  if (!client) return;

  const payloads = alerts.map(_mapAlertToSupabase).filter(Boolean);
  if (payloads.length === 0) return;

  try {
    const { error } = await client
      .from('alerts')
      .upsert(payloads, { onConflict: 'external_id' });

    if (error) {
      logger.error(
        { count: payloads.length, eventType, supabaseError: error.message },
        'supabase_sync: batch upsert failed (non-fatal)'
      );
      return;
    }

    logger.debug(
      { count: payloads.length, eventType },
      'supabase_sync: batch sync complete'
    );
  } catch (err) {
    logger.error(
      { count: payloads.length, eventType, err: err.message },
      'supabase_sync: unexpected batch error (non-fatal)'
    );
  }
}

// ─── Field Mapping ────────────────────────────────────────────────────────────

/**
 * Maps a local alert object to the Supabase `alerts` row payload.
 *
 * Handles both camelCase fields (from normalization.js output passed through
 * the ingestion pipeline) and camelCase-aliased SQL fields (from repository
 * SELECT … AS camelCase queries).
 *
 * @param {object} alert - Local alert object.
 * @returns {object|null} - Supabase row payload, or null if required fields missing.
 */
export function _mapAlertToSupabase(alert) {
  if (!alert || !alert.id) return null;

  // Both normalization.js and the repository alias to camelCase — use those.
  const now = new Date().toISOString();

  const payload = {
    external_id:  alert.id,                              // local TEXT PK
    type:         alert.event       || 'Unknown',        // CAP event field
    title:        alert.headline    || null,
    description:  alert.description || null,
    severity:     normaliseSeverity(alert.severity),
    status:       normaliseStatus(alert.status),
    source:       alert.source      || null,
    source_id:    alert.sourceId    || alert.source_id  || null,
    language:     alert.language    || 'en',
    area:         alert.area        || null,
    area_code:    alert.areaCode    || alert.area_code  || null,
    latitude:     alert.latitude    != null ? Number(alert.latitude)  : null,
    longitude:    alert.longitude   != null ? Number(alert.longitude) : null,
    region_geom:  polygonToWkt(alert.polygon),
    valid_from:   toIso(alert.effectiveAt || alert.effective_at),
    valid_to:     toIso(alert.expiresAt   || alert.expires_at),
    issued_at:    toIso(alert.issuedAt    || alert.issued_at),
    created_at:   toIso(alert.createdAt   || alert.created_at) || now,
    updated_at:   now,
  };

  return payload;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Ensure severity is one of the Supabase CHECK values.
 * Falls back to 'Unknown' for anything unrecognised.
 */
function normaliseSeverity(raw) {
  const VALID = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'];
  if (!raw) return 'Unknown';
  // Local normalizer already produces Title-case; guard against any drift.
  const titleCase = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return VALID.includes(titleCase) ? titleCase : 'Unknown';
}

/**
 * Ensure status is one of the Supabase CHECK values.
 * Falls back to 'ACTIVE' for anything unrecognised.
 */
function normaliseStatus(raw) {
  const VALID = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'UPDATED'];
  if (!raw) return 'ACTIVE';
  const upper = raw.toUpperCase();
  return VALID.includes(upper) ? upper : 'ACTIVE';
}

/**
 * Convert an ISO string or Date-like value to an ISO string, or return null.
 */
function toIso(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Convert the local polygon JSON string to a PostGIS WKT string.
 *
 * The local DB stores polygon as a JSON-encoded array of {lat, lon} objects
 * (see normalization.js → parsePolygon).  PostGIS expects coordinates in
 * (longitude latitude) order — the opposite of the local storage format.
 *
 * Returns null if:
 *   - polygon is absent or empty
 *   - the JSON cannot be parsed
 *   - there are fewer than 3 coordinate pairs (not a valid polygon)
 *   - any coordinate value is non-numeric
 *
 * The caller handles null gracefully — Supabase stores NULL for region_geom.
 *
 * WKT format: POLYGON((lon1 lat1, lon2 lat2, …, lon1 lat1))
 * The ring must be closed (first === last), so we append the first point.
 *
 * @param {string|null} polygonJson - JSON string from local alerts.polygon
 * @returns {string|null} WKT polygon string, or null
 */
export function polygonToWkt(polygonJson) {
  if (!polygonJson) return null;

  let coords;
  try {
    coords = typeof polygonJson === 'string' ? JSON.parse(polygonJson) : polygonJson;
  } catch {
    return null;
  }

  if (!Array.isArray(coords) || coords.length < 3) return null;

  try {
    const pairs = coords.map(({ lat, lon }) => {
      if (typeof lat !== 'number' || typeof lon !== 'number') {
        throw new Error('non-numeric coordinate');
      }
      return `${lon} ${lat}`; // PostGIS: longitude first
    });

    // Close the ring: first point === last point
    const first = pairs[0];
    const last  = pairs[pairs.length - 1];
    if (first !== last) pairs.push(first);

    return `POLYGON((${pairs.join(', ')}))`;
  } catch {
    return null;
  }
}
