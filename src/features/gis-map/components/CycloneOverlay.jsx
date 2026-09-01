import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const CYCLONE_DATA = {
  name: 'Cyclone REMAL',
  category: 'Severe Cyclonic Storm',
  maxWindKph: 130,
  centralPressureHpa: 984,
  pastTrack: [
    { lat: 13.5, lon: 87.8, time: 'May 24 00:00 UTC', windKph: 55, category: 'Depression' },
    { lat: 14.8, lon: 87.5, time: 'May 24 06:00 UTC', windKph: 65, category: 'Deep Depression' },
    { lat: 16.2, lon: 87.1, time: 'May 24 12:00 UTC', windKph: 75, category: 'Cyclonic Storm' },
    { lat: 17.5, lon: 87.3, time: 'May 24 18:00 UTC', windKph: 85, category: 'Cyclonic Storm' },
    { lat: 18.6, lon: 87.8, time: 'May 25 00:00 UTC', windKph: 95, category: 'Severe Cyclonic Storm' },
    { lat: 19.4, lon: 88.2, time: 'May 25 06:00 UTC', windKph: 110, category: 'Severe Cyclonic Storm' },
    { lat: 20.1, lon: 88.5, time: 'May 25 12:00 UTC', windKph: 120, category: 'Severe Cyclonic Storm' },
    { lat: 20.8, lon: 88.9, time: 'May 25 18:00 UTC', windKph: 130, category: 'Severe Cyclonic Storm' }
  ],
  forecastTrack: [
    { lat: 21.4, lon: 89.2, time: '+6h Forecast', windKph: 120 },
    { lat: 21.9, lon: 89.4, time: '+12h Forecast', windKph: 100 },
    { lat: 22.3, lon: 89.5, time: '+18h Forecast', windKph: 80 },
    { lat: 22.8, lon: 89.6, time: '+24h Forecast', windKph: 60 }
  ],
  forecastCone: [
    [20.8, 88.9],
    [21.2, 88.5],
    [21.7, 88.3],
    [22.2, 88.4],
    [22.6, 88.6],
    [23.0, 88.8],
    [23.2, 89.6],
    [23.0, 90.4],
    [22.6, 90.6],
    [22.2, 90.6],
    [21.7, 90.5],
    [21.2, 90.1],
    [20.8, 88.9]
  ]
};

const getCategoryColor = (windKph) => {
  if (windKph >= 120) return '#dc2626';
  if (windKph >= 90) return '#f97316';
  if (windKph >= 65) return '#eab308';
  return '#22d3ee';
};

const getCategoryName = (windKph) => {
  if (windKph >= 120) return 'Severe Cyclonic Storm';
  if (windKph >= 90) return 'Cyclonic Storm';
  if (windKph >= 65) return 'Deep Depression';
  return 'Depression';
};

