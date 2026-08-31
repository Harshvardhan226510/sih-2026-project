import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { mean, min as minVal, max as maxVal, median, stdDev, percentile, sum, coefficientOfVariation, calculateAnomalyPercentage } from '../utils/statistics.js';
export class ComparisonService {
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
            default: return '';
        }
    }
    computeSummary(values, metric) {
        const isRain = metric === 'rainfall';
        return {
            min: Number(minVal(values).toFixed(2)),
            max: Number(maxVal(values).toFixed(2)),
            mean: Number(mean(values).toFixed(2)),
            median: Number(median(values).toFixed(2)),
            stdDev: Number(stdDev(values).toFixed(2)),
            p25: Number(percentile(values, 25).toFixed(2)),
            p75: Number(percentile(values, 75).toFixed(2)),
            p90: Number(percentile(values, 90).toFixed(2)),
            p95: Number(percentile(values, 95).toFixed(2)),
            totalSum: isRain ? Number(sum(values).toFixed(2)) : undefined,
            unit: this.getMetricUnit(metric)
        };
    }
    async compareLocations(locA, locB, startDate, endDate, metric = 'rainfall') {
        const [resA, resB] = await Promise.all([
            this.adapter.fetchHistoricalRecords(locA, startDate, endDate),
            this.adapter.fetchHistoricalRecords(locB, startDate, endDate)
        ]);
        const isRain = metric === 'rainfall';
        const getVal = (r) => {
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
        const mapB = new Map();
        resB.records.forEach(r => mapB.set(r.date, getVal(r)));
        const valuesA = [];
        const valuesB = [];
        const timeSeries = [];
        for (const rA of resA.records) {
            const valA = getVal(rA);
            const valB = mapB.get(rA.date) ?? valA;
            valuesA.push(valA);
            valuesB.push(valB);
            timeSeries.push({
                date: rA.date,
                valueA: Number(valA.toFixed(1)),
                valueB: Number(valB.toFixed(1)),
                diff: Number((valA - valB).toFixed(1))
            });
        }
        const statsA = this.computeSummary(valuesA, metric);
        const statsB = this.computeSummary(valuesB, metric);
        const targetValA = isRain ? (statsA.totalSum || 0) : statsA.mean;
        const targetValB = isRain ? (statsB.totalSum || 0) : statsB.mean;
        const meanDiff = Number((targetValA - targetValB).toFixed(2));
        const pctDiff = calculateAnomalyPercentage(targetValA, targetValB);
        const cvA = coefficientOfVariation(valuesA);
        const cvB = coefficientOfVariation(valuesB);
        const varDiff = Number((cvA - cvB).toFixed(2));
        const higherLoc = targetValA >= targetValB ? locA.name : locB.name;
        // Detect extreme threshold events (> 95th percentile)
        const p95A = statsA.p95;
        const p95B = statsB.p95;
        const extremeCountA = valuesA.filter(v => v >= p95A && v > 10).length;
        const extremeCountB = valuesB.filter(v => v >= p95B && v > 10).length;
        const unit = this.getMetricUnit(metric);
        const explanation = `Comparative meteorological analysis between ${locA.name} and ${locB.name} (${startDate} to ${endDate}): ` +
            `${higherLoc} recorded higher overall ${metric} (${targetValA >= targetValB ? targetValA : targetValB} ${unit}) compared to ` +
            `${higherLoc === locA.name ? locB.name : locA.name} (${targetValA >= targetValB ? targetValB : targetValA} ${unit}), ` +
            `representing a ${Math.abs(pctDiff)}% difference. ` +
            `${locA.name} experienced ${extremeCountA} high-intensity events while ${locB.name} recorded ${extremeCountB} events.`;
        const provenance = {
            ...resA.provenance,
            location: `${locA.name} vs ${locB.name}`,
            calculationMethod: `Dual-Station Time-Series Covariance & Differential Matrix`
        };
        return {
            metric,
            timeRange: { start: startDate, end: endDate },
            locationA: {
                name: locA.name,
                stats: statsA,
                extremeEventsCount: extremeCountA,
                anomalyAverage: Number(mean(valuesA).toFixed(2))
            },
            locationB: {
                name: locB.name,
                stats: statsB,
                extremeEventsCount: extremeCountB,
                anomalyAverage: Number(mean(valuesB).toFixed(2))
            },
            comparisonSummary: {
                meanDifference: meanDiff,
                percentDifference: pctDiff,
                variabilityDifference: varDiff,
                higherLocation: higherLoc
            },
            timeSeries,
            analyticalExplanation: explanation,
            provenance
        };
    }
}
