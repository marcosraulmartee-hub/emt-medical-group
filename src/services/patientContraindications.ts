import { supabase } from '../lib/supabase'

export interface PatientContraindication {
  id: string
  patient_id: string
  contraindication: string
  severity: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

const SELECT = `id, patient_id, contraindication, severity, notes, is_active, created_at, updated_at`

export async function listPatientContraindications(patientId: string) {
  const { data, error } = await supabase
    .from('patient_contraindications')
    .select(SELECT)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as PatientContraindication[]
}

export async function addPatientContraindication(
  patientId: string,
  payload: { contraindication: string; severity: string; notes: string },
) {
  const { data, error } = await supabase
    .from('patient_contraindications')
    .insert({
      patient_id: patientId,
      contraindication: payload.contraindication,
      severity: payload.severity || null,
      notes: payload.notes || null,
    })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as PatientContraindication
}

export async function deactivatePatientContraindication(id: string) {
  const { data, error } = await supabase
    .from('patient_contraindications')
    .update({ is_active: false })
    .eq('id', id)
    .select(SELECT)
    .single()
  if (error) throw error
  return data as PatientContraindication
}
