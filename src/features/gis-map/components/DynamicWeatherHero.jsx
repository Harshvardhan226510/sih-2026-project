import React, { useState } from 'react';
import { useWeather } from '../../../context/WeatherContext';
import { getThemeForCondition, WEATHER_THEMES } from '../config/weatherThemes';
import { WeatherParticles } from './WeatherParticles';
import {
  CloudLightning,
  CloudRain,
  Sun,
  Cloud,
  Wind,
  Droplets,
  Eye,
  Plus,
  Search,
  Bell,
  User,
  MapPin
} from 'lucide-react';

export const DynamicWeatherHero = ({ onOpenGisMap }) => {
  const { selectedLocation, setSelectedLocation } = useWeather();
  const [activeConditionKey, setActiveConditionKey] = useState('storm');

  const theme = WEATHER_THEMES[activeConditionKey] || getThemeForCondition(selectedLocation?.name);

  const forecastDays = [
    { day: 'Sunday', temp: 11, icon: CloudRain },
    { day: 'Monday', temp: 13, icon: Cloud },
    { day: 'Tuesday', temp: 14, icon: CloudRain },
    { day: 'Wednesday', temp: 10, icon: CloudLightning, active: true },
    { day: 'Thursday', temp: 19, icon: Sun },
    { day: 'Friday', temp: 12, icon: CloudRain }
  ];

  const savedLocations = [
    { name: 'North Jakarta', region: 'Indonesia', temp: 12, condition: 'Mostly Sunny', icon: Cloud },
    { name: 'Bandung', region: 'Indonesia', temp: 10, condition: 'Cloudy', icon: Cloud },
    { name: 'South Jakarta', region: 'Indonesia', temp: 14, condition: 'Sunny', icon: Sun }
  ];

  const curvePoints = 'M 30,70 Q 90,40 150,55 T 270,30 T 390,75 T 510,25 T 630,65';

  return (
    <div className="dynamic-weather-hero-container">
      <div className="hero-layer-base-gradient" style={{ background: theme.baseGradient }} />

      <div
        className="hero-layer-scene-imagery"
        style={{ backgroundImage: `url(${theme.bgImage})` }}
      />

      <WeatherParticles particleType={theme.particleType} />

      <div className="hero-layer-readability-overlay" />

      <div className="hero-layer-ui-content">
        <div className="hero-main-layout">
          <div className="hero-left-panel">
            <header className="hero-top-welcome">
              <div>
                <span className="welcome-sub">Welcome</span>
                <h3 className="welcome-name">Calfin Danang</h3>
              </div>
            </header>

            <div className="hero-headline-zone">
              <div className="forecast-pill-tag">
                <span>Weather Forecast</span>
              </div>

              <h1 className="hero-main-title">{theme.headline}</h1>

              <p className="hero-summary-text">{theme.summary}</p>
            </div>

            <div className="theme-switcher-pills">
              {Object.keys(WEATHER_THEMES).map((key) => (
                <button
                  key={key}
                  className={`theme-pill-btn ${activeConditionKey === key ? 'active' : ''}`}
                  onClick={() => setActiveConditionKey(key)}
                >
                  {WEATHER_THEMES[key].name}
                </button>
              ))}
            </div>

            <div className="hero-forecast-curve-section">
              <div className="curve-temp-headers">
                {forecastDays.map((item, i) => {
                  const IconComp = item.icon;
                  return (
                    <div key={i} className={`temp-node-col ${item.active ? 'active-node' : ''}`}>
                      <span className="temp-val-text">{item.temp}°</span>
                      <IconComp size={16} className="temp-icon" />
                    </div>
                  );
                })}
              </div>

              <div className="curve-svg-wrapper">
                <svg className="curve-svg" viewBox="0 0 660 100" preserveAspectRatio="none">
                  <path d={curvePoints} className="curve-line-bg" />
                  <path d={curvePoints} className="curve-line-glow" />
                  <circle cx="390" cy="75" r="7" className="curve-pulse-node" />
                  <circle cx="390" cy="75" r="3" className="curve-pulse-core" />
                </svg>
              </div>

              <div className="curve-days-row">
                {forecastDays.map((item, i) => (
                  <span key={i} className={`day-label ${item.active ? 'active-day' : ''}`}>
                    {item.day}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-right-panel">
            <div className="hero-top-actions">
              <button className="top-action-btn" title="Add Location">
                <Plus size={18} />
              </button>
              <button className="top-action-btn" onClick={onOpenGisMap} title="Search Map">
                <Search size={18} />
              </button>
              <button className="top-action-btn" title="Notifications">
                <Bell size={18} />
              </button>
              <div className="user-avatar-badge" title="User Profile">
                <User size={18} />
              </div>
            </div>

            <div className="location-card active-location-card">
              <div className="card-top-row">
                <div className="location-name-group">
                  <MapPin size={16} className="text-slate-200" />
                  <span className="location-city-name">{selectedLocation.name || 'Central Jakarta'}</span>
                </div>
              </div>

              <div className="big-temp-row">
                <span className="big-temp-value">10°C</span>
              </div>

              <div className="active-card-stats-row">
                <span className="stat-pill-item">
                  <Wind size={14} /> 19 mph
                </span>
                <span className="stat-pill-item">
                  <Droplets size={14} /> 40%
                </span>
                <span className="stat-pill-item">
                  <Eye size={14} /> 15km/h
                </span>
              </div>
            </div>

            <div className="saved-locations-stack">
              {savedLocations.map((loc, idx) => {
                const IconComponent = loc.icon;
                return (
                  <div
                    key={idx}
                    className="location-card saved-location-card"
                    onClick={() =>
                      setSelectedLocation({
                        lat: 20.5937,
                        lon: 78.9629,
                        name: loc.name,
                        region: loc.region,
                        country: 'Indonesia'
                      })
                    }
                  >
                    <div className="saved-card-left">
                      <span className="saved-country-tag">{loc.region}</span>
                      <h4 className="saved-city-title">{loc.name}</h4>
                      <span className="saved-cond-text">{loc.condition}</span>
                    </div>

                    <div className="saved-card-right">
                      <span className="saved-temp-value">{loc.temp}°</span>
                      <IconComponent size={18} className="saved-cond-icon" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
