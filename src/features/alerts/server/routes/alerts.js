import { Router } from 'express';
import {
  listAlerts, getAlert, syncAlerts, bootstrapAlerts,
  alertSummary, healthCheck, triggerIngestion,
  registerDevice, acknowledgeAlert, updateLocation,
  subscribePush, unsubscribePush, getVapidPublicKey,
} from '../controllers/alertController.js';

const router = Router();

// Device registration + acknowledgement
router.post('/devices/register', registerDevice);
router.post('/devices/location', updateLocation);
router.post('/alerts/ack', acknowledgeAlert);

// Push subscription management
// GET /api/push/vapid-public-key  — returns only the public VAPID key (never private)
router.get('/push/vapid-public-key', getVapidPublicKey);
router.post('/push/subscribe',   subscribePush);
router.delete('/push/subscribe', unsubscribePush);

// Alert data
router.get('/alerts/sync',      syncAlerts);
router.get('/alerts/bootstrap', bootstrapAlerts);
router.get('/alerts/summary',   alertSummary);
router.get('/alerts/:id',       getAlert);
router.get('/alerts',           listAlerts);

// Admin / manual trigger
router.post('/alerts/ingest', triggerIngestion);
router.post('/admin/ingest',  triggerIngestion);
router.get('/health',         healthCheck);

export default router;