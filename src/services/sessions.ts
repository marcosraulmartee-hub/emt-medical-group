import { supabase } from '../lib/supabase'

export interface SessionRecord {
  id: string
  patient_id: string
  clinician_id: string
  date: string
  start_time: string
  end_time: string
  equipment_id: string
  coil_id: string
  stimulated_region: string
  laterality: string
  protocol_id: string
  frequency_hz: number
  intensity_pct: number
  rmt_pct: number
  motor_threshold: number
  pulses: number
  trains: number
  duration_minutes: number
  clinical_response: string
  adverse_events: string
  notes: string
  created_at: string
  updated_at: string
}

const SESSION_SELECT = `id, patient_id, clinician_id, date, start_time, end_time, equipment_id, coil_id, stimulated_region, laterality, protocol_id, frequency_hz, intensity_pct, rmt_pct, motor_threshold, pulses, trains, duration_minutes, clinical_response, adverse_events, notes, created_at, updated_at`

export async function listSessions() {
  const { data, error } = await supabase.from('emt_sessions').select(SESSION_SELECT).order('date', { ascending: false }).limit(200)
  if (error) throw error
  return data as SessionRecord[]
}

export async function getSession(id: string) {
  const { data, error } = await supabase.from('emt_sessions').select(SESSION_SELECT).eq('id', id).single()
  if (error) throw error
  return data as SessionRecord
}

export async function createSession(payload: Omit<SessionRecord, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('emt_sessions').insert(payload).select(SESSION_SELECT).single()
  if (error) throw error
  return data as SessionRecord
}

export async function updateSession(id: string, patch: Partial<Omit<SessionRecord, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase.from('emt_sessions').update(patch).eq('id', id).select(SESSION_SELECT).single()
  if (error) throw error
  return data as SessionRecord
}
