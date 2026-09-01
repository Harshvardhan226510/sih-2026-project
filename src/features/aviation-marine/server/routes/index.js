import { Router } from 'express';
import { AviationService } from '../services/aviationService.js';
import { MarineService } from '../services/marineService.js';

const router = Router();
const aviationService = new AviationService();
const marineService = new MarineService();

// GET /api/aviation/live_by_departure?airport=VIDP
router.get('/aviation/live_by_departure', async (req, res) => {
  try {
    const airport = req.query.airport || 'VIDP';
    const flights = await aviationService.getLiveFlightsByDeparture(airport);
    res.json(flights);
  } catch (error) {
    console.error('Error in /api/aviation/live_by_departure:', error);
    res.status(500).json({ error: 'Failed to fetch live flight data.' });
  }
});

// GET /api/aviation/route?departure=VIDP&arrival=VABB
router.get('/aviation/route', async (req, res) => {
  try {
    const departure = req.query.departure || 'VIDP';
    const arrival = req.query.arrival || 'VABB';
    const routeData = await aviationService.getAviationRoute(departure, arrival);
    res.json(routeData);
  } catch (error) {
    console.error('Error in /api/aviation/route:', error);
    res.status(500).json({ error: 'Failed to fetch aviation route analysis.' });
  }
});

// GET /api/marine/route?start_lat=18.92&start_lon=72.83&end_lat=15.55&end_lon=73.75
router.get('/marine/route', async (req, res) => {
  try {
    const { start_lat, start_lon, end_lat, end_lon } = req.query;
    if (!start_lat || !start_lon || !end_lat || !end_lon) {
      return res.status(400).json({ error: 'Missing coordinates for marine route.' });
    }
    const marineData = await marineService.getMarineRoute(start_lat, start_lon, end_lat, end_lon);
    res.json(marineData);
  } catch (error) {
    console.error('Error in /api/marine/route:', error);
    res.status(500).json({ error: 'Failed to scan marine route.' });
  }
});

export default router;
