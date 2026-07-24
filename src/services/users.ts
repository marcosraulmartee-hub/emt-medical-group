import { supabase } from '../lib/supabase'
import type { AppRole, Profile } from '../types/auth'
import { logAudit } from './audit'

const PROFILE_SELECT = `id, full_name, role, is_active, created_at, updated_at`

export async function listUsers() {
  const { data, error } = await supabase.from('profiles').select(PROFILE_SELECT).order('full_name')
  if (error) throw error
  return data as Profile[]
}

export async function updateUserRole(id: string, role: AppRole) {
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select(PROFILE_SELECT).single()
  if (error) throw error
  void logAudit('role_change', 'profile', id, { new_role: role })
  return data as Profile
}

export async function setUserActive(id: string, is_active: boolean) {
  const { data, error } = await supabase.from('profiles').update({ is_active }).eq('id', id).select(PROFILE_SELECT).single()
  if (error) throw error
  void logAudit(is_active ? 'activate' : 'deactivate', 'profile', id, {})
  return data as Profile
}

export async function updateUserName(id: string, full_name: string) {
  const { data, error } = await supabase.from('profiles').update({ full_name }).eq('id', id).select(PROFILE_SELECT).single()
  if (error) throw error
  void logAudit('rename', 'profile', id, { full_name })
  return data as Profile
}
