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
    <div className="sidebar-panel-card location-instrument">
      <div className="instrument-label">
        <span>Target Location</span>
        {hasLocation && <span className="text-[10px] text-emerald-400">ONLINE</span>}
      </div>

      <div className="location-title">
        <span>📍</span>
        <span className="truncate">{locationDisplay}</span>
      </div>

      <div className="location-status">
        {statusText}
      </div>

      <button 
        className="location-action-btn"
        onClick={() => setShowManual(!showManual)}
      >
        {showManual ? 'Cancel' : 'Change Location'}
      </button>

      {showManual && (
        <form onSubmit={handleManualSubmit} className="location-manual-form">
          <div className="form-group-compact">
            <label htmlFor="user-state">State</label>
            <input 
              id="user-state" 
              type="text" 
              value={state} 
              onChange={e => setState(e.target.value)} 
              placeholder="e.g. Maharashtra" 
              required
            />
          </div>
          <div className="form-group-compact">
            <label htmlFor="user-district">District / City</label>
            <input 
              id="user-district" 
              type="text" 
              value={district} 
              onChange={e => setDistrict(e.target.value)} 
              placeholder="e.g. Pune" 
            />
          </div>
          <div className="form-actions-compact">
            <button type="submit" className="btn-primary-compact">
              Save
            </button>
            <button 
              type="button" 
              onClick={handleAutoDetect} 
              disabled={isDetecting}
              className="btn-secondary-compact"
            >
              {isDetecting ? 'Detecting…' : 'Auto Detect'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
