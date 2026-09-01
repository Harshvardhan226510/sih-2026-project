import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { 
    mean, 
    min as minVal, 
    max as maxVal, 
    median, 
    stdDev, 
    percentile, 
    sum, 
    coefficientOfVariation, 
    calculateAnomalyPercentage,
    distributionStats
} from '../utils/statistics.js';

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
            case 'cloud_cover': return '%';
            default: return '';
        }
    }

    extractMetricValue(record, metric) {
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

    computeSummary(values, metric) {
        const isRain = metric === 'rainfall';
        const dist = distributionStats(values);
        return {
            min: dist.min,
            max: dist.max,
            mean: dist.mean,
            median: dist.median,
            stdDev: dist.stdDev,
            p10: dist.p10,
            p25: dist.p25,
            p75: dist.p75,
            p90: dist.p90,
            p95: Number(percentile(values, 95).toFixed(2)),
            iqr: dist.iqr,
            totalSum: isRain ? Number(sum(values).toFixed(2)) : undefined,
            variabilityCv: Number(coefficientOfVariation(values).toFixed(2)),
            unit: this.getMetricUnit(metric)
        };
    }

    /**
     * Compare 2 to 4 locations for the same date range, metric, and resolution
     */
    async compareMultipleLocations(locations, startDate, endDate, metric = 'rainfall', aggregation = 'daily') {
        if (!locations || locations.length < 2) {
            throw new Error('At least 2 locations are required for comparison.');
        }
        const boundedLocations = locations.slice(0, 4); // max 4 locations
        const isRain = metric === 'rainfall';
        const unit = this.getMetricUnit(metric);

        // Fetch datasets for each location concurrently (reusing L1/L2 cache independently)
        const fetchPromises = boundedLocations.map(loc => 
            this.adapter.fetchHistoricalRecords(loc, startDate, endDate)
        );
        const results = await Promise.all(fetchPromises);

        // Build synchronized date map
        const dateSet = new Set();
        results.forEach(res => {
            res.records.forEach(r => dateSet.add(r.date));
        });
        const sortedDates = Array.from(dateSet).sort();

        // Location summaries & series
        const locationProfiles = [];
        const dateValueMaps = results.map(res => {
            const map = new Map();
            res.records.forEach(r => map.set(r.date, this.extractMetricValue(r, metric)));
            return map;
        });

        // Compute stats for each location
        results.forEach((res, idx) => {
            const loc = boundedLocations[idx];
            const values = sortedDates.map(d => dateValueMaps[idx].get(d) ?? 0);
            const stats = this.computeSummary(values, metric);
            const p95 = stats.p95;
            const extremeCount = values.filter(v => v >= p95 && v > (isRain ? 10 : 0)).length;

            locationProfiles.push({
                locationId: `loc_${idx + 1}`,
                name: loc.name,
                state: loc.state,
                coordinates: { lat: loc.lat, lon: loc.lon },
                stats,
                primaryMetricValue: isRain ? (stats.totalSum ?? 0) : stats.mean,
                extremeEventsCount: extremeCount,
                variabilityCv: stats.variabilityCv
            });
        });

        // Rank locations by primary value
        locationProfiles.sort((a, b) => b.primaryMetricValue - a.primaryMetricValue);
        locationProfiles.forEach((loc, rankIdx) => {
            loc.rank = rankIdx + 1;
        });

        // Synchronized Multi-line time series
        const timeSeries = sortedDates.map(date => {
            const point = { date };
            locationProfiles.forEach((loc, idx) => {
                const originalIndex = boundedLocations.findIndex(l => l.name === loc.name);
                const val = dateValueMaps[originalIndex].get(date) ?? 0;
                point[loc.name] = Number(val.toFixed(1));
            });
            return point;
        });

        // Summary differences between top and bottom
        const highest = locationProfiles[0];
        const lowest = locationProfiles[locationProfiles.length - 1];
        const primaryDiff = Number((highest.primaryMetricValue - lowest.primaryMetricValue).toFixed(2));
        const pctDiff = calculateAnomalyPercentage(highest.primaryMetricValue, lowest.primaryMetricValue);

        const explanation = `Comparative multi-location meteorological analysis for ${boundedLocations.map(l => l.name).join(', ')} (${startDate} to ${endDate}): ` +
            `${highest.name} recorded the highest ${metric} (${highest.primaryMetricValue} ${unit}) while ` +
            `${lowest.name} recorded the lowest (${lowest.primaryMetricValue} ${unit}), representing a ${Math.abs(pctDiff)}% difference. ` +
            `Variability ranged from ${Math.min(...locationProfiles.map(l => l.variabilityCv))}% to ${Math.max(...locationProfiles.map(l => l.variabilityCv))}%.`;

        return {
            metric,
            unit,
            timeRange: { start: startDate, end: endDate },
            aggregation,
            locations: locationProfiles,
            summaryComparison: {
                highestLocation: highest.name,
                lowestLocation: lowest.name,
                absoluteDifference: primaryDiff,
                percentDifference: pctDiff,
                locationCount: boundedLocations.length
            },
            timeSeries,
            analyticalExplanation: explanation,
            provenance: {
                ...results[0].provenance,
                location: boundedLocations.map(l => l.name).join(' vs '),
                calculationMethod: `Multi-Station Synchronized Covariance & Comparative Matrix (${boundedLocations.length} locations)`
            }
        };
    }

    /**
     * Backward-compatible 2-location comparison
     */
    async compareLocations(locA, locB, startDate, endDate, metric = 'rainfall') {
        const multi = await this.compareMultipleLocations([locA, locB], startDate, endDate, metric);
        const locProfileA = multi.locations.find(l => l.name === locA.name) || multi.locations[0];
        const locProfileB = multi.locations.find(l => l.name === locB.name) || multi.locations[1];

        const valA = locProfileA.primaryMetricValue;
        const valB = locProfileB.primaryMetricValue;
        const meanDiff = Number((valA - valB).toFixed(2));
        const pctDiff = calculateAnomalyPercentage(valA, valB);
        const varDiff = Number((locProfileA.variabilityCv - locProfileB.variabilityCv).toFixed(2));

        return {
            metric,
            timeRange: { start: startDate, end: endDate },
            locationA: {
                name: locA.name,
                stats: locProfileA.stats,
                extremeEventsCount: locProfileA.extremeEventsCount,
                anomalyAverage: locProfileA.stats.mean
            },
            locationB: {
                name: locB.name,
                stats: locProfileB.stats,
                extremeEventsCount: locProfileB.extremeEventsCount,
                anomalyAverage: locProfileB.stats.mean
            },
            comparisonSummary: {
                meanDifference: meanDiff,
                percentDifference: pctDiff,
                variabilityDifference: varDiff,
                higherLocation: valA >= valB ? locA.name : locB.name
            },
            locations: multi.locations,
            timeSeries: multi.timeSeries.map(p => ({
                date: p.date,
                valueA: p[locA.name] ?? 0,
                valueB: p[locB.name] ?? 0,
                diff: Number(((p[locA.name] ?? 0) - (p[locB.name] ?? 0)).toFixed(1))
            })),
            analyticalExplanation: multi.analyticalExplanation,
            provenance: multi.provenance
        };
    }

    /**
     * Compare two distinct time periods for the SAME location
     */
    async comparePeriods(location, periodA, periodB, metric = 'rainfall') {
        const isRain = metric === 'rainfall';
        const unit = this.getMetricUnit(metric);

        // Fetch datasets for both periods (reuses cache/coverage where applicable)
        const [resA, resB] = await Promise.all([
            this.adapter.fetchHistoricalRecords(location, periodA.start, periodA.end),
            this.adapter.fetchHistoricalRecords(location, periodB.start, periodB.end)
        ]);

        const valuesA = resA.records.map(r => this.extractMetricValue(r, metric));
        const valuesB = resB.records.map(r => this.extractMetricValue(r, metric));

        const statsA = this.computeSummary(valuesA, metric);
        const statsB = this.computeSummary(valuesB, metric);

        const primaryA = isRain ? (statsA.totalSum ?? 0) : statsA.mean;
        const primaryB = isRain ? (statsB.totalSum ?? 0) : statsB.mean;

        const absoluteDiff = Number((primaryB - primaryA).toFixed(2));
        // Safe percentage change calculation
        const percentDiff = calculateAnomalyPercentage(primaryB, primaryA);

        const variabilityDiff = Number((statsB.variabilityCv - statsA.variabilityCv).toFixed(2));

        // Extreme events in each period (> 95th percentile of baseline period A)
        const p95A = statsA.p95;
        const extremeCountA = valuesA.filter(v => v >= p95A && v > (isRain ? 10 : 0)).length;
        const extremeCountB = valuesB.filter(v => v >= p95A && v > (isRain ? 10 : 0)).length;
        const extremeCountDiff = extremeCountB - extremeCountA;

        const directionWord = absoluteDiff > 0 ? 'increased' : absoluteDiff < 0 ? 'decreased' : 'remained unchanged';
        const explanation = `Period comparison for ${location.name} (${periodA.start}–${periodA.end} vs ${periodB.start}–${periodB.end}): ` +
            `Average ${metric} ${directionWord} by ${Math.abs(absoluteDiff)} ${unit} (${percentDiff > 0 ? '+' : ''}${percentDiff}% change). ` +
            `Variability (CV) changed from ${statsA.variabilityCv}% to ${statsB.variabilityCv}% (${variabilityDiff > 0 ? '+' : ''}${variabilityDiff}%). ` +
            `Extreme event frequency changed by ${extremeCountDiff > 0 ? '+' : ''}${extremeCountDiff} events.`;

        return {
            location: `${location.name}, ${location.state}`,
            metric,
            unit,
            periodA: {
                label: `Period A (${periodA.start} to ${periodA.end})`,
                timeRange: periodA,
                observationCount: valuesA.length,
                stats: statsA,
                extremeEventsCount: extremeCountA,
                primaryValue: primaryA
            },
            periodB: {
                label: `Period B (${periodB.start} to ${periodB.end})`,
                timeRange: periodB,
                observationCount: valuesB.length,
                stats: statsB,
                extremeEventsCount: extremeCountB,
                primaryValue: primaryB
            },
            differences: {
                absoluteChange: absoluteDiff,
                percentChange: percentDiff,
                variabilityChange: variabilityDiff,
                extremeEventsChange: extremeCountDiff,
                meanChange: Number((statsB.mean - statsA.mean).toFixed(2)),
                medianChange: Number((statsB.median - statsA.median).toFixed(2)),
                maxChange: Number((statsB.max - statsA.max).toFixed(2)),
                minChange: Number((statsB.min - statsA.min).toFixed(2))
            },
            analyticalExplanation: explanation,
            provenance: {
                ...resA.provenance,
                timeRange: { start: periodA.start, end: periodB.end },
                calculationMethod: `Temporal Diachronic Covariance & Period Differential Analysis`
            }
        };
    }
}
