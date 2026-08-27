import { createClient } from 'jsr:@supabase/supabase-js@2'

// Helper to get the supabase client using env vars in Edge Function
export const getSupabase = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for reading tables safely in Edge Function
  )
}

export const getWeatherObservation = async (locationName: string) => {
  console.log(`Tool invoked: getWeatherObservation for ${locationName}`);
  const supabase = getSupabase();
  
  let lat = null;
  let lng = null;
  let locName = locationName;

  // 1. Try to find the location in DB
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name, lat, lng')
    .ilike('name', `%${locationName}%`)
    .limit(1);
    
  if (!locError && locations && locations.length > 0) {
    const location = locations[0];
    lat = location.lat;
    lng = location.lng;
    locName = location.name;
    
    // 2. Try to get latest observation from DB
    const { data: observations, error: obsError } = await supabase
      .from('observations')
      .select('*')
      .eq('location_id', location.id)
      .order('recorded_at', { ascending: false })
      .limit(1);
      
    if (!obsError && observations && observations.length > 0) {
      return { source: "database", location, observation: observations[0] };
    }
  }

  // 3. Fallback: If no location or observation in DB, use Live APIs
  console.log(`Falling back to live API for ${locationName}`);
  
  try {
    // Get Coordinates if not found in DB
    if (!lat || !lng) {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        return { error: `Could not find coordinates for '${locationName}' anywhere.` };
      }
      lat = geoData.results[0].latitude;
      lng = geoData.results[0].longitude;
      locName = geoData.results[0].name;
    }

    // Get Live Weather
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation`);
    const weatherData = await weatherRes.json();
    
    if (!weatherData.current) {
      return { error: `Could not fetch live weather data for '${locName}'.` };
    }

    return {
      source: "live_api",
      location: { name: locName, lat, lng },
      observation: {
        temp_c: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        wind_kph: weatherData.current.wind_speed_10m,
        rainfall_mm: weatherData.current.precipitation,
        recorded_at: weatherData.current.time
      }
    };
  } catch (apiError) {
    console.error("API Fallback Error:", apiError);
    return { error: `Failed to fetch data for '${locationName}' due to an internal API error.` };
  }
};

export const getActiveAlerts = async () => {
  console.log(`Tool invoked: getActiveAlerts`);
  const supabase = getSupabase();
  
  const now = new Date().toISOString();
  
  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('id, type, severity, message, valid_to')
    .gte('valid_to', now)
    .order('severity', { ascending: false })
    .limit(5);
    
  if (error || !alerts || alerts.length === 0) {
    return { message: "No active alerts at this time." };
  }
  
  return { alerts };
};

export const getCropAdvisory = async (cropName: string, stage: string = "") => {
  console.log(`Tool invoked: getCropAdvisory for ${cropName} (stage: ${stage})`);
  const supabase = getSupabase();
  
  let query = supabase.from('crop_stage_rules').select('*').ilike('crop', `%${cropName}%`);
  
  if (stage) {
    query = query.ilike('stage', `%${stage}%`);
  }
  
  const { data: rules, error } = await query.limit(3);
  
  if (error || !rules || rules.length === 0) {
    return { error: `No advisory found for crop '${cropName}' ${stage ? `at stage '${stage}'` : ''}.` };
  }
  
  return { rules };
};
