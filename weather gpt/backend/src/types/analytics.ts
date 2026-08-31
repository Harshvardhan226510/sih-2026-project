export type WeatherMetric = 
  | 'rainfall' 
  | 'temperature' 
  | 'temp_max' 
  | 'temp_min' 
  | 'humidity' 
  | 'wind_speed' 
  | 'pressure' 
  | 'cloud_cover';

export type AggregationPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type AnomalySeverity = 
  | 'EXTREME_NEGATIVE'
  | 'HIGH_NEGATIVE'
  | 'BELOW_NORMAL'
  | 'NORMAL'
  | 'ABOVE_NORMAL'
  | 'HIGH_ANOMALY'
  | 'EXTREME_ANOMALY';

export type Season = 'Summer' | 'Monsoon' | 'Post-Monsoon' | 'Winter';

export interface LocationCoordinates {
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  elevation?: number;
}

export interface RawWeatherRecord {
  date: string;
  timestamp?: number;
  rainfall: number; // mm
  temperature: number; // °C
  temp_max: number; // °C
  temp_min: number; // °C
  humidity: number; // %
  wind_speed: number; // km/h
  pressure: number; // hPa
  cloud_cover: number; // %
}

export interface DataProvenance {
  source: string;
  dataset: string;
  location: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  timeRange: {
    start: string;
    end: string;
  };
  observationCount: number;
  aggregationPeriod: string;
  calculationMethod: string;
  lastUpdated: string;
  dataQualityStatus: 'EXCELLENT' | 'GOOD' | 'PARTIAL' | 'DEMO_DATA';
  isDemo: boolean;
}

export interface StatisticalSummary {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
  totalSum?: number;
  unit: string;
}

export interface HistoricalDataPoint {
  date: string;
  value: number;
  min?: number;
  max?: number;
  rollingAvg7d?: number;
  rollingAvg30d?: number;
  rollingAvg90d?: number;
}

export interface HistoricalAnalyticsResponse {
  location: string;
  metric: WeatherMetric;
  aggregation: AggregationPeriod;
  summary: StatisticalSummary;
  dataPoints: HistoricalDataPoint[];
  provenance: DataProvenance;
}

export interface TrendAnalyticsResponse {
  location: string;
  metric: WeatherMetric;
  timeRange: { start: string; end: string };
  trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE';
  slopePerYear: number;
  percentageChange: number;
  baselineAverage: number;
  recentAverage: number;
  variabilityPercent: number;
  series: Array<{
    date: string;
    actual: number;
    trendLine: number;
    ma7?: number;
    ma30?: number;
  }>;
  seasonalBreakdown: Array<{
    season: Season;
    average: number;
    totalSum: number;
    percentOfAnnual: number;
  }>;
  yearlyAverages: Array<{
    year: number;
    average: number;
    totalSum: number;
  }>;
  analyticalExplanation: string;
  provenance: DataProvenance;
}

export interface AnomalyAnalyticsResponse {
  location: string;
  metric: WeatherMetric;
  targetPeriod: { start: string; end: string };
  baselinePeriod: { start: string; end: string };
  historicalBaseline: number;
  observedValue: number;
  anomaly: number;
  anomalyPercentage: number;
  zScore: number;
  classification: AnomalySeverity;
  badgeLabel: string;
  timeSeries: Array<{
    date: string;
    observed: number;
    historicalBaseline: number;
    anomaly: number;
    anomalyPercent: number;
  }>;
  explanation: string;
  provenance: DataProvenance;
}

export interface LocationComparisonResponse {
  metric: WeatherMetric;
  timeRange: { start: string; end: string };
  locationA: {
    name: string;
    stats: StatisticalSummary;
    extremeEventsCount: number;
    anomalyAverage: number;
  };
  locationB: {
    name: string;
    stats: StatisticalSummary;
    extremeEventsCount: number;
    anomalyAverage: number;
  };
  comparisonSummary: {
    meanDifference: number;
    percentDifference: number;
    variabilityDifference: number;
    higherLocation: string;
  };
  timeSeries: Array<{
    date: string;
    valueA: number;
    valueB: number;
    diff: number;
  }>;
  analyticalExplanation: string;
  provenance: DataProvenance;
}

