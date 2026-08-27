import { AlertRepository } from '../repositories/alertRepository.js';
import { DeliveryService } from './delivery.js';
import { normalizeIMDAlert } from './normalization.js';
import { processAlerts } from './processing.js';
import { expireAlerts } from './expiry.js';
import { saveDb } from '../db/connection.js';
import { notificationRouter } from './notificationRouter.js';
import logger from '../utils/logger.js';

const repo = new AlertRepository();
const deliveryService = new DeliveryService();

export async function ingestFromProvider(provider) {
  const providerName = provider.name;
  logger.info({ provider: providerName }, 'starting ingestion');
  try {
    const rawAlerts = await provider.fetchAlerts();
    if (!rawAlerts || !rawAlerts.length) {
      logger.info({ provider: providerName }, 'no alerts returned');
      repo.updateProviderStatus(providerName, true);
      return { created: 0, updated: 0, skipped: 0 };
    }
    const normalized = rawAlerts.map(raw => {
      if (providerName === 'imd') return normalizeIMDAlert(raw);
      return null;
    }).filter(Boolean);
    const sourceIds = normalized.map(a => a.sourceId);
    const existingMap = repo.getExistingBySourceIds(sourceIds);
    const { toCreate, toUpdate, skipped } = processAlerts(normalized, existingMap);
    let revision = repo.getCurrentRevision();
    for (const alert of toCreate) {
      revision++;
      repo.create(alert, revision);
      deliveryService.enqueueAlerts(alert);
      // Route to notification channels (Web Push fan-out)
      // Non-blocking: push failure never prevents ingestion completion
      notificationRouter.route(alert).catch(err =>
        logger.error({ alertId: alert.id, err: err.message }, 'notification router error on create')
      );
    }
    for (const alert of toUpdate) {
      revision++;
      repo.update(alert, revision);
      deliveryService.enqueueAlerts(alert);
      // Route to notification channels on significant update
      notificationRouter.route(alert).catch(err =>
        logger.error({ alertId: alert.id, err: err.message }, 'notification router error on update')
      );
    }
    if (toCreate.length || toUpdate.length) {
      repo.updateSyncRevision(revision);
    }
    const expiredCount = expireAlerts();
    saveDb();
    repo.updateProviderStatus(providerName, true);
    repo.updateProviderAlertCount(providerName, normalized.length);
    const result = { created: toCreate.length, updated: toUpdate.length, skipped, expired: expiredCount };
    logger.info({ provider: providerName, ...result }, 'ingestion complete');
    return result;
  } catch (err) {
    logger.error({ provider: providerName, err: err.message }, 'ingestion failed');
    repo.updateProviderStatus(providerName, false, err.message);
    return { created: 0, updated: 0, skipped: 0, error: err.message };
  }
}