import { runQuery, runExec, runGet, saveDb } from '../db/connection.js';
const COMPACT_FIELDS = 'id, source, event, headline, severity, urgency, certainty, status, effective_at as effectiveAt, expires_at as expiresAt, issued_at as issuedAt, area, area_code as areaCode, latitude, longitude, revision, updated_at as updatedAt';
const FULL_FIELDS = 'id, source, source_id as sourceId, event, headline, description, instruction, severity, urgency, certainty, status, effective_at as effectiveAt, expires_at as expiresAt, issued_at as issuedAt, area, area_code as areaCode, latitude, longitude, polygon, language, revision, created_at as createdAt, updated_at as updatedAt';
export class AlertRepository {
  getAll({ severity, event, area, status, page = 1, limit = 50, updatedSince } = {}) {
    const conditions = [];
    const params = [];
    if (severity) { conditions.push('severity = ?'); params.push(severity); }
    if (event) { conditions.push('event LIKE ?'); params.push(`%${event}%`); }
    if (area) { conditions.push('(area LIKE ? OR area_code LIKE ?)'); params.push(`%${area}%`, `%${area}%`); }
    if (status) { conditions.push('status = ?'); params.push(status); }
    if (updatedSince) { conditions.push('updated_at > ?'); params.push(updatedSince); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const countRow = runGet(`SELECT COUNT(*) as total FROM alerts ${where}`, params);
    const rows = runQuery(
      `SELECT ${COMPACT_FIELDS} FROM alerts ${where} ORDER BY issued_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { alerts: rows, total: countRow?.total || 0, page, limit };
  }
  getById(id) {
    return runGet(`SELECT ${FULL_FIELDS} FROM alerts WHERE id = ?`, [id]);
  }
  getBySourceId(sourceId) {
    return runGet(`SELECT ${FULL_FIELDS} FROM alerts WHERE source_id = ?`, [sourceId]);
  }
  getExistingBySourceIds(sourceIds) {
    if (!sourceIds.length) return new Map();
    const placeholders = sourceIds.map(() => '?').join(',');
    const rows = runQuery(`SELECT ${FULL_FIELDS} FROM alerts WHERE source_id IN (${placeholders})`, sourceIds);
    return new Map(rows.map(r => [r.sourceId, r]));
  }
  create(alert, revision) {
    const now = new Date().toISOString();
    runExec(`
      INSERT INTO alerts (id, source, source_id, event, headline, description, instruction,
        severity, urgency, certainty, status, effective_at, expires_at, issued_at,
        area, area_code, latitude, longitude, polygon, language, raw_data, revision, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      alert.id, alert.source, alert.sourceId, alert.event, alert.headline, alert.description,
      alert.instruction, alert.severity, alert.urgency, alert.certainty, alert.status,
      alert.effectiveAt, alert.expiresAt, alert.issuedAt, alert.area, alert.areaCode,
      alert.latitude, alert.longitude, alert.polygon, alert.language, alert.rawData,
      revision, now, now,
    ]);
    this.recordRevision(alert.id, revision, 'created');
  }
  update(alert, revision) {
    const now = new Date().toISOString();
    runExec(`
      UPDATE alerts SET event = ?, headline = ?, description = ?, instruction = ?,
        severity = ?, urgency = ?, certainty = ?, status = ?, effective_at = ?,
        expires_at = ?, area = ?, area_code = ?, latitude = ?, longitude = ?,
        polygon = ?, raw_data = ?, revision = ?, updated_at = ?
      WHERE id = ?
    `, [
      alert.event, alert.headline, alert.description, alert.instruction,
      alert.severity, alert.urgency, alert.certainty, alert.status,
      alert.effectiveAt, alert.expiresAt, alert.area, alert.areaCode,
      alert.latitude, alert.longitude, alert.polygon, alert.rawData,
      revision, now, alert.id,
    ]);
    this.recordRevision(alert.id, revision, 'updated');
  }
  getSyncData(sinceRevision, { state, district, networkProfile } = {}) {
    const isVerySlow = networkProfile === 'slow';
    const fields = isVerySlow 
      ? 'id, severity as s, event as e, area as a, expires_at as x' 
      : COMPACT_FIELDS;

    let alertQuery = `SELECT ${fields} FROM alerts WHERE revision > ?`;
    let params = [sinceRevision];

    if (state || district) {
      const locationConditions = [];
      locationConditions.push(`severity = 'Extreme'`);
      if (state) {
        locationConditions.push(`area LIKE ?`);
        params.push(`%${state}%`);
      }
      if (district) {
        locationConditions.push(`area LIKE ?`);
        params.push(`%${district}%`);
      }
      alertQuery += ` AND (${locationConditions.join(' OR ')})`;
    }

    alertQuery += ' ORDER BY revision ASC';
    const alerts = runQuery(alertQuery, params);

    const removed = runQuery(
      `SELECT alert_id as id FROM alert_revisions WHERE revision > ? AND action IN ('expired', 'cancelled', 'deleted')`,
      [sinceRevision]
    ).map(r => r.id);
    const activeRows = runQuery(`SELECT id FROM alerts WHERE status = 'ACTIVE'`);
    const activeIds = activeRows.map(r => r.id);
    const currentRevision = this.getCurrentRevision();
    return { revision: currentRevision, alerts, removed, activeIds };
  }
  getBootstrapData() {
    const alerts = runQuery(`SELECT ${COMPACT_FIELDS} FROM alerts WHERE status = 'ACTIVE' ORDER BY issued_at DESC LIMIT 100`);
    const activeIds = alerts.map(a => a.id);
    const currentRevision = this.getCurrentRevision();
    return { revision: currentRevision, alerts, removed: [], activeIds };
  }
  getSummary() {
    const total = runGet("SELECT COUNT(*) as count FROM alerts WHERE status = 'ACTIVE'")?.count || 0;
    const extreme = runGet("SELECT COUNT(*) as count FROM alerts WHERE status = 'ACTIVE' AND severity = 'Extreme'")?.count || 0;
    const severe = runGet("SELECT COUNT(*) as count FROM alerts WHERE status = 'ACTIVE' AND severity = 'Severe'")?.count || 0;
    const moderate = runGet("SELECT COUNT(*) as count FROM alerts WHERE status = 'ACTIVE' AND severity = 'Moderate'")?.count || 0;
    const minor = runGet("SELECT COUNT(*) as count FROM alerts WHERE status = 'ACTIVE' AND severity = 'Minor'")?.count || 0;
    const revision = this.getCurrentRevision();
    return { total, extreme, severe, moderate, minor, revision };
  }
  getCurrentRevision() {
    return runGet('SELECT revision FROM sync_state WHERE id = 1')?.revision || 0;
  }
  nextRevision() {
    return this.getCurrentRevision() + 1;
  }
  updateSyncRevision(revision) {
    runExec('UPDATE sync_state SET revision = ?, updated_at = ? WHERE id = 1', [revision, new Date().toISOString()]);
  }
  recordRevision(alertId, revision, action, diff = null) {
    runExec(
      'INSERT INTO alert_revisions (alert_id, revision, action, diff, created_at) VALUES (?, ?, ?, ?, ?)',
      [alertId, revision, action, diff ? JSON.stringify(diff) : null, new Date().toISOString()]
    );
  }
  getProviderStatus(provider) {
    return runGet('SELECT * FROM provider_status WHERE provider = ?', [provider]);
  }
  updateProviderStatus(provider, success, error = null) {
    const now = new Date().toISOString();
    const existing = this.getProviderStatus(provider);
    if (!existing) {
      runExec(
        `INSERT INTO provider_status (provider, last_success_at, last_failure_at, last_error, consecutive_failures, alert_count, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [provider, success ? now : null, success ? null : now, error, success ? 0 : 1, now]
      );
    } else if (success) {
      runExec('UPDATE provider_status SET last_success_at = ?, consecutive_failures = 0, updated_at = ? WHERE provider = ?', [now, now, provider]);
    } else {
      runExec('UPDATE provider_status SET last_failure_at = ?, last_error = ?, consecutive_failures = consecutive_failures + 1, updated_at = ? WHERE provider = ?', [now, error, now, provider]);
    }
  }
  updateProviderAlertCount(provider, count) {
    runExec('UPDATE provider_status SET alert_count = ?, updated_at = ? WHERE provider = ?', [count, new Date().toISOString(), provider]);
  }
  getAllProviderStatuses() {
    return runQuery('SELECT * FROM provider_status');
  }
}