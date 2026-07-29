import { supabase } from '../lib/supabase'
import type { Appointment } from './appointments'
import { toISODate, addDays } from '../utils/dates'

const APPOINTMENT_SELECT = `id, patient_id, clinician_id, protocol_id, date, start_time, end_time, status, requested_date, requested_start_time, notes, created_at, updated_at, patient:patients(full_name, phone), clinician:profiles(full_name), protocol:protocols(name)`

export async function listAppointmentsForStats(fromDate: string, toDate: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })
  if (error) throw error
  return data as unknown as Appointment[]
}

/** Pacientes con saldo pendiente (facturas emitidas cuyo total supera lo cobrado). */
export async function getOutstandingBalanceByPatient(patientIds: string[]): Promise<Set<string>> {
  const ids = [...new Set(patientIds)].filter(Boolean)
  if (ids.length === 0) return new Set()

  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('id, patient_id, total')
    .eq('status', 'issued')
    .in('patient_id', ids)
  if (invError) throw invError
  if (!invoices || invoices.length === 0) return new Set()

  const invoiceIds = invoices.map((inv) => inv.id)
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('invoice_id, amount')
    .in('invoice_id', invoiceIds)
  if (payError) throw payError

  const paidByInvoice = new Map<string, number>()
  for (const p of payments ?? []) {
    paidByInvoice.set(p.invoice_id, (paidByInvoice.get(p.invoice_id) ?? 0) + p.amount)
  }

  const outstanding = new Set<string>()
  for (const inv of invoices) {
    const paid = paidByInvoice.get(inv.id) ?? 0
    if (inv.total - paid > 0.01) outstanding.add(inv.patient_id)
  }
  return outstanding
}

export interface WeeklyAttendance {
  weekLabel: string
  weekStart: string
  completed: number
  cancelled: number
}

export function bucketAttendanceByWeek(appointments: Appointment[], weeks: number): WeeklyAttendance[] {
  const today = new Date()
  const buckets: WeeklyAttendance[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = addDays(today, -7 * i - today.getDay())
    const weekEnd = addDays(weekStart, 6)
    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`
    buckets.push({ weekLabel: label, weekStart: toISODate(weekStart), completed: 0, cancelled: 0 })
    void weekEnd
  }
  const startOf = (iso: string) => {
    const idx = buckets.findIndex((b, i) => {
      const nextStart = i + 1 < buckets.length ? buckets[i + 1].weekStart : null
      return iso >= b.weekStart && (nextStart === null || iso < nextStart)
    })
    return idx
  }
  for (const appt of appointments) {
    const idx = startOf(appt.date)
    if (idx === -1) continue
    if (appt.status === 'completed') buckets[idx].completed++
    else if (appt.status === 'cancelled') buckets[idx].cancelled++
  }
  return buckets
}

export interface ProtocolUsage {
  name: string
  count: number
}

export async function getTopProtocolsByUsage(fromDate: string, toDate: string, limit = 8): Promise<ProtocolUsage[]> {
  const { data, error } = await supabase
    .from('emt_sessions')
    .select('protocol:protocols(name)')
    .gte('date', fromDate)
    .lte('date', toDate)
  if (error) throw error
  const counts = new Map<string, number>()
  for (const row of (data ?? []) as unknown as { protocol: { name: string } | null }[]) {
    const name = row.protocol?.name ?? 'Sin protocolo'
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export interface StatsSummary {
  totalPatients: number
  totalSessions: number
  attendanceRate: number | null
  cancellationRate: number | null
  revenue30d: number
  pendingBudgets: number
}

export async function getStatsSummary(appointmentsInRange: Appointment[]): Promise<StatsSummary> {
  const today = new Date()
  const todayISO = toISODate(today)
  const thirtyDaysAgo = toISODate(addDays(today, -29))

  const [{ count: totalPatients }, { count: totalSessions }, { data: invoices }, { count: pendingBudgets }] =
    await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('emt_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('total').eq('status', 'issued').gte('issue_date', thirtyDaysAgo).lte('issue_date', todayISO),
      supabase.from('budgets').select('id', { count: 'exact', head: true }).in('status', ['draft', 'sent']),
    ])

  const completed = appointmentsInRange.filter((a) => a.status === 'completed').length
  const cancelled = appointmentsInRange.filter((a) => a.status === 'cancelled').length
  const totalRelevant = completed + cancelled
  const revenue30d = (invoices ?? []).reduce((sum, inv) => sum + inv.total, 0)

  return {
    totalPatients: totalPatients ?? 0,
    totalSessions: totalSessions ?? 0,
    attendanceRate: totalRelevant > 0 ? completed / totalRelevant : null,
    cancellationRate: totalRelevant > 0 ? cancelled / totalRelevant : null,
    revenue30d,
    pendingBudgets: pendingBudgets ?? 0,
  }
}
