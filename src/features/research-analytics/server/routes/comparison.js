import { Router } from 'express';
import { ComparisonService } from '../services/comparisonService.js';
import { resolveLocation, validateDateRange, validateMetric } from '../utils/validation.js';
const router = Router();
const comparisonService = new ComparisonService();
/**
 * GET /api/analytics/compare
 * Query params:
 * - location: string (Location A, e.g. Pune)
 * - comparison_location: string (Location B, e.g. Mumbai)
 * - start_date: string (YYYY-MM-DD)
 * - end_date: string (YYYY-MM-DD)
 * - metric: string (rainfall, temperature, etc.)
 */
router.get('/', async (req, res) => {
    try {
        const { location: locAParam, comparison_location: locBParam, start_date, end_date, metric: metricParam } = req.query;
        const locA = resolveLocation(locAParam || 'pune');
        const locB = resolveLocation(locBParam || 'mumbai');
        const { start, end } = validateDateRange(start_date, end_date);
        const metric = validateMetric(metricParam);
        const result = await comparisonService.compareLocations(locA, locB, start, end, metric);
        return res.json(result);
    }
    catch (error) {
        console.error('Error in /api/analytics/compare:', error);
        return res.status(500).json({ error: 'Failed to compute location comparison', details: error.message });
    }
});
export default router;