export const CycloneOverlay = ({ map }) => {
  const layersRef = useRef([]);

  useEffect(() => {
    if (!map) return;

    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    const pastCoords = CYCLONE_DATA.pastTrack.map((p) => [p.lat, p.lon]);

    const pastLine = L.polyline(pastCoords, {
      color: '#ef4444',
      weight: 3,
      opacity: 0.9
    }).addTo(map);
    layersRef.current.push(pastLine);

    CYCLONE_DATA.pastTrack.forEach((point, idx) => {
      const color = getCategoryColor(point.windKph);
      const isLatest = idx === CYCLONE_DATA.pastTrack.length - 1;
      const radius = isLatest ? 0 : 4 + (point.windKph / 40);

      if (!isLatest) {
        const marker = L.circleMarker([point.lat, point.lon], {
          radius: radius,
          color: color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: 2
        }).addTo(map);

        marker.bindPopup(
          `<div style="font-family:Inter,system-ui,sans-serif;min-width:180px">` +
          `<div style="font-weight:700;font-size:13px;margin-bottom:4px;color:${color}">${point.category}</div>` +
          `<div style="font-size:12px;color:#64748b;margin-bottom:6px">${point.time}</div>` +
          `<div style="display:flex;gap:12px;font-size:12px">` +
          `<span>💨 ${point.windKph} km/h</span>` +
          `<span>📍 ${point.lat.toFixed(1)}°N, ${point.lon.toFixed(1)}°E</span>` +
          `</div></div>`
        );
        layersRef.current.push(marker);
      }
    });

    const currentPos = CYCLONE_DATA.pastTrack[CYCLONE_DATA.pastTrack.length - 1];

    const outerRing = L.circle([currentPos.lat, currentPos.lon], {
      radius: 180000,
      color: 'rgba(239, 68, 68, 0.25)',
      fillColor: 'rgba(239, 68, 68, 0.06)',
      fillOpacity: 1,
      weight: 1,
      dashArray: '8, 4'
    }).addTo(map);
    layersRef.current.push(outerRing);

    const midRing = L.circle([currentPos.lat, currentPos.lon], {
      radius: 120000,
      color: 'rgba(249, 115, 22, 0.35)',
      fillColor: 'rgba(249, 115, 22, 0.08)',
      fillOpacity: 1,
      weight: 1,
      dashArray: '6, 4'
    }).addTo(map);
    layersRef.current.push(midRing);

    const innerRing = L.circle([currentPos.lat, currentPos.lon], {
      radius: 60000,
      color: 'rgba(234, 179, 8, 0.5)',
      fillColor: 'rgba(234, 179, 8, 0.12)',
      fillOpacity: 1,
      weight: 1.5,
      dashArray: '4, 3'
    }).addTo(map);
    layersRef.current.push(innerRing);

    const eyeIcon = L.divIcon({
      className: 'cyclone-eye-icon',
      html: `<div class="cyclone-eye-wrapper">` +
        `<div class="cyclone-pulse-outer animate__animated animate__pulse animate__infinite animate__slow"></div>` +
        `<div class="cyclone-pulse-inner animate__animated animate__pulse animate__infinite" style="animation-delay:0.5s"></div>` +
        `<div class="cyclone-eye-core animate__animated animate__rotateIn animate__infinite animate__slower">🌀</div>` +
        `</div>`,
      iconSize: [56, 56],
      iconAnchor: [28, 28]
    });

    const eyeMarker = L.marker([currentPos.lat, currentPos.lon], { icon: eyeIcon }).addTo(map);
    eyeMarker.bindPopup(
      `<div style="font-family:Inter,system-ui,sans-serif;min-width:220px">` +
      `<div style="font-weight:800;font-size:15px;color:#ef4444;margin-bottom:2px">🌀 ${CYCLONE_DATA.name}</div>` +
      `<div style="font-size:12px;color:#f97316;font-weight:600;margin-bottom:8px">${CYCLONE_DATA.category}</div>` +
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px">` +
      `<div><span style="color:#94a3b8">Max Wind</span><br/><b>${CYCLONE_DATA.maxWindKph} km/h</b></div>` +
      `<div><span style="color:#94a3b8">Pressure</span><br/><b>${CYCLONE_DATA.centralPressureHpa} hPa</b></div>` +
      `<div><span style="color:#94a3b8">Position</span><br/><b>${currentPos.lat.toFixed(1)}°N, ${currentPos.lon.toFixed(1)}°E</b></div>` +
      `<div><span style="color:#94a3b8">Time</span><br/><b>${currentPos.time}</b></div>` +
      `</div></div>`
    );
    layersRef.current.push(eyeMarker);

    const conePolygon = L.polygon(CYCLONE_DATA.forecastCone, {
      color: 'rgba(251, 191, 36, 0.6)',
      fillColor: 'rgba(251, 191, 36, 0.12)',
      fillOpacity: 1,
      weight: 1.5,
      dashArray: '6, 4'
    }).addTo(map);
    conePolygon.bindPopup(
      `<div style="font-family:Inter,system-ui,sans-serif">` +
      `<div style="font-weight:700;font-size:13px;color:#fbbf24;margin-bottom:4px">Forecast Uncertainty Cone</div>` +
      `<div style="font-size:12px;color:#94a3b8">24-hour projected path with uncertainty bounds</div>` +
      `</div>`
    );
    layersRef.current.push(conePolygon);

    const forecastCoords = [
      [currentPos.lat, currentPos.lon],
      ...CYCLONE_DATA.forecastTrack.map((p) => [p.lat, p.lon])
    ];

    const forecastLine = L.polyline(forecastCoords, {
      color: '#fbbf24',
      weight: 2.5,
      opacity: 0.8,
      dashArray: '10, 6'
    }).addTo(map);
    layersRef.current.push(forecastLine);

    CYCLONE_DATA.forecastTrack.forEach((point) => {
      const color = getCategoryColor(point.windKph);

      const marker = L.circleMarker([point.lat, point.lon], {
        radius: 5,
        color: '#fbbf24',
        fillColor: color,
        fillOpacity: 0.7,
        weight: 1.5
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-family:Inter,system-ui,sans-serif;min-width:160px">` +
        `<div style="font-weight:700;font-size:13px;color:#fbbf24;margin-bottom:4px">${point.time}</div>` +
        `<div style="font-size:12px;color:${color};font-weight:600;margin-bottom:4px">${getCategoryName(point.windKph)}</div>` +
        `<div style="font-size:12px">💨 ${point.windKph} km/h</div>` +
        `</div>`
      );
      layersRef.current.push(marker);
    });

    const labelIcon = L.divIcon({
      className: 'cyclone-label-icon',
      html: `<div class="cyclone-name-label animate__animated animate__fadeInRight">${CYCLONE_DATA.name}<br/><span>${CYCLONE_DATA.maxWindKph} km/h</span></div>`,
      iconSize: [140, 40],
      iconAnchor: [-12, 20]
    });

    const labelMarker = L.marker([currentPos.lat, currentPos.lon], { icon: labelIcon, interactive: false }).addTo(map);
    layersRef.current.push(labelMarker);

    return () => {
      layersRef.current.forEach((layer) => map.removeLayer(layer));
      layersRef.current = [];
    };
  }, [map]);

  return null;
};
