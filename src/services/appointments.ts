import { supabase } from '../lib/supabase'
import { logAudit } from './audit'

export type AppointmentStatus = 'pending' | 'confirmed' | 'reschedule_requested' | 'cancelled' | 'completed'

export interface Appointment {
  id: string
  patient_id: string
  clinician_id: string | null
  protocol_id: string | null
  date: string
  start_time: string
  end_time: string | null
  status: AppointmentStatus
  requested_date: string | null
  requested_start_time: string | null
  notes: string | null
  created_at: string
  updated_at: string
  patient: { full_name: string; phone: string | null } | null
  clinician: { full_name: string } | null
  protocol: { name: string } | null
}

const APPOINTMENT_SELECT = `id, patient_id, clinician_id, protocol_id, date, start_time, end_time, status, requested_date, requested_start_time, notes, created_at, updated_at, patient:patients(full_name, phone), clinician:profiles(full_name), protocol:protocols(name)`

export async function listAppointmentsInRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('start_time')
  if (error) throw error
  return data as unknown as Appointment[]
}

export async function countAppointmentsOnDate(date: string) {
  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('date', date)
    .in('status', ['pending', 'confirmed', 'completed'])
  if (error) throw error
  return count ?? 0
}

export async function createAppointment(payload: {
  patient_id: string
  clinician_id: string | null
  protocol_id: string | null
  date: string
  start_time: string
  end_time: string | null
  notes: string | null
}) {
  const { data, error } = await supabase.from('appointments').insert(payload).select(APPOINTMENT_SELECT).single()
  if (error) throw error
  return data as unknown as Appointment
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select(APPOINTMENT_SELECT)
    .single()
  if (error) throw error
  void logAudit('status_change', 'appointment', id, { status })
  return data as unknown as Appointment
}

export async function requestReschedule(id: string, requested_date: string, requested_start_time: string) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'reschedule_requested', requested_date, requested_start_time })
    .eq('id', id)
    .select(APPOINTMENT_SELECT)
    .single()
  if (error) throw error
  return data as unknown as Appointment
}

export async function confirmReschedule(id: string) {
  const { data: current, error: fetchError } = await supabase
    .from('appointments')
    .select('requested_date, requested_start_time')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError
  const { data, error } = await supabase
    .from('appointments')
    .update({
      date: current.requested_date,
      start_time: current.requested_start_time,
      status: 'confirmed',
      requested_date: null,
      requested_start_time: null,
    })
    .eq('id', id)
    .select(APPOINTMENT_SELECT)
    .single()
  if (error) throw error
  return data as unknown as Appointment
}
