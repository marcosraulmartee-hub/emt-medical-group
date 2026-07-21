import { supabase } from '../lib/supabase'

export interface Equipment {
  id: string
  name: string
  manufacturer: string | null
  model: string | null
  serial_number: string | null
  status: string
  created_at: string
  updated_at: string
}

const EQUIPMENT_SELECT = `id, name, manufacturer, model, serial_number, status, created_at, updated_at`

export async function listEquipment() {
  const { data, error } = await supabase.from('emt_equipment').select(EQUIPMENT_SELECT).order('name')
  if (error) throw error
  return data as Equipment[]
}

export async function createEquipment(payload: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('emt_equipment').insert(payload).select(EQUIPMENT_SELECT).single()
  if (error) throw error
  return data as Equipment
}

export async function updateEquipment(id: string, patch: Partial<Omit<Equipment, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase.from('emt_equipment').update(patch).eq('id', id).select(EQUIPMENT_SELECT).single()
  if (error) throw error
  return data as Equipment
}
