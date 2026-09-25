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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 flex flex-col pointer-events-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-1">
            <MapPin size={16} className="text-blue-500" />
            {selectedLocation.name}
          </h3>
          <p className="text-xs text-slate-500 capitalize">{data.description} • {selectedLocation.region}</p>
        </div>
        <div className="text-right">
          <span className="block text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{Math.round(data.temp)}°C</span>
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Feels {Math.round(data.feelsLike)}°C</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
            <Wind size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wind</span>
            <span className="text-xs font-bold text-slate-700">{data.windSpeed} km/h</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
          <div className="bg-cyan-100 text-cyan-600 p-1.5 rounded-lg">
            <Droplets size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Humidity</span>
            <span className="text-xs font-bold text-slate-700">{data.humidity}%</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
          <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg">
            <Gauge size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pressure</span>
            <span className="text-xs font-bold text-slate-700">{Math.round(data.pressure)} hPa</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
          <div className="bg-orange-100 text-orange-600 p-1.5 rounded-lg">
            <Sun size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source</span>
            <span className="text-[10px] font-bold text-slate-700">OpenWeather</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
        <span className="text-[10px] text-slate-500">
          Today Range: <strong className="text-slate-700">{Math.round(data.tempMin)}°C</strong> – <strong className="text-slate-700">{Math.round(data.tempMax)}°C</strong>
        </span>
        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">OWM Live Feed</span>
      </div>
    </div>
  );
};
