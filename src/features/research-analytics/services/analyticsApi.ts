import { 
  HistoricalAnalyticsResponse, 
  TrendAnalyticsResponse, 
  AnomalyAnalyticsResponse, 
  LocationComparisonResponse, 
  PeriodComparisonResponse,
  ExtremeEventsResponse, 
  EventRecurrenceResponse,
  ClimateFingerprintResponse, 
  ForecastAccuracyResponse, 
  HistoricalEventReplayResponse, 
  ResearchQueryResponse, 
  RecentQueryEntry,
  ExplainTrendResponse,
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

export async function fetchMultiLocationComparison(
  locations: Array<string | any>,
  startDate: string,
  endDate: string,
  metric: WeatherMetric,
  aggregation: AggregationPeriod = 'daily'
): Promise<LocationComparisonResponse> {
  const locsJson = JSON.stringify(locations);
  const params = new URLSearchParams({
    locations: locsJson,
    start_date: startDate,
    end_date: endDate,
    metric,
    aggregation
  });
  const res = await fetch(`${BASE_URL}/compare?${params.toString()}`);
  if (!res.ok) throw new Error(`Multi-location comparison error: ${res.statusText}`);
  return res.json();
}

export async function fetchPeriodComparison(
  location: string | any,
  periodA: { start: string; end: string },
  periodB: { start: string; end: string },
  metric: WeatherMetric
): Promise<PeriodComparisonResponse> {
  const locStr = typeof location === 'string' ? location : JSON.stringify(location);
  const params = new URLSearchParams({
    mode: 'periods',
    location: locStr,
    period_a_start: periodA.start,
    period_a_end: periodA.end,
    period_b_start: periodB.start,
    period_b_end: periodB.end,
    metric
  });
  const res = await fetch(`${BASE_URL}/compare?${params.toString()}`);
  if (!res.ok) throw new Error(`Period comparison error: ${res.statusText}`);
  return res.json();
}

export async function fetchExtremeEvents(
  location: string | any,
  startDate: string,
  endDate: string,
  metric: string = 'all',
  threshold?: number,
  topN?: number
): Promise<ExtremeEventsResponse> {
  const locStr = typeof location === 'string' ? location : JSON.stringify(location);
  const params = new URLSearchParams({
    location: locStr,
    start_date: startDate,
    end_date: endDate,
    metric
  });
  if (threshold !== undefined) params.append('threshold', threshold.toString());
  if (topN !== undefined) params.append('top_n', topN.toString());

  const res = await fetch(`${BASE_URL}/extremes?${params.toString()}`);
  if (!res.ok) throw new Error(`Extremes API error: ${res.statusText}`);
  return res.json();
}

export async function fetchEventRecurrence(
  location: string | any,
  startDate: string,
  endDate: string,
  metric: WeatherMetric = 'rainfall',
  threshold: number = 64.5
): Promise<EventRecurrenceResponse> {
  const locStr = typeof location === 'string' ? location : JSON.stringify(location);
  const params = new URLSearchParams({
    mode: 'recurrence',
    location: locStr,
    start_date: startDate,
    end_date: endDate,
    metric,
    threshold: threshold.toString()
  });
  const res = await fetch(`${BASE_URL}/extremes?${params.toString()}`);
  if (!res.ok) throw new Error(`Event recurrence API error: ${res.statusText}`);
  return res.json();
}

export async function explainTrendWithWeatherGPT(
  trendData: TrendAnalyticsResponse
): Promise<ExplainTrendResponse> {
  const res = await fetch(`${BASE_URL}/explain/explain-trend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trendData })
  });
  if (!res.ok) throw new Error(`Explain Trend API error: ${res.statusText}`);
  return res.json();
}

export async function fetchRecentQueries(limit: number = 10): Promise<RecentQueryEntry[]> {
  const res = await fetch(`${BASE_URL}/recent-queries?limit=${limit}`);
  if (!res.ok) throw new Error(`Recent Queries API error: ${res.statusText}`);
  const data = await res.json();
  return data.queries || [];
}

export async function saveRecentQuery(entry: {
  queryType: string;
  title: string;
  location: any;
  params: any;
}): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/recent-queries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save query history:', err);
    return false;
  }
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
