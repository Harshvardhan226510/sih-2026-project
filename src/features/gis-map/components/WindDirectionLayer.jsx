import { useEffect, useRef } from 'react';
import L from 'leaflet';

export const WindDirectionLayer = ({ map }) => {
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const windPoints = [
      { lat: 19.07, lon: 72.87, speed: 28, angle: 245, sector: 'Mumbai / Konkan Coast' },
      { lat: 28.61, lon: 77.20, speed: 14, angle: 310, sector: 'Delhi / NCR' },
      { lat: 22.57, lon: 88.36, speed: 22, angle: 185, sector: 'Kolkata / Sundarbans' },
      { lat: 13.08, lon: 80.27, speed: 26, angle: 160, sector: 'Chennai Coast' },
      { lat: 26.91, lon: 75.78, speed: 18, angle: 290, sector: 'Jaipur / Desert' },
      { lat: 25.59, lon: 85.13, speed: 16, angle: 200, sector: 'Patna / Gangetic Belt' },
      { lat: 21.17, lon: 72.83, speed: 30, angle: 260, sector: 'Surat / Gulf of Khambhat' },
      { lat: 15.29, lon: 74.12, speed: 34, angle: 240, sector: 'Goa Coastal Waters' },
      { lat: 20.27, lon: 85.84, speed: 24, angle: 175, sector: 'Bhubaneswar / Odisha' },
      { lat: 30.31, lon: 78.03, speed: 12, angle: 330, sector: 'Dehradun / Himalayan Foothills' },
      { lat: 17.38, lon: 78.48, speed: 16, angle: 215, sector: 'Hyderabad / Deccan' },
      { lat: 9.93, lon: 76.26, speed: 29, angle: 230, sector: 'Kochi / Malabar Coast' }
    ];

    const group = L.layerGroup();

    windPoints.forEach((point) => {
      // Animation speed based on wind speed (faster wind = shorter animation duration)
      const animDuration = Math.max(0.5, 2.5 - (point.speed / 20)); 

      const arrowIcon = L.divIcon({
        className: 'wind-arrow-marker-icon',
        html: `
          <style>
            @keyframes windFlowAnim_${point.angle} {
              0% { transform: translateY(10px) scale(0.8); opacity: 0; }
              20% { opacity: 1; }
              80% { transform: translateY(-15px) scale(1.1); opacity: 1; }
              100% { transform: translateY(-20px) scale(0.8); opacity: 0; }
            }
          </style>
          <div style="position: relative; width: 44px; height: 44px;">
            <div style="position: absolute; inset: 0; transform: rotate(${point.angle}deg);">
              <svg 
                style="animation: windFlowAnim_${point.angle} ${animDuration}s infinite ease-in-out; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"
                width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
            <div style="position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: 800; color: #0284c7; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid #e0f2fe; z-index: 10;">
              ${point.speed} km/h
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([point.lat, point.lon], { icon: arrowIcon });

      marker.bindPopup(
        `<div style="font-family:Inter,system-ui,sans-serif;min-width:160px">` +
        `<div style="font-weight:700;font-size:13px;color:#0ea5e9;margin-bottom:4px">💨 Wind Vector</div>` +
        `<div style="font-size:12px;font-weight:600;color:#0f172a">${point.sector}</div>` +
        `<div style="font-size:11px;color:#475569;margin-top:4px"><b>Speed:</b> ${point.speed} km/h</div>` +
        `<div style="font-size:11px;color:#475569"><b>Direction Angle:</b> ${point.angle}°</div>` +
        `</div>`
      );

      group.addLayer(marker);
    });

    group.addTo(map);
    layerGroupRef.current = group;

    return () => {
      if (layerGroupRef.current && map) {
        map.removeLayer(layerGroupRef.current);
      }
    };
  }, [map]);

  return null;
};

export default WindDirectionLayer;
