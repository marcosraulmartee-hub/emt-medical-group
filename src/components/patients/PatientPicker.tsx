import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import type { Patient } from '../../services/patients'

export function PatientPicker({
  label,
  patients,
  value,
  onChange,
  required,
  emptyLabel = 'Seleccioná un paciente',
  className = '',
}: {
  label: string
  patients: Patient[]
  value: string
  onChange: (patientId: string) => void
  required?: boolean
  emptyLabel?: string
  className?: string
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const sorted = [...patients].sort((a, b) => a.full_name.localeCompare(b.full_name))
    if (!term) return sorted
    return sorted.filter((p) => p.full_name.toLowerCase().includes(term))
  }, [patients, query])

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar paciente por nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 pl-8 text-xs"
        />
      </div>
      <Select label={label} required={required} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{emptyLabel}</option>
        {filtered.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
      </Select>
      {query && filtered.length === 0 && <p className="text-xs text-slate-400">Ningún paciente coincide con "{query}".</p>}
    </div>
  )
}
