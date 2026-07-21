import { supabase } from '../lib/supabase'
import { logAudit } from './audit'

export interface CashClosing {
  id: string
  closing_date: string
  total_efectivo: number
  total_tarjeta: number
  total_transferencia: number
  total_otro: number
  total_collected: number
  invoices_issued_count: number
  invoices_issued_total: number
  counted_cash: number | null
  notes: string | null
  closed_by: string | null
  created_at: string
  closer: { full_name: string } | null
}

const SELECT = `id, closing_date, total_efectivo, total_tarjeta, total_transferencia, total_otro, total_collected, invoices_issued_count, invoices_issued_total, counted_cash, notes, closed_by, created_at, closer:profiles(full_name)`

export async function listCashClosings(limit = 30) {
  const { data, error } = await supabase
    .from('cash_closings')
    .select(SELECT)
    .order('closing_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as CashClosing[]
}

export async function createCashClosing(payload: {
  closing_date: string
  total_efectivo: number
  total_tarjeta: number
  total_transferencia: number
  total_otro: number
  total_collected: number
  invoices_issued_count: number
  invoices_issued_total: number
  counted_cash: number | null
  notes: string
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('cash_closings')
    .insert({ ...payload, notes: payload.notes || null, closed_by: user?.id })
    .select(SELECT)
    .single()
  if (error) throw error
  const closing = data as unknown as CashClosing
  void logAudit('create', 'cash_closing', closing.id, {
    closing_date: closing.closing_date,
    total_collected: closing.total_collected,
  })
  return closing
}
