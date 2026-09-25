import { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation.js';

export function LocationSettings({ location, onSave }) {
  const [state, setState] = useState(location.state || '');
  const [district, setDistrict] = useState(location.district || '');
  const [showManual, setShowManual] = useState(false);
  
  const { detectLocation, isDetecting, error: geoError } = useGeolocation();

  useEffect(() => {
    setState(location.state || '');
    setDistrict(location.district || '');
  }, [location]);

  function handleManualSubmit(e) {
    e.preventDefault();
    onSave({ state, district, source: 'manual' });
    setShowManual(false);
  }

  async function handleAutoDetect() {
    try {
      const detectedLocation = await detectLocation();
      onSave(detectedLocation);
      setShowManual(false);
    } catch (err) {
      console.warn("Geolocation failed:", err);
    }
  }

  const isAuto = location.source === 'auto';
  const hasLocation = Boolean(location.state || location.district);

  let statusText = 'Location unavailable';
  if (isDetecting) {
    statusText = 'Detecting coordinates...';
  } else if (geoError) {
    statusText = geoError;
  } else if (hasLocation) {
    statusText = isAuto ? 'Location detected automatically' : 'Manually specified location';
  }

  const locationDisplay = location.district 
    ? `${location.district}, ${location.state}` 
    : location.state || 'Select Location';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
        <span>Target Location</span>
        {hasLocation && <span className="text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">ONLINE</span>}
      </div>

      <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="text-blue-500">📍</span>
        <span className="truncate">{locationDisplay}</span>
      </div>

      <div className="text-xs font-medium text-slate-500">
        {statusText}
      </div>

      <button 
        className="mt-2 w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold py-2 rounded-lg transition-colors border border-slate-200"
        onClick={() => setShowManual(!showManual)}
      >
        {showManual ? 'Cancel' : 'Change Location'}
      </button>

      {showManual && (
        <form onSubmit={handleManualSubmit} className="mt-4 flex flex-col gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col gap-1">
            <label htmlFor="user-state" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">State</label>
            <input 
              id="user-state" 
              type="text" 
              value={state} 
              onChange={e => setState(e.target.value)} 
              placeholder="e.g. Maharashtra" 
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="user-district" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">District / City</label>
            <input 
              id="user-district" 
              type="text" 
              value={district} 
              onChange={e => setDistrict(e.target.value)} 
              placeholder="e.g. Pune" 
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
              Save
            </button>
            <button 
              type="button" 
              onClick={handleAutoDetect} 
              disabled={isDetecting}
              className={`flex-1 flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-lg transition-colors border ${isDetecting ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
              title="Detect my location"
            >
              {isDetecting ? '...' : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Auto
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
