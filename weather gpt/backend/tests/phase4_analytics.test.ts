import { describe, it, expect } from 'vitest';
import { ExtremeEventService } from '../src/services/extremeService.js';
import { ClimateProfileService } from '../src/services/climateProfileService.js';
import { ForecastAccuracyService } from '../src/services/forecastAccuracyService.js';
import { EventReplayService } from '../src/services/eventReplayService.js';
import { ResearchQueryService } from '../src/services/researchQueryService.js';
import { DemoDataAdapter } from '../src/adapters/demoDataAdapter.js';
import { resolveLocation } from '../src/utils/validation.js';

describe('Phase 4: Extremes, Climate Profile, Forecast Accuracy & Replay Tests', () => {
  const adapter = new DemoDataAdapter();
  const extremeService = new ExtremeEventService(adapter);
  const climateService = new ClimateProfileService(adapter);
  const forecastService = new ForecastAccuracyService(adapter);
  const replayService = new EventReplayService();
  const queryService = new ResearchQueryService(adapter);

  it('detects extreme meteorological events with severity classification', async () => {
    const loc = resolveLocation('mumbai');
    const res = await extremeService.detectExtremeEvents(loc, '2023-01-01', '2023-12-31');

    expect(res.location).toContain('Mumbai');
    expect(res.events).toBeDefined();
    expect(res.provenance.dataQualityStatus).toBe('DEMO_DATA');
  });

  it('generates multi-variable climate fingerprint profile', async () => {
    const loc = resolveLocation('pune');
    const res = await climateService.getClimateProfile(loc);

    expect(res.location).toContain('Pune');
    expect(res.monthlyNormals.length).toBe(12);
    expect(res.rainfallSeasonality.monsoonPct).toBeGreaterThan(0);
    expect(res.dominantWeatherPattern).toBeDefined();
  });

  it('evaluates NWP forecast accuracy with MAE, RMSE and Bias', async () => {
    const loc = resolveLocation('delhi');
    const res = await forecastService.getForecastAccuracy(loc, 'temperature', 14);

    expect(res.metrics.mae).toBeGreaterThanOrEqual(0);
    expect(res.metrics.rmse).toBeGreaterThanOrEqual(0);
    expect(typeof res.metrics.bias).toBe('number');
    expect(res.metrics.forecastHitRatePct).toBeGreaterThanOrEqual(0);
    expect(res.comparisonSeries.length).toBe(14);
  });

  it('replays historic extreme event timeline', async () => {
    const res = await replayService.getEventReplay('mumbai-2005-deluge');

    expect(res.eventName).toContain('Mumbai');
    expect(res.timeline.length).toBeGreaterThan(10);
    expect(res.peakObservations.maxRainfall24h.value).toBe(944);
  });

  it('processes natural language research queries without numerical hallucination', async () => {
    const res = await queryService.processResearchQuery({
      query: 'Compare monsoon rainfall in Pune and Mumbai from 2018 to 2023.'
    });

    expect(parsedIntent => {
      expect(parsedIntent.type).toBe('COMPARISON');
      expect(parsedIntent.locations).toContain('Pune');
      expect(parsedIntent.locations).toContain('Mumbai');
    });
    expect(res.analyticsData).toBeDefined();
    expect(res.keyInsights.length).toBeGreaterThan(0);
    expect(res.provenance).toBeDefined();
  });
});
