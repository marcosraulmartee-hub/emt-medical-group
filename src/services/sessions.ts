import { supabase } from '../lib/supabase'
import type { ChecklistAnswer } from './safetyChecklist'
import { logAudit } from './audit'

export interface SessionRecord {
  id: string
  patient_id: string
  clinician_id: string
  cycle_id: string | null
  appointment_id: string | null
  date: string
  start_time: string | null
  end_time: string | null
  equipment_id: string
  coil_id: string
  stimulated_region: string
  laterality: string
  protocol_id: string
  frequency_hz: number | null
  intensity_pct: number | null
  rmt_pct: number | null
  motor_threshold: number | null
  pulses: number | null
  trains: number | null
  duration_minutes: number | null
  clinical_response: string
  adverse_events: string
  notes: string
  safety_checklist: ChecklistAnswer[]
  created_at: string
  updated_at: string
  patient: { full_name: string } | null
  protocol: { name: string } | null
  equipment: { name: string } | null
  coil: { name: string } | null
  cycle: { planned_sessions: number } | null
}

const SESSION_SELECT = `id, patient_id, clinician_id, cycle_id, appointment_id, date, start_time, end_time, equipment_id, coil_id, stimulated_region, laterality, protocol_id, frequency_hz, intensity_pct, rmt_pct, motor_threshold, pulses, trains, duration_minutes, clinical_response, adverse_events, notes, safety_checklist, created_at, updated_at, patient:patients(full_name), protocol:protocols(name), equipment:emt_equipment(name), coil:emt_coils(name), cycle:treatment_cycles(planned_sessions)`

export async function listSessions() {
  const { data, error } = await supabase
    .from('emt_sessions')
    .select(SESSION_SELECT)
    .order('date', { ascending: false })
    .limit(200)
  if (error) throw error
  return data as unknown as SessionRecord[]
}

export async function listSessionsByCycle(cycleId: string) {
  const { data, error } = await supabase
    .from('emt_sessions')
    .select(SESSION_SELECT)
    .eq('cycle_id', cycleId)
    .order('date')
  if (error) throw error
  return data as unknown as SessionRecord[]
}

export async function listSessionsInRange(from: string, to: string) {
  const { data, error } = await supabase
    .from('emt_sessions')
    .select(SESSION_SELECT)
    .gte('date', from)
    .lte('date', to)
    .order('date')
  if (error) throw error
  return data as unknown as SessionRecord[]
}

export async function listSessionsByPatient(patientId: string) {
  const { data, error } = await supabase
    .from('emt_sessions')
    .select(SESSION_SELECT)
    .eq('patient_id', patientId)
    .order('date', { ascending: false })
  if (error) throw error
  return data as unknown as SessionRecord[]
}

export async function getSession(id: string) {
  const { data, error } = await supabase.from('emt_sessions').select(SESSION_SELECT).eq('id', id).single()
  if (error) throw error
  return data as unknown as SessionRecord
}

export async function createSession(
  payload: Omit<SessionRecord, 'id' | 'created_at' | 'updated_at' | 'patient' | 'protocol' | 'equipment' | 'coil' | 'cycle'>,
) {
  const { data, error } = await supabase.from('emt_sessions').insert(payload).select(SESSION_SELECT).single()
  if (error) throw error
  void logAudit('create', 'emt_session', data.id, { patient_id: payload.patient_id, protocol_id: payload.protocol_id })
  return data as unknown as SessionRecord
}

export async function updateSession(
  id: string,
  payload: Partial<
    Omit<SessionRecord, 'id' | 'patient_id' | 'clinician_id' | 'created_at' | 'updated_at' | 'patient' | 'protocol' | 'equipment' | 'coil' | 'cycle'>
  >,
) {
  const { data, error } = await supabase.from('emt_sessions').update(payload).eq('id', id).select(SESSION_SELECT).single()
  if (error) throw error
  void logAudit('update', 'emt_session', id, payload)
  return data as unknown as SessionRecord
}
