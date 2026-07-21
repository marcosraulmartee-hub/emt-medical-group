import { supabase } from '../lib/supabase'

export interface StaffReminder {
  id: string
  text: string
  is_done: boolean
  created_at: string
  updated_at: string
}

const SELECT = `id, text, is_done, created_at, updated_at`

export async function listStaffReminders() {
  const { data, error } = await supabase
    .from('staff_reminders')
    .select(SELECT)
    .order('is_done')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as StaffReminder[]
}

export async function addStaffReminder(text: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('staff_reminders')
    .insert({ text, created_by: user?.id })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as StaffReminder
}

export async function toggleStaffReminder(id: string, is_done: boolean) {
  const { data, error } = await supabase.from('staff_reminders').update({ is_done }).eq('id', id).select(SELECT).single()
  if (error) throw error
  return data as StaffReminder
}

export async function deleteStaffReminder(id: string) {
  const { error } = await supabase.from('staff_reminders').delete().eq('id', id)
  if (error) throw error
}
