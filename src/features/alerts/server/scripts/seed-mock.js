import { initDb } from '../db/connection.js';
import { AlertRepository } from '../repositories/alertRepository.js';

async function seed() {
  await initDb();
  const repo = new AlertRepository();

  const now = new Date();
  
  function createDate(offsetHours) {
    const d = new Date(now);
    d.setHours(d.getHours() + offsetHours);
    return d.toISOString();
  }

  const mocks = [
    // EXTREME
    { id: 'mock-ext-001', severity: 'Extreme', event: 'Cyclonic Storm', status: 'ACTIVE', issued: -2, expires: 24, state: 'Odisha', district: 'Puri' },
    { id: 'mock-ext-002', severity: 'Extreme', event: 'Heavy Rainfall', status: 'ACTIVE', issued: -1, expires: 12, state: 'Maharashtra', district: 'Mumbai' },
    { id: 'mock-ext-003', severity: 'Extreme', event: 'Flood', status: 'EXPIRED', issued: -48, expires: -24, state: 'Assam', district: 'Silchar' },
    
    // SEVERE
    { id: 'mock-sev-001', severity: 'Severe', event: 'Heat Wave', status: 'ACTIVE', issued: -5, expires: 48, state: 'Rajasthan', district: 'Jaipur' },
    { id: 'mock-sev-002', severity: 'Severe', event: 'Thunderstorm', status: 'ACTIVE', issued: -1, expires: 4, state: 'Karnataka', district: 'Bengaluru Urban' },
    { id: 'mock-sev-003', severity: 'Severe', event: 'Coastal Warning', status: 'ACTIVE', issued: 0, expires: 12, state: 'Tamil Nadu', district: 'Chennai' },
    { id: 'mock-sev-004', severity: 'Severe', event: 'Lightning', status: 'CANCELLED', issued: -10, expires: 2, state: 'Kerala', district: 'Kochi' },
    { id: 'mock-sev-005', severity: 'Severe', event: 'Heavy Rainfall', status: 'EXPIRED', issued: -72, expires: -48, state: 'Karnataka', district: 'Udupi' },

    // MODERATE
    { id: 'mock-mod-001', severity: 'Moderate', event: 'Dense Fog', status: 'ACTIVE', issued: -3, expires: 6, state: 'Delhi', district: 'New Delhi' },
    { id: 'mock-mod-002', severity: 'Moderate', event: 'Strong Winds', status: 'ACTIVE', issued: -12, expires: 12, state: 'West Bengal', district: 'Kolkata' },
    { id: 'mock-mod-003', severity: 'Moderate', event: 'Thunderstorm', status: 'ACTIVE', issued: 0, expires: 3, state: 'Karnataka', district: 'Mysuru' },
    { id: 'mock-mod-004', severity: 'Moderate', event: 'Heavy Rainfall', status: 'ACTIVE', issued: -2, expires: 24, state: 'Odisha', district: 'Khordha' },

    // MINOR
    { id: 'mock-min-001', severity: 'Minor', event: 'Lightning', status: 'ACTIVE', issued: -1, expires: 2, state: 'Andhra Pradesh', district: 'Visakhapatnam' },
    { id: 'mock-min-002', severity: 'Minor', event: 'Thunderstorm', status: 'ACTIVE', issued: -4, expires: 8, state: 'Karnataka', district: 'Dakshina Kannada' },
    { id: 'mock-min-003', severity: 'Minor', event: 'Strong Winds', status: 'EXPIRED', issued: -20, expires: -1, state: 'Maharashtra', district: 'Thane' }
  ];

  let currentRevision = repo.getCurrentRevision();
  let createdCount = 0;

  console.log(`Starting mock seed. Existing revision: ${currentRevision}`);

  for (const m of mocks) {
    const existing = repo.getBySourceId(m.id);
    if (!existing) {
      currentRevision++;
      const areaName = `${m.district}, ${m.state}`;
      
      const alertRecord = {
        id: `urn:oid:mock:${m.id}`,
        source: 'mock',
        sourceId: m.id,
        event: m.event,
        headline: `[TEST] ${m.severity} ${m.event} warning for ${m.district}`,
        description: `This is a synthetically generated test alert for ${m.district}, ${m.state}. It is intended ONLY for UI testing.`,
        instruction: `Do not take any real-world action based on this alert. It is fake data.`,
        severity: m.severity,
        urgency: 'Expected',
        certainty: 'Likely',
        status: m.status,
        effectiveAt: createDate(m.issued),
        issuedAt: createDate(m.issued),
        expiresAt: createDate(m.expires),
        area: areaName,
        areaCode: m.district.toUpperCase().replace(/\s+/g, '_'),
        latitude: 0,
        longitude: 0,
        polygon: null,
        language: 'en-US',
        rawData: JSON.stringify({ isMock: true, description: "Test payload" })
      };
      
      repo.create(alertRecord, currentRevision);
      createdCount++;
    }
  }

  if (createdCount > 0) {
    repo.updateSyncRevision(currentRevision);
    console.log(`Successfully created ${createdCount} mock alerts.`);
  } else {
    console.log(`No new mock alerts created (already seeded).`);
  }
  
  process.exit(0);
}

seed().catch(err => {
  console.error("Failed to seed mock alerts:", err);
  process.exit(1);
});
