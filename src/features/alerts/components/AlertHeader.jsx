import { formatTimeAgo } from '../utils.js';

const STATUS_LABELS = {
  FAST: { text: 'Live', className: 'net-online' },
  NORMAL: { text: 'Live', className: 'net-online' },
  SLOW: { text: 'Slow Connection', className: 'net-slow' },
  VERY_SLOW: { text: 'Degraded Network', className: 'net-very-slow' },
  OFFLINE: { text: 'Offline Mode', className: 'net-offline' },
};

export function AlertHeader({ network, syncStatus, lastSync, onSync }) {
  const netInfo = STATUS_LABELS[network.quality] || STATUS_LABELS.OFFLINE;
  const isSyncing = syncStatus === 'syncing';
  
  return (
    <header className="alert-header" role="banner">
      <div className="header-left">
        <div className="header-title-row">
          <h1 id="dashboard-title">WeatherGPT</h1>
          <span className="header-system-tag">IMD Grid • Live Feed</span>
        </div>
        <div className="header-subtitle hidden sm:block">
          Meteorological alert intelligence & early warning
        </div>
      </div>

      <div className="header-right">
        <div className="sync-container">
          {lastSync && (
            <span className="last-sync" title={new Date(lastSync).toLocaleString()}>
              {formatTimeAgo(lastSync)}
            </span>
          )}
          <button
            className="sync-btn"
            onClick={onSync}
            disabled={isSyncing || !network.online}
            aria-label="Synchronize alerts"
            title="Manual sync"
          >
            <svg className={`sync-icon ${isSyncing ? 'spinning' : ''}`} viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>

        <div className={`network-badge ${netInfo.className}`} role="status" aria-live="polite">
          <span className="net-dot" aria-hidden="true" />
          <span>{isSyncing ? 'Syncing…' : netInfo.text}</span>
        </div>
      </div>
    </header>
  );
}