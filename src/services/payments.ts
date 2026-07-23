import { supabase } from '../lib/supabase'

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  method: string
  paid_at: string
  reference: string | null
  created_at: string
}

const SELECT = `id, invoice_id, amount, method, paid_at, reference, created_at`

export async function listPaymentsForInvoice(invoiceId: string) {
  const { data, error } = await supabase.from('payments').select(SELECT).eq('invoice_id', invoiceId).order('paid_at')
  if (error) throw error
  return data as Payment[]
}

export async function addPayment(payload: { invoice_id: string; amount: number; method: string; reference: string }) {
  const { data, error } = await supabase
    .from('payments')
    .insert({ ...payload, reference: payload.reference || null })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as Payment
}

export interface PaymentWithInvoice extends Payment {
  invoice: { invoice_number: string | null; patient: { full_name: string } | null } | null
}

export async function listPaymentsForDate(dateISO: string) {
  const { data, error } = await supabase
    .from('payments')
    .select(`${SELECT}, invoice:invoices(invoice_number, patient:patients(full_name))`)
    .gte('paid_at', `${dateISO}T00:00:00`)
    .lte('paid_at', `${dateISO}T23:59:59.999`)
    .order('paid_at')
  if (error) throw error
  return data as unknown as PaymentWithInvoice[]
}
