import { supabase } from '../lib/supabase'

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  actor_name: string | null
}

export async function logAudit(action: string, entity: string, entityId: string | null, details?: Record<string, unknown>) {
  const { data } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    user_id: data.user?.id ?? null,
    action,
    entity,
    entity_id: entityId,
    details: details ?? null,
  })
}

export async function listAuditLogs(filters: { from?: string; to?: string; entity?: string; userId?: string }) {
  let query = supabase
    .from('audit_logs')
    .select('id, user_id, action, entity, entity_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(300)
  if (filters.from) query = query.gte('created_at', filters.from)
  if (filters.to) query = query.lte('created_at', filters.to)
  if (filters.entity) query = query.eq('entity', filters.entity)
  if (filters.userId) query = query.eq('user_id', filters.userId)

  const { data, error } = await query
  if (error) throw error
  const logs = data as Omit<AuditLog, 'actor_name'>[]

  const userIds = [...new Set(logs.map((l) => l.user_id).filter((id): id is string => !!id))]
  const namesById = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
    for (const p of profiles ?? []) namesById.set(p.id, p.full_name)
  }

  return logs.map((l) => ({ ...l, actor_name: l.user_id ? (namesById.get(l.user_id) ?? 'Usuario eliminado') : 'Sistema' }))
}
