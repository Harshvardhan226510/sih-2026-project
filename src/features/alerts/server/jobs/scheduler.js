import cron from 'node-cron';
import { ingestFromProvider } from '../services/ingestion.js';
import { expireAlerts } from '../services/expiry.js';
import { DeliveryService } from '../services/delivery.js';
import { IMDAlertProvider } from '../providers/imd.js';
import * as mqttService from '../services/mqttService.js';
import { initWebPush, retryFailedPushes } from '../services/webPush.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let task         = null;
let deliveryTask = null;
let outboxTask   = null;

const deliveryService = new DeliveryService();

export function startScheduler() {
  // Initialize Web Push VAPID keys
  initWebPush();

  // Start MQTT client (server-side only; no-op if MQTT_ENABLED=false)
  mqttService.connect();

  const cronExpr = config.ingestion.cron;
  logger.info({ cron: cronExpr }, 'starting ingestion scheduler');

  // Run immediately on startup, then on schedule
  runIngestion();
  task = cron.schedule(cronExpr, () => {
    runIngestion();
  });

  // Delivery queue processing + push retry (every 5 minutes)
  deliveryTask = cron.schedule('*/5 * * * *', () => {
    deliveryService.processQueue();
    retryFailedPushes().catch(err =>
      logger.error({ err: err.message }, 'push retry error')
    );
  });

  // MQTT outbox flush (every 2 minutes)
  // Provides a secondary recovery path if the reconnect-triggered flush misses entries
  // (e.g. entries added while reconnect was in progress).
  outboxTask = cron.schedule('*/2 * * * *', () => {
    mqttService.flushOutbox().catch(err =>
      logger.error({ err: err.message }, 'mqtt_outbox_flush_error from scheduler')
    );
  });
}

async function runIngestion() {
  try {
    // ingestFromProvider handles its own expiry internally after a successful fetch.
    // Do NOT call expireAlerts() here on failure — the ingestion service handles
    // the contract of "only expire after successful provider fetch".
    await ingestFromProvider(new IMDAlertProvider());
  } catch (err) {
    logger.error({ err: err.message }, 'scheduled ingestion failed');
  }
}

export function stopScheduler() {
  if (task)         { task.stop();         task = null; }
  if (deliveryTask) { deliveryTask.stop();  deliveryTask = null; }
  if (outboxTask)   { outboxTask.stop();    outboxTask = null; }
  // Graceful MQTT shutdown
  mqttService.disconnect();
}