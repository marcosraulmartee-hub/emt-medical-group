import { supabase } from '../lib/supabase'

export interface IntakeSubmission {
  id: string
  patient_id: string | null
  source: string
  raw_payload: Record<string, unknown>
  reviewed: boolean
  created_at: string
  patient: { full_name: string } | null
}

const INTAKE_SELECT = 'id, patient_id, source, raw_payload, reviewed, created_at, patient:patients(full_name)'

export async function listIntakeSubmissions(limit = 50) {
  const { data, error } = await supabase
    .from('patient_intake_submissions')
    .select(INTAKE_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as IntakeSubmission[]
}

export async function listUnreviewedIntakeSubmissions(limit = 10) {
  const { data, error } = await supabase
    .from('patient_intake_submissions')
    .select(INTAKE_SELECT)
    .eq('reviewed', false)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as IntakeSubmission[]
}

export async function markIntakeSubmissionReviewed(id: string) {
  const { error } = await supabase.from('patient_intake_submissions').update({ reviewed: true }).eq('id', id)
  if (error) throw error
}
