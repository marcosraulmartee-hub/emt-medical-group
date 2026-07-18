import { supabase } from '../lib/supabase'

export interface Patient {
  id: string
  full_name: string
  email: string
  phone: string
  birth_date: string
  gender: string
  medical_record: string | null
  created_at: string
  updated_at: string
}

const PATIENT_SELECT = `id, full_name, email, phone, birth_date, gender, medical_record, created_at, updated_at`

export async function listPatients() {
  const { data, error } = await supabase.from('patients').select(PATIENT_SELECT).order('full_name')
  if (error) throw error
  return data as Patient[]
}

export async function getPatient(id: string) {
  const { data, error } = await supabase.from('patients').select(PATIENT_SELECT).eq('id', id).single()
  if (error) throw error
  return data as Patient
}

export async function createPatient(payload: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('patients').insert(payload).select(PATIENT_SELECT).single()
  if (error) throw error
  return data as Patient
}

export async function updatePatient(id: string, patch: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase.from('patients').update(patch).eq('id', id).select(PATIENT_SELECT).single()
  if (error) throw error
  return data as Patient
}
