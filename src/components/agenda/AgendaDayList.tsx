import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { Appointment } from '../../services/appointments'
import { categoryColor } from '../../utils/categoryColors'

const STATUS_LABEL: Record<Appointment['status'], string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  reschedule_requested: 'Reprogramación solicitada',
  cancelled: 'Cancelada',
  completed: 'Completada',
}

const STATUS_TONE: Record<Appointment['status'], 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'neutral',
  confirmed: 'success',
  reschedule_requested: 'warning',
  cancelled: 'danger',
  completed: 'info',
}

function formatHour(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? 'a. m.' : 'p. m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export function AgendaDayList({
  appointments,
  onEventClick,
}: {
  appointments: Appointment[]
  onEventClick: (appointment: Appointment) => void
}) {
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const a of appointments) {
      if (a.protocol?.category && !seen.has(a.protocol.category)) {
        seen.set(a.protocol.category, a.protocol.category)
      }
    }
    return Array.from(seen.keys())
  }, [appointments])

  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set())

  function toggleCategory(code: string) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const sorted = useMemo(
    () =>
      [...appointments]
        .filter((a) => activeCategories.size === 0 || (a.protocol?.category && activeCategories.has(a.protocol.category)))
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [appointments, activeCategories],
  )

  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((code, i) => {
            const color = categoryColor(i)
            const active = activeCategories.has(code)
            return (
              <button
                key={code}
                onClick={() => toggleCategory(code)}
                className={
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ' +
                  (active ? `${color.bg} ${color.text} ring-1 ring-inset ring-current` : 'bg-white text-slate-500 shadow-card hover:bg-slate-50')
                }
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color.dot }} />
                {code}
              </button>
            )
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        {sorted.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No hay citas para este día.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sorted.map((a) => {
              const catIndex = a.protocol?.category ? categories.indexOf(a.protocol.category) : -1
              const color = catIndex >= 0 ? categoryColor(catIndex) : null
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-20 shrink-0 text-sm font-medium text-slate-600">{formatHour(a.start_time)}</div>
                  <div className="h-8 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: color?.dot ?? '#cbd5e1' }} />
                  <button
                    type="button"
                    onClick={() => onEventClick(a)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-midnight-950">{a.patient?.full_name ?? '—'}</p>
                    <p className="truncate text-xs text-slate-500">
                      {a.protocol?.name ?? 'Consulta / evaluación'}
                      {a.clinician?.full_name ? ` · ${a.clinician.full_name}` : ''}
                    </p>
                  </button>
                  <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  <button
                    type="button"
                    onClick={() => onEventClick(a)}
                    title="Editar cita"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Pencil size={15} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
