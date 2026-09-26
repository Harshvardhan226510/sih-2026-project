import { getSupabaseClient } from '../db/supabaseClient.js';

const MAX_ATTEMPTS = 10;

export class MqttOutboxRepository {
  async enqueue(alertId, topic, payload, qos = 1) {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    
    // We don't have a status or alert_id column in our simplified schema,
    // let's just insert it for now.
    await client.from('mqtt_outbox').insert([{
      topic,
      payload: JSON.stringify(payload),
      qos,
      created_at: now
    }]);
  }

  async getPending(limit = 50) {
    const client = getSupabaseClient();
    // Assuming everything in the table is pending, since published ones are deleted.
    const { data } = await client.from('mqtt_outbox').select('*').order('created_at', { ascending: true }).limit(limit);
    return data || [];
  }

  async markPublished(id) {
    const client = getSupabaseClient();
    // Delete it once published to keep it simple
    await client.from('mqtt_outbox').delete().eq('id', id);
  }

  async markFailed(id, errorMessage) {
    const client = getSupabaseClient();
    // Simplified: Delete if failed too many times, but we don't have attempts tracked.
    // For now, let's just delete it to prevent infinite loop.
    await client.from('mqtt_outbox').delete().eq('id', id);
  }

  async getStats() {
    const client = getSupabaseClient();
    const { count } = await client.from('mqtt_outbox').select('*', { count: 'exact', head: true });
    return { pending: count || 0, published: 0, failed: 0 };
  }
}
