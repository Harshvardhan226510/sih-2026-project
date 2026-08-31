import { Router, Request, Response } from 'express';
import { ExtremeEventService } from '../services/extremeService.js';
import { resolveLocation, validateDateRange } from '../utils/validation.js';

const router = Router();
const extremeService = new ExtremeEventService();

/**
 * GET /api/analytics/extremes
 * Query params: location, start_date, end_date
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { location: locParam, start_date, end_date } = req.query;
    const location = resolveLocation(locParam as string);
    const { start, end } = validateDateRange(start_date as string, end_date as string);

    const result = await extremeService.detectExtremeEvents(location, start, end);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/analytics/extremes:', error);
    return res.status(500).json({ error: 'Failed to detect extreme events', details: error.message });
  }
});

export default router;
