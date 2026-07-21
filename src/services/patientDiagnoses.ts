import { supabase } from '../lib/supabase'

export interface PatientDiagnosis {
  id: string
  patient_id: string
  diagnosis: string
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

const SELECT = `id, patient_id, diagnosis, notes, is_active, created_at, updated_at`

export async function listPatientDiagnoses(patientId: string) {
  const { data, error } = await supabase
    .from('patient_diagnoses')
    .select(SELECT)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as PatientDiagnosis[]
}

export async function addPatientDiagnosis(patientId: string, diagnosis: string, notes: string) {
  const { data, error } = await supabase
    .from('patient_diagnoses')
    .insert({ patient_id: patientId, diagnosis, notes: notes || null })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as PatientDiagnosis
}

export async function deactivatePatientDiagnosis(id: string) {
  const { data, error } = await supabase
    .from('patient_diagnoses')
    .update({ is_active: false })
    .eq('id', id)
    .select(SELECT)
    .single()
  if (error) throw error
  return data as PatientDiagnosis
}
