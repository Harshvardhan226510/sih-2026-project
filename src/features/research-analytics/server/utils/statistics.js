/**
 * Pure numerical and statistical calculation engine for WeatherGPT Research & Analytics.
 * All functions follow standard meteorological and statistical formulations.
 */

export function sum(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
}

export function mean(values) {
    if (!values || values.length === 0) return 0;
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (valid.length === 0) return 0;
    return sum(valid) / valid.length;
}

export function min(values) {
    if (!values || values.length === 0) return 0;
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (valid.length === 0) return 0;
    return Math.min(...valid);
}

export function max(values) {
    if (!values || values.length === 0) return 0;
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (valid.length === 0) return 0;
    return Math.max(...valid);
}

export function median(values) {
    if (!values || values.length === 0) return 0;
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (valid.length === 0) return 0;
    const mid = Math.floor(valid.length / 2);
    return valid.length % 2 !== 0 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
}

export function variance(values) {
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (valid.length < 2) return 0;
    const avg = mean(valid);
    const squareDiffs = valid.map(val => Math.pow(val - avg, 2));
    return sum(squareDiffs) / (valid.length - 1); // Sample variance
}

export function stdDev(values) {
    return Math.sqrt(variance(values));
}

export function percentile(values, p) {
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (valid.length === 0) return 0;
    if (p <= 0) return valid[0];
    if (p >= 100) return valid[valid.length - 1];
    const index = (p / 100) * (valid.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper) return valid[lower];
    return valid[lower] * (1 - weight) + valid[upper] * weight;
}

export function percentileRank(values, targetValue) {
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (valid.length === 0) return 0;
    let countBelow = 0;
    let countEqual = 0;
    for (const v of valid) {
        if (v < targetValue) countBelow++;
        else if (v === targetValue) countEqual++;
    }
    const rank = ((countBelow + 0.5 * countEqual) / valid.length) * 100;
    return Number(rank.toFixed(1));
}

export function distributionStats(values) {
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (valid.length === 0) {
        return { min: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0, iqr: 0, mean: 0, stdDev: 0, skewness: 0 };
    }
    const sorted = [...valid].sort((a, b) => a - b);
    const p10Val = Number(percentile(sorted, 10).toFixed(2));
    const p25Val = Number(percentile(sorted, 25).toFixed(2));
    const medVal = Number(median(sorted).toFixed(2));
    const p75Val = Number(percentile(sorted, 75).toFixed(2));
    const p90Val = Number(percentile(sorted, 90).toFixed(2));
    const minVal = Number(min(sorted).toFixed(2));
    const maxVal = Number(max(sorted).toFixed(2));
    const iqrVal = Number((p75Val - p25Val).toFixed(2));
    const meanVal = Number(mean(sorted).toFixed(2));
    const sDev = Number(stdDev(sorted).toFixed(2));

    // Fisher-Pearson coefficient of skewness
    let skew = 0;
    if (valid.length >= 3 && sDev > 0) {
        const m3 = sum(valid.map(x => Math.pow(x - meanVal, 3))) / valid.length;
        skew = Number((m3 / Math.pow(sDev, 3)).toFixed(3));
    }

    return {
        min: minVal,
        p10: p10Val,
        p25: p25Val,
        median: medVal,
        p75: p75Val,
        p90: p90Val,
        max: maxVal,
        iqr: iqrVal,
        mean: meanVal,
        stdDev: sDev,
        skewness: skew
    };
}

export function coefficientOfVariation(values) {
    const avg = mean(values);
    if (avg === 0) return 0;
    return (stdDev(values) / Math.abs(avg)) * 100;
}

/**
 * Anomaly = Observed - Historical Baseline
 */
export function calculateAnomaly(observed, baseline) {
    return Number((observed - baseline).toFixed(2));
}

/**
 * Percentage Anomaly = ((Observed - Baseline) / Baseline) * 100
 * Handles division by zero gracefully for precipitation/temperature
 */
export function calculateAnomalyPercentage(observed, baseline) {
    if (baseline === 0) {
        return observed === 0 ? 0 : observed > 0 ? 100 : -100;
    }
    return Number((((observed - baseline) / Math.abs(baseline)) * 100).toFixed(2));
}

/**
 * Z-score = (Value - Mean) / StdDev
 */
export function calculateZScore(value, baselineMean, baselineStdDev) {
    if (baselineStdDev === 0) return 0;
    return Number(((value - baselineMean) / baselineStdDev).toFixed(2));
}

/**
 * Simple Moving Average
 */
export function movingAverage(values, windowSize) {
    if (windowSize <= 0) return values;
    const result = [];
    for (let i = 0; i < values.length; i++) {
        if (i < windowSize - 1) {
            result.push(null);
        } else {
            const windowSlice = values.slice(i - windowSize + 1, i + 1);
            result.push(Number(mean(windowSlice).toFixed(2)));
        }
    }
    return result;
}

/**
 * Error function approximation for normal cumulative distribution
 */
function erf(x) {
    // Abramowitz and Stegun approximation 7.1.26
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
}

