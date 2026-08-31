import { describe, it, expect } from 'vitest';
import { TrendService } from '../src/services/trendService.js';
import { AnomalyService } from '../src/services/anomalyService.js';
import { ComparisonService } from '../src/services/comparisonService.js';
import { DemoDataAdapter } from '../src/adapters/demoDataAdapter.js';
import { resolveLocation } from '../src/utils/validation.js';

describe('Phase 3: Trend, Anomaly & Comparison Engine Tests', () => {
  const adapter = new DemoDataAdapter();
  const trendService = new TrendService(adapter);
  const anomalyService = new AnomalyService(adapter);
  const comparisonService = new ComparisonService(adapter);

  it('calculates climate trends, slope, and seasonal distribution', async () => {
    const loc = resolveLocation('pune');
    const res = await trendService.getTrendAnalytics(loc, '2015-01-01', '2023-12-31', 'rainfall');

    expect(res.location).toContain('Pune');
    expect(res.metric).toBe('rainfall');
    expect(res.seasonalBreakdown.length).toBe(4);
    expect(res.yearlyAverages.length).toBe(9);
    expect(res.analyticalExplanation).toContain('Long-term trend analysis');
    expect(typeof res.slopePerYear).toBe('number');
    expect(typeof res.percentageChange).toBe('number');
  });

  it('calculates rainfall anomaly and classifies severity against baseline', async () => {
    const loc = resolveLocation('mumbai');
    const res = await anomalyService.getAnomalyAnalytics(
      loc,
      '2023-06-01',
      '2023-09-30',
      '2013-06-01',
      '2022-09-30',
      'rainfall'
    );

    expect(res.observedValue).toBeGreaterThan(0);
    expect(res.historicalBaseline).toBeGreaterThan(0);
    expect(res.classification).toBeDefined();
    expect(res.badgeLabel).toBeDefined();
    expect(res.timeSeries.length).toBeGreaterThan(100);
    expect(res.explanation).toContain('Rainfall observation');
  });

  it('compares Pune vs Mumbai rainfall with dual time-series and summary matrix', async () => {
    const locA = resolveLocation('pune');
    const locB = resolveLocation('mumbai');

    const res = await comparisonService.compareLocations(locA, locB, '2022-01-01', '2023-12-31', 'rainfall');

    expect(res.locationA.name).toBe('Pune');
    expect(res.locationB.name).toBe('Mumbai');
    expect(res.comparisonSummary.higherLocation).toBeDefined();
    expect(res.timeSeries.length).toBe(730);
    expect(res.analyticalExplanation).toContain('Comparative meteorological analysis');
  });
});
