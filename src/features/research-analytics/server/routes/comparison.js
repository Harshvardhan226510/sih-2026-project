import { Router } from 'express';
import { ComparisonService } from '../services/comparisonService.js';
import { resolveLocation, validateDateRange, validateMetric, validateAggregation } from '../utils/validation.js';

const router = Router();
const comparisonService = new ComparisonService();

/**
 * GET /api/analytics/compare
 * Query params:
 * - mode: 'locations' (default) | 'periods'
 * - location: Primary location (string or JSON)
 * - comparison_location: Location B (string or JSON)
 * - locations: JSON array of 2-4 location objects or comma-separated names
 * - start_date, end_date: Target period (YYYY-MM-DD)
 * - period_a_start, period_a_end, period_b_start, period_b_end: For mode='periods'
 * - metric: rainfall | temperature | etc.
 * - aggregation: daily | monthly | yearly
 */
router.get('/', async (req, res) => {
    try {
        const { 
            mode,
            location: locParam, 
            comparison_location: locBParam, 
            locations: locationsParam,
            start_date, 
            end_date, 
            period_a_start,
            period_a_end,
            period_b_start,
            period_b_end,
            metric: metricParam,
            aggregation: aggParam
        } = req.query;

        const metric = validateMetric(metricParam);
        const aggregation = validateAggregation(aggParam);

        // Period-vs-Period comparison
        if (mode === 'periods' || (period_a_start && period_b_start)) {
            const loc = resolveLocation(locParam || 'pune');
            const rangeA = validateDateRange(period_a_start || '1990-01-01', period_a_end || '2000-12-31');
            const rangeB = validateDateRange(period_b_start || '2015-01-01', period_b_end || '2024-12-31');
            const result = await comparisonService.comparePeriods(loc, rangeA, rangeB, metric);
            return res.json(result);
        }

        // Multi-location comparison (2 to 4 locations)
        let resolvedLocations = [];
        if (locationsParam) {
            try {
                const parsed = typeof locationsParam === 'string' ? JSON.parse(locationsParam) : locationsParam;
                if (Array.isArray(parsed)) {
                    resolvedLocations = parsed.map(item => {
                        const str = typeof item === 'string' ? item : JSON.stringify(item);
                        return resolveLocation(str);
                    });
                }
            } catch (e) {
                // If not JSON, check comma separated
                if (typeof locationsParam === 'string' && locationsParam.includes(',')) {
                    resolvedLocations = locationsParam.split(',').map(s => resolveLocation(s.trim()));
                }
            }
        }

        if (resolvedLocations.length < 2) {
            const locA = resolveLocation(locParam || 'pune');
            const locB = resolveLocation(locBParam || 'mumbai');
            resolvedLocations = [locA, locB];
        }

        const { start, end } = validateDateRange(start_date, end_date);
        const result = await comparisonService.compareMultipleLocations(resolvedLocations, start, end, metric, aggregation);
        return res.json(result);
    } catch (error) {
        console.error('Error in /api/analytics/compare:', error);
        return res.status(500).json({ error: 'Failed to compute comparison', details: error.message });
    }
});

export default router;
