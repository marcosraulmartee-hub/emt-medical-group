import { supabase } from '../lib/supabase'
import { logAudit } from './audit'

export interface Patient {
  id: string
  full_name: string
  email: string
  phone: string
  birth_date: string
  gender: string
  medical_record: string | null
  national_id: string | null
  address: string | null
  city: string | null
  occupation: string | null
  education_level: string | null
  marital_status: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  referred_by: string | null
  insurance_provider: string | null
  created_at: string
  updated_at: string
}

const PATIENT_SELECT = `id, full_name, email, phone, birth_date, gender, medical_record, national_id, address, city, occupation, education_level, marital_status, emergency_contact_name, emergency_contact_phone, referred_by, insurance_provider, created_at, updated_at`

export async function listPatients() {
  const { data, error } = await supabase.from('patients').select(PATIENT_SELECT).order('full_name')
  if (error) throw error
  return data as Patient[]
}

export async function countPatients() {
  const { count, error } = await supabase.from('patients').select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

export async function getPatient(id: string) {
  const { data, error } = await supabase.from('patients').select(PATIENT_SELECT).eq('id', id).single()
  if (error) throw error
  return data as Patient
}

export async function createPatient(payload: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('patients').insert(payload).select(PATIENT_SELECT).single()
  if (error) throw error
  void logAudit('create', 'patient', data.id, { full_name: data.full_name })
  return data as Patient
}

export async function updatePatient(id: string, patch: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase.from('patients').update(patch).eq('id', id).select(PATIENT_SELECT).single()
  if (error) throw error
  void logAudit('update', 'patient', id, patch)
  return data as Patient
}
