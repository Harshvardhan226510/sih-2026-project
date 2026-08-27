import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeIMDAlert } from '../services/normalization.js';
describe('Alert Normalization', () => {
  describe('normalizeIMDAlert', () => {
    it('normalizes a CAP alert into standard model', () => {
      const cap = {
        identifier: 'urn:oid:2.49.0.1.356.0.2026.1.1.1.0.0',
        sender: 'test@imd.gov.in',
        sent: '2026-01-01T05:30:00+05:30',
        severity: 'Severe',
        urgency: 'Expected',
        certainty: 'Likely',
        event: 'Heavy Rainfall',
        headline: 'Heavy rainfall warning for Maharashtra',
        description: 'Heavy to very heavy rainfall expected.',
        instruction: 'Stay indoors.',
        onset: '2026-01-01T00:00:00+05:30',
        expires: '2026-01-02T00:00:00+05:30',
        areaDesc: 'MAHARASHTRA',
        polygon: '19.0,72.8 19.5,73.0 19.2,73.5 18.8,73.2 19.0,72.8',
      };
      const result = normalizeIMDAlert(cap);
      assert.strictEqual(result.source, 'imd');
      assert.strictEqual(result.severity, 'Severe');
      assert.strictEqual(result.event, 'Heavy Rainfall');
      assert.strictEqual(result.area, 'MAHARASHTRA');
      assert.strictEqual(result.status, 'ACTIVE');
      assert.ok(result.id.startsWith('imd-'));
      assert.ok(result.latitude);
      assert.ok(result.longitude);
      assert.ok(result.polygon);
    });
    it('handles missing optional fields', () => {
      const minimal = {
        identifier: 'test-min',
        sent: '2026-01-01T00:00:00Z',
        event: 'Test Event',
      };
      const result = normalizeIMDAlert(minimal);
      assert.strictEqual(result.source, 'imd');
      assert.strictEqual(result.severity, 'Unknown');
      assert.strictEqual(result.event, 'Test Event');
      assert.strictEqual(result.polygon, null);
    });
    it('maps invalid severity to Unknown', () => {
      const cap = {
        identifier: 'test-bad-sev',
        sent: '2026-01-01T00:00:00Z',
        event: 'Test',
        severity: 'SuperBad',
      };
      const result = normalizeIMDAlert(cap);
      assert.strictEqual(result.severity, 'Unknown');
    });
  });
});