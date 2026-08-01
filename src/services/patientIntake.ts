import { supabase } from '../lib/supabase'

export interface IntakeSubmission {
  id: string
  patient_id: string | null
  source: string
  raw_payload: Record<string, unknown>
  created_at: string
  patient: { full_name: string } | null
}

export async function listIntakeSubmissions(limit = 50) {
  const { data, error } = await supabase
    .from('patient_intake_submissions')
    .select('id, patient_id, source, raw_payload, created_at, patient:patients(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as IntakeSubmission[]
}
