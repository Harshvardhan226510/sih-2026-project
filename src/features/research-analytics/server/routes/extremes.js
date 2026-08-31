import { Router } from 'express';
import { ExtremeEventService } from '../services/extremeService.js';
import { resolveLocation, validateDateRange } from '../utils/validation.js';
const router = Router();
const extremeService = new ExtremeEventService();
/**
 * GET /api/analytics/extremes
 * Query params: location, start_date, end_date
 */
router.get('/', async (req, res) => {
    try {
        const { location: locParam, start_date, end_date } = req.query;
        const location = resolveLocation(locParam);
        const { start, end } = validateDateRange(start_date, end_date);
        const result = await extremeService.detectExtremeEvents(location, start, end);
        return res.json(result);
    }
    catch (error) {
        console.error('Error in /api/analytics/extremes:', error);
        return res.status(500).json({ error: 'Failed to detect extreme events', details: error.message });
    }
});
export default router;
