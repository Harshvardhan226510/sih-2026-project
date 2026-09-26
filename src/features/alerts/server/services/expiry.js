import { getSupabaseClient } from '../db/supabaseClient.js';
import logger from '../utils/logger.js';

export async function expireAlerts() {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  const { data: toExpire, error } = await client
    .from('alerts')
    .select('id')
    .eq('status', 'ACTIVE')
    .not('expires_at', 'is', null)
    .lt('expires_at', now);

  if (error || !toExpire || toExpire.length === 0) return 0;

  const { data: syncData } = await client.from('sync_state').select('revision').eq('id', 1).single();
  let revision = syncData?.revision || 0;

  for (const { id } of toExpire) {
    revision++;
    await client.from('alerts').update({
      status: 'EXPIRED',
      revision: revision,
      updated_at: now
    }).eq('id', id);

    await client.from('alert_revisions').insert([{
      alert_id: id,
      revision: revision,
      action: 'expired',
      created_at: now
    }]);

    logger.info({ alertId: id, revision }, 'alert_expired');
  }

  await client.from('sync_state').update({
    revision: revision,
    updated_at: now
  }).eq('id', 1);

  logger.info({ count: toExpire.length }, 'alerts expired');
  return toExpire.length;
}