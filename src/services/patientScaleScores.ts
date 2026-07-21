import { supabase } from '../lib/supabase'

export type AssessmentPoint = 'baseline' | 'intermedio' | 'fin_tratamiento' | 'seguimiento_1m' | 'seguimiento_3m' | 'seguimiento_6m' | 'otro'

export interface PatientScaleScore {
  id: string
  patient_id: string
  cycle_id: string | null
  scale_code: string
  score: number
  notes: string | null
  administered_at: string
  administered_by: string | null
  assessment_point: AssessmentPoint
  created_at: string
  scale: { label: string; pdf_url: string | null; pdf_url_es: string | null } | null
}

const SELECT = `id, patient_id, cycle_id, scale_code, score, notes, administered_at, administered_by, assessment_point, created_at, scale:clinical_scales(label, pdf_url, pdf_url_es)`

export async function listPatientScaleScores(patientId: string) {
  const { data, error } = await supabase
    .from('patient_scale_scores')
    .select(SELECT)
    .eq('patient_id', patientId)
    .order('administered_at', { ascending: false })
  if (error) throw error
  return data as unknown as PatientScaleScore[]
}

export async function addPatientScaleScore(payload: {
  patient_id: string
  cycle_id: string | null
  scale_code: string
  score: number
  notes: string
  administered_at: string
  administered_by: string | null
  assessment_point: AssessmentPoint
}) {
  const { data, error } = await supabase
    .from('patient_scale_scores')
    .insert({ ...payload, notes: payload.notes || null })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as unknown as PatientScaleScore
}
