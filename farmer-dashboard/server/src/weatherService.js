import { config } from './config.js';

const weatherCodeIcon = (code) => code === 0 ? '☀' : code <= 3 ? '☁' : code <= 67 ? '☂' : '☔';

export async function searchLocations(query) {
  const url = new URL(`${config.geocodingUrl}/search`);
  url.search = new URLSearchParams({ name: query, count: '8', language: 'en', format: 'json' });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo geocoding failed (${response.status})`);
  const { results = [] } = await response.json();
  return results.map(({ id, name, admin1, country, latitude, longitude }) => ({ id, name, admin1, country, latitude, longitude, label: [name, admin1, country].filter(Boolean).join(', ') }));
}

export async function fetchWeather(latitude, longitude) {
  const url = new URL(`${config.weatherUrl}/forecast`);
  url.search = new URLSearchParams({ latitude, longitude, timezone: 'auto', forecast_days: '7', current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code', daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code' });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo forecast failed (${response.status})`);
  const raw = await response.json();
  const daily = raw.daily;
  return {
    current: { temperature: Math.round(raw.current.temperature_2m), humidity: raw.current.relative_humidity_2m, windSpeed: Math.round(raw.current.wind_speed_10m), weatherCode: raw.current.weather_code },
    forecast: daily.time.map((date, index) => ({ date, day: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)), temperature: Math.round(daily.temperature_2m_max[index]), temperatureMin: Math.round(daily.temperature_2m_min[index]), rainProbability: daily.precipitation_probability_max[index] || 0, weatherCode: daily.weather_code[index], icon: weatherCodeIcon(daily.weather_code[index]) }))
  };
}
