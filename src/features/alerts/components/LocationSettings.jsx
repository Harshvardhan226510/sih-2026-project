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
    statusText = 'Detecting location...';
  } else if (geoError) {
    statusText = geoError;
  } else if (hasLocation) {
    statusText = isAuto ? 'Location detected automatically' : 'Using manually selected location';
  }

  return (
    <div className="location-minimal">
      {hasLocation ? (
        <div>
          <div className="location-text">
            📍 {location.district ? `${location.district}, ${location.state}` : location.state}
          </div>
          <div className="location-subtext">{statusText}</div>
          <button className="location-btn" onClick={() => setShowManual(!showManual)}>
            {showManual ? 'Cancel' : 'Change Location'}
          </button>
        </div>
      ) : (
        <div>
          <div className="location-text" style={{ color: 'var(--severity-extreme)' }}>
            📍 {statusText}
          </div>
          <button className="location-btn" onClick={() => setShowManual(!showManual)}>
            {showManual ? 'Cancel' : 'Set Location'}
          </button>
        </div>
      )}

      {showManual && (
        <form onSubmit={handleManualSubmit} style={{ marginTop: '16px' }}>
          <div className="filter-group" style={{ marginBottom: '8px' }}>
            <label htmlFor="user-state">State</label>
            <input 
              id="user-state" 
              type="text" 
              value={state} 
              onChange={e => setState(e.target.value)} 
              placeholder="e.g. Karnataka" 
            />
          </div>
          <div className="filter-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="user-district">District</label>
            <input 
              id="user-district" 
              type="text" 
              value={district} 
              onChange={e => setDistrict(e.target.value)} 
              placeholder="e.g. Dakshina Kannada" 
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={{ flex: 1, padding: '10px', background: 'var(--text-main)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              Save
            </button>
            <button type="button" onClick={handleAutoDetect} disabled={isDetecting} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', cursor: isDetecting ? 'wait' : 'pointer', fontWeight: '600' }}>
              {isDetecting ? 'Detecting...' : 'Auto Detect'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
