import { useCallback, useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Spinner } from '../components/ui/Spinner'
import type { Appointment } from '../services/appointments'
import { confirmReschedule, listAppointmentsInRange, updateAppointmentStatus } from '../services/appointments'
import { addDays, formatFullDate, startOfWeek, toISODate } from '../utils/dates'
import { CalendarGrid } from '../components/calendar/CalendarGrid'
import { AgendaDayList } from '../components/agenda/AgendaDayList'
import { AppointmentFormModal } from './agenda/AppointmentFormModal'
import { AppointmentDetailModal } from './agenda/AppointmentDetailModal'
import { RescheduleModal } from './agenda/RescheduleModal'
import { CancellationsModal } from './agenda/CancellationsModal'
import { AgendaSummaryModal } from './agenda/AgendaSummaryModal'
import { AvailabilityModal } from './agenda/AvailabilityModal'
import { useAuth } from '../hooks/useAuth'
import { buildDailyAgendaMessage } from '../utils/messages'
import { buildWhatsAppShareUrl, openShareWindow } from '../utils/share'

type ViewMode = 'day' | 'week'

export function AgendaPage() {
  const { can } = useAuth()
  const [view, setView] = useState<ViewMode>('day')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [cancellationsOpen, setCancellationsOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [sendingAgendaFor, setSendingAgendaFor] = useState<'today' | 'tomorrow' | null>(null)

  const weekStart = startOfWeek(selectedDate)
  const rangeStart = view === 'day' ? selectedDate : weekStart
  const rangeEnd = view === 'day' ? selectedDate : addDays(weekStart, 6)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listAppointmentsInRange(toISODate(rangeStart), toISODate(rangeEnd))
      setAppointments(data)
    } catch {
      setError('No se pudieron cargar las citas.')
    } finally {
      setLoading(false)
    }
  }, [rangeStart.getTime(), rangeEnd.getTime()])

  useEffect(() => {
    void load()
  }, [load])

  async function handleStatusAction(appointment: Appointment, status: Appointment['status']) {
    try {
      await updateAppointmentStatus(appointment.id, status)
      setSelectedAppointment(null)
      await load()
    } catch {
      setError('No se pudo actualizar la cita.')
    }
  }

  async function handleConfirmReschedule(appointment: Appointment) {
    try {
      await confirmReschedule(appointment.id)
      setSelectedAppointment(null)
      await load()
    } catch {
      setError('No se pudo confirmar la reprogramación.')
    }
  }

  async function handleSendAgenda(which: 'today' | 'tomorrow') {
    setSendingAgendaFor(which)
    setError('')
    try {
      const targetDate = which === 'tomorrow' ? addDays(new Date(), 1) : new Date()
      const iso = toISODate(targetDate)
      const data = await listAppointmentsInRange(iso, iso)
      openShareWindow(buildWhatsAppShareUrl(null, buildDailyAgendaMessage(targetDate, data)))
    } catch {
      setError(`No se pudo preparar la agenda de ${which === 'tomorrow' ? 'mañana' : 'hoy'}.`)
    } finally {
      setSendingAgendaFor(null)
    }
  }

  return (
    <AppShell title="Agenda">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Calendario de sesiones</h2>
            <p className="text-sm text-slate-500 capitalize">{formatFullDate(selectedDate)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setAvailabilityOpen(true)}>
              Ver disponibilidad
            </Button>
            <Button variant="secondary" onClick={() => handleSendAgenda('today')} loading={sendingAgendaFor === 'today'}>
              <MessageCircle size={16} className="mr-1.5" />
              Enviar agenda de hoy
            </Button>
            <Button variant="secondary" onClick={() => handleSendAgenda('tomorrow')} loading={sendingAgendaFor === 'tomorrow'}>
              <MessageCircle size={16} className="mr-1.5" />
              Enviar agenda de mañana
            </Button>
            {can('stats.view') && (
              <>
                <Button variant="secondary" onClick={() => setSummaryOpen(true)}>
                  Resumen clínico
                </Button>
                <Button variant="secondary" onClick={() => setCancellationsOpen(true)}>
                  Ver cancelaciones
                </Button>
              </>
            )}
            <Button onClick={() => setCreateOpen(true)}>Nueva cita</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedDate((d) => addDays(d, view === 'day' ? -1 : -7))}
            >
              {view === 'day' ? '← Día anterior' : '← Semana anterior'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedDate(new Date())}>
              Hoy
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setSelectedDate((d) => addDays(d, view === 'day' ? 1 : 7))}>
              {view === 'day' ? 'Día siguiente →' : 'Semana siguiente →'}
            </Button>
          </div>
          <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-card">
            <button
              onClick={() => setView('day')}
              className={
                'rounded-xl px-4 py-2 text-sm font-medium transition ' +
                (view === 'day' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              Día
            </button>
            <button
              onClick={() => setView('week')}
              className={
                'rounded-xl px-4 py-2 text-sm font-medium transition ' +
                (view === 'week' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              Semana
            </button>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {loading ? (
          <div className="flex justify-center p-10">
            <Spinner className="h-6 w-6 text-teal-500" />
          </div>
        ) : view === 'day' ? (
          <AgendaDayList appointments={appointments} onEventClick={(a) => setSelectedAppointment(a)} />
        ) : (
          <CalendarGrid
            days={Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))}
            appointments={appointments}
            onEventClick={(a) => setSelectedAppointment(a)}
            onDayHeaderClick={(date) => {
              setSelectedDate(date)
              setView('day')
            }}
          />
        )}
      </div>

      <AppointmentFormModal
        open={createOpen}
        defaultDate={selectedDate}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false)
          void load()
        }}
      />

      {rescheduling && (
        <RescheduleModal
          appointment={rescheduling}
          onClose={() => setRescheduling(null)}
          onSaved={() => {
            setRescheduling(null)
            void load()
          }}
        />
      )}

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onConfirm={(a) => handleStatusAction(a, 'confirmed')}
          onCancel={(a) => handleStatusAction(a, 'cancelled')}
          onComplete={(a) => handleStatusAction(a, 'completed')}
          onReschedule={(a) => {
            setSelectedAppointment(null)
            setRescheduling(a)
          }}
          onConfirmReschedule={handleConfirmReschedule}
        />
      )}

      <CancellationsModal open={cancellationsOpen} onClose={() => setCancellationsOpen(false)} />
      <AgendaSummaryModal open={summaryOpen} onClose={() => setSummaryOpen(false)} />
      <AvailabilityModal open={availabilityOpen} onClose={() => setAvailabilityOpen(false)} />
    </AppShell>
  )
}
