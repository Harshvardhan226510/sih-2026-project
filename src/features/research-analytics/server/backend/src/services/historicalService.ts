import { 
  WeatherMetric, 
  AggregationPeriod, 
  LocationCoordinates, 
  RawWeatherRecord, 
  HistoricalAnalyticsResponse,
  HistoricalDataPoint,
  StatisticalSummary
} from '../types/analytics.js';
import { IWeatherAdapter } from '../adapters/weatherAdapter.js';
import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { 
  mean, 
  min as minVal, 
  max as maxVal, 
  median, 
  stdDev, 
  percentile, 
  sum, 
  movingAverage 
} from '../utils/statistics.js';

export class HistoricalService {
  private adapter: IWeatherAdapter;

  constructor(adapter?: IWeatherAdapter) {
    this.adapter = adapter || new OpenMeteoAdapter();
  }

  private getMetricUnit(metric: WeatherMetric): string {
    switch (metric) {
      case 'rainfall': return 'mm';
      case 'temperature':
      case 'temp_max':
      case 'temp_min': return '°C';
      case 'humidity': return '%';
      case 'wind_speed': return 'km/h';
      case 'pressure': return 'hPa';
      case 'cloud_cover': return '%';
      default: return '';
    }
  }

  private extractRecordValue(record: RawWeatherRecord, metric: WeatherMetric): number {
    switch (metric) {
      case 'rainfall': return record.rainfall;
      case 'temperature': return record.temperature;
      case 'temp_max': return record.temp_max;
      case 'temp_min': return record.temp_min;
      case 'humidity': return record.humidity;
      case 'wind_speed': return record.wind_speed;
      case 'pressure': return record.pressure;
      case 'cloud_cover': return record.cloud_cover;
      default: return record.rainfall;
    }
  }

  async getHistoricalAnalytics(
    location: LocationCoordinates,
    startDate: string,
    endDate: string,
    metric: WeatherMetric = 'rainfall',
    aggregation: AggregationPeriod = 'monthly'
  ): Promise<HistoricalAnalyticsResponse> {
    const { records, provenance } = await this.adapter.fetchHistoricalRecords(location, startDate, endDate);

    if (records.length === 0) {
      return {
        location: location.name,
        metric,
        aggregation,
        summary: {
          min: 0, max: 0, mean: 0, median: 0, stdDev: 0,
          p25: 0, p75: 0, p90: 0, p95: 0, totalSum: 0,
          unit: this.getMetricUnit(metric)
        },
        dataPoints: [],
        provenance
      };
    }

    const isSumMetric = metric === 'rainfall';
    const groupedData = new Map<string, number[]>();

    for (const record of records) {
      let groupKey = record.date; // daily

      if (aggregation === 'monthly') {
        groupKey = record.date.substring(0, 7); // YYYY-MM
      } else if (aggregation === 'yearly') {
        groupKey = record.date.substring(0, 4); // YYYY
      } else if (aggregation === 'weekly') {
        const d = new Date(record.date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        groupKey = monday.toISOString().split('T')[0];
      }

      const val = this.extractRecordValue(record, metric);
      if (!groupedData.has(groupKey)) {
        groupedData.set(groupKey, []);
      }
      groupedData.get(groupKey)!.push(val);
    }

    const aggregatedPoints: HistoricalDataPoint[] = [];
    const aggregatedValues: number[] = [];

    for (const [key, values] of groupedData.entries()) {
      const val = isSumMetric ? Number(sum(values).toFixed(1)) : Number(mean(values).toFixed(1));
      const min = Number(minVal(values).toFixed(1));
      const max = Number(maxVal(values).toFixed(1));

      aggregatedValues.push(val);
      aggregatedPoints.push({
        date: key,
        value: val,
        min,
        max
      });
    }

    // Compute rolling averages
    const ma7 = movingAverage(aggregatedValues, 7);
    const ma30 = movingAverage(aggregatedValues, 30);
    const ma90 = movingAverage(aggregatedValues, 90);

    for (let i = 0; i < aggregatedPoints.length; i++) {
      if (ma7[i] !== null) aggregatedPoints[i].rollingAvg7d = ma7[i]!;
      if (ma30[i] !== null) aggregatedPoints[i].rollingAvg30d = ma30[i]!;
      if (ma90[i] !== null) aggregatedPoints[i].rollingAvg90d = ma90[i]!;
    }

    // Statistical summary of aggregated series
    const summary: StatisticalSummary = {
      min: Number(minVal(aggregatedValues).toFixed(2)),
      max: Number(maxVal(aggregatedValues).toFixed(2)),
      mean: Number(mean(aggregatedValues).toFixed(2)),
      median: Number(median(aggregatedValues).toFixed(2)),
      stdDev: Number(stdDev(aggregatedValues).toFixed(2)),
      p25: Number(percentile(aggregatedValues, 25).toFixed(2)),
      p75: Number(percentile(aggregatedValues, 75).toFixed(2)),
      p90: Number(percentile(aggregatedValues, 90).toFixed(2)),
      p95: Number(percentile(aggregatedValues, 95).toFixed(2)),
      totalSum: isSumMetric ? Number(sum(aggregatedValues).toFixed(2)) : undefined,
      unit: this.getMetricUnit(metric)
    };

    provenance.aggregationPeriod = aggregation;
    provenance.calculationMethod = isSumMetric
      ? `Temporal Aggregation (${aggregation} sum) with Percentile & Rolling Averages`
      : `Temporal Aggregation (${aggregation} arithmetic mean) with Min/Max and Percentiles`;

    return {
      location: `${location.name}, ${location.state}`,
      metric,
      aggregation,
      summary,
      dataPoints: aggregatedPoints,
      provenance
    };
  }
}
