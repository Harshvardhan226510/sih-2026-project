import { getSupabaseClient } from '../db/supabaseClient.js';

export class PushRepository {
  async upsert(deviceId, endpoint, p256dh, auth, state, district) {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    
    // Upsert using endpoint as PK
    await client.from('push_subscriptions').upsert([{
      endpoint,
      device_id: deviceId,
      p256dh,
      auth,
      state: state || null,
      district: district || null,
      updated_at: now,
      created_at: now
    }], { onConflict: 'endpoint' });
  }

  async updateLocation(deviceId, state, district) {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    await client.from('push_subscriptions').update({
      state: state || null,
      district: district || null,
      updated_at: now
    }).eq('device_id', deviceId);
  }

  async getByDeviceId(deviceId) {
    const client = getSupabaseClient();
    const { data } = await client.from('push_subscriptions').select('*').eq('device_id', deviceId);
    return data || [];
  }

  async getForLocation(state, district) {
    const client = getSupabaseClient();
    let query = client.from('push_subscriptions').select('*');
    
    const conditions = [];
    if (state) conditions.push(`state.ilike.%${state}%`);
    if (district) conditions.push(`district.ilike.%${district}%`);
    
    if (conditions.length > 0) {
      query = query.or(conditions.join(','));
    }
    
    const { data } = await query;
    return data || [];
  }

  async getAll() {
    const client = getSupabaseClient();
    const { data } = await client.from('push_subscriptions').select('*');
    return data || [];
  }

  async markSuccess(endpoint) {
    // Note: simplified as we don't have last_success_at in schema, but we can update updated_at
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    await client.from('push_subscriptions').update({
      updated_at: now
    }).eq('endpoint', endpoint);
  }

  async markFailure(endpoint) {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    await client.from('push_subscriptions').update({
      updated_at: now
    }).eq('endpoint', endpoint);
  }

  async remove(endpoint) {
    const client = getSupabaseClient();
    await client.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }

  async getStats() {
    const client = getSupabaseClient();
    const [{ count: total }, { count: withState }, { count: withDistrict }] = await Promise.all([
      client.from('push_subscriptions').select('*', { count: 'exact', head: true }),
      client.from('push_subscriptions').select('*', { count: 'exact', head: true }).not('state', 'is', null),
      client.from('push_subscriptions').select('*', { count: 'exact', head: true }).not('district', 'is', null)
    ]);
    
    return {
      total: total || 0,
      withState: withState || 0,
      withDistrict: withDistrict || 0,
      recentSuccess: 0,
      recentFailure: 0
    };
  }

  async getHighFailureCount(threshold = 5) {
    // Mocking this as we didn't add failure_count to the simplified schema
    return 0;
  }
}
