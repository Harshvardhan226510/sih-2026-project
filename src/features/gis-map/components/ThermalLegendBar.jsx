import React from 'react';
import { Thermometer } from 'lucide-react';

export const ThermalLegendBar = () => {
  return (
    <div className="thermal-legend-bar animate__animated animate__fadeInUp">
      <div className="legend-top-row">
        <span className="legend-title flex items-center gap-1">
          <Thermometer size={14} className="text-orange-400" />
          <span>OpenWeather Thermal Scale</span>
        </span>
        <span className="legend-unit">°C</span>
      </div>

      <div className="legend-gradient-track"></div>

      <div className="legend-labels">
        <span>-50°</span>
        <span>-25°</span>
        <span>0°</span>
        <span>25°</span>
        <span>+50°</span>
      </div>
    </div>
  );
};
