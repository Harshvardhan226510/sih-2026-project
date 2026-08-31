import { describe, it, expect } from 'vitest';
import { HistoricalService } from '../src/services/historicalService.js';
import { DemoDataAdapter } from '../src/adapters/demoDataAdapter.js';
import { resolveLocation } from '../src/utils/validation.js';

describe('Historical Weather Explorer Service Tests', () => {
  const adapter = new DemoDataAdapter();
  const service = new HistoricalService(adapter);

  it('aggregates daily rainfall data into monthly totals for Pune', async () => {
    const loc = resolveLocation('pune');
    const res = await service.getHistoricalAnalytics(loc, '2023-01-01', '2023-12-31', 'rainfall', 'monthly');

    expect(res.location).toContain('Pune');
    expect(res.metric).toBe('rainfall');
    expect(res.aggregation).toBe('monthly');
    expect(res.dataPoints.length).toBe(12); // 12 months in 2023
    expect(res.summary.min).toBeGreaterThanOrEqual(0);
    expect(res.summary.unit).toBe('mm');
    expect(res.provenance.observationCount).toBe(365);
    expect(res.provenance.dataQualityStatus).toBe('DEMO_DATA');
  });

  it('computes temperature min, max, mean and rolling averages', async () => {
    const loc = resolveLocation('mumbai');
    const res = await service.getHistoricalAnalytics(loc, '2023-01-01', '2023-03-31', 'temperature', 'daily');

    expect(res.metric).toBe('temperature');
    expect(res.aggregation).toBe('daily');
    expect(res.dataPoints.length).toBe(90);
    expect(res.summary.mean).toBeGreaterThan(15);
    expect(res.summary.mean).toBeLessThan(45);
    expect(res.summary.unit).toBe('°C');

    // Check rolling average on 7th day
    expect(res.dataPoints[6].rollingAvg7d).toBeDefined();
  });
});
