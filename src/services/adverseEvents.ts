import { supabase } from '../lib/supabase'

export type AdverseEventSeverity = 'leve' | 'moderado' | 'grave'

export interface AdverseEvent {
  id: string
  patient_id: string
  session_id: string | null
  severity: AdverseEventSeverity
  description: string
  action_taken: string | null
  reported_by: string | null
  occurred_at: string
  created_at: string
}

const SELECT = `id, patient_id, session_id, severity, description, action_taken, reported_by, occurred_at, created_at`

export async function listPatientAdverseEvents(patientId: string) {
  const { data, error } = await supabase
    .from('adverse_events')
    .select(SELECT)
    .eq('patient_id', patientId)
    .order('occurred_at', { ascending: false })
  if (error) throw error
  return data as AdverseEvent[]
}

export async function listAdverseEventsInRange(from: string, to: string) {
  const { data, error } = await supabase
    .from('adverse_events')
    .select(SELECT)
    .gte('occurred_at', from)
    .lte('occurred_at', to)
    .order('occurred_at')
  if (error) throw error
  return data as AdverseEvent[]
}

export async function reportAdverseEvent(payload: {
  patient_id: string
  session_id: string | null
  severity: AdverseEventSeverity
  description: string
  action_taken: string
  reported_by: string | null
}) {
  const { data, error } = await supabase
    .from('adverse_events')
    .insert({ ...payload, action_taken: payload.action_taken || null })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as AdverseEvent
}
