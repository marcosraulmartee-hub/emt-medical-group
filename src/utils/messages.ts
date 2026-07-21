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
