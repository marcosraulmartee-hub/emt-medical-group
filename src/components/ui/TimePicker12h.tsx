import { useId } from 'react'

function to12Hour(h24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM'
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { hour12, period }
}

function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12
  return hour12 === 12 ? 12 : hour12 + 12
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

const selectClass =
  'h-11 rounded-2xl border border-slate-200 bg-white px-2 text-sm text-midnight-950 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 focus:border-teal-500'

export function TimePicker12h({
  label,
  value,
  onChange,
  required,
}: {
  label?: string
  value: string
  onChange: (value24h: string) => void
  required?: boolean
}) {
  const groupId = useId()
  const [h24Str, mStr] = value ? value.split(':') : ['', '']
  const h24 = h24Str !== '' ? Number(h24Str) : null
  const minute = mStr !== '' ? Number(mStr) : null
  const { hour12, period } = h24 !== null ? to12Hour(h24) : { hour12: null as number | null, period: 'AM' as const }

  function emit(nextHour12: number | null, nextMinute: number | null, nextPeriod: 'AM' | 'PM') {
    if (nextHour12 === null || nextMinute === null) {
      onChange('')
      return
    }
    const h24Next = to24Hour(nextHour12, nextPeriod)
    onChange(`${String(h24Next).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`)
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={groupId} className="mb-1.5 block text-sm font-medium text-slate-600">
          {label}
          {required && <span className="ml-0.5 text-teal-500">*</span>}
        </label>
      )}
      <div id={groupId} className="flex items-center gap-1.5">
        <select
          aria-label="Hora"
          className={selectClass}
          value={hour12 ?? ''}
          onChange={(e) => emit(e.target.value === '' ? null : Number(e.target.value), minute ?? 0, period)}
        >
          <option value="">--</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-slate-400">:</span>
        <select
          aria-label="Minutos"
          className={selectClass}
          value={minute ?? ''}
          onChange={(e) => emit(hour12, e.target.value === '' ? null : Number(e.target.value), period)}
        >
          <option value="">--</option>
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, '0')}
            </option>
          ))}
        </select>
        <select
          aria-label="a.m. / p.m."
          className={selectClass}
          value={period}
          onChange={(e) => emit(hour12, minute, e.target.value as 'AM' | 'PM')}
        >
          <option value="AM">a.m.</option>
          <option value="PM">p.m.</option>
        </select>
      </div>
    </div>
  )
}
