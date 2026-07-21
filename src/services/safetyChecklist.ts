import { supabase } from '../lib/supabase'

export interface SafetyChecklistItem {
  id: string
  code: string
  label: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChecklistAnswer {
  code: string
  label: string
  passed: boolean
  notes: string
}

const SELECT = `id, code, label, order_index, is_active, created_at, updated_at`

export async function listActiveChecklistItems() {
  const { data, error } = await supabase
    .from('safety_checklist_items')
    .select(SELECT)
    .eq('is_active', true)
    .order('order_index')
  if (error) throw error
  return data as SafetyChecklistItem[]
}

export async function listAllChecklistItems() {
  const { data, error } = await supabase.from('safety_checklist_items').select(SELECT).order('order_index')
  if (error) throw error
  return data as SafetyChecklistItem[]
}

export async function createChecklistItem(payload: { code: string; label: string; order_index: number }) {
  const { data, error } = await supabase.from('safety_checklist_items').insert(payload).select(SELECT).single()
  if (error) throw error
  return data as SafetyChecklistItem
}

export async function updateChecklistItem(
  id: string,
  patch: Partial<{ label: string; order_index: number; is_active: boolean }>,
) {
  const { data, error } = await supabase.from('safety_checklist_items').update(patch).eq('id', id).select(SELECT).single()
  if (error) throw error
  return data as SafetyChecklistItem
}