export interface ExtremeEvent {
  id: string;
  date: string;
  location: string;
  eventType: 'HEAVY_RAINFALL' | 'EXTREME_HEAT' | 'COLD_WAVE' | 'HIGH_WIND_GALE' | 'SEVERE_DEPRESSION';
  severity: 'MODERATE' | 'SEVERE' | 'VERY_SEVERE' | 'EXTREME';
  measuredValue: number;
  unit: string;
  historicalPercentile: number;
  baselineNormal: number;
  thresholdApplied: string;
  description: string;
  source: string;
}

export interface ExtremeEventsResponse {
  location: string;
  timeRange: { start: string; end: string };
  totalEvents: number;
  events: ExtremeEvent[];
  breakdownByType: Record<string, number>;
  breakdownBySeverity: Record<string, number>;
  provenance: DataProvenance;
}

export interface ClimateFingerprintResponse {
  location: string;
  coordinates: { lat: number; lon: number };
  elevationMeters: number;
  climateZone: string;
  rainfallSeasonality: {
    summerPct: number;
    monsoonPct: number;
    postMonsoonPct: number;
    winterPct: number;
  };
  temperatureVariability: {
    annualMean: number;
    annualMin: number;
    annualMax: number;
    diurnalRangeMean: number;
    stdDev: number;
  };
  rainfallVariability: {
    annualMeanMm: number;
    coefficientOfVariationPct: number;
    monsoonMeanMm: number;
  };
  extremeEventFrequencyPerYear: number;
  dominantWeatherPattern: string;
  anomalyFrequencyPct: number;
  monthlyNormals: Array<{
    month: string;
    monthIndex: number;
    avgTemp: number;
    avgRainfall: number;
    avgHumidity: number;
    avgWindSpeed: number;
  }>;
  provenance: DataProvenance;
}

export interface ForecastAccuracyResponse {
  location: string;
  parameter: WeatherMetric;
  timeRange: { start: string; end: string };
  sampleSize: number;
  metrics: {
    mae: number;
    rmse: number;
    bias: number;
    mape: number;
    forecastHitRatePct: number;
  };
  comparisonSeries: Array<{
    date: string;
    forecast: number;
    actual: number;
    error: number;
    absoluteError: number;
  }>;
  interpretation: string;
  provenance: DataProvenance;
}

export interface HistoricalEventReplayResponse {
  eventId: string;
  eventName: string;
  location: string;
  startDate: string;
  endDate: string;
  timeline: Array<{
    timestamp: string;
    rainfall: number;
    temperature: number;
    pressure: number;
    windSpeed: number;
    anomalyScore: number;
    warningLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
    commentary?: string;
  }>;
  peakObservations: {
    maxRainfall24h: { value: number; timestamp: string };
    maxWindGust: { value: number; timestamp: string };
    minPressure: { value: number; timestamp: string };
  };
  impactSummary: string;
  provenance: DataProvenance;
}

export interface ResearchQueryRequest {
  query: string;
  preferredLocation?: string;
}

export interface ResearchQueryResponse {
  query: string;
  parsedIntent: {
    type: 'HISTORICAL' | 'TREND' | 'ANOMALY' | 'COMPARISON' | 'EXTREME' | 'CLIMATE_PROFILE' | 'FORECAST_ACCURACY';
    metric: WeatherMetric;
    locations: string[];
    dateRange: { start: string; end: string };
    aggregation: AggregationPeriod;
    season?: Season;
  };
  analyticsData: any;
  chartType: 'line' | 'bar' | 'area' | 'comparison-line' | 'timeline' | 'radar';
  analyticalExplanation: string;
  keyInsights: string[];
  provenance: DataProvenance;
}
