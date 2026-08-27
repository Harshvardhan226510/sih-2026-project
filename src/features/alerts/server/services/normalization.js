import { createAlertId } from '../models/alert.js';
export function normalizeIMDAlert(capAlert) {
  const polygonCoords = parsePolygon(capAlert.polygon);
  const centroid = polygonCoords ? computeCentroid(polygonCoords) : null;
  return {
    id: createAlertId('imd', capAlert.identifier),
    source: 'imd',
    sourceId: capAlert.identifier,
    event: capAlert.event || capAlert.headline || 'Unknown Event',
    headline: capAlert.headline || '',
    description: capAlert.description || '',
    instruction: capAlert.instruction || '',
    severity: mapSeverity(capAlert.severity),
    urgency: capAlert.urgency || null,
    certainty: capAlert.certainty || null,
    status: 'ACTIVE',
    effectiveAt: capAlert.onset || capAlert.sent,
    expiresAt: capAlert.expires || null,
    issuedAt: capAlert.sent,
    area: capAlert.areaDesc || null,
    areaCode: extractAreaCode(capAlert.areaDesc),
    latitude: capAlert.latitude || centroid?.lat || null,
    longitude: capAlert.longitude || centroid?.lon || null,
    polygon: polygonCoords ? JSON.stringify(polygonCoords) : null,
    language: capAlert.language || 'en',
    rawData: JSON.stringify(capAlert),
  };
}
function mapSeverity(raw) {
  if (!raw) return 'Unknown';
  const s = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const valid = ['Extreme', 'Severe', 'Moderate', 'Minor'];
  return valid.includes(s) ? s : 'Unknown';
}
function parsePolygon(polygonStr) {
  if (!polygonStr || typeof polygonStr !== 'string') return null;
  try {
    const coords = polygonStr.trim().split(/\s+/).map(pair => {
      const [lat, lon] = pair.split(',').map(Number);
      if (isNaN(lat) || isNaN(lon)) return null;
      return { lat, lon };
    }).filter(Boolean);
    return coords.length >= 3 ? coords : null;
  } catch {
    return null;
  }
}
function computeCentroid(coords) {
  const sum = coords.reduce((acc, c) => ({ lat: acc.lat + c.lat, lon: acc.lon + c.lon }), { lat: 0, lon: 0 });
  return { lat: sum.lat / coords.length, lon: sum.lon / coords.length };
}
function extractAreaCode(areaDesc) {
  if (!areaDesc) return null;
  return areaDesc.toUpperCase().replace(/[^A-Z\s,]/g, '').trim().split(/\s*,\s*/)[0] || null;
}