import { supabase } from '../lib/supabase'

export interface ProtocolCategory {
  id: string
  code: string
  label: string
  description: string | null
  created_at: string
  updated_at: string
}

const CATEGORY_SELECT = `id, code, label, description, created_at, updated_at`

export async function listProtocolCategories() {
  const { data, error } = await supabase.from('protocol_categories').select(CATEGORY_SELECT).order('label')
  if (error) throw error
  return data as ProtocolCategory[]
}

export async function createProtocolCategory(payload: Omit<ProtocolCategory, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('protocol_categories').insert(payload).select(CATEGORY_SELECT).single()
  if (error) throw error
  return data as ProtocolCategory
}

export async function updateProtocolCategory(
  id: string,
  patch: Partial<Omit<ProtocolCategory, 'id' | 'created_at' | 'updated_at'>>,
) {
  const { data, error } = await supabase
    .from('protocol_categories')
    .update(patch)
    .eq('id', id)
    .select(CATEGORY_SELECT)
    .single()
  if (error) throw error
  return data as ProtocolCategory
}
