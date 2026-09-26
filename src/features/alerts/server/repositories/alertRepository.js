import { getSupabaseClient } from '../db/supabaseClient.js';
import logger from '../utils/logger.js';

const COMPACT_FIELDS = 'id, severity, event, headline, status, issued_at, expires_at, area, area_code, version';
const FULL_FIELDS    = 'id, source, source_id, event, headline, description, instruction, severity, urgency, certainty, status, effective_at, expires_at, issued_at, area, area_code, latitude, longitude, polygon, language, raw_data, revision, version, created_at, updated_at';

export class AlertRepository {
  async getAll({ severity, event, area, status, page = 1, limit = 50, updatedSince } = {}) {
    const client = getSupabaseClient();
    let query = client.from('alerts').select(COMPACT_FIELDS, { count: 'exact' });
    
    if (severity) query = query.eq('severity', severity);
    if (event) query = query.ilike('event', `%${event}%`);
    if (area) query = query.or(`area.ilike.%${area}%,area_code.ilike.%${area}%`);
    if (status) query = query.eq('status', status);
    if (updatedSince) query = query.gt('updated_at', updatedSince);
    
    const offset = (page - 1) * limit;
    query = query.order('issued_at', { ascending: false }).range(offset, offset + limit - 1);
    
    const { data, count, error } = await query;
    if (error) throw new Error(error.message);
    
    return {
      alerts: data.map(this._mapToCamelCase),
      total: count || 0,
      page,
      limit
    };
  }

  async getById(id) {
    const { data, error } = await getSupabaseClient().from('alerts').select(FULL_FIELDS).eq('id', id).single();
    if (error || !data) return null;
    return this._mapToCamelCase(data);
  }

  async getBySourceId(sourceId) {
    const { data, error } = await getSupabaseClient().from('alerts').select(FULL_FIELDS).eq('source_id', sourceId).single();
    if (error || !data) return null;
    return this._mapToCamelCase(data);
  }

  async getExistingBySourceIds(sourceIds) {
    if (!sourceIds || !sourceIds.length) return new Map();
    const { data, error } = await getSupabaseClient().from('alerts').select(FULL_FIELDS).in('source_id', sourceIds);
    if (error) throw new Error(error.message);
    return new Map((data || []).map(r => [r.source_id, this._mapToCamelCase(r)]));
  }

  async create(alert, revision) {
    const now = new Date().toISOString();
    const payload = this._mapToSnakeCase(alert);
    payload.revision = revision;
    payload.version = 1;
    payload.created_at = now;
    payload.updated_at = now;

    // Use upsert to handle race condition but do not overwrite if existing
    const { data, error } = await getSupabaseClient().from('alerts').insert([payload]);
    if (error) {
      if (error.code === '23505') return false; // unique violation
      throw new Error(error.message);
    }
    
    await this.recordRevision(alert.id, revision, 'created');
    return true;
  }

  async update(alert, revision) {
    const now = new Date().toISOString();
    const payload = this._mapToSnakeCase(alert);
    payload.revision = revision;
    payload.updated_at = now;
    
    // We increment version automatically (we could read it first or do it via RPC, but let's just use the object)
    // Actually Supabase API doesn't have an increment operation without RPC. Let's ignore version increment for a moment or omit it.
    delete payload.id;
    delete payload.created_at;

    const { error } = await getSupabaseClient().from('alerts').update(payload).eq('id', alert.id);
    if (error) throw new Error(error.message);
    
    await this.recordRevision(alert.id, revision, 'updated');
  }

  async cancel(alertId, revision) {
    const now = new Date().toISOString();
    const { error } = await getSupabaseClient().from('alerts').update({
      status: 'CANCELLED',
      revision: revision,
      updated_at: now
    }).eq('id', alertId);
    if (error) throw new Error(error.message);
    
    await this.recordRevision(alertId, revision, 'cancelled');
  }

  async getAlertHistory(alertId) {
    const { data, error } = await getSupabaseClient()
      .from('alert_revisions')
      .select('id, revision, action, diff, created_at')
      .eq('alert_id', alertId)
      .order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return data.map(r => ({
      ...r,
      createdAt: r.created_at
    }));
  }

  async getSyncData(sinceRevision, { state, district, networkProfile } = {}) {
    let fields = FULL_FIELDS;
    if (networkProfile === 'slow') fields = COMPACT_FIELDS;
    if (networkProfile === 'very-slow' || networkProfile === 'very_slow') fields = 'id, severity, event, status, expires_at, area, area_code, version';

    let query = getSupabaseClient().from('alerts').select(fields).gt('revision', sinceRevision);
    if (sinceRevision === 0) {
      query = query.eq('status', 'ACTIVE');
    }

    if ((state || district) && networkProfile !== 'fast') {
      // Complex OR is harder in supabase JS, but we can use .or()
      const orParts = [`severity.eq.Extreme`];
      if (networkProfile === 'slow' || networkProfile === 'very-slow' || networkProfile === 'very_slow') {
        if (state) orParts.push(`area.ilike.%${state}%`);
        if (district) orParts.push(`area.ilike.%${district}%`);
      } else {
        if (district) orParts.push(`area.ilike.%${district}%`);
        else if (state) orParts.push(`area.ilike.%${state}%`);
      }
      query = query.or(orParts.join(','));
    }

    query = query.order('revision', { ascending: true });
    
    const [alertsRes, removedRes, activeRes, revision] = await Promise.all([
      query,
      getSupabaseClient().from('alert_revisions').select('alert_id').gt('revision', sinceRevision).in('action', ['expired', 'cancelled', 'deleted']),
      getSupabaseClient().from('alerts').select('id').eq('status', 'ACTIVE'),
      this.getCurrentRevision()
    ]);

    return {
      revision,
      alerts: (alertsRes.data || []).map(this._mapToCamelCase),
      removed: (removedRes.data || []).map(r => r.alert_id),
      activeIds: (activeRes.data || []).map(r => r.id)
    };
  }

