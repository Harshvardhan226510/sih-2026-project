import { Router, Request, Response } from 'express';
import { ForecastAccuracyService } from '../services/forecastAccuracyService.js';
import { resolveLocation, validateMetric } from '../utils/validation.js';

const router = Router();
const forecastAccuracyService = new ForecastAccuracyService();

/**
 * GET /api/analytics/forecast-accuracy
 * Query params: location, metric, days
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { location: locParam, metric: metricParam, days: daysParam } = req.query;
    const location = resolveLocation(locParam as string);
    const metric = validateMetric(metricParam as string || 'temperature');
    const days = daysParam ? parseInt(daysParam as string, 10) : 14;

    const result = await forecastAccuracyService.getForecastAccuracy(location, metric, days);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/analytics/forecast-accuracy:', error);
    return res.status(500).json({ error: 'Failed to verify forecast accuracy', details: error.message });
  }
});

export default router;
