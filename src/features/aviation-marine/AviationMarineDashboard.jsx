import React, { useState, useEffect, useRef } from 'react';
import { Plane, Ship, Search, Wind, Droplets, Thermometer, AlertTriangle, Eye, Waves, MapPin, Clock, ArrowRight, Download, Radio, Activity, X, Compass, Globe } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';

const INDIAN_AIRPORTS = [
  { icao: 'VABB', city: 'Mumbai', lat: 19.088, lon: 72.868 },
  { icao: 'VIDP', city: 'Delhi', lat: 28.556, lon: 77.100 },
  { icao: 'VOBL', city: 'Bengaluru', lat: 13.199, lon: 77.706 },
  { icao: 'VOMM', city: 'Chennai', lat: 12.990, lon: 80.169 },
  { icao: 'VECC', city: 'Kolkata', lat: 22.654, lon: 88.446 },
  { icao: 'VOHS', city: 'Hyderabad', lat: 17.240, lon: 78.429 },
  { icao: 'VAAH', city: 'Ahmedabad', lat: 23.073, lon: 72.634 },
  { icao: 'VAPO', city: 'Pune', lat: 18.582, lon: 73.919 },
  { icao: 'VOCI', city: 'Kochi', lat: 10.152, lon: 76.392 },
  { icao: 'VOGO', city: 'Goa (Dabolim)', lat: 15.380, lon: 73.831 },
  { icao: 'VOTV', city: 'Thiruvananthapuram', lat: 8.482, lon: 76.920 },
  { icao: 'VEGT', city: 'Guwahati', lat: 26.106, lon: 91.585 },
  { icao: 'VILK', city: 'Lucknow', lat: 26.760, lon: 80.889 },
  { icao: 'VIJP', city: 'Jaipur', lat: 26.824, lon: 75.812 },
  { icao: 'VEBN', city: 'Varanasi', lat: 25.451, lon: 82.859 },
  { icao: 'VOCB', city: 'Coimbatore', lat: 11.030, lon: 77.043 },
  { icao: 'VEPT', city: 'Patna', lat: 25.591, lon: 85.088 },
  { icao: 'VABB', city: 'Navi Mumbai', lat: 18.988, lon: 73.068 },
  { icao: 'VAAK', city: 'Akola', lat: 20.698, lon: 77.058 }
];

