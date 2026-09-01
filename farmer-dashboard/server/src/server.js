import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { requireUser, errors } from './middleware.js';
import { fetchWeather, searchLocations } from './weatherService.js';
import { generateAdvisory } from './advisoryRules.js';
import { addCrop, listCrops, removeCrop, updateCrop } from './farmerRepository.js';
import { readFreshWeather, writeWeather } from './weatherCacheRepository.js';

export const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '32kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', mode: config.demoMode ? 'demo' : 'configured' }));

app.get('/api/farmer/locations/search', requireUser, async (req, res, next) => {
  try { const query = String(req.query.q || '').trim(); if (query.length < 2) return res.status(400).json({ error: 'q must contain at least two characters.' }); res.json({ locations: await searchLocations(query) }); } catch (error) { next(error); }
});

// User-provided Geocoding Endpoint
app.get('/api/search-city', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ error: 'City name is required' });
  }
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=5&language=en&format=json`;
  try {
    const response = await fetch(geocodingUrl);
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No locations found' });
    }
    const locations = data.results.map((loc) => ({
      id: loc.id,
      name: loc.name,
      state: loc.admin1,
      country: loc.country,
      latitude: loc.latitude,
      longitude: loc.longitude,
      displayName: `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}, ${loc.country}`
    }));
    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User-provided Weather Endpoint (appended required daily dashboard fields)
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and Longitude are required' });
  }
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,showers,rain,wind_speed_10m,weather_code&hourly=temperature_2m,wind_speed_180m,rain,showers,apparent_temperature,precipitation_probability,precipitation&daily=rain_sum,showers_sum,weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
  try {
    const response = await fetch(weatherUrl);
    const data = await response.json();
    res.json({ success: true, weather: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/farmer/weather/refresh', requireUser, async (req, res, next) => {
  try { const { latitude, longitude, locationId } = req.body; if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return res.status(400).json({ error: 'latitude and longitude must be numbers.' }); let weather = null; let source = 'open-meteo'; if (locationId && !config.demoMode) weather = await readFreshWeather(locationId); if (weather) source = 'cache'; else { weather = await fetchWeather(latitude, longitude); if (locationId && !config.demoMode) await writeWeather(locationId, latitude, longitude, weather); } const advisory = advisoryFor(weather); res.json({ weather, advisory, source, fetchedAt: new Date().toISOString() }); } catch (error) { next(error); }
});
function advisoryFor(weather) { return generateAdvisory({ rainProbability: Math.max(...weather.forecast.slice(0, 2).map((day) => day.rainProbability)), windSpeed: weather.current.windSpeed, temperatureMax: weather.forecast[0].temperature }); }
app.get('/api/farmer/dashboard', requireUser, async (req, res, next) => {
  try {
    const latitude = Number(req.query.latitude); const longitude = Number(req.query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return res.status(400).json({ error: 'latitude and longitude query parameters are required.' });
    const weather = await fetchWeather(latitude, longitude);
    const crops = config.demoMode ? [] : await listCrops(req.user.id);
    const mandiPrices = [{crop: 'Cotton', price: 6850, trend: 'up', advice: 'Hold', unit: '₹/Quintal'}, {crop: 'Wheat', price: 2350, trend: 'down', advice: 'Sell Now', unit: '₹/Quintal'}, {crop: 'Onion', price: 2100, trend: 'up', advice: 'Hold', unit: '₹/Quintal'}];
    const schemes = [{name: 'PM-KISAN Samman Nidhi', eligible: true, deadline: 'Oct 31', description: '₹6,000 per year income support.'}, {name: 'Pradhan Mantri Fasal Bima Yojana', eligible: true, deadline: 'Nov 15', description: 'Crop insurance against natural failure.'}];
    res.json({ farmer: { name: String(req.query.name || 'Farmer'), location: String(req.query.location || 'Selected location') }, advisory: advisoryFor(weather), current: weather.current, forecast: weather.forecast, crops: crops.map((item) => ({ id: item.id, name: item.crops?.name, stage: item.current_growth_stage || 'Stage not recorded', status: 'Review advisory', urgency: 'Medium', icon: '⌁' })), mandiPrices, schemes, syncedAt: new Date().toISOString(), isDemo: config.demoMode, source: 'open-meteo' });
  } catch (error) { next(error); }
});
app.get('/api/farmer/crops', requireUser, async (req, res, next) => { try { res.json({ crops: await listCrops(req.user.id) }); } catch (error) { next(error); } });
app.post('/api/farmer/crops', requireUser, async (req, res, next) => { try { const { cropId, locationId } = req.body; if (!cropId || !locationId) return res.status(400).json({ error: 'cropId and locationId are required.' }); res.status(201).json({ crop: await addCrop(req.user.id, req.body) }); } catch (error) { next(error); } });
app.patch('/api/farmer/crops/:id', requireUser, async (req, res, next) => { try { const crop = await updateCrop(req.user.id, req.params.id, req.body); if (!crop) return res.status(404).json({ error: 'Crop not found.' }); res.json({ crop }); } catch (error) { next(error); } });
app.delete('/api/farmer/crops/:id', requireUser, async (req, res, next) => { try { await removeCrop(req.user.id, req.params.id); res.status(204).end(); } catch (error) { next(error); } });
app.use(errors);

// Only start the HTTP server when running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(config.port, () => console.log(`Farmer API listening on ${config.port}`));
}
