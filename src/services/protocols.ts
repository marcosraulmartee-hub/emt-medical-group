import { supabase } from '../lib/supabase'

export interface Protocol {
  id: string
  name: string
  category: string
  diagnosis: string
  indication: string
  objective: string
  technical_parameters: string
  contraindications: string
  precautions: string
  adverse_events: string
  evidence_level: string
  bibliography: string
  clinical_guidelines: string
  regulatory_body: string
  version: string
  frequency_hz: number | null
  intensity_pct: number | null
  recommended_sessions: number | null
  sessions_per_week: number | null
  price: number | null
  updated_at: string
  created_at: string
  is_active: boolean
}

const PROTOCOL_SELECT = `id, name, category, diagnosis, indication, objective, technical_parameters, contraindications, precautions, adverse_events, evidence_level, bibliography, clinical_guidelines, regulatory_body, version, frequency_hz, intensity_pct, recommended_sessions, sessions_per_week, price, updated_at, created_at, is_active`

export async function listProtocols() {
  const { data, error } = await supabase.from('protocols').select(PROTOCOL_SELECT).order('name')
  if (error) throw error
  return data as Protocol[]
}

export async function getProtocol(id: string) {
  const { data, error } = await supabase.from('protocols').select(PROTOCOL_SELECT).eq('id', id).single()
  if (error) throw error
  return data as Protocol
}

export async function createProtocol(payload: Omit<Protocol, 'id' | 'updated_at' | 'created_at'>) {
  const { data, error } = await supabase.from('protocols').insert(payload).select(PROTOCOL_SELECT).single()
  if (error) throw error
  return data as Protocol
}

export async function updateProtocol(id: string, patch: Partial<Omit<Protocol, 'id' | 'updated_at' | 'created_at'>>) {
  const { data, error } = await supabase.from('protocols').update(patch).eq('id', id).select(PROTOCOL_SELECT).single()
  if (error) throw error
  return data as Protocol
}
