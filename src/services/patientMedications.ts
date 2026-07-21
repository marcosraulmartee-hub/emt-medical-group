import { supabase } from '../lib/supabase'

export interface PatientMedication {
  id: string
  patient_id: string
  medication: string
  dosage: string | null
  frequency: string | null
  started_at: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

const SELECT = `id, patient_id, medication, dosage, frequency, started_at, notes, is_active, created_at, updated_at`

export async function listPatientMedications(patientId: string) {
  const { data, error } = await supabase
    .from('patient_medications')
    .select(SELECT)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as PatientMedication[]
}

export async function addPatientMedication(
  patientId: string,
  payload: { medication: string; dosage: string; frequency: string; started_at: string; notes: string },
) {
  const { data, error } = await supabase
    .from('patient_medications')
    .insert({
      patient_id: patientId,
      medication: payload.medication,
      dosage: payload.dosage || null,
      frequency: payload.frequency || null,
      started_at: payload.started_at || null,
      notes: payload.notes || null,
    })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as PatientMedication
}

export async function deactivatePatientMedication(id: string) {
  const { data, error } = await supabase
    .from('patient_medications')
    .update({ is_active: false })
    .eq('id', id)
    .select(SELECT)
    .single()
  if (error) throw error
  return data as PatientMedication
}
