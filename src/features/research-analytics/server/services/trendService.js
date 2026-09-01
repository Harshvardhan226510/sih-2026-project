import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { 
    mean, 
    sum, 
    stdDev,
    min as minVal,
    max as maxVal,
    linearRegressionWithSignificance, 
    mannKendallTest,
    movingAverage, 
    coefficientOfVariation, 
    calculateAnomalyPercentage 
} from '../utils/statistics.js';

export class TrendService {
    adapter;
    constructor(adapter) {
        this.adapter = adapter || new OpenMeteoAdapter();
    }

    getSeason(month) {
        // IMD Standard Indian Meteorological Seasons
        // 0 = Jan, 1 = Feb, etc.
        if (month === 11 || month === 0 || month === 1) return 'Winter'; // Dec - Feb
        if (month >= 2 && month <= 4) return 'Pre-Monsoon / Summer'; // Mar - May
        if (month >= 5 && month <= 8) return 'Monsoon'; // Jun - Sep
        return 'Post-Monsoon'; // Oct - Nov
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

    async getTrendAnalytics(location, startDate, endDate, metric = 'rainfall') {
        const { records, provenance } = await this.adapter.fetchHistoricalRecords(location, startDate, endDate);
        if (records.length === 0) {
            throw new Error('No historical records available for the requested range.');
        }

        const isRain = metric === 'rainfall';
        const unit = this.getMetricUnit(metric);

        // Group by year and season
        const yearlyMap = new Map();
        const seasonalMap = new Map([
            ['Winter', []],
            ['Pre-Monsoon / Summer', []],
            ['Monsoon', []],
            ['Post-Monsoon', []]
        ]);

        // Multi-year seasonal tracking: Map<Season, Map<Year, number[]>>
        const seasonalYearlyMap = new Map([
            ['Winter', new Map()],
            ['Pre-Monsoon / Summer', new Map()],
            ['Monsoon', new Map()],
            ['Post-Monsoon', new Map()]
        ]);

        for (const record of records) {
            const d = new Date(record.date);
            const year = d.getFullYear();
            const month = d.getMonth();
            const season = this.getSeason(month);
            const val = this.extractRecordValue(record, metric);

            if (!yearlyMap.has(year)) yearlyMap.set(year, []);
            yearlyMap.get(year).push(val);

            if (!seasonalMap.has(season)) seasonalMap.set(season, []);
            seasonalMap.get(season).push(val);

            const sYearMap = seasonalYearlyMap.get(season);
            if (!sYearMap.has(year)) sYearMap.set(year, []);
            sYearMap.get(year).push(val);
        }

        const years = Array.from(yearlyMap.keys()).sort((a, b) => a - b);
        const yearlyAverages = [];
        years.forEach(year => {
            const vals = yearlyMap.get(year);
            yearlyAverages.push({
                year,
                average: Number(mean(vals).toFixed(2)),
                totalSum: Number(sum(vals).toFixed(2)),
                min: Number(minVal(vals).toFixed(2)),
                max: Number(maxVal(vals).toFixed(2)),
                stdDev: Number(stdDev(vals).toFixed(2))
            });
        });

        // Compute Linear Regression with statistical significance & Mann-Kendall test
        const xYears = years.map((_, idx) => idx);
        const yValues = yearlyAverages.map(y => isRain ? y.totalSum : y.average);

        const regSignificance = linearRegressionWithSignificance(xYears, yValues);
        const mkTest = mannKendallTest(yValues);

        const slopePerYear = Number(regSignificance.slope.toFixed(3));

        // Baseline (first half of years) vs Recent (second half of years)
        const midPoint = Math.max(1, Math.floor(years.length / 2));
        const baselineVals = yValues.slice(0, midPoint);
        const recentVals = yValues.slice(midPoint);
        const baselineAverage = Number(mean(baselineVals).toFixed(2));
        const recentAverage = Number(mean(recentVals).toFixed(2));
        const percentageChange = calculateAnomalyPercentage(recentAverage, baselineAverage);

        let trendDirection = 'STABLE';
        if (slopePerYear > 0.05 || (mkTest.isSignificant && mkTest.s > 0)) {
            trendDirection = 'INCREASING';
        } else if (slopePerYear < -0.05 || (mkTest.isSignificant && mkTest.s < 0)) {
            trendDirection = 'DECREASING';
        }

        const variabilityPercent = Number(coefficientOfVariation(yValues).toFixed(2));
        const ma3 = movingAverage(yValues, 3); // 3-year moving average

        const series = yearlyAverages.map((item, idx) => ({
            date: String(item.year),
            actual: isRain ? item.totalSum : item.average,
            trendLine: Number((regSignificance.intercept + regSignificance.slope * idx).toFixed(2)),
            ma3: ma3[idx] ?? undefined
        }));

        // Seasonal breakdown with Indian meteorological context & multi-year inter-comparison
        const totalAllRain = sum(records.map(r => r.rainfall));
        const seasonalBreakdown = ['Winter', 'Pre-Monsoon / Summer', 'Monsoon', 'Post-Monsoon'].map(season => {
            const vals = seasonalMap.get(season) || [];
            const sSum = Number(sum(vals).toFixed(2));
            const sAvg = Number(mean(vals).toFixed(2));
            const sVar = Number(coefficientOfVariation(vals).toFixed(1));
            const pct = isRain && totalAllRain > 0 ? Number(((sSum / totalAllRain) * 100).toFixed(1)) : undefined;

            // Yearly series for this season
            const sYearMap = seasonalYearlyMap.get(season);
            const seasonYearlyHistory = years.map(yr => {
                const yrVals = sYearMap.get(yr) || [];
                return {
                    year: yr,
                    value: isRain ? Number(sum(yrVals).toFixed(1)) : Number(mean(yrVals).toFixed(1))
                };
            });

            return {
                season,
                average: sAvg,
                totalSum: sSum,
                variabilityCv: sVar,
                percentOfAnnual: pct,
                yearlyHistory: seasonYearlyHistory
            };
        });

        // Key Insights & analytical explanation
        const directionWord = trendDirection === 'INCREASING' ? 'an upward' : trendDirection === 'DECREASING' ? 'a downward' : 'a stable';
        const sigBadge = mkTest.isSignificant ? 'Statistically Significant (p < 0.05)' : 'Observed (Not Statistically Significant at α=0.05)';
        
        const explanation = `Long-term trend analysis for ${location.name} (${years[0]}–${years[years.length - 1]}): ` +
            `Shows ${directionWord} trajectory in ${metric} with a slope of ${slopePerYear > 0 ? '+' : ''}${slopePerYear} ${unit}/year ` +
            `(R² = ${regSignificance.rSquared}, Mann-Kendall Tau = ${mkTest.tau}, p = ${mkTest.pValue}). ` +
            `Trend status: [${sigBadge}]. ` +
            `Overall change is ${percentageChange > 0 ? '+' : ''}${percentageChange}% relative to the baseline period (${years[0]}–${years[midPoint - 1] || years[0]}), ` +
            `with inter-annual variability of ${variabilityPercent}%.`;

        provenance.calculationMethod = `Mann-Kendall Non-Parametric Trend Test & OLS Linear Regression with 95% Confidence Intervals`;

        return {
            location: `${location.name}, ${location.state}`,
            metric,
            unit,
            timeRange: { start: startDate, end: endDate },
            trendDirection,
            slopePerYear,
            percentageChange,
            baselineAverage,
            recentAverage,
            variabilityPercent,
            significance: {
                isSignificant: mkTest.isSignificant,
                significanceLevel: mkTest.significanceLevel,
                pValue: mkTest.pValue,
                mannKendallTau: mkTest.tau,
                mannKendallZ: mkTest.z,
                rSquared: regSignificance.rSquared,
                stdError: regSignificance.stdError,
                tStatistic: regSignificance.tStatistic,
                confidenceInterval95: [regSignificance.ci95Lower, regSignificance.ci95Upper],
                sampleSize: regSignificance.sampleSize,
                degreesOfFreedom: regSignificance.degreesOfFreedom,
                interpretation: mkTest.interpretation,
                label: mkTest.isSignificant ? 'Statistically Significant Trend' : 'Observed Trend (Not Statistically Significant)'
            },
            series,
            seasonalBreakdown,
            yearlyAverages,
            analyticalExplanation: explanation,
            provenance
        };
    }
}
