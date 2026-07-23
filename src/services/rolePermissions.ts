import { supabase } from '../lib/supabase'
import { logAudit } from './audit'

export interface PermissionDef {
  key: string
  label: string
}

export interface RoleDef {
  code: string
  label: string
}

export async function listPermissionDefs() {
  const { data, error } = await supabase.from('permissions').select('key, label').order('key')
  if (error) throw error
  return data as PermissionDef[]
}

export async function listRoleDefs() {
  const { data, error } = await supabase.from('roles').select('code, label').order('code')
  if (error) throw error
  return data as RoleDef[]
}

export async function listRolePermissionPairs() {
  const { data, error } = await supabase.from('role_permissions').select('role_code, permission_key')
  if (error) throw error
  return data as { role_code: string; permission_key: string }[]
}

export async function grantRolePermission(roleCode: string, permissionKey: string) {
  const { error } = await supabase.from('role_permissions').insert({ role_code: roleCode, permission_key: permissionKey })
  if (error) throw error
  void logAudit('grant_permission', 'role_permissions', null, { role: roleCode, permission: permissionKey })
}

export async function revokeRolePermission(roleCode: string, permissionKey: string) {
  const { error } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_code', roleCode)
    .eq('permission_key', permissionKey)
  if (error) throw error
  void logAudit('revoke_permission', 'role_permissions', null, { role: roleCode, permission: permissionKey })
}