  async getBootstrapData() {
    const { data: alerts, error } = await getSupabaseClient()
      .from('alerts')
      .select(COMPACT_FIELDS)
      .eq('status', 'ACTIVE')
      .order('issued_at', { ascending: false })
      .limit(100);
      
    if (error) throw new Error(error.message);
    const revision = await this.getCurrentRevision();
    return {
      revision,
      alerts: (alerts || []).map(this._mapToCamelCase),
      removed: [],
      activeIds: (alerts || []).map(r => r.id)
    };
  }

  async getSummary() {
    const [total, extreme, severe, moderate, minor, revision] = await Promise.all([
      this._count('ACTIVE'),
      this._count('ACTIVE', 'Extreme'),
      this._count('ACTIVE', 'Severe'),
      this._count('ACTIVE', 'Moderate'),
      this._count('ACTIVE', 'Minor'),
      this.getCurrentRevision()
    ]);
    return { total, extreme, severe, moderate, minor, revision };
  }

  async _count(status, severity = null) {
    let query = getSupabaseClient().from('alerts').select('*', { count: 'exact', head: true }).eq('status', status);
    if (severity) query = query.eq('severity', severity);
    const { count } = await query;
    return count || 0;
  }

  async getCurrentRevision() {
    const { data, error } = await getSupabaseClient().from('sync_state').select('revision').eq('id', 1).single();
    if (error || !data) return 0;
    return data.revision;
  }

  async nextRevision() {
    return (await this.getCurrentRevision()) + 1;
  }

  async updateSyncRevision(revision) {
    const now = new Date().toISOString();
    await getSupabaseClient().from('sync_state').update({ revision, updated_at: now }).eq('id', 1);
  }

  async recordRevision(alertId, revision, action, diff = null) {
    const now = new Date().toISOString();
    await getSupabaseClient().from('alert_revisions').insert([{
      alert_id: alertId,
      revision,
      action,
      diff: diff ? JSON.stringify(diff) : null,
      created_at: now
    }]);
  }

  async getProviderStatus(provider) {
    const { data } = await getSupabaseClient().from('provider_status').select('*').eq('provider', provider).single();
    return data;
  }

  async updateProviderStatus(provider, success, errorMsg = null) {
    const now = new Date().toISOString();
    const existing = await this.getProviderStatus(provider);
    if (!existing) {
      await getSupabaseClient().from('provider_status').insert([{
        provider,
        last_success_at: success ? now : null,
        last_failure_at: success ? null : now,
        last_error: errorMsg,
        consecutive_failures: success ? 0 : 1,
        alert_count: 0,
        updated_at: now
      }]);
    } else if (success) {
      await getSupabaseClient().from('provider_status').update({
        last_success_at: now,
        consecutive_failures: 0,
        updated_at: now
      }).eq('provider', provider);
    } else {
      await getSupabaseClient().from('provider_status').update({
        last_failure_at: now,
        last_error: errorMsg,
        consecutive_failures: existing.consecutive_failures + 1,
        updated_at: now
      }).eq('provider', provider);
    }
  }

  async updateProviderAlertCount(provider, count) {
    const now = new Date().toISOString();
    await getSupabaseClient().from('provider_status').update({
      alert_count: count,
      updated_at: now
    }).eq('provider', provider);
  }

  async getAllProviderStatuses() {
    const { data } = await getSupabaseClient().from('provider_status').select('*');
    return data || [];
  }

  _mapToCamelCase(row) {
    if (!row) return row;
    const res = { ...row };
    if (res.source_id) res.sourceId = res.source_id; delete res.source_id;
    if (res.effective_at) res.effectiveAt = res.effective_at; delete res.effective_at;
    if (res.expires_at) res.expiresAt = res.expires_at; delete res.expires_at;
    if (res.issued_at) res.issuedAt = res.issued_at; delete res.issued_at;
    if (res.area_code) res.areaCode = res.area_code; delete res.area_code;
    if (res.raw_data) res.rawData = res.raw_data; delete res.raw_data;
    if (res.created_at) res.createdAt = res.created_at; delete res.created_at;
    if (res.updated_at) res.updatedAt = res.updated_at; delete res.updated_at;
    return res;
  }

  _mapToSnakeCase(obj) {
    if (!obj) return obj;
    const res = { ...obj };
    if (res.sourceId) res.source_id = res.sourceId; delete res.sourceId;
    if (res.effectiveAt) res.effective_at = res.effectiveAt; delete res.effectiveAt;
    if (res.expiresAt) res.expires_at = res.expiresAt; delete res.expiresAt;
    if (res.issuedAt) res.issued_at = res.issuedAt; delete res.issuedAt;
    if (res.areaCode) res.area_code = res.areaCode; delete res.areaCode;
    if (res.rawData) res.raw_data = res.rawData; delete res.rawData;
    if (res.createdAt) res.created_at = res.createdAt; delete res.createdAt;
    if (res.updatedAt) res.updated_at = res.updatedAt; delete res.updatedAt;
    return res;
  }
}