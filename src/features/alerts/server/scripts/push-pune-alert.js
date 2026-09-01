import { initDb, saveDb } from '../db/connection.js';
import { AlertRepository } from '../repositories/alertRepository.js';
import { initWebPush } from '../services/webPush.js';
import { notificationRouter } from '../services/notificationRouter.js';
import { ALERT_EVENTS } from '../models/alert.js';
import logger from '../utils/logger.js';

async function triggerPunePush() {
  console.log('--- Starting Pune Web Push Notification Trigger ---');

  // 1. Initialize DB and Web Push VAPID
  await initDb();
  const vapidReady = initWebPush();
  if (!vapidReady) {
    console.error('❌ VAPID keys not configured. Web Push cannot be dispatched.');
    process.exit(1);
  }

  const repo = new AlertRepository();
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h from now

  const timestamp = Date.now();
  const alertId = `mock-pune-${timestamp}`;

  const puneAlert = {
    id: `urn:oid:mock:${alertId}`,
    source: 'mock',
    sourceId: `pune-live-test-${timestamp}`,
    event: 'Severe Thunderstorm & Flash Flood Warning',
    headline: '⚡ [TEST ALERT] Severe Thunderstorm & Heavy Rainfall Warning for Pune',
    description: 'Intense convective thunderstorm activity with torrential rain (65-115 mm) and severe lightning detected over Pune district. Localized waterlogging and traffic disruption expected.',
    instruction: 'Stay indoors, disconnect electrical appliances, and avoid low-lying waterlogged roads.',
    severity: 'Severe',
    urgency: 'Immediate',
    certainty: 'Observed',
    status: 'ACTIVE',
    effectiveAt: now.toISOString(),
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    area: 'Pune, Maharashtra',
    areaCode: 'PUNE',
    latitude: 18.5204,
    longitude: 73.8567,
    polygon: null,
    language: 'en-US',
    rawData: JSON.stringify({ isMock: true, generatedAt: now.toISOString(), targetDistrict: 'Pune' })
  };

  // 2. Insert alert into local database
  let currentRevision = repo.getCurrentRevision() + 1;
  repo.create(puneAlert, currentRevision);
  repo.updateSyncRevision(currentRevision);
  saveDb();

  console.log(`✅ Alert created in database: "${puneAlert.headline}" (Revision: ${currentRevision})`);

  // 3. Dispatch through notification router (Web Push + MQTT)
  console.log('🚀 Dispatching Web Push and MQTT notifications to Pune subscribers...');
  await notificationRouter.route(puneAlert, ALERT_EVENTS.CREATED);

  console.log('🎉 Notification routing complete! Check your browser / OS notification center.');
  process.exit(0);
}

triggerPunePush().catch((err) => {
  console.error('❌ Error triggering Pune push notification:', err);
  process.exit(1);
});
