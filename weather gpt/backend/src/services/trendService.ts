import { 
  WeatherMetric, 
  LocationCoordinates, 
  TrendAnalyticsResponse, 
  Season 
} from '../types/analytics.js';
import { IWeatherAdapter } from '../adapters/weatherAdapter.js';
import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { 
  mean, 
  sum, 
  linearRegression, 
  movingAverage, 
  coefficientOfVariation, 
  calculateAnomalyPercentage 
} from '../utils/statistics.js';

export class TrendService {
  private adapter: IWeatherAdapter;

  constructor(adapter?: IWeatherAdapter) {
    this.adapter = adapter || new OpenMeteoAdapter();
  }

  private getSeason(month: number): Season {
    // 0 = Jan, 1 = Feb, etc.
    if (month >= 2 && month <= 4) return 'Summer'; // Mar - May
    if (month >= 5 && month <= 8) return 'Monsoon'; // Jun - Sep
    if (month >= 9 && month <= 10) return 'Post-Monsoon'; // Oct - Nov
    return 'Winter'; // Dec - Feb
  }

  async getTrendAnalytics(
    location: LocationCoordinates,
    startDate: string,
    endDate: string,
    metric: WeatherMetric = 'rainfall'
  ): Promise<TrendAnalyticsResponse> {
    const { records, provenance } = await this.adapter.fetchHistoricalRecords(location, startDate, endDate);

    if (records.length === 0) {
      throw new Error('No historical records available for the requested range.');
    }

    // Group by year
    const yearlyMap = new Map<number, number[]>();
    const seasonalMap = new Map<Season, number[]>();
    seasonalMap.set('Summer', []);
    seasonalMap.set('Monsoon', []);
    seasonalMap.set('Post-Monsoon', []);
    seasonalMap.set('Winter', []);

    for (const record of records) {
      const d = new Date(record.date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const season = this.getSeason(month);

      const val = metric === 'rainfall' ? record.rainfall :
                  metric === 'temperature' ? record.temperature :
                  metric === 'temp_max' ? record.temp_max :
                  metric === 'temp_min' ? record.temp_min :
                  metric === 'humidity' ? record.humidity :
                  metric === 'wind_speed' ? record.wind_speed :
                  metric === 'pressure' ? record.pressure : record.rainfall;

      if (!yearlyMap.has(year)) yearlyMap.set(year, []);
      yearlyMap.get(year)!.push(val);
      seasonalMap.get(season)!.push(val);
    }

    const years = Array.from(yearlyMap.keys()).sort((a, b) => a - b);
    const yearlyAverages: Array<{ year: number; average: number; totalSum: number }> = [];

    years.forEach(year => {
      const vals = yearlyMap.get(year)!;
      yearlyAverages.push({
        year,
        average: Number(mean(vals).toFixed(2)),
        totalSum: Number(sum(vals).toFixed(2))
      });
    });

    // Compute Linear Regression over yearly series
    const isRain = metric === 'rainfall';
    const xYears = years.map((_, idx) => idx);
    const yValues = yearlyAverages.map(y => isRain ? y.totalSum : y.average);

    const reg = linearRegression(xYears, yValues);
    const slopePerYear = Number(reg.slope.toFixed(2));

    // Baseline (first half of years) vs Recent (second half of years)
    const midPoint = Math.max(1, Math.floor(years.length / 2));
    const baselineVals = yValues.slice(0, midPoint);
    const recentVals = yValues.slice(midPoint);

    const baselineAverage = Number(mean(baselineVals).toFixed(2));
    const recentAverage = Number(mean(recentVals).toFixed(2));
    const percentageChange = calculateAnomalyPercentage(recentAverage, baselineAverage);

    let trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
    if (percentageChange > 3.0 || slopePerYear > 0.1) {
      trendDirection = 'INCREASING';
    } else if (percentageChange < -3.0 || slopePerYear < -0.1) {
      trendDirection = 'DECREASING';
    }

    const variabilityPercent = Number(coefficientOfVariation(yValues).toFixed(2));

    // Moving averages on yearly/seasonal series
    const ma7 = movingAverage(yValues, 3); // 3-year MA
    const series = yearlyAverages.map((item, idx) => ({
      date: String(item.year),
      actual: isRain ? item.totalSum : item.average,
      trendLine: Number((reg.intercept + reg.slope * idx).toFixed(2)),
      ma7: ma7[idx] ?? undefined
    }));

    // Seasonal breakdown
    const totalAllRain = sum(records.map(r => r.rainfall));
    const seasonalBreakdown: Array<{
      season: Season;
      average: number;
      totalSum: number;
      percentOfAnnual: number;
    }> = (['Summer', 'Monsoon', 'Post-Monsoon', 'Winter'] as Season[]).map(season => {
      const vals = seasonalMap.get(season)!;
      const sSum = Number(sum(vals).toFixed(2));
      const sAvg = Number(mean(vals).toFixed(2));
      const pct = isRain && totalAllRain > 0 ? Number(((sSum / totalAllRain) * 100).toFixed(1)) : 25;

      return {
        season,
        average: sAvg,
        totalSum: sSum,
        percentOfAnnual: pct
      };
    });

    // Evidence-based analytical explanation (no hallucination)
    const unit = isRain ? 'mm' : '°C';
    const directionWord = trendDirection === 'INCREASING' ? 'an upward' : trendDirection === 'DECREASING' ? 'a downward' : 'a stable';
    const explanation = `Long-term trend analysis for ${location.name} (${years[0]}–${years[years.length - 1]}) shows ${directionWord} trajectory in ${metric}. ` +
      `The slope is ${slopePerYear > 0 ? '+' : ''}${slopePerYear} ${unit}/year with an overall change of ${percentageChange > 0 ? '+' : ''}${percentageChange}% relative to the baseline period (${years[0]}–${years[midPoint - 1] || years[0]}). ` +
      `Inter-annual variability is measured at ${variabilityPercent}%.`;

    provenance.calculationMethod = `Ordinary Least Squares Regression (R²=${reg.rSquared}) & Seasonal Climatological Partitioning`;

    return {
      location: `${location.name}, ${location.state}`,
      metric,
      timeRange: { start: startDate, end: endDate },
      trendDirection,
      slopePerYear,
      percentageChange,
      baselineAverage,
      recentAverage,
      variabilityPercent,
      series,
      seasonalBreakdown,
      yearlyAverages,
      analyticalExplanation: explanation,
      provenance
    };
  }
}
