import { supabase } from '../lib/supabase'

export interface PatientDocument {
  id: string
  patient_id: string
  name: string
  url: string
  type: string | null
  created_at: string
  updated_at: string
}

const SELECT = `id, patient_id, name, url, type, created_at, updated_at`

export async function listPatientDocuments(patientId: string) {
  const { data, error } = await supabase
    .from('patient_documents')
    .select(SELECT)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as PatientDocument[]
}

export async function addPatientDocument(patientId: string, payload: { name: string; url: string; type: string }) {
  const { data, error } = await supabase
    .from('patient_documents')
    .insert({ patient_id: patientId, name: payload.name, url: payload.url, type: payload.type || null })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as PatientDocument
}
