import type { Appointment } from '../services/appointments'
import { formatFullDate, fromISODate } from './dates'

export function buildAppointmentConfirmMessage(appointment: Appointment): string {
  const dateLabel = formatFullDate(fromISODate(appointment.date))
  const clinicianLine = appointment.clinician?.full_name ? ` con ${appointment.clinician.full_name}` : ''
  return `Hola ${appointment.patient?.full_name ?? ''}, te escribimos de EMT Medical Group para confirmar tu cita del ${dateLabel} a las ${appointment.start_time.slice(0, 5)}${clinicianLine}. ¿Confirmas tu asistencia?`
}

export function buildFollowUpReminderMessage(name: string): string {
  return `Hola ${name}, te escribimos de EMT Medical Group — hace tiempo no te vemos por la clínica. ¿Deseas agendar tu próxima sesión de tratamiento?`
}

export function buildDailyAgendaMessage(date: Date, appointments: Appointment[]): string {
  const dateLabel = formatFullDate(date)
  const active = appointments.filter((a) => a.status !== 'cancelled')
  if (active.length === 0) {
    return `📋 Agenda EMT Medical Group — ${dateLabel}\n\nNo hay citas programadas.`
  }
  const lines = active.map((a) => {
    const time = a.start_time.slice(0, 5)
    const name = a.patient?.full_name ?? '—'
    const protocol = a.protocol?.name ? ` — ${a.protocol.name}` : ''
    return `${time}  ${name}${protocol}`
  })
  return `📋 Agenda EMT Medical Group — ${dateLabel}\n\n${lines.join('\n')}\n\nTotal: ${active.length} cita${active.length === 1 ? '' : 's'}`
}
