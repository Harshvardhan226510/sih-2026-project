import { describe, it } from 'node:test';
import assert from 'node:assert';
import { processAlerts, classifySeverity, checkExpired } from '../services/processing.js';
describe('Alert Processing', () => {
  describe('processAlerts', () => {
    it('creates new alerts that do not exist', () => {
      const normalized = [
        { id: 'a1', source: 'imd', sourceId: 'src-1', event: 'Rain', severity: 'Severe', issuedAt: '2026-01-01' },
        { id: 'a2', source: 'imd', sourceId: 'src-2', event: 'Flood', severity: 'Extreme', issuedAt: '2026-01-01' },
      ];
      const existingMap = new Map();
      const result = processAlerts(normalized, existingMap);
      assert.strictEqual(result.toCreate.length, 2);
      assert.strictEqual(result.toUpdate.length, 0);
      assert.strictEqual(result.skipped, 0);
    });
    it('skips unchanged existing alerts', () => {
      const normalized = [
        { id: 'a1', sourceId: 'src-1', event: 'Rain', severity: 'Severe', status: 'ACTIVE', headline: 'Rain', description: 'Desc', expiresAt: '2026-12-31', area: 'Mumbai', issuedAt: '2026-01-01', source: 'imd' },
      ];
      const existingMap = new Map([
        ['src-1', { id: 'a1', sourceId: 'src-1', severity: 'Severe', status: 'ACTIVE', headline: 'Rain', description: 'Desc', expiresAt: '2026-12-31', area: 'Mumbai' }],
      ]);
      const result = processAlerts(normalized, existingMap);
      assert.strictEqual(result.toCreate.length, 0);
      assert.strictEqual(result.toUpdate.length, 0);
      assert.strictEqual(result.skipped, 1);
    });
    it('detects changed alerts for update', () => {
      const normalized = [
        { id: 'a1', sourceId: 'src-1', event: 'Rain', severity: 'Extreme', status: 'ACTIVE', headline: 'Updated', description: 'Desc', expiresAt: '2026-12-31', area: 'Mumbai', issuedAt: '2026-01-01', source: 'imd' },
      ];
      const existingMap = new Map([
        ['src-1', { id: 'a1', sourceId: 'src-1', severity: 'Severe', status: 'ACTIVE', headline: 'Original', description: 'Desc', expiresAt: '2026-12-31', area: 'Mumbai' }],
      ]);
      const result = processAlerts(normalized, existingMap);
      assert.strictEqual(result.toUpdate.length, 1);
      assert.strictEqual(result.toUpdate[0].severity, 'Extreme');
    });
    it('skips alerts with validation errors', () => {
      const normalized = [
        { id: 'bad', sourceId: '', event: '', severity: 'Severe', issuedAt: '', source: '' },
      ];
      const result = processAlerts(normalized, new Map());
      assert.strictEqual(result.skipped, 1);
      assert.strictEqual(result.toCreate.length, 0);
    });
  });
  describe('classifySeverity', () => {
    it('classifies extremely heavy as Extreme', () => {
      assert.strictEqual(classifySeverity('rainfall', 'extremely heavy rainfall'), 'Extreme');
    });
    it('classifies cyclonic storm as Extreme', () => {
      assert.strictEqual(classifySeverity('cyclonic storm', 'approaching coast'), 'Extreme');
    });
    it('classifies heavy as Moderate', () => {
      assert.strictEqual(classifySeverity('rainfall', 'heavy rainfall expected'), 'Moderate');
    });
    it('classifies fog as Minor', () => {
      assert.strictEqual(classifySeverity('weather', 'dense fog advisory'), 'Minor');
    });
    it('returns Unknown for unrecognized events', () => {
      assert.strictEqual(classifySeverity('event', 'something unclear'), 'Unknown');
    });
  });
  describe('checkExpired', () => {
    it('identifies expired alerts', () => {
      const alerts = [
        { id: 'a1', status: 'ACTIVE', expiresAt: '2020-01-01T00:00:00Z' },
        { id: 'a2', status: 'ACTIVE', expiresAt: '2099-12-31T00:00:00Z' },
        { id: 'a3', status: 'ACTIVE', expiresAt: null },
      ];
      const { expired, active } = checkExpired(alerts);
      assert.strictEqual(expired.length, 1);
      assert.strictEqual(expired[0], 'a1');
      assert.strictEqual(active.length, 2);
    });
  });
});