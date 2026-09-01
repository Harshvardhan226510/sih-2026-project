import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { 
    mean, 
    min as minVal, 
    max as maxVal, 
    median, 
    stdDev, 
    percentile, 
    percentileRank,
    distributionStats,
    sum, 
    movingAverage 
} from '../utils/statistics.js';

export class HistoricalService {
    adapter;
    constructor(adapter) {
        this.adapter = adapter || new OpenMeteoAdapter();
    }

    getMetricUnit(metric) {
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

    extractRecordValue(record, metric) {
        switch (metric) {
            case 'rainfall': return record.rainfall ?? 0;
            case 'temperature': return record.temperature ?? 25;
            case 'temp_max': return record.temp_max ?? 30;
            case 'temp_min': return record.temp_min ?? 20;
            case 'humidity': return record.humidity ?? 60;
            case 'wind_speed': return record.wind_speed ?? 10;
            case 'pressure': return record.pressure ?? 1010;
            case 'cloud_cover': return record.cloud_cover ?? 30;
            default: return record.rainfall ?? 0;
        }
    }

    async getHistoricalAnalytics(location, startDate, endDate, metric = 'rainfall', aggregation = 'monthly') {
        const { records, provenance } = await this.adapter.fetchHistoricalRecords(location, startDate, endDate);
        const unit = this.getMetricUnit(metric);

        if (records.length === 0) {
            return {
                location: `${location.name}, ${location.state}`,
                metric,
                aggregation,
                summary: {
                    min: 0, max: 0, mean: 0, median: 0, stdDev: 0,
                    p10: 0, p25: 0, p75: 0, p90: 0, p95: 0, iqr: 0, skewness: 0,
                    totalSum: 0,
                    unit
                },
                distribution: {
                    min: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0, iqr: 0, mean: 0, stdDev: 0, skewness: 0
                },
                dataPoints: [],
                provenance
            };
        }

        const isSumMetric = metric === 'rainfall';
        const groupedData = new Map();

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
            groupedData.get(groupKey).push(val);
        }

        const aggregatedPoints = [];
        const aggregatedValues = [];

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

        // Rolling averages
        const ma7 = movingAverage(aggregatedValues, 7);
        const ma30 = movingAverage(aggregatedValues, 30);
        const ma90 = movingAverage(aggregatedValues, 90);

        // Calculate distribution stats & percentile ranks for each point
        const dist = distributionStats(aggregatedValues);

        for (let i = 0; i < aggregatedPoints.length; i++) {
            if (ma7[i] !== null) aggregatedPoints[i].rollingAvg7d = ma7[i];
            if (ma30[i] !== null) aggregatedPoints[i].rollingAvg30d = ma30[i];
            if (ma90[i] !== null) aggregatedPoints[i].rollingAvg90d = ma90[i];
            aggregatedPoints[i].percentileRank = percentileRank(aggregatedValues, aggregatedPoints[i].value);
            
            // Typical / Unusual / Extreme categorization
            const v = aggregatedPoints[i].value;
            if (v >= dist.p90) aggregatedPoints[i].classification = 'EXTREME_HIGH';
            else if (v >= dist.p75) aggregatedPoints[i].classification = 'UNUSUALLY_HIGH';
            else if (v <= dist.p10) aggregatedPoints[i].classification = 'EXTREME_LOW';
            else if (v <= dist.p25) aggregatedPoints[i].classification = 'UNUSUALLY_LOW';
            else aggregatedPoints[i].classification = 'TYPICAL';
        }

        // Statistical summary of aggregated series
        const summary = {
            min: dist.min,
            max: dist.max,
            mean: dist.mean,
            median: dist.median,
            stdDev: dist.stdDev,
            p10: dist.p10,
            p25: dist.p25,
            p75: dist.p75,
            p90: dist.p90,
            p95: Number(percentile(aggregatedValues, 95).toFixed(2)),
            iqr: dist.iqr,
            skewness: dist.skewness,
            totalSum: isSumMetric ? Number(sum(aggregatedValues).toFixed(2)) : undefined,
            unit
        };

        provenance.aggregationPeriod = aggregation;
        provenance.calculationMethod = isSumMetric
            ? `Temporal Aggregation (${aggregation} sum) with Percentile Distribution & Rolling Averages`
            : `Temporal Aggregation (${aggregation} arithmetic mean) with Distribution Metrics & Percentiles`;

        return {
            location: `${location.name}, ${location.state}`,
            metric,
            aggregation,
            summary,
            distribution: dist,
            dataPoints: aggregatedPoints,
            provenance
        };
    }
}
