import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Header } from './components/Header';
import { LocationSearch } from './components/LocationSearch';
import { AddCrop } from './components/AddCrop';
import { PrimaryAdvisory } from './components/PrimaryAdvisory';
import { Sidebar } from './components/Sidebar';
import { MandiSchemes } from './components/MandiSchemes';
import { SevenDayPlanner } from './components/SevenDayPlanner';
import { FarmerAlerts } from './components/FarmerAlerts';
import { FarmActionsSummary } from './components/FarmActionsSummary';
import { copy, localAdvice, fallbackPlaces } from './utils/i18n';
import { supabase } from '../../shared/lib/supabaseClient';
import { generateAdvisories } from './utils/advisoryEngine';


const start = { name: 'Nashik, Maharashtra', latitude: 19.9975, longitude: 73.7898 };

export function FarmerDashboard() {

  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('weathergpt-dashboard')));
  const [place, setPlace] = useState(start);
  const [day, setDay] = useState(0);
  const [activeCrop, setActiveCrop] = useState(null);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState('');
  const [matches, setMatches] = useState([]);


  
  const [message, setMessage] = useState('');
  const [add, setAdd] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('weathergpt-language') || 'en');
  const [loading, setLoading] = useState(!data);

  const load = useCallback(async (loc) => {
    try {
      setLoading(true);
      // Fetch from the backend's user-provided /api/weather endpoint
      const url = `/api/weather?lat=${loc.latitude}&lon=${loc.longitude}`;
      const r = await fetch(url);
      if (!r.ok) throw Error('API failed');
      const responseBody = await r.json();
      if (!responseBody.success || !responseBody.weather) throw Error('Invalid API response');
      const raw = responseBody.weather;

      const weatherCodeIcon = (code) => code === 0 ? '☀' : code <= 3 ? '☁' : code <= 67 ? '☂' : '☔';
      const daily = raw.daily;
      
      const weather = {
        current: {
          temperature: Math.round(raw.current.temperature_2m),
          humidity: raw.current.relative_humidity_2m,
          windSpeed: Math.round(raw.current.wind_speed_10m),
          rainProbability: daily.precipitation_probability_max[0] || 0
        },
        forecast: daily.time.map((date, index) => ({
          day: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)),
          temperature: Math.round(daily.temperature_2m_max[index]),
          icon: weatherCodeIcon(daily.weather_code[index]),
          rainProbability: daily.precipitation_probability_max[index] || 0
        }))
      };

      const rainProb = Math.max(weather.forecast[0].rainProbability, weather.forecast[1]?.rainProbability || 0);
      const advisory = {
        verdict: rainProb > 50 ? 'Rain expected — delay spraying' : 'Safe to spray today',
        reason: rainProb > 50 ? `A ${rainProb}% chance of rain is forecast. Spraying now could wash treatment off leaves.` : 'Clear weather expected.',
        action: rainProb > 50 ? 'Wait until 24 hours after the rain clears.' : 'Proceed with scheduled farm tasks.'
      };

      setData((d) => {
        const nextData = {
          farmer: { name: 'Arjun', location: loc.name },
          advisory,
          current: weather.current,
          forecast: weather.forecast,
          crops: d?.crops?.length ? d.crops : [{name:'Cotton',stage:'Vegetative stage',status:'Hold spraying',urgency:'Medium',icon:'⌁'}],
          mandiPrices: [], // Removed dummy data
          schemes: [],     // Removed dummy data
          isDemo: false,
          syncedAt: new Date().toISOString()
        };
        localStorage.setItem('weathergpt-dashboard', JSON.stringify(nextData));
        return nextData;
      });

      setDay(0);
      setOffline(false);
    } catch (err) {
      console.error(err);
      setOffline(true);
      // No dummy fallback data as requested. Set data to null to show error screen.
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(place);
  }, [load, place]);

  async function find(e) {
    e.preventDefault();
    if (q.trim().length < 2) return setMessage('Type at least two letters.');
    setMessage('Searching…');
    try {
      const r = await fetch(`/api/search-city?city=${encodeURIComponent(q)}`);
      const b = await r.json();
      if (!r.ok) throw Error();
      if (b.success && b.locations) {
        // Map the new location format to the expected label format
        const formattedLocations = b.locations.map(l => ({
          ...l,
          label: l.displayName
        }));
        setMatches(formattedLocations);
        setMessage(formattedLocations.length ? 'Choose your village or district.' : 'No match found.');
      } else {
        setMatches([]);
        setMessage('No match found.');
      }
    } catch {
      setMatches([]);
      setMessage('Failed to search locations. Server is offline.');
    }
  }

  function choose(x) {
    setPlace({ name: x.label, latitude: x.latitude, longitude: x.longitude });
    setSearch(false);
    setMatches([]);
    setQ('');
  }

  async function addCropForm({ name, sowingDate, stage }) {
    const next = {
      name,
      stage: stage || 'Stage not recorded',
      sowingDate: sowingDate || null,
      status: 'Review advisory',
      urgency: 'Low',
      icon: '⌁'
    };
    
    // Try to save to backend if authenticated
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
         await fetch('/api/farmer/crops', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${sessionData.session.access_token}`
           },
           body: JSON.stringify({
             cropId: name.toLowerCase(),
             locationId: place.name,
             sowingDate: next.sowingDate,
             growthStage: next.stage,
             isPrimary: false
           })
         });
      }
    } catch (e) {
      console.log('Failed to save to backend, falling back to local storage', e);
    }

    setData((d) => {
      const updated = { ...d, crops: [next, ...(d?.crops || [])] };
      localStorage.setItem('weathergpt-dashboard', JSON.stringify(updated));
      return updated;
    });
    setActiveCrop(next);
    setAdd(false);
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="atmosphere" />
        <section className="dashboard">
          <div className="content" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
            <h2>Fetching real-time weather from Open-Meteo...</h2>
          </div>
        </section>
      </main>
    );
  }

  if (!data && !loading) {
    return (
      <main className="page-shell">
        <div className="atmosphere" />
        <section className="dashboard">
          <div className="content" style={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center' }}>
            <div>
              <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Failed to connect to the weather server</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>Please check if your backend servers are running.</p>
              <button 
                onClick={() => load(place)}
                style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Retry Connection
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const text = copy[language];
  const decisionState = data ? generateAdvisories(data, activeCrop, language) : null;

  return (
    <main className="page-shell" style={{ background: '#f1f5f9', minHeight: '100vh', paddingBottom: '40px' }}>
      <div className="atmosphere" />
      <section className="dashboard" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div className="content">
          <Header
            data={data}
            language={language}
            setLanguage={setLanguage}
            add={add}
            setAdd={setAdd}
            search={search}
            setSearch={setSearch}
          />
          <LocationSearch
            search={search}
            q={q}
            setQ={setQ}
            message={message}
            matches={matches}
            choose={choose}
            find={find}
            setSearch={setSearch}
            language={language}
          />
          <AddCrop
            add={add}
            addCrop={addCropForm}
            language={language}
            text={text}
          />

          {offline && (
            <div className="offline" style={{ background: '#f59e0b', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
              Showing cached weather from {new Date(data.syncedAt).toLocaleString()}. Network is offline.
            </div>
          )}

          {/* Desktop Grid Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Left Column: Primary Decision */}
            <div style={{ gridColumn: '1 / span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <PrimaryAdvisory
                decisionState={decisionState}
                place={place}
                data={data}
                language={language}
              />
              <FarmActionsSummary decisionState={decisionState} language={language} />
            </div>

            {/* Right Column: Context */}
            <div style={{ gridColumn: 'span 1' }}>
              <Sidebar
                data={data}
                activeCrop={activeCrop}
                setActiveCrop={setActiveCrop}
                setSearch={setSearch}
                decisionState={decisionState}
              />
            </div>

          </div>

          <FarmerAlerts place={place} language={language} />

          <SevenDayPlanner data={data} language={language} activeCrop={activeCrop} />

          <MandiSchemes data={data} language={language} />

        </div>
      </section>
    </main>
  );
}


