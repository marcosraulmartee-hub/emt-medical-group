import { supabase } from '../lib/supabase'
import { logAudit } from './audit'

export type CashRegisterStatus = 'open' | 'closed'

export interface CashRegister {
  id: string
  business_date: string
  status: CashRegisterStatus
  opening_amount: number
  opened_at: string | null
  closed_at: string | null
}

const SELECT = `id, business_date, status, opening_amount, opened_at, closed_at`

export async function getCashRegister(dateISO: string) {
  const { data, error } = await supabase.from('cash_registers').select(SELECT).eq('business_date', dateISO).maybeSingle()
  if (error) throw error
  return data as CashRegister | null
}

export async function openCashRegister(dateISO: string, openingAmount: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('cash_registers')
    .upsert(
      {
        business_date: dateISO,
        status: 'open',
        opening_amount: openingAmount,
        opened_at: new Date().toISOString(),
        opened_by: user?.id,
        closed_at: null,
        closed_by: null,
      },
      { onConflict: 'business_date' },
    )
    .select(SELECT)
    .single()
  if (error) throw error
  void logAudit('open', 'cash_register', data.id, { business_date: dateISO, opening_amount: openingAmount })
  return data as CashRegister
}

export async function closeCashRegister(dateISO: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('cash_registers')
    .update({ status: 'closed', closed_at: new Date().toISOString(), closed_by: user?.id })
    .eq('business_date', dateISO)
    .select(SELECT)
    .single()
  if (error) throw error
  void logAudit('close', 'cash_register', data.id, { business_date: dateISO })
  return data as CashRegister
}
