import { supabase } from '../lib/supabase'
import { ALL_PERMISSIONS, ROLE_MATRIX } from '../types/permissions'

export async function loadPermissions(role: string): Promise<Set<string>> {
  if (role === 'admin') return new Set(ALL_PERMISSIONS)
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_key')
      .eq('role_code', role)
    if (error || !data || data.length === 0) return new Set(ROLE_MATRIX[role] ?? [])
    return new Set((data as { permission_key: string }[]).map((d) => d.permission_key))
  } catch {
    return new Set(ROLE_MATRIX[role] ?? [])
  }
}
