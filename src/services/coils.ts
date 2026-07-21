import { supabase } from '../lib/supabase'

export interface Coil {
  id: string
  name: string
  type: string | null
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

const COIL_SELECT = `id, name, type, description, status, created_at, updated_at`

export async function listCoils() {
  const { data, error } = await supabase.from('emt_coils').select(COIL_SELECT).order('name')
  if (error) throw error
  return data as Coil[]
}

export async function createCoil(payload: Omit<Coil, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('emt_coils').insert(payload).select(COIL_SELECT).single()
  if (error) throw error
  return data as Coil
}

export async function updateCoil(id: string, patch: Partial<Omit<Coil, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase.from('emt_coils').update(patch).eq('id', id).select(COIL_SELECT).single()
  if (error) throw error
  return data as Coil
}
