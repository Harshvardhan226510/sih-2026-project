import axios from 'axios';
import { runExec } from '../../../alerts/server/db/connection.js';
import crypto from 'crypto';

export class MarineService {
  /**
   * Scans a marine voyage path between start and end coordinates.
   * Interpolates waypoints along the great-circle path, queries marine weather (waves, wind, swell),
   * evaluates active cyclone intersections (e.g. Cyclone Tej simulator), and calculates risk status.
   */
  async getMarineRoute(startLat, startLon, endLat, endLon) {
    const sLat = parseFloat(startLat);
    const sLon = parseFloat(startLon);
    const eLat = parseFloat(endLat);
    const eLon = parseFloat(endLon);

    if (isNaN(sLat) || isNaN(sLon) || isNaN(eLat) || isNaN(eLon)) {
      throw new Error('Invalid marine route coordinates.');
    }

    // 1. Calculate distance (Haversine in Nautical Miles)
    const distanceNm = this._haversineDistanceNm(sLat, sLon, eLat, eLon);

    // 2. Generate 5 Interpolated Route Waypoints
    const waypoints = this._interpolateWaypoints(sLat, sLon, eLat, eLon, 5);

    // 3. Query Open-Meteo Marine API at midpoint/waypoints
    let maxWaveHeight = 1.2;
    let maxWindSpeedKt = 14;
    let seaCondition = 'Moderate';

    try {
      const midPoint = waypoints[Math.floor(waypoints.length / 2)];
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${midPoint.lat.toFixed(2)}&longitude=${midPoint.lon.toFixed(2)}&current=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height&hourly=wave_height,wave_period&forecast_days=1`;
      
      const mRes = await axios.get(marineUrl, { timeout: 5000 });
      if (mRes.data && mRes.data.current) {
        const cur = mRes.data.current;
        if (cur.wave_height !== undefined && cur.wave_height !== null) {
          maxWaveHeight = parseFloat(cur.wave_height.toFixed(1));
        }
      }
    } catch (err) {
      console.warn(`[MarineService] Marine API error (${err.message}). Using conservative weather models.`);
      maxWaveHeight = 1.8;
    }

    // 4. Cyclone Detection Check (Simulated Cyclone Tej at 17.0N, 72.0E with 250km radius)
    const cyclone = {
      name: 'Cyclone Tej',
      lat: 17.0,
      lon: 72.0,
      radiusKm: 250,
      windSpeedKt: 65,
      category: 'Severe Cyclonic Storm'
    };

    let cycloneIntersect = false;
    let closestDistToCycloneKm = Infinity;

    for (const wp of waypoints) {
      const distKm = this._haversineDistanceKm(wp.lat, wp.lon, cyclone.lat, cyclone.lon);
      if (distKm < closestDistToCycloneKm) {
        closestDistToCycloneKm = distKm;
      }
      if (distKm <= cyclone.radiusKm) {
        cycloneIntersect = true;
      }
    }

    // 5. Build Safety Status & AI Summary
    let safetyStatus = 'NOMINAL';
    let aiSummary = '';

    if (cycloneIntersect) {
      safetyStatus = 'EMERGENCY - CYCLONE PROXIMITY';
      maxWaveHeight = Math.max(maxWaveHeight, 4.8);
      seaCondition = 'Very Rough / High Danger';
      aiSummary = `EMERGENCY ALERT: Route intersects active ${cyclone.name} hazard perimeter (${Math.round(closestDistToCycloneKm)} km from eye). Sea condition ${seaCondition} with dangerous waves up to ${maxWaveHeight}m. Immediate diversion recommended to standard safe harbor corridor.`;
    } else if (closestDistToCycloneKm <= cyclone.radiusKm * 1.6) {
      safetyStatus = 'ADVISORY - OUTER BANDS';
      maxWaveHeight = Math.max(maxWaveHeight, 2.6);
      seaCondition = 'Rough';
      aiSummary = `CAUTION: Outer peripheral bands of ${cyclone.name} detected within ${Math.round(closestDistToCycloneKm)} km. Elevated sea state with wave heights reaching ${maxWaveHeight}m and gusty winds. Maintain continuous VHF watch.`;
    } else if (maxWaveHeight > 2.5) {
      safetyStatus = 'MODERATE SWELL';
      aiSummary = `Voyage route clear of active tropical depressions. Moderate swells detected along offshore waypoints (max wave height ${maxWaveHeight}m, distance ${Math.round(distanceNm)} NM). Normal maritime vigilance advised.`;
    } else {
      safetyStatus = 'CALM - SAFE TO SAIL';
      aiSummary = `All marine safety parameters nominal across ${Math.round(distanceNm)} NM transit corridor. Max detected wave height is ${maxWaveHeight}m. Favorable navigation window.`;
    }

    const result = {
      start: { lat: sLat, lon: sLon },
      end: { lat: eLat, lon: eLon },
      distance_nm: Math.round(distanceNm),
      safety_status: safetyStatus,
      ai_summary: aiSummary,
      max_wave_height: maxWaveHeight,
      sea_condition: seaCondition,
      waypoints: waypoints.map(wp => ({
        ...wp,
        wave_height_m: maxWaveHeight
      }))
    };

    // Log query asynchronously
    this._logQuery('marine_route', { start: { lat: sLat, lon: sLon }, end: { lat: eLat, lon: eLon } }, aiSummary);

    return result;
  }

  _interpolateWaypoints(lat1, lon1, lat2, lon2, count) {
    const points = [];
    for (let i = 0; i <= count; i++) {
      const frac = i / count;
      points.push({
        lat: parseFloat((lat1 + (lat2 - lat1) * frac).toFixed(4)),
        lon: parseFloat((lon1 + (lon2 - lon1) * frac).toFixed(4))
      });
    }
    return points;
  }

  _haversineDistanceNm(lat1, lon1, lat2, lon2) {
    return this._haversineDistanceKm(lat1, lon1, lat2, lon2) * 0.539957;
  }

  _haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  _logQuery(type, params, summary) {
    try {
      const id = crypto.randomUUID();
      runExec(
        `INSERT INTO aviation_marine_logs (id, query_type, request_params, response_summary, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [id, type, JSON.stringify(params), summary]
      );
    } catch (e) {
      // Ignore DB log error
    }
  }
}
