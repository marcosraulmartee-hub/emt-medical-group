import { supabase } from '../lib/supabase'
import { logAudit } from './audit'

export type BudgetStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Budget {
  id: string
  patient_id: string
  protocol_id: string | null
  status: BudgetStatus
  valid_until: string | null
  subtotal: number
  discount_amount: number
  total: number
  notes: string | null
  created_at: string
  updated_at: string
  patient: { full_name: string; phone: string | null; email: string | null } | null
  protocol: { name: string } | null
}

export interface BudgetItem {
  id: string
  budget_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

const BUDGET_SELECT = `id, patient_id, protocol_id, status, valid_until, subtotal, discount_amount, total, notes, created_at, updated_at, patient:patients(full_name, phone, email), protocol:protocols(name)`
const ITEM_SELECT = `id, budget_id, description, quantity, unit_price, amount`

export async function listBudgets() {
  const { data, error } = await supabase.from('budgets').select(BUDGET_SELECT).order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as Budget[]
}

export async function getBudget(id: string) {
  const { data, error } = await supabase.from('budgets').select(BUDGET_SELECT).eq('id', id).single()
  if (error) throw error
  return data as unknown as Budget
}

export async function listBudgetItems(budgetId: string) {
  const { data, error } = await supabase.from('budget_items').select(ITEM_SELECT).eq('budget_id', budgetId)
  if (error) throw error
  return data as BudgetItem[]
}

export async function createBudget(
  budget: { patient_id: string; protocol_id: string | null; valid_until: string | null; discount_amount: number; notes: string },
  items: { description: string; quantity: number; unit_price: number }[],
) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const total = Math.max(subtotal - budget.discount_amount, 0)

  const { data: created, error } = await supabase
    .from('budgets')
    .insert({
      patient_id: budget.patient_id,
      protocol_id: budget.protocol_id,
      valid_until: budget.valid_until,
      discount_amount: budget.discount_amount,
      notes: budget.notes || null,
      subtotal,
      total,
    })
    .select(BUDGET_SELECT)
    .single()
  if (error) throw error

  const budgetRow = created as unknown as Budget

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('budget_items').insert(
      items.map((item) => ({
        budget_id: budgetRow.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
      })),
    )
    if (itemsError) throw itemsError
  }

  void logAudit('create', 'budget', budgetRow.id, { patient_id: budget.patient_id, total: budgetRow.total })
  return budgetRow
}

export async function updateBudgetStatus(id: string, status: BudgetStatus) {
  const { data, error } = await supabase.from('budgets').update({ status }).eq('id', id).select(BUDGET_SELECT).single()
  if (error) throw error
  void logAudit('status_change', 'budget', id, { status })
  return data as unknown as Budget
}
