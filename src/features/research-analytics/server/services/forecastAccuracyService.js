import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { calculateMAE, calculateRMSE, calculateBias, calculateMAPE } from '../utils/statistics.js';
export class ForecastAccuracyService {
    adapter;
    constructor(adapter) {
        this.adapter = adapter || new OpenMeteoAdapter();
    }
    async getForecastAccuracy(location, metric = 'temperature', days = 14) {
        const { pairs, provenance } = await this.adapter.fetchForecastComparison(location, days);
        if (pairs.length === 0) {
            throw new Error('No paired forecast observations available.');
        }
        const actuals = pairs.map(p => p.actual);
        const forecasts = pairs.map(p => p.forecast);
        const maeVal = calculateMAE(actuals, forecasts);
        const rmseVal = calculateRMSE(actuals, forecasts);
        const biasVal = calculateBias(actuals, forecasts);
        const mapeVal = calculateMAPE(actuals, forecasts);
        // Hit rate: Forecast within tolerance (e.g. within 2.0°C of actual)
        const hits = pairs.filter(p => Math.abs(p.forecast - p.actual) <= 2.0).length;
        const hitRatePct = Number(((hits / pairs.length) * 100).toFixed(1));
        const comparisonSeries = pairs.map(p => {
            const err = Number((p.forecast - p.actual).toFixed(2));
            return {
                date: p.date,
                forecast: p.forecast,
                actual: p.actual,
                error: err,
                absoluteError: Math.abs(err)
            };
        });
        const unit = metric === 'temperature' ? '°C' : 'mm';
        const biasDescriptor = biasVal > 0.2 ? 'slight over-forecasting bias' : biasVal < -0.2 ? 'slight under-forecasting bias' : 'neutral bias';
        const interpretation = `NWP Model Forecast Verification for ${location.name} across ${pairs.length} operational lead-days: ` +
            `Mean Absolute Error (MAE) is ${maeVal} ${unit}, RMSE is ${rmseVal} ${unit}, with a ${biasDescriptor} of ${biasVal > 0 ? '+' : ''}${biasVal} ${unit}. ` +
            `Operational forecast hit rate within ±2.0 ${unit} tolerance is ${hitRatePct}%.`;
        provenance.calculationMethod = 'Standard WMO Lead-Day Synoptic Verification Matrix (MAE / RMSE / Mean Bias)';
        return {
            location: `${location.name}, ${location.state}`,
            parameter: metric,
            timeRange: { start: pairs[0]?.date || '', end: pairs[pairs.length - 1]?.date || '' },
            sampleSize: pairs.length,
            metrics: {
                mae: maeVal,
                rmse: rmseVal,
                bias: biasVal,
                mape: mapeVal,
                forecastHitRatePct: hitRatePct
            },
            comparisonSeries,
            interpretation,
            provenance
        };
    }
}
