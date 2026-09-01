import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { 
    mean, 
    sum, 
    stdDev, 
    percentile, 
    calculateAnomaly, 
    calculateAnomalyPercentage, 
    calculateZScore,
    distributionStats,
    detectIqrOutliers 
} from '../utils/statistics.js';

export class AnomalyService {
    adapter;
    constructor(adapter) {
        this.adapter = adapter || new OpenMeteoAdapter();
    }

    classifyAnomaly(anomalyPct) {
        if (anomalyPct >= 60) {
            return { classification: 'EXTREME_ANOMALY', badge: `+${anomalyPct.toFixed(1)}% EXTREME ANOMALY`, severity: 'EXTREME' };
        }
        if (anomalyPct >= 25) {
            return { classification: 'HIGH_ANOMALY', badge: `+${anomalyPct.toFixed(1)}% HIGH ANOMALY`, severity: 'HIGH' };
        }
        if (anomalyPct >= 10) {
            return { classification: 'ABOVE_NORMAL', badge: `+${anomalyPct.toFixed(1)}% ABOVE NORMAL`, severity: 'MODERATE' };
        }
        if (anomalyPct <= -60) {
            return { classification: 'EXTREME_NEGATIVE', badge: `${anomalyPct.toFixed(1)}% EXTREME DEFICIT`, severity: 'EXTREME' };
        }
        if (anomalyPct <= -25) {
            return { classification: 'HIGH_NEGATIVE', badge: `${anomalyPct.toFixed(1)}% HIGH DEFICIT`, severity: 'HIGH' };
        }
        if (anomalyPct <= -10) {
            return { classification: 'BELOW_NORMAL', badge: `${anomalyPct.toFixed(1)}% BELOW NORMAL`, severity: 'MODERATE' };
        }
        return { classification: 'NORMAL', badge: `${anomalyPct >= 0 ? '+' : ''}${anomalyPct.toFixed(1)}% NORMAL`, severity: 'NORMAL' };
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

    /**
     * Comprehensive Anomaly Analytics with Automatic Anomaly Detection & Baseline Normalization
     */
    async getAnomalyAnalytics(location, targetStartDate, targetEndDate, baselineStartDate, baselineEndDate, metric = 'rainfall', methodology = 'zscore') {
        const targetStartYear = new Date(targetStartDate).getFullYear();
        // Default to standard 1991-2020 baseline if within range or prior 10-year window
        const baseStart = baselineStartDate || `${Math.max(1991, targetStartYear - 10)}-01-01`;
        const baseEnd = baselineEndDate || `${Math.min(2020, targetStartYear - 1)}-12-31`;

        // Fetch baseline & target historical records concurrently
        const [baseRes, targetRes] = await Promise.all([
            this.adapter.fetchHistoricalRecords(location, baseStart, baseEnd),
            this.adapter.fetchHistoricalRecords(location, targetStartDate, targetEndDate)
        ]);

        const baselineRecords = baseRes.records;
        const targetRecords = targetRes.records;
        const isSumMetric = metric === 'rainfall';
        const unit = this.getMetricUnit(metric);

        // Group baseline records by day-of-year (MM-DD)
        const baselineDailyMap = new Map();
        baselineRecords.forEach(r => {
            const mmdd = r.date.substring(5); // "07-15"
            if (!baselineDailyMap.has(mmdd)) baselineDailyMap.set(mmdd, []);
            baselineDailyMap.get(mmdd).push(this.extractMetricValue(r, metric));
        });

        const baselineAllVals = baselineRecords.map(r => this.extractMetricValue(r, metric));
        const targetVals = targetRecords.map(r => this.extractMetricValue(r, metric));

        const observedValue = Number((isSumMetric ? sum(targetVals) : mean(targetVals)).toFixed(2));
        const baselineDailyMean = mean(baselineAllVals);
        const historicalBaseline = Number((isSumMetric ? (baselineDailyMean * targetRecords.length) : baselineDailyMean).toFixed(2));

        const anomaly = calculateAnomaly(observedValue, historicalBaseline);
        const anomalyPercentage = calculateAnomalyPercentage(observedValue, historicalBaseline);
        const baselineStd = stdDev(baselineAllVals) || 1;
        const zScore = calculateZScore(observedValue, historicalBaseline, baselineStd);

        const { classification, badge, severity } = this.classifyAnomaly(anomalyPercentage);

        // Daily time-series with day-by-day anomalies
        const timeSeries = targetRecords.map(tr => {
            const mmdd = tr.date.substring(5);
            const histDayVals = baselineDailyMap.get(mmdd) || [baselineDailyMean];
            const histNormal = Number(mean(histDayVals).toFixed(2));
            const obs = this.extractMetricValue(tr, metric);
            const dayAnom = calculateAnomaly(obs, histNormal);
            const dayAnomPct = calculateAnomalyPercentage(obs, histNormal);
            const dayZ = calculateZScore(obs, histNormal, stdDev(histDayVals) || baselineStd);

            return {
                date: tr.date,
                observed: obs,
                historicalBaseline: histNormal,
                anomaly: dayAnom,
                anomalyPercent: dayAnomPct,
                zScore: dayZ
            };
        });

        // 4. Automatic Anomaly Detection Engine (Deterministic Statistical Rules)
        const targetDist = distributionStats(targetVals);
        const detectedAnomalies = [];

        // Method 1: Z-Score (|Z| >= 2.0 standard deviations from climatological mean)
        // Method 2: Tukey IQR Rule (Observations outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR])
        timeSeries.forEach((pt, idx) => {
            const isZScoreAnomaly = Math.abs(pt.zScore) >= 2.0;
            const isIqrHighAnomaly = pt.observed > (targetDist.p75 + 1.5 * targetDist.iqr);
            const isIqrLowAnomaly = pt.observed < (targetDist.p25 - 1.5 * targetDist.iqr);

            if (isZScoreAnomaly || isIqrHighAnomaly || isIqrLowAnomaly) {
                const methodUsed = isZScoreAnomaly && (isIqrHighAnomaly || isIqrLowAnomaly)
                    ? 'Dual-Criterion (Z-Score ≥ 2.0σ & Tukey 1.5×IQR Outlier)'
                    : isZScoreAnomaly
                    ? `Z-Score Deviation (|Z| = ${Math.abs(pt.zScore)} ≥ 2.0σ)`
                    : `Tukey IQR Bound (${pt.observed > targetDist.p75 ? `>${(targetDist.p75 + 1.5 * targetDist.iqr).toFixed(1)}` : `<${(targetDist.p25 - 1.5 * targetDist.iqr).toFixed(1)}`})`;

                detectedAnomalies.push({
                    id: `ANOM-${idx}-${pt.date}`,
                    date: pt.date,
                    observedValue: pt.observed,
                    baselineReference: pt.historicalBaseline,
                    anomalyMagnitude: pt.anomaly,
                    anomalyPercentage: pt.anomalyPercent,
                    zScore: pt.zScore,
                    unit,
                    direction: pt.anomaly >= 0 ? 'POSITIVE' : 'NEGATIVE',
                    severity: Math.abs(pt.zScore) >= 3.0 ? 'EXTREME' : Math.abs(pt.zScore) >= 2.0 ? 'HIGH' : 'MODERATE',
                    methodology: methodUsed,
                    description: `Observation of ${pt.observed} ${unit} departs from normal (${pt.historicalBaseline} ${unit}) by ${pt.anomaly > 0 ? '+' : ''}${pt.anomaly} ${unit} (Z=${pt.zScore}).`
                });
            }
        });

        // Sort detected anomalies by absolute magnitude descending
        detectedAnomalies.sort((a, b) => Math.abs(b.anomalyMagnitude) - Math.abs(a.anomalyMagnitude));

        const metricTitle = metric.charAt(0).toUpperCase() + metric.slice(1);
        const directionWord = anomaly >= 0 ? 'above' : 'below';
        const explanation = `${metricTitle} observation (${observedValue} ${unit}) is ${Math.abs(anomalyPercentage)}% ${directionWord} the historical climatological baseline (${historicalBaseline} ${unit}) for ${location.name} (${targetStartDate} to ${targetEndDate}). ` +
            `Statistical departure is ${anomaly > 0 ? '+' : ''}${anomaly} ${unit} (Z-score: ${zScore}), classified as "${classification.replace(/_/g, ' ')}". ` +
            `Automatic detection identified ${detectedAnomalies.length} significant day-level anomalies in this period.`;

        const isClimatologicalBaseline = baseStart.startsWith('1991') && baseEnd.startsWith('2020');

        return {
            location: `${location.name}, ${location.state}`,
            metric,
            unit,
            targetPeriod: { start: targetStartDate, end: targetEndDate },
            baselinePeriod: { 
                start: baseStart, 
                end: baseEnd,
                isWMOStandardBaseline: isClimatologicalBaseline,
                baselineLabel: isClimatologicalBaseline ? 'WMO Standard 1991–2020 Climatological Baseline' : `Historical Window (${baseStart} to ${baseEnd})`
            },
            historicalBaseline,
            observedValue,
            anomaly,
            anomalyPercentage,
            zScore,
            classification,
            badgeLabel: badge,
            severity,
            distribution: targetDist,
            detectedAnomaliesCount: detectedAnomalies.length,
            detectedAnomaliesSummary: `${detectedAnomalies.length} significant ${metric} anomalies detected in evaluation window.`,
            detectedAnomalies,
            timeSeries,
            explanation,
            provenance: {
                ...targetRes.provenance,
                calculationMethod: `Climatological Baseline Normalization (${baseStart} to ${baseEnd}) & Deterministic Z-score / IQR Outlier Extraction`
            }
        };
    }
}
