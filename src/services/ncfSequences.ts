import { supabase } from '../lib/supabase'

export interface NcfSequence {
  id: string
  ncf_type: string
  label: string
  range_start: number
  range_end: number
  next_number: number
  authorized_until: string | null
  is_active: boolean
  updated_at: string
}

const SELECT = `id, ncf_type, label, range_start, range_end, next_number, authorized_until, is_active, updated_at`

export async function listNcfSequences() {
  const { data, error } = await supabase.from('ncf_sequences').select(SELECT).order('ncf_type')
  if (error) throw error
  return data as NcfSequence[]
}

export async function updateNcfSequenceRange(
  id: string,
  payload: { range_start: number; range_end: number; next_number: number; authorized_until: string | null },
) {
  const { data, error } = await supabase.from('ncf_sequences').update(payload).eq('id', id).select(SELECT).single()
  if (error) throw error
  return data as NcfSequence
}
