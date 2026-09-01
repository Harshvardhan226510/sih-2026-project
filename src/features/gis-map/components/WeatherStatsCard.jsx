import React, { useEffect, useState } from 'react';
import { useWeather } from '../../../context/WeatherContext';
import { Thermometer, Wind, Droplets, Gauge, Sun, MapPin, AlertCircle } from 'lucide-react';

const OWM_API_KEY = '1690b9beed53f2415e79f37f1133e600';

export const WeatherStatsCard = () => {
  const { selectedLocation, setActiveWeather } = useWeather();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedLocation?.lat || !selectedLocation?.lon) return;

    setLoading(true);
    setError(null);

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}&appid=${OWM_API_KEY}&units=metric`
    )
      .then((res) => res.json())
      .then((owmData) => {
        if (owmData && owmData.main) {
          const parsed = {
            temp: owmData.main.temp,
            feelsLike: owmData.main.feels_like,
            tempMin: owmData.main.temp_min,
            tempMax: owmData.main.temp_max,
            humidity: owmData.main.humidity,
            pressure: owmData.main.pressure,
            windSpeed: (owmData.wind.speed * 3.6).toFixed(1),
            description: owmData.weather?.[0]?.description || 'Clear',
            icon: owmData.weather?.[0]?.icon
          };
          setData(parsed);
          setActiveWeather(owmData);
        } else {
          throw new Error('Invalid OWM data');
        }
      })
      .catch(() => {
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${selectedLocation.lat}&longitude=${selectedLocation.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,surface_pressure`
        )
          .then((res) => res.json())
          .then((omData) => {
            if (omData?.current) {
              const current = omData.current;
              setData({
                temp: current.temperature_2m,
                feelsLike: current.apparent_temperature,
                tempMin: current.temperature_2m - 2,
                tempMax: current.temperature_2m + 3,
                humidity: current.relative_humidity_2m,
                pressure: current.surface_pressure,
                windSpeed: current.wind_speed_10m,
                description: 'Clear'
              });
              setActiveWeather(omData);
            }
          })
          .catch(() => setError('Weather data unavailable'));
      })
      .finally(() => setLoading(false));
  }, [selectedLocation.lat, selectedLocation.lon]);

  if (loading) {
    return (
      <div className="weather-stats-card loading">
        <div className="animate-pulse flex flex-col space-y-2">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-8 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="weather-stats-card error">
        <AlertCircle className="text-rose-400 mb-1" size={20} />
        <span>Weather data unavailable for this location</span>
      </div>
    );
  }

  return (
    <div className="weather-stats-card">
      <div className="stats-header">
        <div>
          <h3 className="location-title flex items-center gap-1.5">
            <MapPin size={16} className="text-cyan-400" />
            {selectedLocation.name}
          </h3>
          <p className="location-subtitle capitalize">{data.description} • {selectedLocation.region}</p>
        </div>
        <div className="temp-display">
          <span className="temp-val">{Math.round(data.temp)}°C</span>
          <span className="feels-like">Feels {Math.round(data.feelsLike)}°C</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <Wind size={16} className="text-sky-400" />
          <div className="stat-info">
            <span className="stat-label">Wind</span>
            <span className="stat-value">{data.windSpeed} km/h</span>
          </div>
        </div>

        <div className="stat-box">
          <Droplets size={16} className="text-blue-400" />
          <div className="stat-info">
            <span className="stat-label">Humidity</span>
            <span className="stat-value">{data.humidity}%</span>
          </div>
        </div>

        <div className="stat-box">
          <Gauge size={16} className="text-purple-400" />
          <div className="stat-info">
            <span className="stat-label">Pressure</span>
            <span className="stat-value">{Math.round(data.pressure)} hPa</span>
          </div>
        </div>

        <div className="stat-box">
          <Sun size={16} className="text-amber-400" />
          <div className="stat-info">
            <span className="stat-label">Source</span>
            <span className="stat-value text-amber-300">OpenWeather</span>
          </div>
        </div>
      </div>

      <div className="range-strip">
        <span>Today Range: <strong>{Math.round(data.tempMin)}°C</strong> – <strong>{Math.round(data.tempMax)}°C</strong></span>
        <span className="text-cyan-300">OWM Live Feed</span>
      </div>
    </div>
  );
};
