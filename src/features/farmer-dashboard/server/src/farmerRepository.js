import { supabase } from './supabase.js';

export async function listCrops(userId) {
  const { data, error } = await supabase().from('farmer_crops').select('id, sowing_date, current_growth_stage, is_primary, crops(id, name), locations(id, name, latitude, longitude)').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
export async function addCrop(userId, input) {
  const { data, error } = await supabase().from('farmer_crops').insert({ user_id: userId, crop_id: input.cropId, location_id: input.locationId, sowing_date: input.sowingDate || null, current_growth_stage: input.growthStage || null, is_primary: Boolean(input.isPrimary) }).select().single();
  if (error) throw error;
  return data;
}
export async function updateCrop(userId, id, input) {
  const { data, error } = await supabase().from('farmer_crops').update({ current_growth_stage: input.growthStage, is_primary: input.isPrimary }).eq('id', id).eq('user_id', userId).select().maybeSingle();
  if (error) throw error;
  return data;
}
export async function removeCrop(userId, id) {
  const { error } = await supabase().from('farmer_crops').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}
