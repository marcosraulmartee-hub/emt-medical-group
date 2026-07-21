import type { SessionRecord } from '../services/sessions'

export function computeCycleProgress(sessions: SessionRecord[]): Map<string, string> {
  const byCycle = new Map<string, SessionRecord[]>()
  for (const s of sessions) {
    if (!s.cycle_id) continue
    const list = byCycle.get(s.cycle_id) ?? []
    list.push(s)
    byCycle.set(s.cycle_id, list)
  }
  const result = new Map<string, string>()
  for (const list of byCycle.values()) {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))
    sorted.forEach((s, index) => {
      const total = s.cycle?.planned_sessions
      result.set(s.id, total ? `${index + 1} de ${total}` : `${index + 1}`)
    })
  }
  return result
}
