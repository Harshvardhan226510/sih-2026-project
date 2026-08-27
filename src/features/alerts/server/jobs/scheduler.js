import cron from 'node-cron';
import { ingestFromProvider } from '../services/ingestion.js';
import { expireAlerts } from '../services/expiry.js';
import { DeliveryService } from '../services/delivery.js';
import { IMDAlertProvider } from '../providers/imd.js';
import * as mqttService from '../services/mqttService.js';
import { initWebPush, retryFailedPushes } from '../services/webPush.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let task = null;
let deliveryTask = null;
const deliveryService = new DeliveryService();

export function startScheduler() {
  // Initialize Web Push VAPID keys
  initWebPush();

  // Start MQTT client (server-side only; no-op if MQTT_ENABLED=false)
  mqttService.connect();

  const cronExpr = config.ingestion.cron;
  logger.info({ cron: cronExpr }, 'starting ingestion scheduler');
  runIngestion();
  task = cron.schedule(cronExpr, () => {
    runIngestion();
  });

  // Schedule delivery queue processing + push retry (every 5 minutes)
  deliveryTask = cron.schedule('*/5 * * * *', () => {
    deliveryService.processQueue();
    retryFailedPushes().catch(err =>
      logger.error({ err: err.message }, 'push retry error')
    );
  });
}

async function runIngestion() {
  try {
    await ingestFromProvider(new IMDAlertProvider());
    expireAlerts();
  } catch (err) {
    logger.error({ err: err.message }, 'scheduled ingestion failed');
  }
}

export function stopScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
  if (deliveryTask) {
    deliveryTask.stop();
    deliveryTask = null;
  }
  // Graceful MQTT shutdown
  mqttService.disconnect();
}