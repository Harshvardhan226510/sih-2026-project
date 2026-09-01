import { 
  WeatherMetric, 
  LocationCoordinates, 
  AnomalyAnalyticsResponse, 
  AnomalySeverity 
} from '../types/analytics.js';
import { IWeatherAdapter } from '../adapters/weatherAdapter.js';
import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { 
  mean, 
  sum, 
  stdDev, 
  calculateAnomaly, 
  calculateAnomalyPercentage, 
  calculateZScore 
} from '../utils/statistics.js';

export class AnomalyService {
  private adapter: IWeatherAdapter;

  constructor(adapter?: IWeatherAdapter) {
    this.adapter = adapter || new OpenMeteoAdapter();
  }

  private classifyAnomaly(anomalyPct: number): { classification: AnomalySeverity; badge: string } {
    if (anomalyPct >= 60) {
      return { classification: 'EXTREME_ANOMALY', badge: `+${anomalyPct.toFixed(1)}% EXTREME ANOMALY` };
    }
    if (anomalyPct >= 25) {
      return { classification: 'HIGH_ANOMALY', badge: `+${anomalyPct.toFixed(1)}% HIGH ANOMALY` };
    }
    if (anomalyPct >= 10) {
      return { classification: 'ABOVE_NORMAL', badge: `+${anomalyPct.toFixed(1)}% ABOVE NORMAL` };
    }
    if (anomalyPct <= -60) {
      return { classification: 'EXTREME_NEGATIVE', badge: `${anomalyPct.toFixed(1)}% EXTREME DEFICIT` };
    }
    if (anomalyPct <= -25) {
      return { classification: 'HIGH_NEGATIVE', badge: `${anomalyPct.toFixed(1)}% HIGH DEFICIT` };
    }
    if (anomalyPct <= -10) {
      return { classification: 'BELOW_NORMAL', badge: `${anomalyPct.toFixed(1)}% BELOW NORMAL` };
    }
    return { classification: 'NORMAL', badge: `${anomalyPct >= 0 ? '+' : ''}${anomalyPct.toFixed(1)}% NORMAL` };
  }

  async getAnomalyAnalytics(
    location: LocationCoordinates,
    targetStartDate: string,
    targetEndDate: string,
    baselineStartDate?: string,
    baselineEndDate?: string,
    metric: WeatherMetric = 'rainfall'
  ): Promise<AnomalyAnalyticsResponse> {
    // If no baseline specified, use standard 10-year historical prior window
    const targetStartYear = new Date(targetStartDate).getFullYear();
    const baseStart = baselineStartDate || `${targetStartYear - 10}-01-01`;
    const baseEnd = baselineEndDate || `${targetStartYear - 1}-12-31`;

    // Fetch baseline historical records
    const { records: baselineRecords, provenance } = await this.adapter.fetchHistoricalRecords(
      location,
      baseStart,
      baseEnd
    );

    // Fetch target period records
    const { records: targetRecords } = await this.adapter.fetchHistoricalRecords(
      location,
      targetStartDate,
      targetEndDate
    );

    const isSumMetric = metric === 'rainfall';

    // Helper to get metric value
    const getVal = (r: any) => {
      switch (metric) {
        case 'rainfall': return r.rainfall;
        case 'temperature': return r.temperature;
        case 'temp_max': return r.temp_max;
        case 'temp_min': return r.temp_min;
        case 'humidity': return r.humidity;
        case 'wind_speed': return r.wind_speed;
        case 'pressure': return r.pressure;
        default: return r.rainfall;
      }
    };

    // Calculate baseline normal for matching day-of-year/month
    // Group baseline by MM-DD
    const baselineDailyMap = new Map<string, number[]>();
    baselineRecords.forEach(r => {
      const mmdd = r.date.substring(5); // "07-15"
      if (!baselineDailyMap.has(mmdd)) baselineDailyMap.set(mmdd, []);
      baselineDailyMap.get(mmdd)!.push(getVal(r));
    });

    const baselineAllVals = baselineRecords.map(getVal);
    const targetVals = targetRecords.map(getVal);

    const observedValue = Number((isSumMetric ? sum(targetVals) : mean(targetVals)).toFixed(2));
    
    // Scale baseline to target period duration
    const baselineDailyMean = mean(baselineAllVals);
    const historicalBaseline = Number((isSumMetric ? (baselineDailyMean * targetRecords.length) : baselineDailyMean).toFixed(2));

    const anomaly = calculateAnomaly(observedValue, historicalBaseline);
    const anomalyPercentage = calculateAnomalyPercentage(observedValue, historicalBaseline);
    const baselineStd = stdDev(baselineAllVals);
    const zScore = calculateZScore(observedValue, historicalBaseline, baselineStd || 1);

    const { classification, badge } = this.classifyAnomaly(anomalyPercentage);

    // Build day-by-day comparison series for target period
    const timeSeries = targetRecords.map(tr => {
      const mmdd = tr.date.substring(5);
      const histDayVals = baselineDailyMap.get(mmdd) || [baselineDailyMean];
      const histNormal = Number(mean(histDayVals).toFixed(2));
      const obs = getVal(tr);
      const dayAnom = calculateAnomaly(obs, histNormal);
      const dayAnomPct = calculateAnomalyPercentage(obs, histNormal);

      return {
        date: tr.date,
        observed: obs,
        historicalBaseline: histNormal,
        anomaly: dayAnom,
        anomalyPercent: dayAnomPct
      };
    });

    const unit = isSumMetric ? 'mm' : '°C';
    const directionWord = anomaly >= 0 ? 'above' : 'below';
    const metricTitle = metric.charAt(0).toUpperCase() + metric.slice(1);
    const explanation = `${metricTitle} observation (${observedValue} ${unit}) is ${Math.abs(anomalyPercentage)}% ${directionWord} the historical climatological baseline (${historicalBaseline} ${unit}) for ${location.name} during ${targetStartDate} to ${targetEndDate}. ` +
      `With a statistical departure of ${anomaly > 0 ? '+' : ''}${anomaly} ${unit} (Z-score: ${zScore}), this observation is classified as "${classification.replace(/_/g, ' ')}".`;

    provenance.calculationMethod = `Climatological Baseline Normalization (${baseStart} to ${baseEnd}) vs Target Period Observation`;

    return {
      location: `${location.name}, ${location.state}`,
      metric,
      targetPeriod: { start: targetStartDate, end: targetEndDate },
      baselinePeriod: { start: baseStart, end: baseEnd },
      historicalBaseline,
      observedValue,
      anomaly,
      anomalyPercentage,
      zScore,
      classification,
      badgeLabel: badge,
      timeSeries,
      explanation,
      provenance
    };
  }
}
