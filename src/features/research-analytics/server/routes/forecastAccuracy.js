import { Router } from 'express';
import { ForecastAccuracyService } from '../services/forecastAccuracyService.js';
import { resolveLocation, validateMetric } from '../utils/validation.js';
const router = Router();
const forecastAccuracyService = new ForecastAccuracyService();
/**
 * GET /api/analytics/forecast-accuracy
 * Query params: location, metric, days
 */
router.get('/', async (req, res) => {
    try {
        const { location: locParam, metric: metricParam, days: daysParam } = req.query;
        const location = resolveLocation(locParam);
        const metric = validateMetric(metricParam || 'temperature');
        const days = daysParam ? parseInt(daysParam, 10) : 14;
        const result = await forecastAccuracyService.getForecastAccuracy(location, metric, days);
        return res.json(result);
    }
    catch (error) {
        console.error('Error in /api/analytics/forecast-accuracy:', error);
        return res.status(500).json({ error: 'Failed to verify forecast accuracy', details: error.message });
    }
});
export default router;
