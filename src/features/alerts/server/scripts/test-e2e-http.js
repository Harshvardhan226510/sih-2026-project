const now = new Date().toISOString();
const expires = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

const puneAlert = {
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

const odishaAlert = {
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

const API_URL = 'http://localhost:3001/api';
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.ADMIN_SECRET || 'test-secret'}`
};

async function runTest() {
  console.log('--- STARTING HTTP END-TO-END TEST ---');

  // STEP 1: INJECT TEST ALERTS
  console.log('\nSTEP 1: Injecting mock alerts via HTTP API...');
  let res = await fetch(`${API_URL}/admin/test-alerts`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ alerts: [puneAlert, odishaAlert] })
  });
  if (!res.ok) throw new Error(`Inject failed: ${res.status} ${res.statusText}`);
  let json = await res.json();
  console.log('Injection successful:', json.result);

  // STEP 2: VERIFY FAST DASHBOARD (PAN-INDIA)
  console.log('\nSTEP 2: Verifying FAST dashboard synchronization...');
  res = await fetch(`${API_URL}/alerts/sync?since=0&networkProfile=fast`);
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
  json = await res.json();
  const testAlertsFast = json.alerts.filter(a => a.id && a.id.includes('test-'));
  if (testAlertsFast.length !== 2) {
    throw new Error(`Expected 2 test alerts in FAST profile, found ${testAlertsFast.length}`);
  }
  console.log('FAST Profile check PASS (Both alerts found)');

  // STEP 3: VERIFY SLOW DASHBOARD (PUNE USER)
  console.log('\nSTEP 3: Verifying SLOW dashboard synchronization for Pune user...');
  res = await fetch(`${API_URL}/alerts/sync?since=0&networkProfile=slow&state=Maharashtra&district=Pune`);
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
  json = await res.json();
  const testAlertsSlow = json.alerts.filter(a => a.id && a.id.includes('test-'));
  
  const hasPune = testAlertsSlow.some(a => a.id.includes('test-pune-e2e-001'));
  const hasOdisha = testAlertsSlow.some(a => a.id.includes('test-odisha-e2e-001'));

  if (!hasPune) throw new Error('Pune alert missing in SLOW profile for Pune user');
  if (!hasOdisha) throw new Error('Odisha alert missing in SLOW profile for Pune user (Extreme alerts must always pass)');
  console.log('SLOW Profile check PASS (Pune alert found, Odisha Extreme alert found)');

  // STEP 4: CLEANUP
  /*
  console.log('\nSTEP 4: Cleaning up test alerts...');
  res = await fetch(`${API_URL}/admin/test-alerts`, {
    method: 'DELETE',
    headers: HEADERS
  });
  if (!res.ok) throw new Error(`Cleanup failed: ${res.statusText || res.status}`);
  json = await res.json();
  console.log('Cleanup successful:', json);
  */

  console.log('\n--- END-TO-END TEST SUCCESSFUL ---');
}

runTest().catch(err => {
  console.error('\n!!! TEST FAILED !!!', err);
  process.exit(1);
});
