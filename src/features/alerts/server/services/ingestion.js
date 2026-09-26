import { AlertRepository } from '../repositories/alertRepository.js';
import { DeliveryService } from './delivery.js';
import { normalizeIMDAlert } from './normalization.js';
import { processAlerts } from './processing.js';
import { expireAlerts } from './expiry.js';
import { notificationRouter } from './notificationRouter.js';
import { ALERT_EVENTS } from '../models/alert.js';
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
    logger.error({ provider: providerName, err: err.message }, 'ingestion_failure: provider fetch failed');
    await repo.updateProviderStatus(providerName, false, err.message);
    return { created: 0, updated: 0, cancelled: 0, skipped: 0, malformed: 0, error: err.message };
  }

  if (!rawAlerts || !rawAlerts.length) {
    logger.info({ provider: providerName }, 'no alerts returned');
    await repo.updateProviderStatus(providerName, true);
    return { created: 0, updated: 0, cancelled: 0, skipped: 0, malformed: 0 };
  }

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
      logger.warn({ provider: providerName, err: err.message }, 'ingestion: malformed alert skipped (normalization error)');
    }
  }

  if (normalizationErrors > 0) {
    logger.warn({ provider: providerName, total: rawAlerts.length, malformed: normalizationErrors, valid: normalized.length }, 'ingestion: some alerts skipped due to normalization errors');
  }

  const sourceIds   = normalized.map(a => a.sourceId);
  const existingMap = await repo.getExistingBySourceIds(sourceIds);
  const { toCreate, toUpdate, toCancel, skipped, malformed } = processAlerts(normalized, existingMap);

  let revision = await repo.getCurrentRevision();
  let created = 0, updated = 0, cancelled = 0;

  for (const alert of toCreate) {
    try {
      revision++;
      const inserted = await repo.create(alert, revision);
      if (inserted) {
        created++;
        deliveryService.enqueueAlerts(alert); // Not awaiting delivery enqueue for performance
        notificationRouter.route(alert, ALERT_EVENTS.CREATED).catch(err =>
          logger.error({ alertId: alert.id, err: err.message }, 'notification router error on create')
        );
      } else {
        revision--;
        logger.debug({ alertId: alert.id, sourceId: alert.sourceId }, 'duplicate_detected: INSERT OR IGNORE skipped existing alert');
      }
    } catch (err) {
      revision--;
      logger.error({ alertId: alert.id, err: err.message }, 'ingestion: failed to create alert');
    }
  }

  for (const alert of toUpdate) {
    try {
      revision++;
      await repo.update(alert, revision);
      updated++;
      deliveryService.enqueueAlerts(alert);
      notificationRouter.route(alert, ALERT_EVENTS.UPDATED).catch(err =>
        logger.error({ alertId: alert.id, err: err.message }, 'notification router error on update')
      );
    } catch (err) {
      revision--;
      logger.error({ alertId: alert.id, err: err.message }, 'ingestion: failed to update alert');
    }
  }

  for (const { alertId, sourceId } of toCancel) {
    try {
      revision++;
      await repo.cancel(alertId, revision);
      cancelled++;
      const cancelledAlert = await repo.getById(alertId);
      if (cancelledAlert) {
        notificationRouter.route(cancelledAlert, ALERT_EVENTS.CANCELLED).catch(err =>
          logger.error({ alertId, err: err.message }, 'notification router error on cancel')
        );
      }
      logger.info({ alertId, sourceId }, 'alert_cancelled');
    } catch (err) {
      revision--;
      logger.error({ alertId, err: err.message }, 'ingestion: failed to cancel alert');
    }
  }

  if (created || updated || cancelled) {
    await repo.updateSyncRevision(revision);
  }

  // expireAlerts also needs to be refactored to use Supabase, but for now we will await it if we converted it
  // Actually, we must convert expiry.js to be async. 
  let expiredCount = 0;
  try {
    expiredCount = await expireAlerts();
  } catch (err) {
     logger.error({ err: err.message }, 'expiry error');
  }

  await repo.updateProviderStatus(providerName, true);
  await repo.updateProviderAlertCount(providerName, normalized.length);

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