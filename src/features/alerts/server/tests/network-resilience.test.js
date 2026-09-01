import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AlertRepository } from '../repositories/alertRepository.js';
import { runExec, runQuery, initDb } from '../db/connection.js';

describe('Network Resilience (Priority 2)', () => {
  let repo;

  beforeEach(async () => {
    // Reset DB for each test
    await initDb();
    repo = new AlertRepository();
    
    // Clean up existing to be safe
    runExec('DELETE FROM alerts');
    runExec('DELETE FROM sync_state');
    runExec('INSERT INTO sync_state (id, revision, updated_at) VALUES (1, 0, ?)', [new Date().toISOString()]);

    // Add dummy alerts
    repo.create({
      id: 'a1', source: 'imd', sourceId: 'src-1', event: 'Rain', headline: 'Heavy Rain',
      description: 'Desc', instruction: 'Stay home', severity: 'Severe', urgency: 'Expected',
      certainty: 'Likely', status: 'ACTIVE', effectiveAt: '2026-01-01T00:00:00Z',
      expiresAt: '2026-12-31T00:00:00Z', issuedAt: '2026-01-01T00:00:00Z', area: 'Maharashtra, Mumbai',
      areaCode: '', latitude: null, longitude: null, polygon: null, language: 'en-IN',
      rawData: '{}'
    }, 1);

    repo.create({
      id: 'a2', source: 'imd', sourceId: 'src-2', event: 'Flood', headline: 'Extreme Flood',
      description: 'Flood desc', instruction: 'Evacuate', severity: 'Extreme', urgency: 'Immediate',
      certainty: 'Observed', status: 'ACTIVE', effectiveAt: '2026-01-01T00:00:00Z',
      expiresAt: '2026-12-31T00:00:00Z', issuedAt: '2026-01-01T00:00:00Z', area: 'Gujarat, Surat',
      areaCode: '', latitude: null, longitude: null, polygon: null, language: 'en-IN',
      rawData: '{}'
    }, 2);
    
    // Explicitly update the global sync state revision since we manually incremented it
    repo.updateSyncRevision(2);
  });

  describe('Adaptive Payloads', () => {
    it('returns FULL payload for fast network (default)', () => {
      const data = repo.getSyncData(0, { networkProfile: 'fast' });
      assert.strictEqual(data.alerts.length, 2);
      const a1 = data.alerts.find(a => a.id === 'a1');
      assert.ok(a1.description, 'Should include description');
      assert.ok(a1.instruction, 'Should include instruction');
      assert.ok(a1.sourceId, 'Should include sourceId');
    });

    it('returns COMPACT payload for slow network', () => {
      const data = repo.getSyncData(0, { networkProfile: 'slow' });
      assert.strictEqual(data.alerts.length, 2);
      const a1 = data.alerts.find(a => a.id === 'a1');
      assert.strictEqual(a1.description, undefined, 'Should not include description');
      assert.strictEqual(a1.instruction, undefined, 'Should not include instruction');
      assert.ok(a1.headline, 'Should include headline');
    });

    it('returns MINIMAL payload for very_slow network', () => {
      const data = repo.getSyncData(0, { networkProfile: 'very_slow' });
      assert.strictEqual(data.alerts.length, 2);
      const a1 = data.alerts.find(a => a.id === 'a1');
      assert.strictEqual(a1.description, undefined, 'Should not include description');
      assert.strictEqual(a1.headline, undefined, 'Should not include headline');
      assert.ok(a1.event, 'Should include event');
    });
  });

  describe('Adaptive Geographic Filtering', () => {
    it('filters by state/district with fallback on fast network', () => {
      const data = repo.getSyncData(0, { state: 'Maharashtra', district: 'Pune', networkProfile: 'fast' });
      // Pune is not Mumbai, but Extreme overrides everything anyway.
      assert.strictEqual(data.alerts.length, 1);
      assert.strictEqual(data.alerts[0].id, 'a2');
    });

    it('matches district leniently on normal network', () => {
      const data = repo.getSyncData(0, { district: 'Mumbai' }); // default network
      assert.strictEqual(data.alerts.length, 2); // a1 matches district, a2 is Extreme
      assert.ok(data.alerts.some(a => a.id === 'a1'));
    });

    it('always includes EXTREME alerts regardless of location filter', () => {
      const data = repo.getSyncData(0, { state: 'Delhi', district: 'New Delhi', networkProfile: 'very_slow' });
      assert.strictEqual(data.alerts.length, 1);
      assert.strictEqual(data.alerts[0].id, 'a2', 'Extreme alert must always bypass filter');
    });
    
    it('applies strict filtering for slow networks', () => {
       const data = repo.getSyncData(0, { state: 'Maharashtra', district: 'Mumbai', networkProfile: 'slow' });
       assert.strictEqual(data.alerts.length, 2, 'Should match Mumbai (Severe) and Extreme override');
    });
  });
});
