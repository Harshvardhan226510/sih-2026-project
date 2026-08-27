import { useState, useEffect, useRef } from 'react';
const EFFECTIVE_TYPE_MAP = {
  '4g': 'FAST',
  '3g': 'NORMAL',
  '2g': 'SLOW',
  'slow-2g': 'SLOW',
};
export function useNetwork() {
  const [state, setState] = useState(() => ({
    online: navigator.onLine,
    quality: getInitialQuality(),
    effectiveType: getEffectiveType(),
  }));
  const latencyRef = useRef(null);
  useEffect(() => {
    function handleOnline() { setState(s => ({ ...s, online: true })); measureLatency(); }
    function handleOffline() { setState(s => ({ ...s, online: false, quality: 'OFFLINE' })); }
    function handleConnectionChange() {
      const et = getEffectiveType();
      setState(s => ({ ...s, effectiveType: et, quality: EFFECTIVE_TYPE_MAP[et] || s.quality }));
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const conn = navigator.connection;
    if (conn) conn.addEventListener('change', handleConnectionChange);
    measureLatency();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn) conn.removeEventListener('change', handleConnectionChange);
    };
  }, []);
  function measureLatency() {
    if (!navigator.onLine) return;
    const start = Date.now();
    fetch('/api/health', { method: 'GET', cache: 'no-store' })
      .then(() => {
        const ms = Date.now() - start;
        latencyRef.current = ms;
        let quality = 'FAST';
        if (ms > 3000) quality = 'SLOW';
        else if (ms > 1000) quality = 'NORMAL';
        setState(s => ({ ...s, quality, online: true }));
      })
      .catch(() => {
        setState(s => ({ ...s, quality: navigator.onLine ? 'SLOW' : 'OFFLINE' }));
      });
  }
  return { ...state, measureLatency };
}
function getInitialQuality() {
  if (!navigator.onLine) return 'OFFLINE';
  const et = getEffectiveType();
  return EFFECTIVE_TYPE_MAP[et] || 'NORMAL';
}
function getEffectiveType() {
  return navigator.connection?.effectiveType || '4g';
}