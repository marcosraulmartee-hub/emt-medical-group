import { supabase } from '../lib/supabase'

export interface SessionPackage {
  id: string
  patient_id: string
  protocol_id: string | null
  name: string
  total_sessions: number
  used_sessions: number
  price: number
  status: 'active' | 'completed' | 'expired' | 'cancelled'
  invoice_id: string | null
  purchased_at: string
  created_at: string
  updated_at: string
  protocol: { name: string } | null
}

const SELECT = `id, patient_id, protocol_id, name, total_sessions, used_sessions, price, status, invoice_id, purchased_at, created_at, updated_at, protocol:protocols(name)`

export async function listPatientPackages(patientId: string) {
  const { data, error } = await supabase
    .from('session_packages')
    .select(SELECT)
    .eq('patient_id', patientId)
    .order('purchased_at', { ascending: false })
  if (error) throw error
  return data as unknown as SessionPackage[]
}

export async function createSessionPackage(payload: {
  patient_id: string
  protocol_id: string | null
  name: string
  total_sessions: number
  price: number
  invoice_id: string | null
}) {
  const { data, error } = await supabase.from('session_packages').insert(payload).select(SELECT).single()
  if (error) throw error
  return data as unknown as SessionPackage
}

export async function updatePackageUsage(id: string, used_sessions: number) {
  const { data, error } = await supabase.from('session_packages').update({ used_sessions }).eq('id', id).select(SELECT).single()
  if (error) throw error
  return data as unknown as SessionPackage
}
