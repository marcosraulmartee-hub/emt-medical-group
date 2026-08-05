import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { Appointment } from '../../services/appointments'
import { listAppointmentsInRange } from '../../services/appointments'
import type { AvailabilitySlot, DayAvailabilitySummary } from '../../services/availability'
import { buildDayAvailability, buildWeekAvailability } from '../../services/availability'
import { addDays, formatFullDate, startOfWeek, toISODate } from '../../utils/dates'
import { AppointmentFormModal } from './AppointmentFormModal'

type Range = 'dia' | 'semana'

export function AvailabilityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [range, setRange] = useState<Range>('dia')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingSlot, setBookingSlot] = useState<{ date: Date; time: string } | null>(null)

  const weekStart = startOfWeek(selectedDate)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const from = range === 'dia' ? selectedDate : weekStart
      const to = range === 'dia' ? selectedDate : addDays(weekStart, 6)
      setAppointments(await listAppointmentsInRange(toISODate(from), toISODate(to)))
    } catch {
      setError('No se pudo cargar la disponibilidad.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, range, selectedDate.getTime()])

  const daySlots: AvailabilitySlot[] = useMemo(() => {
    if (range !== 'dia') return []
    const iso = toISODate(selectedDate)
    return buildDayAvailability(appointments.filter((a) => a.date === iso))
  }, [range, appointments, selectedDate])

  const weekSummary: DayAvailabilitySummary[] = useMemo(() => {
    if (range !== 'semana') return []
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const byDate = new Map(days.map((d) => [toISODate(d), appointments.filter((a) => a.date === toISODate(d))]))
    return buildWeekAvailability(byDate)
  }, [range, appointments, weekStart])

  return (
    <>
      <Modal open={open} title="Disponibilidad de horario" size="lg" onClose={onClose}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5">
              <button
                onClick={() => setRange('dia')}
                className={
                  'rounded-xl px-4 py-2 text-sm font-medium transition ' +
                  (range === 'dia' ? 'bg-white text-midnight-950 shadow-card' : 'text-slate-600 hover:bg-white/60')
                }
              >
                Día
              </button>
              <button
                onClick={() => setRange('semana')}
                className={
                  'rounded-xl px-4 py-2 text-sm font-medium transition ' +
                  (range === 'semana' ? 'bg-white text-midnight-950 shadow-card' : 'text-slate-600 hover:bg-white/60')
                }
              >
                Semana
              </button>
            </div>
            {range === 'dia' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDate((d) => addDays(d, -1))}
                  className="rounded-xl px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
                >
                  ←
                </button>
                <p className="text-sm font-medium capitalize text-midnight-950">{formatFullDate(selectedDate)}</p>
                <button
                  onClick={() => setSelectedDate((d) => addDays(d, 1))}
                  className="rounded-xl px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
                >
                  →
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400">Bloques de 35 min · 9:00 a.m. – 6:00 p.m.</p>

          {error && <Alert variant="error">{error}</Alert>}

          {loading ? (
            <div className="p-6 text-center text-sm text-slate-500">Cargando...</div>
          ) : range === 'dia' ? (
            <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-slate-100">
              <ul className="divide-y divide-slate-100">
                {daySlots.map((slot) => (
                  <li key={slot.start} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="w-28 shrink-0 text-sm font-medium text-slate-600">
                      {slot.start} – {slot.end}
                    </span>
                    {slot.occupied ? (
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-500">
                        {slot.appointment?.patient?.full_name ?? 'Ocupado'}
                      </span>
                    ) : (
                      <span className="flex-1 text-sm text-slate-300">—</span>
                    )}
                    {slot.occupied ? (
                      <Badge tone="neutral">Ocupado</Badge>
                    ) : (
                      <button
                        onClick={() => setBookingSlot({ date: selectedDate, time: slot.start })}
                        className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        Libre · agendar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              {weekSummary.map((day, i) => {
                const date = addDays(weekStart, i)
                const pct = day.total === 0 ? 0 : Math.round((day.free / day.total) * 100)
                return (
                  <button
                    key={day.date}
                    onClick={() => {
                      setSelectedDate(date)
                      setRange('dia')
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-card hover:bg-slate-50"
                  >
                    <span className="w-32 shrink-0 text-sm font-medium capitalize text-midnight-950">
                      {formatFullDate(date)}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs text-slate-500">
                      {day.free} de {day.total} libres
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </Modal>

      {bookingSlot && (
        <AppointmentFormModal
          open
          defaultDate={bookingSlot.date}
          defaultTime={bookingSlot.time}
          onClose={() => setBookingSlot(null)}
          onCreated={() => {
            setBookingSlot(null)
            void load()
          }}
        />
      )}
    </>
  )
}
