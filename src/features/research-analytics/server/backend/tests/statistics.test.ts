import { describe, it, expect } from 'vitest';
import { 
  mean, 
  median, 
  min, 
  max, 
  variance, 
  stdDev, 
  percentile, 
  calculateAnomaly, 
  calculateAnomalyPercentage, 
  calculateZScore, 
  linearRegression, 
  calculateMAE, 
  calculateRMSE, 
  calculateBias 
} from '../src/utils/statistics.js';

describe('Statistical & Analytical Engine Unit Tests', () => {
  it('calculates mean, min, max and median correctly', () => {
    const data = [10, 20, 30, 40, 50];
    expect(mean(data)).toBe(30);
    expect(min(data)).toBe(10);
    expect(max(data)).toBe(50);
    expect(median(data)).toBe(30);
  });

  it('calculates standard deviation and percentiles correctly', () => {
    const data = [10, 20, 30, 40, 50];
    expect(Number(stdDev(data).toFixed(2))).toBe(15.81);
    expect(percentile(data, 50)).toBe(30);
    expect(percentile(data, 0)).toBe(10);
    expect(percentile(data, 100)).toBe(50);
    expect(percentile(data, 75)).toBe(40);
  });

  it('computes exact weather anomaly and percentage anomaly with known values', () => {
    const baseline = 100;
    const observed = 150;

    const anomaly = calculateAnomaly(observed, baseline);
    const anomalyPct = calculateAnomalyPercentage(observed, baseline);

    expect(anomaly).toBe(50);
    expect(anomalyPct).toBe(50);
  });

  it('computes negative anomaly and negative percentage correctly', () => {
    const baseline = 80;
    const observed = 40;

    const anomaly = calculateAnomaly(observed, baseline);
    const anomalyPct = calculateAnomalyPercentage(observed, baseline);

    expect(anomaly).toBe(-40);
    expect(anomalyPct).toBe(-50);
  });

  it('calculates z-score correctly', () => {
    const value = 140;
    const baselineMean = 100;
    const baselineStd = 20;

    expect(calculateZScore(value, baselineMean, baselineStd)).toBe(2);
  });

  it('computes ordinary least squares linear regression slope and r-squared', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10]; // Perfect line y = 2x + 0
    const reg = linearRegression(x, y);

    expect(reg.slope).toBe(2);
    expect(reg.intercept).toBe(0);
    expect(reg.rSquared).toBe(1);
  });

  it('calculates MAE, RMSE, and Bias for forecast validation', () => {
    const actual = [20, 25, 30, 35];
    const forecast = [22, 24, 33, 33];
    // Errors: +2, -1, +3, -2
    // Absolute Errors: 2, 1, 3, 2 -> Mean = 8 / 4 = 2.0
    // Squared Errors: 4, 1, 9, 4 -> Mean = 18 / 4 = 4.5 -> Sqrt = 2.12
    // Bias: (2 - 1 + 3 - 2) / 4 = 2 / 4 = +0.5

    expect(calculateMAE(actual, forecast)).toBe(2.0);
    expect(calculateRMSE(actual, forecast)).toBe(2.12);
    expect(calculateBias(actual, forecast)).toBe(0.5);
  });
});
