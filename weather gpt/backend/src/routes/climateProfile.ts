import { Router, Request, Response } from 'express';
import { ClimateProfileService } from '../services/climateProfileService.js';
import { resolveLocation } from '../utils/validation.js';

const router = Router();
const climateProfileService = new ClimateProfileService();

/**
 * GET /api/analytics/climate-profile
 * Query params: location
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { location: locParam } = req.query;
    const location = resolveLocation(locParam as string);

    const result = await climateProfileService.getClimateProfile(location);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/analytics/climate-profile:', error);
    return res.status(500).json({ error: 'Failed to generate climate profile', details: error.message });
  }
});

export default router;
