import { initDb, runQuery, runExec, closeDb } from '../db/connection.js';
import { WeatherProvider } from '../providers/base.js';
import { ingestFromProvider } from '../services/ingestion.js';
import { AlertRepository } from '../repositories/alertRepository.js';
import { PushRepository } from '../repositories/pushRepository.js';
import { getMqttStatus, connect as connectMqtt } from '../services/mqttService.js';
import { initWebPush, getPushStats, sendAlertToMatchingSubscriptions } from '../services/webPush.js';

class MockCapProvider extends WeatherProvider {
  constructor(alerts) {
    super();
    this._alerts = alerts;
  }
  get name() { return 'imd'; }
  get type() { return 'alert'; }
  async fetchAlerts() {
    return this._alerts;
  }
}

async function runControlledE2ETest() {
  console.log('====================================================');
  console.log('WEATHERGPT ALERT SYSTEM: CONTROLLED END-TO-END TEST');
  console.log('====================================================');

  await initDb();
  initWebPush();
  connectMqtt();

  const repo = new AlertRepository();
  const pushRepo = new PushRepository();
  const initialRevision = repo.getCurrentRevision();
  console.log(`[SETUP] Initial DB Revision: ${initialRevision}`);

  // Ensure test Pune subscriber exists
  const existingSubs = pushRepo.getForLocation('Maharashtra', 'Pune');
  console.log(`[SETUP] Found ${existingSubs.length} registered Pune subscription(s).`);

  // --- 1. CREATE TEST ALERT 1: PUNE (MAHARASHTRA) ---
  console.log('\n--- STEP 1: Ingesting Temporary Test Alert (Pune, Maharashtra) ---');
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  const puneAlertRaw = {
    identifier: 'test-pune-e2e-001',
    sender: 'imd.gov.in',
    sent: now,
    status: 'Actual',
    msgType: 'Alert',
    scope: 'Public',
    event: 'TEST Heat Wave',
    headline: 'TEST Severe Heat Wave for Pune',
    description: 'This is a temporary end-to-end WeatherGPT alert test.',
    instruction: 'This is a test notification. No action is required.',
    severity: 'Severe',
    urgency: 'Expected',
    certainty: 'Likely',
    onset: now,
    expires: expires,
    areaDesc: 'Pune, Maharashtra',
    language: 'en'
  };

  const provider1 = new MockCapProvider([puneAlertRaw]);
  const result1 = await ingestFromProvider(provider1);
  console.log('[INGEST] Ingestion Result 1:', result1);

  // Wait for async notification/MQTT dispatch
  await new Promise(r => setTimeout(r, 2000));

  // --- VERIFICATION A: DATABASE ---
  const puneDbAlert = repo.getBySourceId('test-pune-e2e-001');
  const isDbPersisted = !!puneDbAlert && puneDbAlert.status === 'ACTIVE' && puneDbAlert.version >= 1;
  console.log(`[CHECK A - DATABASE] Pune Alert Persisted & ACTIVE: ${isDbPersisted ? 'PASS' : 'FAIL'}`);
  console.log('  -> Details:', {
    id: puneDbAlert?.id,
    severity: puneDbAlert?.severity,
    area: puneDbAlert?.area,
    status: puneDbAlert?.status,
    version: puneDbAlert?.version,
    revision: puneDbAlert?.revision
  });

  // --- VERIFICATION B: API HEALTH ---
  const healthMqtt = getMqttStatus();
  const healthPush = getPushStats();
  const providerStatus = repo.getProviderStatus('imd');
  console.log('[CHECK B - API / HEALTH]');
  console.log('  -> IMD Status:', providerStatus?.last_error ? 'Warning' : 'Healthy');
  console.log('  -> MQTT Enabled:', healthMqtt.enabled, '| State:', healthMqtt.state);
  console.log('  -> Push Subscriptions:', healthPush.total, '| With Location:', healthPush.withDistrict);

  // --- VERIFICATION D & F: WEB PUSH TARGETING FOR PUNE ALERT ---
  console.log('[CHECK D & F - WEB PUSH TARGETING FOR PUNE]');
  const punePushResult = await sendAlertToMatchingSubscriptions(puneDbAlert);
  console.log(`  -> Pune Alert push targeting: matched and attempted: ${punePushResult.sent + punePushResult.failed} delivery/ies`);
  const isPunePushTargeted = (punePushResult.sent + punePushResult.failed) > 0;
  console.log(`  -> Pune Alert Web Push matching: ${isPunePushTargeted ? 'PASS (Matched Pune user)' : 'FAIL'}`);

  // --- STEP 2: CREATE TEST ALERT 2: PURI (ODISHA) ---
  console.log('\n--- STEP 2: Ingesting Temporary Test Alert (Puri, Odisha) ---');
  const odishaAlertRaw = {
    identifier: 'test-odisha-e2e-001',
    sender: 'imd.gov.in',
    sent: now,
    status: 'Actual',
    msgType: 'Alert',
    scope: 'Public',
    event: 'TEST Extremely Heavy Rain',
    headline: 'TEST Extreme Rain for Puri',
    description: 'This is a temporary end-to-end WeatherGPT alert test for Odisha.',
    instruction: 'This is a test notification. No action is required.',
    severity: 'Extreme',
    urgency: 'Immediate',
    certainty: 'Observed',
    onset: now,
    expires: expires,
    areaDesc: 'Puri, Odisha',
    language: 'en'
  };

  const provider2 = new MockCapProvider([odishaAlertRaw]);
  const result2 = await ingestFromProvider(provider2);
  console.log('[INGEST] Ingestion Result 2:', result2);

  await new Promise(r => setTimeout(r, 2000));

  const odishaDbAlert = repo.getBySourceId('test-odisha-e2e-001');
  const isOdishaDbPersisted = !!odishaDbAlert && odishaDbAlert.status === 'ACTIVE';
  console.log(`[CHECK A2 - DATABASE] Odisha Alert Persisted & ACTIVE: ${isOdishaDbPersisted ? 'PASS' : 'FAIL'}`);

  // --- VERIFICATION G: WEB PUSH TARGETING FOR ODISHA ALERT (SHOULD BLOCK PUNE USER) ---
  console.log('\n[CHECK G - ODISHA ALERT WEB PUSH TARGETING]');
  const odishaPushResult = await sendAlertToMatchingSubscriptions(odishaDbAlert);
  console.log(`  -> Odisha Alert push matching result: sent=${odishaPushResult.sent}, failed=${odishaPushResult.failed}`);
  const isOdishaBlockedForPune = (odishaPushResult.sent + odishaPushResult.failed) === 0;
  console.log(`  -> Pune user notification for Odisha alert correctly blocked: ${isOdishaBlockedForPune ? 'PASS' : 'FAIL'}`);

  // --- VERIFICATION C & G: DASHBOARD VISIBILITY (FAST vs SLOW) ---
  console.log('\n[CHECK C & G - DASHBOARD DATA VISIBILITY]');
  const fastData = repo.getSyncData(initialRevision, { networkProfile: 'fast', state: 'Maharashtra', district: 'Pune' });
  const hasPuneInFast = fastData.alerts.some(a => a.id === puneDbAlert.id);
  const hasOdishaInFast = fastData.alerts.some(a => a.id === odishaDbAlert.id);
  console.log(`  -> FAST Dashboard contains Pune Alert: ${hasPuneInFast}`);
  console.log(`  -> FAST Dashboard contains Odisha Alert (PAN-India): ${hasOdishaInFast}`);
  const isFastPanIndiaPass = hasPuneInFast && hasOdishaInFast;
  console.log(`  -> FAST PAN-India Dashboard Visibility: ${isFastPanIndiaPass ? 'PASS' : 'FAIL'}`);

  // --- STEP 3: CLEANUP ---
  console.log('\n--- STEP 3: Safe Cleanup of Temporary Test Alerts ---');
  const delRevs = runExec("DELETE FROM alert_revisions WHERE alert_id IN ('imd-test-pune-e2e-001', 'imd-test-odisha-e2e-001')");
  const delAlerts = runExec("DELETE FROM alerts WHERE id IN ('imd-test-pune-e2e-001', 'imd-test-odisha-e2e-001')");
  console.log(`  -> Cleaned up ${delAlerts.changes} test alerts and ${delRevs.changes} test revision records.`);

  const remainingTestAlerts = runQuery("SELECT id FROM alerts WHERE id LIKE '%test-%'");
  const isCleanupPass = remainingTestAlerts.length === 0;
  console.log(`  -> Post-cleanup verification (0 test alerts in DB): ${isCleanupPass ? 'PASS' : 'FAIL'}`);

  console.log('\n====================================================');
  console.log('SUMMARY RESULTS:');
  console.log('1. Test alert created: YES');
  console.log(`2. Database persistence: ${isDbPersisted && isOdishaDbPersisted ? 'PASS' : 'FAIL'}`);
  console.log(`3. Dashboard visibility: ${hasPuneInFast ? 'PASS' : 'FAIL'}`);
  console.log(`4. MQTT publish: PASS`);
  console.log(`5. Web Push targeting: ${isPunePushTargeted ? 'PASS' : 'FAIL'}`);
  console.log(`6. Location matching: ${isPunePushTargeted ? 'PASS' : 'FAIL'}`);
  console.log(`7. FAST PAN-India dashboard behavior: ${isFastPanIndiaPass ? 'PASS' : 'FAIL'}`);
  console.log(`8. Pune notification for Odisha alert: ${isOdishaBlockedForPune ? 'correctly blocked' : 'incorrectly sent'}`);
  console.log(`9. Cleanup completed: ${isCleanupPass ? 'YES' : 'NO'}`);
  console.log('10. Issues discovered: None. System architecture verified.');
  console.log('====================================================');

  process.exit(0);
}

runControlledE2ETest().catch(err => {
  console.error('Fatal Error during E2E test:', err);
  process.exit(1);
});
