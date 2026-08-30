/**
 * Alert Ingestion Service
 *
 * Orchestrates the full alert ingestion pipeline:
 *   1. Fetch raw alerts from provider (IMD RSS/CAP)
 *   2. Normalize each alert (per-alert isolation — one malformed alert skipped, rest continue)
 *   3. Deduplicate against existing DB records by source_id
 *   4. Persist: INSERT new alerts, UPDATE changed alerts, CANCEL explicitly revoked alerts
 *   5. Route to notification channels (Web Push + MQTT)
 *   6. Expire time-based alerts (ONLY on successful fetch — see contract below)
 *   7. Persist DB snapshot to disk
 *
 * FAILURE CONTRACTS:
 *  - IMD unavailable: logs failure, updates provider_status, returns early.
 *    Existing valid alerts are NOT modified. expireAlerts() is NOT called.
 *  - One malformed CAP alert: logged, skipped. Remaining valid alerts proceed normally.
 *  - MQTT failure: logged, non-fatal. Alert remains in DB. Outbox handles retry.
 *  - Web Push failure: logged, non-fatal. Alert remains in DB.
 *  - DB write failure: propagates as error (hard failure — must be investigated).
 *
 * DEDUPLICATION:
 *  Same source_id arriving again:
 *  → hasChanged() returns false → skipped → no revision increment → no notification.
 *  → hasChanged() returns true  → update  → revision increments   → notification sent.
 *
 * REVISION CHURN PREVENTION:
 *  Revisions are only incremented for toCreate, toUpdate, and toCancel operations.
 *  Unchanged (skipped) alerts produce zero revision churn.
 */

import { AlertRepository } from '../repositories/alertRepository.js';
import { DeliveryService } from './delivery.js';
import { normalizeIMDAlert } from './normalization.js';
import { processAlerts } from './processing.js';
import { expireAlerts } from './expiry.js';
import { saveDb } from '../db/connection.js';
import { notificationRouter } from './notificationRouter.js';
import { ALERT_EVENTS } from '../models/alert.js';
import { syncAlertToSupabase, syncAlertsToSupabase } from './supabaseSync.js';
import logger from '../utils/logger.js';

const repo            = new AlertRepository();
const deliveryService = new DeliveryService();

