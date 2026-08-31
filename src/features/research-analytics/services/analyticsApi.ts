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
  location: string | any,
  startDate: string,
  endDate: string,
  metric: WeatherMetric,
  aggregation: AggregationPeriod
): Promise<HistoricalAnalyticsResponse> {
  const locStr = typeof location === 'string' ? location : JSON.stringify(location);
  const params = new URLSearchParams({
    location: locStr,
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
  location: string | any,
  startDate: string,
  endDate: string,
  metric: WeatherMetric
): Promise<TrendAnalyticsResponse> {
  const locStr = typeof location === 'string' ? location : JSON.stringify(location);
  const params = new URLSearchParams({
    location: locStr,
    start_date: startDate,
    end_date: endDate,
    metric
  });
  const res = await fetch(`${BASE_URL}/trends?${params.toString()}`);
  if (!res.ok) throw new Error(`Trends API error: ${res.statusText}`);
  return res.json();
}

export async function fetchAnomalyData(
  location: string | any,
  startDate: string,
  endDate: string,
  metric: WeatherMetric,
  baselineStart?: string,
  baselineEnd?: string
): Promise<AnomalyAnalyticsResponse> {
  const locStr = typeof location === 'string' ? location : JSON.stringify(location);
  const params = new URLSearchParams({
    location: locStr,
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
  locationA: string | any,
  locationB: string | any,
  startDate: string,
  endDate: string,
  metric: WeatherMetric
): Promise<LocationComparisonResponse> {
  const locStrA = typeof locationA === 'string' ? locationA : JSON.stringify(locationA);
  const locStrB = typeof locationB === 'string' ? locationB : JSON.stringify(locationB);
  const params = new URLSearchParams({
    location: locStrA,
    comparison_location: locStrB,
    start_date: startDate,
    end_date: endDate,
    metric
  });
  const res = await fetch(`${BASE_URL}/compare?${params.toString()}`);
  if (!res.ok) throw new Error(`Comparison API error: ${res.statusText}`);
  return res.json();
}

export async function fetchExtremeEvents(
  location: string | any,
  startDate: string,
  endDate: string
): Promise<ExtremeEventsResponse> {
  const locStr = typeof location === 'string' ? location : JSON.stringify(location);
  const params = new URLSearchParams({
    location: locStr,
    start_date: startDate,
    end_date: endDate
  });
  const res = await fetch(`${BASE_URL}/extremes?${params.toString()}`);
  if (!res.ok) throw new Error(`Extremes API error: ${res.statusText}`);
  return res.json();
}

export async function fetchClimateFingerprint(
  location: string | any
): Promise<ClimateFingerprintResponse> {
  const locStr = typeof location === 'string' ? location : JSON.stringify(location);
  const params = new URLSearchParams({ location: locStr });
  const res = await fetch(`${BASE_URL}/climate-profile?${params.toString()}`);
  if (!res.ok) throw new Error(`Climate Profile API error: ${res.statusText}`);
  return res.json();
}

export async function fetchForecastAccuracy(
  location: string | any,
  metric: WeatherMetric = 'temperature',
  days: number = 14
): Promise<ForecastAccuracyResponse> {
  const locStr = typeof location === 'string' ? location : JSON.stringify(location);
  const params = new URLSearchParams({
    location: locStr,
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
