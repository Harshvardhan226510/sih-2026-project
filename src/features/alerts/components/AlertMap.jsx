import React from 'react';

export function AlertMap({ polygon, networkOnline }) {
  if (!networkOnline) {
    return (
      <div className="alert-map offline-placeholder" style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '4px', textAlign: 'center', color: '#64748b' }}>
        Map unavailable in offline mode
      </div>
    );
  }

  if (!polygon) {
    return null;
  }

  // Very rudimentary projection of polygon to SVG viewbox
  const points = polygon.split(' ').map(p => {
    const [lat, lon] = p.split(',').map(Number);
    return { lat, lon };
  });

  if (points.length < 3) return null;

  const minLat = Math.min(...points.map(p => p.lat));
  const maxLat = Math.max(...points.map(p => p.lat));
  const minLon = Math.min(...points.map(p => p.lon));
  const maxLon = Math.max(...points.map(p => p.lon));

  const pad = 0.5; // Padding in degrees
  const w = maxLon - minLon + pad * 2;
  const h = maxLat - minLat + pad * 2;

  // Convert points to SVG coordinates (flip Y for latitude)
  const svgPoints = points.map(p => {
    const x = ((p.lon - minLon + pad) / w) * 100;
    const y = ((maxLat - p.lat + pad) / h) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="alert-map" style={{ width: '100%', height: '200px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <polygon points={svgPoints} fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="2" />
      </svg>
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '0.75rem', color: '#334155', background: 'rgba(255,255,255,0.8)', padding: '2px 4px', borderRadius: '2px' }}>
        Area Polygon
      </div>
    </div>
  );
}
