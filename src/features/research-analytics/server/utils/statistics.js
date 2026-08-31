/**
 * Pure numerical and statistical calculation engine for WeatherGPT Research & Analytics.
 * All functions follow standard meteorological and statistical formulations.
 */
export function sum(values) {
    if (!values || values.length === 0)
        return 0;
    return values.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
}
export function mean(values) {
    if (!values || values.length === 0)
        return 0;
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (valid.length === 0)
        return 0;
    return sum(valid) / valid.length;
}
export function min(values) {
    if (!values || values.length === 0)
        return 0;
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (valid.length === 0)
        return 0;
    return Math.min(...valid);
}
export function max(values) {
    if (!values || values.length === 0)
        return 0;
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (valid.length === 0)
        return 0;
    return Math.max(...valid);
}
export function median(values) {
    if (!values || values.length === 0)
        return 0;
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (valid.length === 0)
        return 0;
    const mid = Math.floor(valid.length / 2);
    return valid.length % 2 !== 0 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
}
export function variance(values) {
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (valid.length < 2)
        return 0;
    const avg = mean(valid);
    const squareDiffs = valid.map(val => Math.pow(val - avg, 2));
    return sum(squareDiffs) / (valid.length - 1); // Sample variance
}
export function stdDev(values) {
    return Math.sqrt(variance(values));
}
export function percentile(values, p) {
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (valid.length === 0)
        return 0;
    if (p <= 0)
        return valid[0];
    if (p >= 100)
        return valid[valid.length - 1];
    const index = (p / 100) * (valid.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper)
        return valid[lower];
    return valid[lower] * (1 - weight) + valid[upper] * weight;
}
export function coefficientOfVariation(values) {
    const avg = mean(values);
    if (avg === 0)
        return 0;
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
    if (baselineStdDev === 0)
        return 0;
    return Number(((value - baselineMean) / baselineStdDev).toFixed(2));
}
/**
 * Simple Moving Average
 */
export function movingAverage(values, windowSize) {
    if (windowSize <= 0)
        return values;
    const result = [];
    for (let i = 0; i < values.length; i++) {
        if (i < windowSize - 1) {
            result.push(null);
        }
        else {
            const windowSlice = values.slice(i - windowSize + 1, i + 1);
            result.push(Number(mean(windowSlice).toFixed(2)));
        }
    }
    return result;
}
/**
 * Ordinary Least Squares Linear Regression
 * y = slope * x + intercept
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
/**
 * Mean Absolute Error (MAE)
 */
export function calculateMAE(actual, forecast) {
    const n = Math.min(actual.length, forecast.length);
    if (n === 0)
        return 0;
    let sumAbsErr = 0;
    for (let i = 0; i < n; i++) {
        sumAbsErr += Math.abs(forecast[i] - actual[i]);
    }
    return Number((sumAbsErr / n).toFixed(2));
}
/**
 * Root Mean Square Error (RMSE)
 */
export function calculateRMSE(actual, forecast) {
    const n = Math.min(actual.length, forecast.length);
    if (n === 0)
        return 0;
    let sumSqErr = 0;
    for (let i = 0; i < n; i++) {
        sumSqErr += Math.pow(forecast[i] - actual[i], 2);
    }
    return Number(Math.sqrt(sumSqErr / n).toFixed(2));
}
/**
 * Forecast Bias = Mean(Forecast - Actual)
 * Positive bias indicates over-forecasting, negative indicates under-forecasting.
 */
export function calculateBias(actual, forecast) {
    const n = Math.min(actual.length, forecast.length);
    if (n === 0)
        return 0;
    let sumErr = 0;
    for (let i = 0; i < n; i++) {
        sumErr += (forecast[i] - actual[i]);
    }
    return Number((sumErr / n).toFixed(2));
}
/**
 * Mean Absolute Percentage Error (MAPE)
 */
export function calculateMAPE(actual, forecast) {
    const n = Math.min(actual.length, forecast.length);
    if (n === 0)
        return 0;
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
