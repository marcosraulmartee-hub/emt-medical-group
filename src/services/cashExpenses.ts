import { supabase } from '../lib/supabase'
import { logAudit } from './audit'

export interface CashExpense {
  id: string
  business_date: string
  amount: number
  concept: string
  method: string
  created_at: string
}

const SELECT = `id, business_date, amount, concept, method, created_at`

export async function listExpensesForDate(dateISO: string) {
  const { data, error } = await supabase.from('cash_expenses').select(SELECT).eq('business_date', dateISO).order('created_at')
  if (error) throw error
  return data as CashExpense[]
}

export async function addExpense(payload: { business_date: string; amount: number; concept: string; method: string }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('cash_expenses')
    .insert({ ...payload, registered_by: user?.id })
    .select(SELECT)
    .single()
  if (error) throw error
  void logAudit('create', 'cash_expense', data.id, { amount: payload.amount, concept: payload.concept })
  return data as CashExpense
}
