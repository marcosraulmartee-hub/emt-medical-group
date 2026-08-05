import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { ProtocolOptionGroups } from './ProtocolOptionGroups'
import type { Protocol } from '../../services/protocols'
import type { ProtocolCategory } from '../../services/protocolCategories'

export function ProtocolPicker({
  label,
  protocols,
  categories,
  value,
  onChange,
  required,
  emptyLabel = 'Sin definir',
}: {
  label: string
  protocols: Protocol[]
  categories: ProtocolCategory[]
  value: string
  onChange: (protocolId: string) => void
  required?: boolean
  emptyLabel?: string
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return protocols
    return protocols.filter((p) => p.name.toLowerCase().includes(term))
  }, [protocols, query])

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar protocolo por nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 pl-8 text-xs"
        />
      </div>
      <Select label={label} required={required} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{emptyLabel}</option>
        <ProtocolOptionGroups protocols={filtered} categories={categories} />
      </Select>
      {query && filtered.length === 0 && <p className="text-xs text-slate-400">Ningún protocolo coincide con "{query}".</p>}
    </div>
  )
}
