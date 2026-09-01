import { Router } from 'express';
import { EventReplayService, HISTORICAL_REPLAY_EVENTS } from '../services/eventReplayService.js';
const router = Router();
const replayService = new EventReplayService();
/**
 * GET /api/analytics/event-replay
 * Query params: event_id
 */
router.get('/', async (req, res) => {
    try {
        const { event_id } = req.query;
        const result = await replayService.getEventReplay(event_id);
        return res.json(result);
    }
    catch (error) {
        console.error('Error in /api/analytics/event-replay:', error);
        return res.status(500).json({ error: 'Failed to replay historical event', details: error.message });
    }
});
/**
 * GET /api/analytics/event-replay/list
 * Returns list of cataloged severe historical events
 */
router.get('/list', (_req, res) => {
    return res.json(HISTORICAL_REPLAY_EVENTS);
});
export default router;