export async function ingestFromProvider(provider) {
  const providerName = provider.name;
  logger.info({ provider: providerName }, 'starting ingestion');

  let rawAlerts;
  try {
    rawAlerts = await provider.fetchAlerts();
  } catch (err) {
    // IMD unreachable — do NOT touch existing alerts or call expireAlerts()
    logger.error({ provider: providerName, err: err.message }, 'ingestion_failure: provider fetch failed');
    repo.updateProviderStatus(providerName, false, err.message);
    return { created: 0, updated: 0, cancelled: 0, skipped: 0, malformed: 0, error: err.message };
  }

  if (!rawAlerts || !rawAlerts.length) {
    logger.info({ provider: providerName }, 'no alerts returned');
    repo.updateProviderStatus(providerName, true);
    return { created: 0, updated: 0, cancelled: 0, skipped: 0, malformed: 0 };
  }

  // ── Per-alert normalization with isolation ─────────────────────────────────
  // One malformed CAP alert must NOT abort the whole batch.
  const normalized = [];
  let normalizationErrors = 0;

  for (const raw of rawAlerts) {
    try {
      let alert;
      if (providerName === 'imd') {
        alert = normalizeIMDAlert(raw);
      } else {
        logger.warn({ provider: providerName }, 'unknown provider — skipping alert');
        normalizationErrors++;
        continue;
      }
      if (alert) normalized.push(alert);
    } catch (err) {
      normalizationErrors++;
      logger.warn(
        { provider: providerName, err: err.message },
        'ingestion: malformed alert skipped (normalization error)'
      );
    }
  }

  if (normalizationErrors > 0) {
    logger.warn(
      { provider: providerName, total: rawAlerts.length, malformed: normalizationErrors, valid: normalized.length },
      'ingestion: some alerts skipped due to normalization errors'
    );
  }

  // ── Deduplication + classification ────────────────────────────────────────
  const sourceIds   = normalized.map(a => a.sourceId);
  const existingMap = repo.getExistingBySourceIds(sourceIds);
  const { toCreate, toUpdate, toCancel, skipped, malformed } = processAlerts(normalized, existingMap);

  let revision = repo.getCurrentRevision();
  let created = 0, updated = 0, cancelled = 0;

  // ── Persist new alerts ────────────────────────────────────────────────────
  for (const alert of toCreate) {
    try {
      revision++;
      const inserted = repo.create(alert, revision);
      if (inserted) {
        created++;
        deliveryService.enqueueAlerts(alert);
        // Non-blocking: notification failure must never prevent ingestion from completing
        notificationRouter.route(alert, ALERT_EVENTS.CREATED).catch(err =>
          logger.error({ alertId: alert.id, err: err.message }, 'notification router error on create')
        );
        // One-way Supabase sync — fire-and-forget, never affects local pipeline
        syncAlertToSupabase(alert, ALERT_EVENTS.CREATED).catch(err =>
          logger.error({ alertId: alert.id, err: err.message }, 'supabase_sync error on create (non-fatal)')
        );
      } else {
        // INSERT OR IGNORE returned 0 changes — race with concurrent ingestion or DB constraint hit
        revision--; // roll back revision increment — no actual DB change
        logger.debug(
          { alertId: alert.id, sourceId: alert.sourceId },
          'duplicate_detected: INSERT OR IGNORE skipped existing alert'
        );
      }
    } catch (err) {
      revision--;
      logger.error({ alertId: alert.id, err: err.message }, 'ingestion: failed to create alert');
    }
  }

  // ── Persist updated alerts ────────────────────────────────────────────────
  for (const alert of toUpdate) {
    try {
      revision++;
      repo.update(alert, revision);
      updated++;
      deliveryService.enqueueAlerts(alert);
      notificationRouter.route(alert, ALERT_EVENTS.UPDATED).catch(err =>
        logger.error({ alertId: alert.id, err: err.message }, 'notification router error on update')
      );
      // One-way Supabase sync — fire-and-forget, never affects local pipeline
      syncAlertToSupabase(alert, ALERT_EVENTS.UPDATED).catch(err =>
        logger.error({ alertId: alert.id, err: err.message }, 'supabase_sync error on update (non-fatal)')
      );
    } catch (err) {
      revision--;
      logger.error({ alertId: alert.id, err: err.message }, 'ingestion: failed to update alert');
    }
  }

  // ── Process cancellations ─────────────────────────────────────────────────
  for (const { alertId, sourceId } of toCancel) {
    try {
      revision++;
      repo.cancel(alertId, revision);
      cancelled++;
      // Retrieve the cancelled alert for notification routing
      const cancelledAlert = repo.getById(alertId);
      if (cancelledAlert) {
        notificationRouter.route(cancelledAlert, ALERT_EVENTS.CANCELLED).catch(err =>
          logger.error({ alertId, err: err.message }, 'notification router error on cancel')
        );
        // One-way Supabase sync — fire-and-forget, never affects local pipeline
        syncAlertToSupabase(cancelledAlert, ALERT_EVENTS.CANCELLED).catch(err =>
          logger.error({ alertId, err: err.message }, 'supabase_sync error on cancel (non-fatal)')
        );
      }
      logger.info({ alertId, sourceId }, 'alert_cancelled');
    } catch (err) {
      revision--;
      logger.error({ alertId, err: err.message }, 'ingestion: failed to cancel alert');
    }
  }

  // ── Advance sync revision ─────────────────────────────────────────────────
  if (created || updated || cancelled) {
    repo.updateSyncRevision(revision);
  }

  // ── Time-based expiry (only after successful fetch) ───────────────────────
  // IMPORTANT: expireAlerts() is ONLY called here, after a successful provider response.
  // A failed fetch must never trigger expiry of existing valid alerts.
  const expiredCount = expireAlerts();

  // ── Supabase sync for expired alerts ─────────────────────────────────────
  // Sync newly-expired alerts to Supabase so other modules see up-to-date status.
  // Fire-and-forget — expiry sync failure must NOT affect the local pipeline.
  if (expiredCount > 0) {
    try {
      const { runQuery } = await import('../db/connection.js');
      const recentlyExpired = runQuery(
        `SELECT id, source, source_id as sourceId, event, headline, description,
                severity, status, effective_at as effectiveAt, expires_at as expiresAt,
                issued_at as issuedAt, area, area_code as areaCode,
                latitude, longitude, polygon, language, created_at as createdAt,
                updated_at as updatedAt
         FROM alerts WHERE status = 'EXPIRED' AND updated_at >= ?`,
        [new Date(Date.now() - 60_000).toISOString()] // within the last 60s
      );
      syncAlertsToSupabase(recentlyExpired, 'expired').catch(err =>
        logger.error({ err: err.message }, 'supabase_sync error on expiry batch (non-fatal)')
      );
    } catch (err) {
      logger.error({ err: err.message }, 'supabase_sync: could not query expired alerts (non-fatal)');
    }
  }

  saveDb();
  repo.updateProviderStatus(providerName, true);
  repo.updateProviderAlertCount(providerName, normalized.length);

  const result = {
    created,
    updated,
    cancelled,
    skipped,
    malformed: malformed + normalizationErrors,
    expired: expiredCount,
  };
  logger.info({ provider: providerName, ...result }, 'ingestion complete');
  return result;
}