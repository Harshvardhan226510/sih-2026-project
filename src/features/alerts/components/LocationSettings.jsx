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
  }

  async function handleAutoDetect() {
    try {
      const detectedLocation = await detectLocation();
      onSave(detectedLocation);
      setShowManual(false);
    } catch (err) {
      // Error is already handled by the hook and displayed in the UI
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
    <div className="location-settings filter-group" style={{ padding: '1rem', borderBottom: '1px solid #333', marginBottom: '1rem' }}>
      <h3 style={{ margin: '0 0 1rem 0' }}>Location</h3>
      
      <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
        {hasLocation ? (
          <div>
            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span>📍 {location.state}</span>
            </div>
            {location.district && <div style={{ paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>{location.district}</div>}
            <div style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic', marginBottom: '0.5rem' }}>
              {statusText}
            </div>
            {isAuto && location.accuracy && (
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                Accuracy: approximately {Math.round(location.accuracy)} m
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#ff6b6b' }}>
              📍 {statusText}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
              Find alerts near you
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          onClick={handleAutoDetect}
          disabled={isDetecting}
          style={{ 
            padding: '0.5rem 1rem', 
            background: isDetecting ? '#4b5563' : '#1e40af', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: isDetecting ? 'wait' : 'pointer' 
          }}
        >
          {isDetecting ? 'Detecting...' : (hasLocation ? 'Refresh Location' : 'Use My Location')}
        </button>

        {geoError && !showManual && (
          <button
            onClick={() => setShowManual(true)}
            style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#aaa', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}
          >
            Enter Location Manually
          </button>
        )}
        
        {!geoError && !hasLocation && !showManual && (
           <button
            onClick={() => setShowManual(true)}
            style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#aaa', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            Enter Location Manually
          </button>
        )}
        
        {(!isAuto || showManual) && hasLocation && !showManual && (
          <button
            onClick={() => setShowManual(true)}
            style={{ padding: '0.25rem 0.5rem', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
          >
            Edit Manual Location
          </button>
        )}
      </div>

      {showManual && (
        <form onSubmit={handleManualSubmit} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #444' }}>
          <div className="filter-group" style={{ marginBottom: '0.5rem' }}>
            <label htmlFor="user-state" style={{ fontSize: '0.85rem' }}>State</label>
            <input 
              id="user-state" 
              type="text" 
              value={state} 
              onChange={e => setState(e.target.value)} 
              placeholder="e.g. Karnataka" 
              style={{ width: '100%', padding: '0.4rem', marginTop: '0.25rem', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="filter-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="user-district" style={{ fontSize: '0.85rem' }}>District</label>
            <input 
              id="user-district" 
              type="text" 
              value={district} 
              onChange={e => setDistrict(e.target.value)} 
              placeholder="e.g. Dakshina Kannada" 
              style={{ width: '100%', padding: '0.4rem', marginTop: '0.25rem', fontSize: '0.9rem' }} 
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.4rem', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Save
            </button>
            <button type="button" onClick={() => setShowManual(false)} style={{ flex: 1, padding: '0.4rem', background: 'transparent', color: '#aaa', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
