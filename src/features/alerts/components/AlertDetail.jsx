import { useState, useEffect } from 'react';
import { getSeverityConfig, formatTime } from '../utils.js';
import { fetchAlert } from '../services/alertApi.js';
export function AlertDetail({ alert, onClose, networkOnline }) {
  const [full, setFull] = useState(null);
  const sev = getSeverityConfig(alert.severity);
  useEffect(() => {
    setFull(null);
    if (networkOnline) {
      fetchAlert(alert.id).then(setFull).catch(() => {});
    }
  }, [alert.id, networkOnline]);
  const data = full || alert;
  const isCompact = !data.headline && !data.description && !data.issuedAt;

  return (
    <aside className="alert-detail" role="complementary" aria-label="Alert details">
      <div className="detail-header">
        <button className="detail-close" onClick={onClose} aria-label="Close detail panel">&times;</button>
      </div>
      <div className="detail-body">
        <div className="detail-severity" style={{ color: sev.color, backgroundColor: sev.bg }}>
          <span aria-hidden="true">{sev.icon}</span> {sev.label}
        </div>
        <h2 className="detail-event">{data.event}</h2>
        {data.headline && <p className="detail-headline">{data.headline}</p>}
        {isCompact && !networkOnline && (
          <div className="compact-warning" style={{ background: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <strong>Offline Mode:</strong> Full details for this alert are not available without a network connection.
          </div>
        )}
        {isCompact && networkOnline && !full && (
          <div style={{ color: '#666', fontStyle: 'italic', marginBottom: '1rem' }}>Loading full details...</div>
        )}
        <dl className="detail-grid">
          <dt>Affected Area</dt>
          <dd>{data.area || '—'}</dd>
          <dt>Status</dt>
          <dd>
            {data.status ? (
              <span className={`status-tag status-${data.status.toLowerCase()}`}>{data.status}</span>
            ) : '—'}
          </dd>
          <dt>Issued</dt>
          <dd>{data.issuedAt ? formatTime(data.issuedAt) : '—'}</dd>
          <dt>Effective</dt>
          <dd>{data.effectiveAt ? formatTime(data.effectiveAt) : '—'}</dd>
          <dt>Expires</dt>
          <dd>{data.expiresAt ? formatTime(data.expiresAt) : '—'}</dd>
          <dt>Urgency</dt>
          <dd>{data.urgency || '—'}</dd>
          <dt>Certainty</dt>
          <dd>{data.certainty || '—'}</dd>
          <dt>Source</dt>
          <dd>{data.source === 'imd' ? 'IMD' : data.source?.toUpperCase() || '—'}</dd>
          {data.updatedAt && (
            <>
              <dt>Last Updated</dt>
              <dd>{formatTime(data.updatedAt)}</dd>
            </>
          )}
        </dl>
        {data.description && (
          <div className="detail-section">
            <h3>Description</h3>
            <p>{data.description}</p>
          </div>
        )}
        {data.instruction && (
          <div className="detail-section detail-instructions">
            <h3>Instructions</h3>
            <p>{data.instruction}</p>
          </div>
        )}
      </div>
    </aside>
  );
}