function normalCdf(z) {
    return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * Mann-Kendall Non-Parametric Trend Test
 * Tests for monotonic trend without assuming normal distribution.
 */
export function mannKendallTest(series) {
    const valid = series.filter(v => typeof v === 'number' && !isNaN(v));
    const n = valid.length;
    if (n < 4) {
        return {
            tau: 0,
            s: 0,
            varS: 0,
            z: 0,
            pValue: 1.0,
            isSignificant: false,
            significanceLevel: 'INSUFFICIENT_DATA',
            interpretation: 'Sample size is too small (N < 4) for a reliable Mann-Kendall trend significance test.'
        };
    }

    let s = 0;
    const tieMap = new Map();
    for (let k = 0; k < n - 1; k++) {
        const valK = valid[k];
        tieMap.set(valK, (tieMap.get(valK) || 0) + 1);
        for (let j = k + 1; j < n; j++) {
            const diff = valid[j] - valid[k];
            if (diff > 0) s += 1;
            else if (diff < 0) s -= 1;
        }
    }
    // Add last element for ties count
    const lastVal = valid[n - 1];
    tieMap.set(lastVal, (tieMap.get(lastVal) || 0) + 1);

    // Variance calculation with tie adjustment
    let tieAdjustment = 0;
    for (const count of tieMap.values()) {
        if (count > 1) {
            tieAdjustment += count * (count - 1) * (2 * count + 5);
        }
    }

    const varS = (n * (n - 1) * (2 * n + 5) - tieAdjustment) / 18;
    let z = 0;
    if (varS > 0) {
        if (s > 0) z = (s - 1) / Math.sqrt(varS);
        else if (s < 0) z = (s + 1) / Math.sqrt(varS);
    }

    // Two-tailed p-value
    const pValue = Number((2 * (1 - normalCdf(Math.abs(z)))).toFixed(4));
    const tau = Number((s / (0.5 * n * (n - 1))).toFixed(4));
    const isSignificant = pValue < 0.05;

    let significanceLevel = 'NOT_SIGNIFICANT';
    if (pValue < 0.001) significanceLevel = 'HIGHLY_SIGNIFICANT (p < 0.001)';
    else if (pValue < 0.01) significanceLevel = 'VERY_SIGNIFICANT (p < 0.01)';
    else if (pValue < 0.05) significanceLevel = 'SIGNIFICANT (p < 0.05)';

    const interpretation = isSignificant
        ? `Statistically significant ${s > 0 ? 'upward' : 'downward'} trend detected (Mann-Kendall Tau = ${tau}, Z = ${z.toFixed(2)}, p = ${pValue}).`
        : `No statistically significant monotonic trend detected at alpha = 0.05 (Mann-Kendall Tau = ${tau}, p = ${pValue}).`;

    return {
        tau,
        s,
        varS: Number(varS.toFixed(2)),
        z: Number(z.toFixed(2)),
        pValue,
        isSignificant,
        significanceLevel,
        interpretation
    };
}

/**
 * Ordinary Least Squares Linear Regression with Statistical Significance (t-test & 95% CI)
 */
export function linearRegression(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) {
        return { slope: 0, intercept: y[0] || 0, rSquared: 0 };
    }
    const xMean = mean(x.slice(0, n));
    const yMean = mean(y.slice(0, n));
    let numerator = 0;
    let denominator = 0;
    let ssTotal = 0;
    for (let i = 0; i < n; i++) {
        const xDiff = x[i] - xMean;
        const yDiff = y[i] - yMean;
        numerator += xDiff * yDiff;
        denominator += xDiff * xDiff;
        ssTotal += yDiff * yDiff;
    }
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;
    let ssResidual = 0;
    for (let i = 0; i < n; i++) {
        const yPred = slope * x[i] + intercept;
        ssResidual += Math.pow(y[i] - yPred, 2);
    }
    const rSquared = ssTotal === 0 ? 1 : Math.max(0, 1 - ssResidual / ssTotal);
    return {
        slope: Number(slope.toFixed(4)),
        intercept: Number(intercept.toFixed(4)),
        rSquared: Number(rSquared.toFixed(4)),
    };
}

export function linearRegressionWithSignificance(x, y) {
    const base = linearRegression(x, y);
    const n = Math.min(x.length, y.length);
    if (n <= 2) {
        return {
            ...base,
            stdError: 0,
            tStatistic: 0,
            pValue: 1.0,
            ci95Lower: base.slope,
            ci95Upper: base.slope,
            isSignificant: false,
            sampleSize: n,
            degreesOfFreedom: 0
        };
    }

    const df = n - 2;
    const xMean = mean(x.slice(0, n));
    let ssX = 0;
    let ssResidual = 0;
    for (let i = 0; i < n; i++) {
        const xDiff = x[i] - xMean;
        ssX += xDiff * xDiff;
        const yPred = base.slope * x[i] + base.intercept;
        ssResidual += Math.pow(y[i] - yPred, 2);
    }

    const residualVariance = ssResidual / df;
    const stdError = ssX > 0 ? Math.sqrt(residualVariance / ssX) : 0;
    const tStatistic = stdError > 0 ? base.slope / stdError : 0;

    // Approximate t-distribution p-value via normal distribution for df >= 10, or t-approx
    const zApprox = Math.abs(tStatistic);
    const pValue = Number((2 * (1 - normalCdf(zApprox))).toFixed(4));

    // t_critical for 95% CI (approx 1.96 to 2.1 depending on df)
    const tCrit = df >= 30 ? 1.96 : df >= 10 ? 2.05 : 2.23;
    const margin = Number((tCrit * stdError).toFixed(4));
    const ci95Lower = Number((base.slope - margin).toFixed(4));
    const ci95Upper = Number((base.slope + margin).toFixed(4));
    const isSignificant = pValue < 0.05;

    return {
        ...base,
        stdError: Number(stdError.toFixed(4)),
        tStatistic: Number(tStatistic.toFixed(2)),
        pValue,
        ci95Lower,
        ci95Upper,
        isSignificant,
        sampleSize: n,
        degreesOfFreedom: df
    };
}

