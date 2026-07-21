import { supabase } from '../lib/supabase'

export interface PriceListItem {
  id: string
  code: string
  label: string
  price: number
  unit: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const SELECT = `id, code, label, price, unit, is_active, created_at, updated_at`

export async function listPriceList() {
  const { data, error } = await supabase.from('price_list').select(SELECT).order('label')
  if (error) throw error
  return data as PriceListItem[]
}

export async function createPriceListItem(payload: { code: string; label: string; price: number; unit: string }) {
  const { data, error } = await supabase.from('price_list').insert(payload).select(SELECT).single()
  if (error) throw error
  return data as PriceListItem
}

export async function updatePriceListItem(
  id: string,
  patch: Partial<{ label: string; price: number; unit: string; is_active: boolean }>,
) {
  const { data, error } = await supabase.from('price_list').update(patch).eq('id', id).select(SELECT).single()
  if (error) throw error
  return data as PriceListItem
}
