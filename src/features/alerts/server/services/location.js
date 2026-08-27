import { fetchWithRetry } from '../utils/http.js';
import logger from '../utils/logger.js';

/**
 * Reverse geocodes latitude and longitude into state and district.
 * Uses Nominatim (OpenStreetMap) API.
 * 
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @returns {Promise<{state: string|null, district: string|null}>}
 */
export async function reverseGeocode(lat, lon) {
  // Validate coordinates
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('Invalid coordinates: lat and lon must be numbers');
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Invalid coordinates: out of range');
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
  
  try {
    const res = await fetchWithRetry(url, {
      timeout: 10000,
      retries: 2,
      headers: {
        'User-Agent': 'WeatherGPT-Alert-System/1.0',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!res.ok) {
      throw new Error(`Nominatim API returned ${res.status}`);
    }

    const data = await res.json();
    
    if (!data || !data.address) {
      return { state: null, district: null };
    }

    // Extract state and district.
    // Nominatim may return district as 'county', 'state_district', or part of the city/town.
    const address = data.address;
    const state = address.state || null;
    let district = address.state_district || address.county || address.city || address.town || null;
    
    // Clean up "District" suffix if present to match manual entry expectations (e.g. "Puri District" -> "Puri")
    if (district && district.toLowerCase().endsWith(' district')) {
      district = district.substring(0, district.length - 9).trim();
    }

    return { state, district };
  } catch (err) {
    logger.error({ err: err.message, lat, lon }, 'Reverse geocoding failed');
    throw err;
  }
}
