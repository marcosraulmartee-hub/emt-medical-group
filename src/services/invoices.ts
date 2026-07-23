import { supabase } from '../lib/supabase'
import { logAudit } from './audit'

export type InvoiceStatus = 'draft' | 'issued' | 'cancelled'

export interface Invoice {
  id: string
  patient_id: string
  invoice_number: string | null
  status: InvoiceStatus
  issue_date: string | null
  due_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total: number
  notes: string | null
  created_at: string
  updated_at: string
  patient: { full_name: string } | null
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  session_id: string | null
  package_id: string | null
}

const INVOICE_SELECT = `id, patient_id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, tax_amount, discount_amount, total, notes, created_at, updated_at, patient:patients(full_name)`
const ITEM_SELECT = `id, invoice_id, description, quantity, unit_price, amount, session_id, package_id`

export async function listInvoices() {
  const { data, error } = await supabase.from('invoices').select(INVOICE_SELECT).order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as Invoice[]
}

export async function countDraftInvoices() {
  const { count, error } = await supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'draft')
  if (error) throw error
  return count ?? 0
}

export async function getInvoice(id: string) {
  const { data, error } = await supabase.from('invoices').select(INVOICE_SELECT).eq('id', id).single()
  if (error) throw error
  return data as unknown as Invoice
}

export async function listInvoiceItems(invoiceId: string) {
  const { data, error } = await supabase.from('invoice_items').select(ITEM_SELECT).eq('invoice_id', invoiceId)
  if (error) throw error
  return data as InvoiceItem[]
}

export async function createDraftInvoice(
  invoice: {
    patient_id: string
    due_date: string | null
    tax_rate: number
    discount_amount: number
    notes: string
  },
  items: { description: string; quantity: number; unit_price: number }[],
) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxable = Math.max(subtotal - invoice.discount_amount, 0)
  const tax_amount = (taxable * invoice.tax_rate) / 100
  const total = taxable + tax_amount

  const { data: created, error } = await supabase
    .from('invoices')
    .insert({
      patient_id: invoice.patient_id,
      due_date: invoice.due_date,
      tax_rate: invoice.tax_rate,
      discount_amount: invoice.discount_amount,
      notes: invoice.notes || null,
      subtotal,
      tax_amount,
      total,
    })
    .select(INVOICE_SELECT)
    .single()
  if (error) throw error

  const invoiceRow = created as unknown as Invoice

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('invoice_items').insert(
      items.map((item) => ({
        invoice_id: invoiceRow.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
      })),
    )
    if (itemsError) throw itemsError
  }

  return invoiceRow
}

export async function deleteDraftInvoice(id: string) {
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw error
  void logAudit('delete', 'invoice', id, {})
}

export async function listInvoicesInRange(from: string, to: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .gte('issue_date', from)
    .lte('issue_date', to)
    .eq('status', 'issued')
    .order('issue_date')
  if (error) throw error
  return data as unknown as Invoice[]
}

export async function issueInvoice(id: string) {
  const { data, error } = await supabase.rpc('issue_invoice', { p_invoice_id: id })
  if (error) throw error
  const invoice = data as unknown as Invoice
  void logAudit('issue', 'invoice', invoice.id, { invoice_number: invoice.invoice_number, total: invoice.total })
  return invoice
}

export async function voidInvoice(id: string) {
  const { data, error } = await supabase.rpc('void_invoice', { p_invoice_id: id })
  if (error) throw error
  const invoice = data as unknown as Invoice
  void logAudit('void', 'invoice', invoice.id, { invoice_number: invoice.invoice_number })
  return invoice
}