const AirportSearch = ({ value, onChange, onSelect, placeholder }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = INDIAN_AIRPORTS.filter(a => 
    a.icao.toLowerCase().includes(value.toLowerCase()) || 
    a.city.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="flex-1 relative" ref={searchRef}>
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
      <input 
        type="text" 
        value={value}
        onChange={(e) => { onChange(e.target.value.toUpperCase()); setShowSuggestions(true); }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="w-full bg-slate-900/40 backdrop-blur-md border border-white/10 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all shadow-inner"
      />
      {showSuggestions && value.length > 0 && (
        <div className="absolute z-50 w-full mt-3 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="py-2">
            {filtered.map((airport) => (
              <li 
                key={airport.icao}
                onClick={() => { onSelect(airport.icao); setShowSuggestions(false); }}
                className="px-5 py-3 hover:bg-white/10 cursor-pointer flex items-center transition-colors group"
              >
                <MapPin className="w-4 h-4 text-sky-400 mr-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-white mr-2">{airport.city}</span>
                <span className="text-slate-400 group-hover:text-sky-300 transition-colors">({airport.icao})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const AviationMarineDashboard = () => {
  const [activeTab, setActiveTab] = useState('live');
  
  // Aviation
  const [depCode, setDepCode] = useState('VIDP');
  const [arrCode, setArrCode] = useState('VABB');
  const [aviationData, setAviationData] = useState(null);
  const [aviationLoading, setAviationLoading] = useState(false);
  const [aviationError, setAviationError] = useState(null);
  const [tafSliderIndex, setTafSliderIndex] = useState(0);
  
  // Live Flights
  const [liveSearchDep, setLiveSearchDep] = useState('VIDP');
  const [liveFlights, setLiveFlights] = useState([]);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null); 

  // Marine
  const [startLat, setStartLat] = useState('18.92');
  const [startLon, setStartLon] = useState('72.83');
  const [endLat, setEndLat] = useState('15.55');
  const [endLon, setEndLon] = useState('73.75');
  const [marineData, setMarineData] = useState(null);
  const [marineLoading, setMarineLoading] = useState(false);
  const [marineError, setMarineError] = useState(null);

  const fetchLiveFlightsByDeparture = async () => {
    if (!liveSearchDep) return;
    setLoadingFlights(true);
    setLiveError(null);
    setSelectedFlight(null);
    try {
      const res = await axios.get(`http://localhost:8000/api/aviation/live_by_departure?airport=${liveSearchDep}`);
      if (res.data.length === 0) {
        setLiveError(`No live flights found that recently departed from ${liveSearchDep}.`);
      }
      setLiveFlights(res.data);
    } catch (err) {
      setLiveError("Failed to fetch live flight data.");
      console.error(err);
    } finally {
      setLoadingFlights(false);
    }
  };

  const handleLiveFlightClick = (flight) => {
    setSelectedFlight(flight);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const fetchAviationRoute = async (d = depCode, a = arrCode) => {
    if (!d || !a) return;
    setAviationLoading(true); setAviationError(null); setTafSliderIndex(0);
    try {
      const response = await axios.get(`http://localhost:8000/api/aviation/route?departure=${d}&arrival=${a}`);
      setAviationData(response.data);
    } catch (err) {
      setAviationError("Error fetching data");
    } finally {
      setAviationLoading(false);
    }
  };

  const fetchMarineRoute = async () => {
    setMarineLoading(true); setMarineError(null);
    try {
      const response = await axios.get(`http://localhost:8000/api/marine/route?start_lat=${startLat}&start_lon=${startLon}&end_lat=${endLat}&end_lon=${endLon}`);
      setMarineData(response.data);
    } catch (err) {
      setMarineError("Error scanning marine route");
    } finally {
      setMarineLoading(false);
    }
  };

  const exportAviationPDF = () => {
    if (!aviationData) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`Official Flight Briefing: ${depCode} to ${arrCode}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`AI Risk Analysis:\n${aviationData.risk_summary}`, 20, 40, { maxWidth: 170 });
    doc.text(`Dep Wind: ${aviationData.departure.metar.wind_speed_kt} kt`, 20, 70);
    doc.text(`Arr Wind: ${aviationData.arrival.metar.wind_speed_kt} kt`, 20, 80);
    doc.save(`Aviation_Briefing_${depCode}_${arrCode}.pdf`);
  };

  const exportMarinePDF = () => {
    if (!marineData) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`Official Marine Voyage Briefing`, 20, 20);
    doc.setFontSize(12);
    doc.text(`AI Safety Summary:\n${marineData.ai_summary}`, 20, 40, { maxWidth: 170 });
    doc.text(`Max Wave Height: ${marineData.max_wave_height} meters`, 20, 70);
    doc.save(`Marine_Voyage_Briefing.pdf`);
  };

  const exportLivePDF = () => {
    if (!selectedFlight) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`Live Telemetry: ${selectedFlight.callsign}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Departure: ${selectedFlight.departure}`, 20, 40);
    doc.text(`Arrival: ${selectedFlight.arrival !== 'Unknown' && selectedFlight.arrival !== 'None' ? selectedFlight.arrival : 'TBD'}`, 20, 50);
    doc.text(`Altitude: ${(selectedFlight.altitude_m * 3.28084).toFixed(0)} ft`, 20, 60);
    doc.text(`Speed: ${(selectedFlight.velocity_ms * 1.94384).toFixed(0)} kt`, 20, 70);
    doc.text(`Coordinates: ${selectedFlight.latitude.toFixed(4)}, ${selectedFlight.longitude.toFixed(4)}`, 20, 80);
    doc.save(`LiveTracking_${selectedFlight.callsign}.pdf`);
  };

  const getCityName = (icao) => {
    const apt = INDIAN_AIRPORTS.find(a => a.icao === icao);
    return apt ? apt.city : icao;
  };

  const getEstDurationSeconds = (depIcao, arrIcao) => {
    const dep = INDIAN_AIRPORTS.find(a => a.icao === depIcao);
    const arr = INDIAN_AIRPORTS.find(a => a.icao === arrIcao);
    if (!dep || !arr) return 2 * 3600; // Default 2 hours

    const R = 3440; 
    const dLat = (arr.lat - dep.lat) * Math.PI / 180;
    const dLon = (arr.lon - dep.lon) * Math.PI / 180;
    const lat1 = dep.lat * Math.PI / 180;
    const lat2 = arr.lat * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceNm = R * c;
    
    const hours = (distanceNm / 450) + 0.5;
    return hours * 3600;
  };

  const getSyncedTafIndex = (targetTafs, referenceUnix) => {
    if (!targetTafs || targetTafs.length === 0 || !referenceUnix) return 0;
    let closestIdx = 0;
    let minDiff = Infinity;
    targetTafs.forEach((taf, idx) => {
      const diff = Math.abs(taf.timestamp_unix - referenceUnix);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    return closestIdx;
  };

  const renderAirportMetrics = (data, title, isDeparture) => {
    const metar = data.metar;
    const tafs = data.taf;
    const isForecast = tafSliderIndex > 0 && tafs.length > 0;
    
    let tIndex = 0;
    if (isForecast) {
      if (isDeparture) {
        tIndex = Math.min(tafSliderIndex - 1, tafs.length - 1);
      } else {
        const depTafs = aviationData.departure.taf;
        const depIdx = Math.min(tafSliderIndex - 1, depTafs.length - 1);
        const targetUnix = depTafs[depIdx]?.timestamp_unix;
        const flightDurationSeconds = getEstDurationSeconds(depCode, arrCode);
        tIndex = getSyncedTafIndex(tafs, targetUnix + flightDurationSeconds);
      }
    }
    
    const windSpeed = isForecast && tafs[tIndex] ? tafs[tIndex].wind_speed_kt : metar.wind_speed_kt;
    const visibility = isForecast && tafs[tIndex] ? tafs[tIndex].visibility_statute_miles : metar.visibility_statute_miles;
    const timeLabel = isForecast && tafs[tIndex] ? tafs[tIndex].time_label : "Current (METAR)";
    
    return (
      <div className="bg-slate-900/30 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl hover:shadow-sky-900/20 transition-all duration-500 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-colors"></div>
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center relative z-10">
          {isDeparture ? <Plane className="w-6 h-6 mr-3 text-sky-400 transform -rotate-45" /> : <Plane className="w-6 h-6 mr-3 text-indigo-400 transform rotate-45" />}
          {title} <span className="ml-2 text-slate-400 font-normal">{getCityName(metar.airport)} ({metar.airport})</span>
        </h3>
        <p className="text-sm text-sky-300 font-mono mb-6 flex items-center bg-sky-900/20 inline-flex px-3 py-1 rounded-full border border-sky-500/20 relative z-10">
          <Clock className="w-3 h-3 mr-2 animate-pulse"/> {timeLabel}
        </p>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <MetricCard icon={<Wind className="w-6 h-6 text-sky-400" />} label="Wind Speed" value={`${windSpeed} kt`} />
          <MetricCard icon={<Eye className="w-6 h-6 text-indigo-400" />} label="Visibility" value={`${visibility} SM`} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f18] to-[#05080f] text-slate-200 p-6 md:p-12 font-sans overflow-x-hidden selection:bg-sky-500/30 selection:text-sky-200">
      
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-5xl font-black tracking-tight bg-gradient-to-br from-white via-sky-200 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm mb-2">
              WeatherGPT
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium tracking-wide uppercase flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Enterprise Command Center
            </p>
          </div>
          
          <div className="flex mt-6 md:mt-0 bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-2xl">
             <button onClick={() => { setActiveTab('live'); setSelectedFlight(null); }} className={`px-6 py-2.5 rounded-xl flex items-center transition-all duration-300 font-semibold ${activeTab === 'live' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}>
               <Activity className="w-4 h-4 mr-2" /> Live Tracking
             </button>
             <button onClick={() => setActiveTab('aviation')} className={`px-6 py-2.5 rounded-xl flex items-center transition-all duration-300 font-semibold ${activeTab === 'aviation' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-105' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}>
               <Plane className="w-4 h-4 mr-2" /> Aviation
             </button>
             <button onClick={() => setActiveTab('marine')} className={`px-6 py-2.5 rounded-xl flex items-center transition-all duration-300 font-semibold ${activeTab === 'marine' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}>
               <Ship className="w-4 h-4 mr-2" /> Marine
             </button>
          </div>
        </header>

        {/* LIVE TRACKING TAB */}
        {activeTab === 'live' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
            
            <div className="relative z-50 flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-br from-amber-900/30 to-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-amber-500/20 gap-6 shadow-2xl">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-amber-400 flex items-center mb-3">
                  <Radio className="w-8 h-8 mr-4 animate-pulse text-amber-500"/> Authentic Route Radar
                </h2>
                <p className="text-slate-300">Querying dual-OpenSky APIs for real-time transponder data across the airspace.</p>
              </div>
              
              <div className="flex-1 w-full flex space-x-3 bg-black/20 p-2 rounded-2xl backdrop-blur-md border border-white/5">
                <AirportSearch 
                  value={liveSearchDep} 
                  onChange={setLiveSearchDep} 
                  onSelect={setLiveSearchDep} 
                  placeholder="Enter Departure ICAO (e.g. VIDP)" 
                />
                <button 
                  onClick={fetchLiveFlightsByDeparture} 
                  className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loadingFlights ? 'Tracking...' : 'Intercept'}
                </button>
              </div>
            </div>

            {liveError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-center shadow-lg animate-in fade-in">
                <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0" /> <span className="font-medium">{liveError}</span>
              </div>
            )}

            {selectedFlight && (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-amber-900/10 animate-in slide-in-from-top-8 duration-500 ring-1 ring-white/5">
                <div className="bg-gradient-to-r from-amber-900/30 to-transparent p-6 md:p-8 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center">
                    <Plane className="w-10 h-10 text-amber-400 mr-4" />
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight">{selectedFlight.callsign}</h2>
                      <div className="flex items-center mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
                        <p className="text-emerald-400 font-mono text-xs tracking-widest font-bold">LIVE TELEMETRY ACTIVE</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={exportLivePDF} className="bg-emerald-600/20 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 text-emerald-400 px-5 py-2.5 rounded-xl font-bold flex items-center transition-all duration-300">
                      <Download className="w-4 h-4 mr-2" /> PDF Report
                    </button>
                    <button onClick={() => setSelectedFlight(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors group">
                      <X className="w-5 h-5 text-slate-300 group-hover:text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 md:p-8">
                  <div className="bg-black/30 rounded-2xl p-8 border border-white/5 flex flex-col md:flex-row justify-between items-center mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-indigo-500/5"></div>
                    <div className="text-center flex-1 relative z-10">
                      <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-2">Departure</p>
                      <p className="text-3xl lg:text-4xl font-black text-white">{getCityName(selectedFlight.departure)}</p>
                      <p className="text-lg text-slate-400 font-mono mt-1">({selectedFlight.departure})</p>
                    </div>
                    <div className="px-8 text-slate-600 flex flex-col items-center py-6 md:py-0 relative z-10">
                      <p className="text-sm text-sky-400 mb-3 font-mono font-bold bg-sky-900/30 px-4 py-1 rounded-full border border-sky-500/20">{(selectedFlight.velocity_ms * 1.94384).toFixed(0)} knots</p>
                      <ArrowRight className="w-10 h-10 text-amber-500/30" />
                    </div>
                    <div className="text-center flex-1 relative z-10">
                      <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-2">Arrival</p>
                      <p className={`text-3xl lg:text-4xl font-black ${selectedFlight.arrival !== 'Unknown' && selectedFlight.arrival !== 'None' ? 'text-white' : 'text-slate-600'}`}>
                        {selectedFlight.arrival !== 'Unknown' && selectedFlight.arrival !== 'None' ? getCityName(selectedFlight.arrival) : 'TBD'}
                      </p>
                      {selectedFlight.arrival !== 'Unknown' && selectedFlight.arrival !== 'None' && (
                        <p className="text-lg text-slate-400 font-mono mt-1">({selectedFlight.arrival})</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center text-slate-400 text-sm mb-2"><Globe className="w-4 h-4 mr-2"/> Country</div>
                      <p className="text-xl font-bold text-white">{selectedFlight.origin_country}</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center text-slate-400 text-sm mb-2"><Compass className="w-4 h-4 mr-2"/> Transponder</div>
                      <p className="text-xl font-bold text-white uppercase font-mono">{selectedFlight.icao24}</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center text-slate-400 text-sm mb-2"><MapPin className="w-4 h-4 mr-2"/> Altitude</div>
                      <p className="text-xl font-bold text-white">{(selectedFlight.altitude_m * 3.28084).toFixed(0)} ft</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center text-slate-400 text-sm mb-2"><Wind className="w-4 h-4 mr-2"/> Heading</div>
                      <p className="text-xl font-bold text-white">{selectedFlight.true_track}°</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center bg-black/20 p-5 rounded-2xl border border-white/5">
                    <p className="text-slate-400 font-mono text-sm mb-4 md:mb-0 flex items-center">
                      <span className="text-amber-500 mr-2">GPS:</span> {selectedFlight.latitude.toFixed(4)}°, {selectedFlight.longitude.toFixed(4)}°
                    </p>
                    <button 
                      onClick={() => {
                        setDepCode(selectedFlight.departure);
                        if (selectedFlight.arrival && selectedFlight.arrival !== 'Unknown' && selectedFlight.arrival !== 'None') {
                          setArrCode(selectedFlight.arrival);
                        }
                        setActiveTab('aviation');
                        fetchAviationRoute(selectedFlight.departure, selectedFlight.arrival !== 'Unknown' ? selectedFlight.arrival : arrCode);
                      }}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] transition-all duration-300 hover:-translate-y-0.5"
                    >
                      Run Aviation Weather Check <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {liveFlights.length > 0 && !selectedFlight && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveFlights.map((f, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleLiveFlightClick(f)} 
                    className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl cursor-pointer hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 border border-white/5 hover:border-white/20 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                  >
                    <div className="absolute top-0 right-0 px-3 py-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-900/30 rounded-bl-xl border-b border-l border-emerald-500/20 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                      LIVE
                    </div>
                    
                    <div>
                      <Plane className="w-8 h-8 text-slate-500 group-hover:text-amber-400 mb-4 transition-colors duration-300" />
                      <p className="text-white font-black text-2xl mb-4 tracking-tight">{f.callsign}</p>
                      
                      <div className="flex items-center justify-between text-sm font-mono bg-black/30 rounded-xl p-3 border border-white/5 mb-4 group-hover:border-white/10 transition-colors">
                        <div className="text-center">
                          <p className="text-slate-500 text-[10px] uppercase mb-0.5">Dep</p>
                          <p className="text-sky-400 font-bold">{getCityName(f.departure)} ({f.departure})</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600" />
                        <div className="text-center">
                          <p className="text-slate-500 text-[10px] uppercase mb-0.5">Arr</p>
                          <p className={`font-bold ${f.arrival !== 'Unknown' && f.arrival !== 'None' ? 'text-indigo-400' : 'text-slate-600'}`}>
                            {f.arrival !== 'Unknown' && f.arrival !== 'None' ? `${getCityName(f.arrival)} (${f.arrival})` : 'TBD'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="space-y-1 text-xs text-slate-400 font-mono">
                        <p>Alt: <span className="text-white">{(f.altitude_m * 3.28084).toFixed(0)} ft</span></p>
                        <p>Spd: <span className="text-white">{(f.velocity_ms * 1.94384).toFixed(0)} kt</span></p>
                      </div>
                      <div className="text-xs text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        Details ➔
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!liveFlights.length && !loadingFlights && !liveError && (
              <div className="bg-slate-900/30 backdrop-blur-sm rounded-3xl p-16 text-center border border-white/5 shadow-inner">
                <Activity className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <p className="text-slate-400 text-xl font-light">Enter a departure airport to intercept live flights.</p>
              </div>
            )}
          </div>
        )}

        {/* AVIATION TAB */}
        {activeTab === 'aviation' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
            <div className="relative z-50 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
              <AirportSearch value={depCode} onChange={setDepCode} onSelect={setDepCode} placeholder="Departure" />
              <div className="hidden md:flex items-center text-slate-600 px-2"><ArrowRight className="w-8 h-8"/></div>
              <AirportSearch value={arrCode} onChange={setArrCode} onSelect={setArrCode} placeholder="Arrival" />
              <button 
                onClick={() => fetchAviationRoute(depCode, arrCode)} 
                className="bg-sky-500 hover:bg-sky-400 text-slate-900 px-10 py-4 rounded-2xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] hover:-translate-y-0.5"
              >
                {aviationLoading ? 'Analyzing...' : 'Analyze Route'}
              </button>
            </div>

            {aviationError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-center shadow-lg">
                <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0" /> <span className="font-medium">{aviationError}</span>
              </div>
            )}

            {aviationData && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-sky-900/30 to-indigo-900/20 backdrop-blur-xl border border-sky-500/20 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
                   <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl"></div>
                   <div className="relative z-10">
                     <h3 className="text-sky-400 font-bold mb-3 flex items-center text-lg uppercase tracking-wider">
                       <AlertTriangle className="w-5 h-5 mr-2" /> AI Economic & Risk Summary
                     </h3>
                     <p className="text-2xl font-light text-white leading-relaxed max-w-3xl">{aviationData.risk_summary}</p>
                   </div>
                   <button onClick={exportAviationPDF} className="mt-6 md:mt-0 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center transition-all duration-300 relative z-10">
                     <Download className="w-5 h-5 mr-2" /> Export PDF
                   </button>
                </div>
                
                {(aviationData.departure.taf.length > 0 || aviationData.arrival.taf.length > 0) && (
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                      <h3 className="text-white font-bold flex items-center text-lg mb-4 md:mb-0">
                        <Clock className="w-5 h-5 mr-3 text-sky-400" /> Predictive TAF Timeline
                      </h3>
                      
                      <div className="text-sm font-mono bg-sky-900/20 text-sky-300 border border-sky-500/20 px-4 py-2 rounded-xl flex items-center shadow-inner">
                        {(() => {
                          if (tafSliderIndex === 0) return <><span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse mr-2"></span> Active: Current Weather (METAR)</>;
                          const dIdx = Math.min(tafSliderIndex - 1, aviationData.departure.taf.length - 1);
                          const dTime = aviationData.departure.taf[dIdx]?.time_label;
                          return <><span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span> Target Chronological Time: {dTime || "Future"}</>;
                        })()}
                      </div>
                    </div>

                    <div className="relative pt-2 pb-4">
                      <input 
                        type="range" 
                        min="0" 
                        max={Math.max(aviationData.departure.taf.length, aviationData.arrival.taf.length)} 
                        value={tafSliderIndex} 
                        onChange={(e) => setTafSliderIndex(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono font-bold uppercase tracking-widest">
                      <span>Now</span>
                      <span>Future ➔</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {renderAirportMetrics(aviationData.departure, "Departure", true)}
                  {renderAirportMetrics(aviationData.arrival, "Arrival", false)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MARINE TAB */}
        {activeTab === 'marine' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
            <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl flex items-center text-orange-400 shadow-lg animate-pulse">
              <Radio className="w-5 h-5 mr-3"/> <span className="font-medium tracking-wide">Simulated "Cyclone Tej" is active at Lat 17.0, Lon 72.0 for hackathon testing.</span>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between space-y-6 lg:space-y-0 lg:space-x-6 bg-slate-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
              
              {/* Departure Group */}
              <div className="flex-1 bg-black/20 p-5 rounded-2xl border border-white/5 relative">
                <p className="absolute -top-3 left-4 bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">Departure Origin</p>
                <div className="flex space-x-3 mt-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest ml-2 mb-1 block">Latitude</label>
                    <input type="text" value={startLat} onChange={(e)=>setStartLat(e.target.value)} placeholder="Lat" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-white font-mono" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest ml-2 mb-1 block">Longitude</label>
                    <input type="text" value={startLon} onChange={(e)=>setStartLon(e.target.value)} placeholder="Lon" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-white font-mono" />
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-center text-slate-600">
                <ArrowRight className="w-8 h-8"/>
              </div>

              {/* Arrival Group */}
              <div className="flex-1 bg-black/20 p-5 rounded-2xl border border-white/5 relative">
                <p className="absolute -top-3 left-4 bg-indigo-900/80 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-500/30">Arrival Destination</p>
                <div className="flex space-x-3 mt-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest ml-2 mb-1 block">Latitude</label>
                    <input type="text" value={endLat} onChange={(e)=>setEndLat(e.target.value)} placeholder="Lat" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-white font-mono" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest ml-2 mb-1 block">Longitude</label>
                    <input type="text" value={endLon} onChange={(e)=>setEndLon(e.target.value)} placeholder="Lon" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-white font-mono" />
                  </div>
                </div>
              </div>

              <button 
                onClick={fetchMarineRoute} 
                className="lg:w-auto w-full bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-5 rounded-2xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 self-center mt-6 lg:mt-0"
              >
                {marineLoading ? 'Scanning...' : 'Scan Path'}
              </button>
            </div>

            {marineData && (
              <div className={`backdrop-blur-xl border rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden ${marineData.safety_status.includes('EMERGENCY') ? 'bg-red-900/20 border-red-500/30' : 'bg-indigo-900/20 border-indigo-500/20'}`}>
                 <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-50 ${marineData.safety_status.includes('EMERGENCY') ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}></div>
                 <div className="relative z-10">
                   <h3 className={`font-bold mb-3 flex items-center text-lg uppercase tracking-wider ${marineData.safety_status.includes('EMERGENCY') ? 'text-red-400' : 'text-indigo-400'}`}>
                     <Waves className="w-5 h-5 mr-2" /> AI Route Alert
                   </h3>
                   <p className="text-2xl font-light text-white leading-relaxed max-w-3xl">{marineData.ai_summary}</p>
                   <p className="mt-5 text-sm text-slate-400 font-mono bg-black/30 inline-flex px-4 py-2 rounded-xl border border-white/5">Max detected wave height: <span className="text-white ml-2 font-bold">{marineData.max_wave_height}m</span></p>
                 </div>
                 <button onClick={exportMarinePDF} className="mt-6 md:mt-0 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center transition-all duration-300 relative z-10">
                   <Download className="w-5 h-5 mr-2" /> Export PDF
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value }) => (
  <div className="bg-black/20 p-5 rounded-2xl flex items-center space-x-4 border border-white/5 hover:bg-black/30 transition-colors">
    <div className="p-3 bg-slate-800/50 rounded-xl text-sky-400 border border-white/5 shadow-inner">{icon}</div>
    <div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  </div>
);

export default AviationMarineDashboard;
