import { supabase } from '../lib/supabase'

export type TreatmentType =
  | 'antidepresivo'
  | 'estabilizador'
  | 'antipsicotico'
  | 'ansiolitico'
  | 'ect'
  | 'ketamina_esketamina'
  | 'psicoterapia'
  | 'tms_previo'
  | 'otro'

export type TreatmentResponse = 'sin_respuesta' | 'respuesta_parcial' | 'respuesta_completa' | 'intolerancia' | 'desconocido'

export interface PatientTreatmentHistory {
  id: string
  patient_id: string
  treatment_type: TreatmentType
  treatment_name: string | null
  adequate_trial: boolean | null
  response: TreatmentResponse | null
  start_date: string | null
  end_date: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

const SELECT = `id, patient_id, treatment_type, treatment_name, adequate_trial, response, start_date, end_date, notes, is_active, created_at, updated_at`

export async function listPatientTreatmentHistory(patientId: string) {
  const { data, error } = await supabase
    .from('patient_treatment_history')
    .select(SELECT)
    .eq('patient_id', patientId)
    .order('start_date', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data as PatientTreatmentHistory[]
}

export async function addPatientTreatmentHistory(payload: {
  patient_id: string
  treatment_type: TreatmentType
  treatment_name: string
  adequate_trial: boolean | null
  response: TreatmentResponse | null
  start_date: string
  end_date: string
  notes: string
}) {
  const { data, error } = await supabase
    .from('patient_treatment_history')
    .insert({
      ...payload,
      treatment_name: payload.treatment_name || null,
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      notes: payload.notes || null,
    })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as PatientTreatmentHistory
}

export async function deactivatePatientTreatmentHistory(id: string) {
  const { data, error } = await supabase
    .from('patient_treatment_history')
    .update({ is_active: false })
    .eq('id', id)
    .select(SELECT)
    .single()
  if (error) throw error
  return data as PatientTreatmentHistory
}

export function countAdequateFailedTrials(items: PatientTreatmentHistory[]): number {
  return items.filter(
    (i) =>
      i.is_active &&
      i.treatment_type === 'antidepresivo' &&
      i.adequate_trial === true &&
      (i.response === 'sin_respuesta' || i.response === 'respuesta_parcial'),
  ).length
}
