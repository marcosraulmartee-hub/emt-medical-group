import type { Protocol } from '../../services/protocols'
import type { ProtocolCategory } from '../../services/protocolCategories'

export function ProtocolOptionGroups({ protocols, categories }: { protocols: Protocol[]; categories: ProtocolCategory[] }) {
  const labelByCode = new Map(categories.map((c) => [c.code, c.label]))
  const groups = new Map<string, Protocol[]>()
  for (const p of protocols) {
    const list = groups.get(p.category) ?? []
    list.push(p)
    groups.set(p.category, list)
  }
  const sortedGroups = Array.from(groups.entries())
    .map(([code, list]) => ({
      code,
      label: labelByCode.get(code) ?? code,
      protocols: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return (
    <>
      {sortedGroups.map((g) => (
        <optgroup key={g.code} label={g.label}>
          {g.protocols.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {!p.is_active ? ' (parámetros pendientes)' : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  )
}
