import { supabase } from '../lib/supabase'

export interface TreatmentCycle {
  id: string
  patient_id: string
  protocol_id: string | null
  planned_sessions: number
  status: 'active' | 'completed' | 'cancelled'
  started_at: string
  notes: string | null
  created_at: string
  updated_at: string
  protocol: { name: string } | null
}

const CYCLE_SELECT = `id, patient_id, protocol_id, planned_sessions, status, started_at, notes, created_at, updated_at, protocol:protocols(name)`

export async function listPatientCycles(patientId: string) {
  const { data, error } = await supabase
    .from('treatment_cycles')
    .select(CYCLE_SELECT)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as TreatmentCycle[]
}

export async function createTreatmentCycle(payload: {
  patient_id: string
  protocol_id: string | null
  planned_sessions: number
  notes: string | null
}) {
  const { data, error } = await supabase.from('treatment_cycles').insert(payload).select(CYCLE_SELECT).single()
  if (error) throw error
  return data as unknown as TreatmentCycle
}

export async function updateCycleStatus(id: string, status: TreatmentCycle['status']) {
  const { data, error } = await supabase
    .from('treatment_cycles')
    .update({ status })
    .eq('id', id)
    .select(CYCLE_SELECT)
    .single()
  if (error) throw error
  return data as unknown as TreatmentCycle
}

export async function countActiveCycles() {
  const { count, error } = await supabase
    .from('treatment_cycles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  if (error) throw error
  return count ?? 0
}

export async function countSessionsInCycle(cycleId: string) {
  const { count, error } = await supabase
    .from('emt_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('cycle_id', cycleId)
  if (error) throw error
  return count ?? 0
}
