import { useEffect, useState } from 'react'
import type { Appointment, AppointmentStatus } from '../../services/appointments'
import { layoutEvents, timeToMinutes } from '../../utils/timeGrid'
import { toISODate } from '../../utils/dates'

const START_HOUR = 7
const END_HOUR = 19
const PX_PER_HOUR = 56
const DEFAULT_DURATION_MIN = 45

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: 'bg-slate-100 border-slate-300 text-slate-700',
  confirmed: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  reschedule_requested: 'bg-amber-50 border-amber-300 text-amber-800',
  cancelled: 'bg-red-50 border-red-200 text-red-500 line-through decoration-red-300',
  completed: 'bg-teal-50 border-teal-300 text-teal-800',
}

function hourLabel(hour: number): string {
  const period = hour < 12 ? 'a.m.' : 'p.m.'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${period}`
}

export function CalendarGrid({
  days,
  appointments,
  onEventClick,
  onDayHeaderClick,
}: {
  days: Date[]
  appointments: Appointment[]
  onEventClick: (appointment: Appointment) => void
  onDayHeaderClick?: (date: Date) => void
}) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const gridHeight = (END_HOUR - START_HOUR) * PX_PER_HOUR
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const todayISO = toISODate(now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  function minutesFromGridStart(min: number) {
    return ((min - START_HOUR * 60) / 60) * PX_PER_HOUR
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="flex border-b border-slate-100">
        <div className="w-14 shrink-0" />
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
          {days.map((day) => {
            const iso = toISODate(day)
            const isToday = iso === todayISO
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onDayHeaderClick?.(day)}
                disabled={!onDayHeaderClick}
                className={`border-l border-slate-100 py-3 text-center ${onDayHeaderClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
              >
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  {new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(day)}
                </p>
                <p
                  className={
                    'mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ' +
                    (isToday ? 'bg-teal-500 text-white' : 'text-midnight-900')
                  }
                >
                  {day.getDate()}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex overflow-x-auto">
        <div className="w-14 shrink-0">
          {hours.map((hour) => (
            <div key={hour} className="relative" style={{ height: PX_PER_HOUR }}>
              <span className="absolute -top-2 right-2 text-[10px] text-slate-400">{hourLabel(hour)}</span>
            </div>
          ))}
        </div>

        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(120px, 1fr))` }}>
          {days.map((day) => {
            const iso = toISODate(day)
            const dayAppointments = appointments.filter((a) => a.date === iso)
            const laidOut = layoutEvents(
              dayAppointments,
              (a) => timeToMinutes(a.start_time),
              (a) => timeToMinutes(a.start_time) + (a.end_time ? timeToMinutes(a.end_time) - timeToMinutes(a.start_time) : DEFAULT_DURATION_MIN),
            )
            return (
              <div key={iso} className="relative border-l border-slate-100" style={{ height: gridHeight }}>
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-slate-100"
                    style={{ top: minutesFromGridStart(hour * 60) }}
                  />
                ))}

                {iso === todayISO && nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60 && (
                  <div
                    className="absolute inset-x-0 z-10 border-t-2 border-[#DC4B3E]"
                    style={{ top: minutesFromGridStart(nowMinutes) }}
                  >
                    <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-[#DC4B3E]" />
                  </div>
                )}

                {laidOut.map(({ event, startMin, endMin, col, totalCols }) => {
                  const top = Math.max(0, minutesFromGridStart(startMin))
                  const height = Math.max(20, minutesFromGridStart(endMin) - top)
                  const widthPct = 100 / totalCols
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick(event)}
                      className={`absolute overflow-hidden rounded-lg border px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition hover:brightness-95 ${STATUS_STYLE[event.status]}`}
                      style={{
                        top,
                        height,
                        left: `calc(${col * widthPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                    >
                      <p className="font-semibold">{event.start_time.slice(0, 5)}</p>
                      <p className="truncate">{event.patient?.full_name ?? '—'}</p>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
