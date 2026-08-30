import { Router } from 'express';
import {
  listAlerts, getAlert, syncAlerts, bootstrapAlerts,
  alertSummary, healthCheck, triggerIngestion,
  registerDevice, acknowledgeAlert, updateLocation,
  subscribePush, unsubscribePush, getVapidPublicKey, getAlertHistory,
  injectTestAlerts, cleanupTestAlerts,
} from '../controllers/alertController.js';
import { requireAdmin, validateLocationPayload, validateSubscriptionPayload, validateSyncPayload } from '../middleware/security.js';

const router = Router();

// Device registration + acknowledgement
router.post('/devices/register', registerDevice);
router.post('/devices/location', validateLocationPayload, updateLocation);
router.post('/alerts/ack', acknowledgeAlert);

// Push subscription management
router.get('/push/vapid-public-key', getVapidPublicKey);
router.post('/push/subscribe', validateSubscriptionPayload, subscribePush);
router.delete('/push/subscribe', unsubscribePush);

// Alert data
router.get('/alerts/sync', validateSyncPayload, syncAlerts);
router.get('/alerts/bootstrap', bootstrapAlerts);
router.get('/alerts/summary', alertSummary);
router.get('/alerts/:id/history', getAlertHistory);
router.get('/alerts/:id', getAlert);
router.get('/alerts', listAlerts);

// Admin / manual trigger
router.post('/alerts/ingest', requireAdmin, triggerIngestion);
router.post('/admin/ingest', requireAdmin, triggerIngestion);
router.post('/admin/test-alerts', requireAdmin, injectTestAlerts);
router.delete('/admin/test-alerts', requireAdmin, cleanupTestAlerts);
router.get('/health', healthCheck);

export default router;