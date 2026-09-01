import { Router, Request, Response } from 'express';
import { AnomalyService } from '../services/anomalyService.js';
import { resolveLocation, validateDateRange, validateMetric } from '../utils/validation.js';

const router = Router();
const anomalyService = new AnomalyService();

/**
 * GET /api/analytics/anomaly
 * Query params:
 * - location: string
 * - start_date: string (target period start)
 * - end_date: string (target period end)
 * - baseline_start: string (optional)
 * - baseline_end: string (optional)
 * - metric: string
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      location: locParam, 
      start_date, 
      end_date, 
      baseline_start, 
      baseline_end, 
      metric: metricParam 
    } = req.query;

    const location = resolveLocation(locParam as string);
    const { start, end } = validateDateRange(start_date as string, end_date as string);
    const metric = validateMetric(metricParam as string);

    const result = await anomalyService.getAnomalyAnalytics(
      location,
      start,
      end,
      baseline_start as string | undefined,
      baseline_end as string | undefined,
      metric
    );

    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/analytics/anomaly:', error);
    return res.status(500).json({ error: 'Failed to compute anomaly analytics', details: error.message });
  }
});

export default router;
