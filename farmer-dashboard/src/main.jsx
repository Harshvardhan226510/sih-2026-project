import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Header } from './components/Header';
import { LocationSearch } from './components/LocationSearch';
import { AddCrop } from './components/AddCrop';
import { PrimaryAdvisory } from './components/PrimaryAdvisory';
import { Sidebar } from './components/Sidebar';
import { copy, localAdvice, fallbackPlaces } from './utils/i18n';


const start = { name: 'Nashik, Maharashtra', latitude: 19.9975, longitude: 73.7898 };

function App() {

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
  const [crop, setCrop] = useState('Wheat');
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

  function addCropForm(e) {
    e.preventDefault();
    const next = {
      name: crop,
      stage: 'Stage not recorded',
      status: 'Review advisory',
      urgency: 'Low',
      icon: '⌁'
    };
    setData((d) => ({ ...d, crops: [next, ...(d?.crops || [])] }));
    setActiveCrop(next);
    setAdd(false);
  }

  if (loading || !data) {
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

  const text = copy[language];
  const advice = localAdvice(data.advisory, language);

  return (
    <main className="page-shell">
      <div className="atmosphere" />
      <section className="dashboard">
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
            crop={crop}
            setCrop={setCrop}
            addCrop={addCropForm}
            language={language}
            text={text}
          />

          {offline && (
            <div className="offline">
              No internet right now. Your last saved farm advice is still available.
            </div>
          )}

          <div className="layout">
            <PrimaryAdvisory
              data={data}
              activeCrop={activeCrop}
              advice={advice}
              day={day}
              setDay={setDay}
              text={text}
              language={language}
              setActiveCrop={setActiveCrop}
              setSearch={setSearch}
            />
            <Sidebar
              data={data}
              text={text}
              activeCrop={activeCrop}
              setActiveCrop={setActiveCrop}
              setSearch={setSearch}
            />
          </div>

          <footer>
            {data.isDemo ? text.demo : `Last synced ${new Date(data.syncedAt).toLocaleString()}`}
          </footer>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
