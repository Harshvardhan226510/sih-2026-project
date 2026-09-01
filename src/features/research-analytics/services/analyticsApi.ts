import { 
  HistoricalAnalyticsResponse, 
  TrendAnalyticsResponse, 
  AnomalyAnalyticsResponse, 
  LocationComparisonResponse, 
  ExtremeEventsResponse, 
  ClimateFingerprintResponse, 
  ForecastAccuracyResponse, 
  HistoricalEventReplayResponse, 
  ResearchQueryResponse, 
  WeatherMetric, 
  AggregationPeriod 
} from '../types/analytics.js';

const BASE_URL = '/api/analytics';

export async function fetchHistoricalData(
  location: string,
  startDate: string,
  endDate: string,
  metric: WeatherMetric,
  aggregation: AggregationPeriod
): Promise<HistoricalAnalyticsResponse> {
  const params = new URLSearchParams({
    location,
    start_date: startDate,
    end_date: endDate,
    metric,
    aggregation
  });
  const res = await fetch(`${BASE_URL}/historical?${params.toString()}`);
  if (!res.ok) throw new Error(`Historical API error: ${res.statusText}`);
  return res.json();
}

export async function fetchTrendData(
  location: string,
  startDate: string,
  endDate: string,
  metric: WeatherMetric
): Promise<TrendAnalyticsResponse> {
  const params = new URLSearchParams({
    location,
    start_date: startDate,
    end_date: endDate,
    metric
  });
  const res = await fetch(`${BASE_URL}/trends?${params.toString()}`);
  if (!res.ok) throw new Error(`Trends API error: ${res.statusText}`);
  return res.json();
}

export async function fetchAnomalyData(
  location: string,
  startDate: string,
  endDate: string,
  metric: WeatherMetric,
  baselineStart?: string,
  baselineEnd?: string
): Promise<AnomalyAnalyticsResponse> {
  const params = new URLSearchParams({
    location,
    start_date: startDate,
    end_date: endDate,
    metric
  });
  if (baselineStart) params.append('baseline_start', baselineStart);
  if (baselineEnd) params.append('baseline_end', baselineEnd);

  const res = await fetch(`${BASE_URL}/anomaly?${params.toString()}`);
  if (!res.ok) throw new Error(`Anomaly API error: ${res.statusText}`);
  return res.json();
}

export async function fetchComparisonData(
  locationA: string,
  locationB: string,
  startDate: string,
  endDate: string,
  metric: WeatherMetric
): Promise<LocationComparisonResponse> {
  const params = new URLSearchParams({
    location: locationA,
    comparison_location: locationB,
    start_date: startDate,
    end_date: endDate,
    metric
  });
  const res = await fetch(`${BASE_URL}/compare?${params.toString()}`);
  if (!res.ok) throw new Error(`Comparison API error: ${res.statusText}`);
  return res.json();
}

export async function fetchExtremeEvents(
  location: string,
  startDate: string,
  endDate: string
): Promise<ExtremeEventsResponse> {
  const params = new URLSearchParams({
    location,
    start_date: startDate,
    end_date: endDate
  });
  const res = await fetch(`${BASE_URL}/extremes?${params.toString()}`);
  if (!res.ok) throw new Error(`Extremes API error: ${res.statusText}`);
  return res.json();
}

export async function fetchClimateFingerprint(
  location: string
): Promise<ClimateFingerprintResponse> {
  const params = new URLSearchParams({ location });
  const res = await fetch(`${BASE_URL}/climate-profile?${params.toString()}`);
  if (!res.ok) throw new Error(`Climate Profile API error: ${res.statusText}`);
  return res.json();
}

export async function fetchForecastAccuracy(
  location: string,
  metric: WeatherMetric = 'temperature',
  days: number = 14
): Promise<ForecastAccuracyResponse> {
  const params = new URLSearchParams({
    location,
    metric,
    days: days.toString()
  });
  const res = await fetch(`${BASE_URL}/forecast-accuracy?${params.toString()}`);
  if (!res.ok) throw new Error(`Forecast Accuracy API error: ${res.statusText}`);
  return res.json();
}

export async function fetchEventReplay(
  eventId?: string
): Promise<HistoricalEventReplayResponse> {
  const params = new URLSearchParams();
  if (eventId) params.append('event_id', eventId);
  const res = await fetch(`${BASE_URL}/event-replay?${params.toString()}`);
  if (!res.ok) throw new Error(`Event Replay API error: ${res.statusText}`);
  return res.json();
}

export async function executeResearchQuery(
  query: string,
  preferredLocation?: string
): Promise<ResearchQueryResponse> {
  const res = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, preferredLocation })
  });
  if (!res.ok) throw new Error(`Research Query API error: ${res.statusText}`);
  return res.json();
}
