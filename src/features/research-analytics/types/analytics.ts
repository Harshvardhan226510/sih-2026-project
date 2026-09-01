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

export type Season = 'Summer' | 'Pre-Monsoon / Summer' | 'Monsoon' | 'Post-Monsoon' | 'Winter';

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

export interface DistributionStats {
  min: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  max: number;
  iqr: number;
  mean: number;
  stdDev: number;
  skewness: number;
}

export interface StatisticalSummary extends DistributionStats {
  p95: number;
  totalSum?: number;
  variabilityCv?: number;
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
  percentileRank?: number;
  classification?: 'TYPICAL' | 'UNUSUALLY_HIGH' | 'EXTREME_HIGH' | 'UNUSUALLY_LOW' | 'EXTREME_LOW';
}

export interface HistoricalAnalyticsResponse {
  location: string;
  metric: WeatherMetric;
  aggregation: AggregationPeriod;
  summary: StatisticalSummary;
  distribution?: DistributionStats;
  dataPoints: HistoricalDataPoint[];
  provenance: DataProvenance;
}

export interface TrendSignificance {
  isSignificant: boolean;
  significanceLevel: string;
  pValue: number;
  mannKendallTau: number;
  mannKendallZ: number;
  rSquared: number;
  stdError: number;
  tStatistic: number;
  confidenceInterval95: [number, number];
  sampleSize: number;
  degreesOfFreedom: number;
  interpretation: string;
  label: string;
}

export interface TrendAnalyticsResponse {
  location: string;
  metric: WeatherMetric;
  unit?: string;
  timeRange: { start: string; end: string };
  trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE';
  slopePerYear: number;
  percentageChange: number;
  baselineAverage: number;
  recentAverage: number;
  variabilityPercent: number;
  significance: TrendSignificance;
  series: Array<{
    date: string;
    actual: number;
    trendLine: number;
    ma3?: number;
  }>;
  seasonalBreakdown: Array<{
    season: Season;
    average: number;
    totalSum: number;
    variabilityCv: number;
    percentOfAnnual?: number;
    yearlyHistory?: Array<{ year: number; value: number }>;
  }>;
  yearlyAverages: Array<{
    year: number;
    average: number;
    totalSum: number;
    min?: number;
    max?: number;
    stdDev?: number;
  }>;
  analyticalExplanation: string;
  provenance: DataProvenance;
}

export interface DetectedAnomaly {
  id: string;
  date: string;
  observedValue: number;
  baselineReference: number;
  anomalyMagnitude: number;
  anomalyPercentage: number;
  zScore: number;
  unit: string;
  direction: 'POSITIVE' | 'NEGATIVE';
  severity: 'MODERATE' | 'HIGH' | 'EXTREME';
  methodology: string;
  description: string;
}

export interface AnomalyAnalyticsResponse {
  location: string;
  metric: WeatherMetric;
  unit?: string;
  targetPeriod: { start: string; end: string };
  baselinePeriod: { 
    start: string; 
    end: string;
    isWMOStandardBaseline?: boolean;
    baselineLabel?: string;
  };
  historicalBaseline: number;
  observedValue: number;
  anomaly: number;
  anomalyPercentage: number;
  zScore: number;
  classification: AnomalySeverity;
  badgeLabel: string;
  severity?: 'NORMAL' | 'MODERATE' | 'HIGH' | 'EXTREME';
  distribution?: DistributionStats;
  detectedAnomaliesCount: number;
  detectedAnomaliesSummary: string;
  detectedAnomalies: DetectedAnomaly[];
  timeSeries: Array<{
    date: string;
    observed: number;
    historicalBaseline: number;
    anomaly: number;
    anomalyPercent: number;
    zScore: number;
  }>;
  explanation: string;
  provenance: DataProvenance;
}

export interface LocationProfile {
  locationId: string;
  name: string;
  state: string;
  coordinates: { lat: number; lon: number };
  stats: StatisticalSummary;
  primaryMetricValue: number;
  extremeEventsCount: number;
  variabilityCv: number;
  rank?: number;
}

