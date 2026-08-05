import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import type { Appointment, AppointmentStatus } from '../../services/appointments'
import { minutesToLabel, timeToMinutes } from '../../utils/timeGrid'

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  reschedule_requested: 'Reprogramación solicitada',
  cancelled: 'Cancelada',
  completed: 'Completada',
}

const STATUS_TONE: Record<AppointmentStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'neutral',
  confirmed: 'success',
  reschedule_requested: 'warning',
  cancelled: 'danger',
  completed: 'info',
}

export function TodayAgenda({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-midnight-950">Agenda de hoy</p>
        <Link to="/agenda" className="text-xs text-teal-600 hover:underline">
          Ver agenda completa
        </Link>
      </div>
      {appointments.length === 0 ? (
        <p className="text-sm text-slate-400">No hay citas agendadas para hoy.</p>
      ) : (
        <ul className="space-y-2">
          {appointments.slice(0, 6).map((appt) => (
            <li key={appt.id} className="flex items-center justify-between rounded-2xl px-1 py-2">
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 whitespace-nowrap text-sm font-semibold text-midnight-900">
                  {minutesToLabel(timeToMinutes(appt.start_time))}
                </span>
                <div>
                  <p className="text-sm text-slate-700">{appt.patient?.full_name ?? '—'}</p>
                  {appt.clinician?.full_name && <p className="text-xs text-slate-400">{appt.clinician.full_name}</p>}
                </div>
              </div>
              <Badge tone={STATUS_TONE[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
            </li>
          ))}
          {appointments.length > 6 && (
            <li className="pt-1 text-center text-xs text-slate-400">+{appointments.length - 6} más</li>
          )}
        </ul>
      )}
    </div>
  )
}