/**
 * Historical Event Intervals Calculation
 */
export function calculateEventIntervals(eventDates) {
    if (!eventDates || eventDates.length <= 1) {
        return {
            totalEvents: eventDates ? eventDates.length : 0,
            averageIntervalDays: null,
            averageIntervalYears: null,
            minIntervalDays: null,
            maxIntervalDays: null,
            shortestInterval: null,
            longestInterval: null,
            intervals: []
        };
    }

    // Sort ascending
    const sortedDates = [...eventDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const intervals = [];
    for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]).getTime();
        const curr = new Date(sortedDates[i]).getTime();
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        intervals.push({
            from: sortedDates[i - 1],
            to: sortedDates[i],
            days: diffDays,
            years: Number((diffDays / 365.25).toFixed(2))
        });
    }

    const dayValues = intervals.map(int => int.days);
    const avgDays = Number(mean(dayValues).toFixed(1));
    const minDays = min(dayValues);
    const maxDays = max(dayValues);
    const shortest = intervals.find(i => i.days === minDays);
    const longest = intervals.find(i => i.days === maxDays);

    return {
        totalEvents: sortedDates.length,
        averageIntervalDays: avgDays,
        averageIntervalYears: Number((avgDays / 365.25).toFixed(2)),
        minIntervalDays: minDays,
        maxIntervalDays: maxDays,
        shortestInterval: shortest ? `${shortest.from} to ${shortest.to} (${shortest.days} days)` : null,
        longestInterval: longest ? `${longest.from} to ${longest.to} (${longest.days} days)` : null,
        intervals
    };
}

/**
 * Tukey IQR Outlier Detection
 */
export function detectIqrOutliers(items, valueExtractor) {
    if (!items || items.length < 4) return [];
    const values = items.map(valueExtractor).filter(v => typeof v === 'number' && !isNaN(v));
    const stats = distributionStats(values);
    const lowerThreshold = stats.p25 - 1.5 * stats.iqr;
    const upperThreshold = stats.p75 + 1.5 * stats.iqr;

    const outliers = [];
    items.forEach((item, idx) => {
        const val = valueExtractor(item);
        if (val < lowerThreshold || val > upperThreshold) {
            outliers.push({
                index: idx,
                item,
                value: val,
                type: val > upperThreshold ? 'HIGH_OUTLIER' : 'LOW_OUTLIER',
                deviation: Number((val > upperThreshold ? val - upperThreshold : lowerThreshold - val).toFixed(2)),
                lowerThreshold: Number(lowerThreshold.toFixed(2)),
                upperThreshold: Number(upperThreshold.toFixed(2))
            });
        }
    });
    return outliers;
}

export function calculateMAE(actual, forecast) {
    const n = Math.min(actual.length, forecast.length);
    if (n === 0) return 0;
    let sumAbsErr = 0;
    for (let i = 0; i < n; i++) {
        sumAbsErr += Math.abs(forecast[i] - actual[i]);
    }
    return Number((sumAbsErr / n).toFixed(2));
}

export function calculateRMSE(actual, forecast) {
    const n = Math.min(actual.length, forecast.length);
    if (n === 0) return 0;
    let sumSqErr = 0;
    for (let i = 0; i < n; i++) {
        sumSqErr += Math.pow(forecast[i] - actual[i], 2);
    }
    return Number(Math.sqrt(sumSqErr / n).toFixed(2));
}

export function calculateBias(actual, forecast) {
    const n = Math.min(actual.length, forecast.length);
    if (n === 0) return 0;
    let sumErr = 0;
    for (let i = 0; i < n; i++) {
        sumErr += (forecast[i] - actual[i]);
    }
    return Number((sumErr / n).toFixed(2));
}

export function calculateMAPE(actual, forecast) {
    const n = Math.min(actual.length, forecast.length);
    if (n === 0) return 0;
    let validCount = 0;
    let sumPctErr = 0;
    for (let i = 0; i < n; i++) {
        if (actual[i] !== 0) {
            sumPctErr += Math.abs((forecast[i] - actual[i]) / actual[i]) * 100;
            validCount++;
        }
    }
    return validCount === 0 ? 0 : Number((sumPctErr / validCount).toFixed(2));
}