export interface LocationComparisonResponse {
  metric: WeatherMetric;
  unit?: string;
  timeRange: { start: string; end: string };
  aggregation?: string;
  locations: LocationProfile[];
  summaryComparison: {
    highestLocation: string;
    lowestLocation: string;
    absoluteDifference: number;
    percentDifference: number;
    locationCount: number;
  };
  locationA?: {
    name: string;
    stats: StatisticalSummary;
    extremeEventsCount: number;
    anomalyAverage: number;
  };
  locationB?: {
    name: string;
    stats: StatisticalSummary;
    extremeEventsCount: number;
    anomalyAverage: number;
  };
  comparisonSummary?: {
    meanDifference: number;
    percentDifference: number;
    variabilityDifference: number;
    higherLocation: string;
  };
  timeSeries: Array<Record<string, any>>;
  analyticalExplanation: string;
  provenance: DataProvenance;
}

export interface PeriodComparisonResponse {
  location: string;
  metric: WeatherMetric;
  unit: string;
  periodA: {
    label: string;
    timeRange: { start: string; end: string };
    observationCount: number;
    stats: StatisticalSummary;
    extremeEventsCount: number;
    primaryValue: number;
  };
  periodB: {
    label: string;
    timeRange: { start: string; end: string };
    observationCount: number;
    stats: StatisticalSummary;
    extremeEventsCount: number;
    primaryValue: number;
  };
  differences: {
    absoluteChange: number;
    percentChange: number;
    variabilityChange: number;
    extremeEventsChange: number;
    meanChange: number;
    medianChange: number;
    maxChange: number;
    minChange: number;
  };
  analyticalExplanation: string;
  provenance: DataProvenance;
}

export interface ExtremeEvent {
  id: string;
  date: string;
  location: string;
  eventType: string;
  severity: 'MODERATE' | 'SEVERE' | 'VERY_SEVERE' | 'EXTREME';
  measuredValue: number;
  unit: string;
  historicalPercentile: number;
  baselineNormal: number;
  thresholdApplied: string;
  description: string;
  rank?: number;
  rankLabel?: string;
  source: string;
}

export interface RecurrenceInterval {
  from: string;
  to: string;
  days: number;
  years: number;
}

export interface RecurrenceAnalysis {
  totalEvents: number;
  averageIntervalDays: number | null;
  averageIntervalYears: number | null;
  minIntervalDays: number | null;
  maxIntervalDays: number | null;
  shortestInterval: string | null;
  longestInterval: string | null;
  recurrenceLabel?: string;
  intervals: RecurrenceInterval[];
}

export interface ExtremeEventsResponse {
  location: string;
  timeRange: { start: string; end: string };
  metric?: string;
  totalEvents: number;
  events: ExtremeEvent[];
  breakdownByType: Record<string, number>;
  breakdownBySeverity: Record<string, number>;
  recurrenceAnalysis?: RecurrenceAnalysis;
  provenance: DataProvenance;
}

export interface EventRecurrenceResponse {
  location: string;
  metric: WeatherMetric;
  unit: string;
  threshold: number;
  timeRange: { start: string; end: string };
  totalEvents: number;
  annualFrequencyEventsPerYear: number;
  intervals: RecurrenceAnalysis;
  seasonalDistribution: Record<string, number>;
  yearlyDistribution: Record<string, number>;
  methodologyNote: string;
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

export interface ResearchQueryResponse {
  query: string;
  parsedIntent: {
    type: string;
    metric: WeatherMetric;
    locations: string[];
    dateRange: { start: string; end: string };
    aggregation: AggregationPeriod;
  };
  analyticsData: any;
  chartType: string;
  analyticalExplanation: string;
  keyInsights: string[];
  provenance: DataProvenance;
}

export interface RecentQueryEntry {
  id: string;
  queryType: string;
  title: string;
  location: any;
  params: any;
  createdAt: string;
}

export interface ExplainTrendResponse {
  verifiedPayload: any;
  systemPrompt: string;
  userPrompt: string;
  explanation: string;
  generatedAt: string;
}
