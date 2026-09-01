import { supabase } from './supabase.js';
import { config } from './config.js';

export async function readFreshWeather(locationId) {
  const { data, error } = await supabase().from('weather_snapshots').select('*').eq('location_id', locationId).gt('expires_at', new Date().toISOString()).order('fetched_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? { current: data.current_conditions, forecast: data.daily_forecast } : null;
}

export async function writeWeather(locationId, latitude, longitude, weather) {
  const expiresAt = new Date(Date.now() + config.weatherCacheMinutes * 60_000).toISOString();
  const { error } = await supabase().from('weather_snapshots').upsert({ location_id: locationId, forecast_date: new Date().toISOString().slice(0, 10), expires_at: expiresAt, latitude, longitude, current_conditions: weather.current, daily_forecast: weather.forecast }, { onConflict: 'location_id,forecast_date' });
  if (error) throw error;
}
