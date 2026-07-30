import { supabase } from '../lib/supabase'
import type { Appointment } from './appointments'

const APPOINTMENT_SELECT = `id, patient_id, clinician_id, protocol_id, date, start_time, end_time, status, requested_date, requested_start_time, notes, created_at, updated_at, patient:patients(full_name, phone), clinician:profiles(full_name), protocol:protocols(name)`

export async function listAppointmentsForSummary(fromDate: string, toDate: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date')
    .order('start_time')
  if (error) throw error
  return data as unknown as Appointment[]
}

export interface BillingInfo {
  kind: 'presupuesto' | 'factura' | 'ninguno'
  label: string
}

export interface AgendaSummaryRow {
  appointment: Appointment
  diagnosis: string | null
  billing: BillingInfo
}

const BUDGET_STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired: 'Vencido',
}

export async function buildAgendaSummary(appointments: Appointment[]): Promise<AgendaSummaryRow[]> {
  const patientIds = [...new Set(appointments.map((a) => a.patient_id))]
  if (patientIds.length === 0) return []

  const [diagnosesRes, budgetsRes, invoicesRes] = await Promise.all([
    supabase
      .from('patient_diagnoses')
      .select('patient_id, diagnosis, created_at')
      .eq('is_active', true)
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('budgets')
      .select('patient_id, status, total, created_at')
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('patient_id, invoice_number, total, created_at')
      .neq('status', 'cancelled')
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false }),
  ])

  const diagnosisByPatient = new Map<string, string>()
  for (const d of diagnosesRes.data ?? []) {
    if (!diagnosisByPatient.has(d.patient_id)) diagnosisByPatient.set(d.patient_id, d.diagnosis)
  }

  const budgetByPatient = new Map<string, { status: string; total: number }>()
  for (const b of budgetsRes.data ?? []) {
    if (!budgetByPatient.has(b.patient_id)) budgetByPatient.set(b.patient_id, { status: b.status, total: b.total })
  }

  const invoiceByPatient = new Map<string, { invoice_number: string | null; total: number }>()
  for (const inv of invoicesRes.data ?? []) {
    if (!invoiceByPatient.has(inv.patient_id)) invoiceByPatient.set(inv.patient_id, { invoice_number: inv.invoice_number, total: inv.total })
  }

  return appointments.map((appointment) => {
    const budget = budgetByPatient.get(appointment.patient_id)
    const invoice = invoiceByPatient.get(appointment.patient_id)
    let billing: BillingInfo
    if (budget) {
      billing = {
        kind: 'presupuesto',
        label: `Presupuesto ${BUDGET_STATUS_LABEL[budget.status] ?? budget.status} · RD$${budget.total.toLocaleString('es-DO')}`,
      }
    } else if (invoice) {
      billing = {
        kind: 'factura',
        label: `Factura individual${invoice.invoice_number ? ' ' + invoice.invoice_number : ''} · RD$${invoice.total.toLocaleString('es-DO')}`,
      }
    } else {
      billing = { kind: 'ninguno', label: 'Sin presupuesto ni factura' }
    }
    return {
      appointment,
      diagnosis: diagnosisByPatient.get(appointment.patient_id) ?? null,
      billing,
    }
  })
}
