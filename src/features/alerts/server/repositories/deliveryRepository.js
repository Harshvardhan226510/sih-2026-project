import { getSupabaseClient } from '../db/supabaseClient.js';

export class DeliveryRepository {
  async registerDevice(id, state, district) {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    
    // Check if exists
    const { data: existing } = await client.from('devices').select('device_id').eq('device_id', id).single();
    
    if (existing) {
      await client.from('devices').update({
        state,
        district,
        updated_at: now
      }).eq('device_id', id);
    } else {
      await client.from('devices').insert([{
        device_id: id,
        state,
        district,
        created_at: now,
        updated_at: now
      }]);
    }
  }

  async enqueueAlert(alertId, deviceId, priority) {
    // simplified implementation
    const client = getSupabaseClient();
    const { data: existing } = await client.from('alert_deliveries')
      .select('id').eq('alert_id', alertId).eq('device_id', deviceId).single();
      
    if (!existing) {
      await client.from('alert_deliveries').insert([{
        alert_id: alertId,
        device_id: deviceId,
        status: 'pending'
      }]);
    }
  }

  async getPendingAlerts(deviceId) {
    const client = getSupabaseClient();
    const { data } = await client.from('alert_deliveries')
      .select('id, alerts!inner(*)')
      .eq('device_id', deviceId)
      .eq('status', 'pending');
      
    if (!data) return [];
    
    // Map alerts properly
    return data.map(row => {
      const a = row.alerts;
      return {
        queueId: row.id,
        id: a.id,
        severity: a.severity,
        event: a.event,
        status: a.status,
        expiresAt: a.expires_at,
        area: a.area,
        areaCode: a.area_code,
        version: a.version
      };
    });
  }

  async acknowledgeAlert(deviceId, alertId) {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    await client.from('alert_deliveries').upsert([{
      alert_id: alertId,
      device_id: deviceId,
      status: 'acknowledged',
      updated_at: now
    }], { onConflict: 'device_id, alert_id' });
  }

  async getDevicesForArea(state, district) {
    const client = getSupabaseClient();
    let query = client.from('devices').select('*');
    
    const conditions = [];
    if (state) conditions.push(`state.ilike.%${state}%`);
    if (district) conditions.push(`district.ilike.%${district}%`);
    
    if (conditions.length > 0) {
      query = query.or(conditions.join(','));
    }
    
    const { data } = await query;
    return data || [];
  }

  async getRetryQueue(limit = 100) {
    const client = getSupabaseClient();
    const { data } = await client.from('alert_deliveries')
      .select('*')
      .eq('status', 'pending')
      .limit(limit);
    return data || [];
  }

  async updateDeliveryAttempt(queueId, status, nextAttemptAt) {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    await client.from('alert_deliveries').update({
      status: status,
      updated_at: now
    }).eq('id', queueId);
  }
}
