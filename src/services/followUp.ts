import { supabase } from '../lib/supabase'
import { toISODate } from '../utils/dates'

export interface FollowUpPatient {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  last_contact_date: string | null
  days_since: number
}

/**
 * Pacientes activos (no dados de alta) cuya última cita o sesión registrada
 * fue hace `thresholdDays` o más — o que nunca tuvieron una y ya llevan ese
 * tiempo registrados. Se calcula en el cliente (agenda + sesiones son
 * datasets chicos para una clínica de este tamaño).
 */
export async function listPatientsNeedingFollowUp(thresholdDays = 30): Promise<FollowUpPatient[]> {
  const [{ data: patients, error: pErr }, { data: appts, error: aErr }, { data: sessions, error: sErr }] = await Promise.all([
    supabase.from('patients').select('id, full_name, phone, email, created_at').eq('status', 'active'),
    supabase.from('appointments').select('patient_id, date'),
    supabase.from('emt_sessions').select('patient_id, date'),
  ])
  if (pErr) throw pErr
  if (aErr) throw aErr
  if (sErr) throw sErr

  const lastContact = new Map<string, string>()
  function consider(patientId: string, date: string) {
    const current = lastContact.get(patientId)
    if (!current || date > current) lastContact.set(patientId, date)
  }
  for (const a of appts ?? []) consider(a.patient_id, a.date)
  for (const s of sessions ?? []) consider(s.patient_id, s.date)

  const today = new Date(toISODate(new Date()))
  const result: FollowUpPatient[] = []
  for (const p of patients ?? []) {
    const lastDate = lastContact.get(p.id) ?? toISODate(new Date(p.created_at))
    const daysSince = Math.floor((today.getTime() - new Date(lastDate).getTime()) / 86400000)
    if (daysSince >= thresholdDays) {
      result.push({
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        email: p.email,
        last_contact_date: lastContact.get(p.id) ?? null,
        days_since: daysSince,
      })
    }
  }
  return result.sort((a, b) => b.days_since - a.days_since)
}
