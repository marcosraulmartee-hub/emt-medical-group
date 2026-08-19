import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, MessageCircle, UserPlus } from 'lucide-react'
import { Alert } from '../ui/Alert'
import type { Appointment } from '../../services/appointments'
import { listAppointmentsInRange, updateAppointmentStatus } from '../../services/appointments'
import type { FollowUpPatient } from '../../services/followUp'
import { listPatientsNeedingFollowUp } from '../../services/followUp'
import type { IntakeSubmission } from '../../services/patientIntake'
import { listUnreviewedIntakeSubmissions, markIntakeSubmissionReviewed } from '../../services/patientIntake'
import { buildAppointmentConfirmMessage, buildFollowUpReminderMessage } from '../../utils/messages'
import { buildWhatsAppShareUrl, openShareWindow } from '../../utils/share'
import { addDays, toISODate } from '../../utils/dates'
import { minutesToLabel, timeToMinutes } from '../../utils/timeGrid'
import { useAuth } from '../../hooks/useAuth'

export function PendingActionsCard({ showFollowUp }: { showFollowUp: boolean }) {
  const { profile } = useAuth()
  const showIntake = profile?.role === 'admin' || profile?.role === 'recepcionista'
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([])
  const [followUp, setFollowUp] = useState<FollowUpPatient[]>([])
  const [intakeSubmissions, setIntakeSubmissions] = useState<IntakeSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const today = new Date()
      const tasks: Promise<void>[] = [
        listAppointmentsInRange(toISODate(today), toISODate(addDays(today, 13))).then((list) =>
          setPendingAppointments(list.filter((a) => a.status === 'pending').slice(0, 5)),
        ),
      ]
      if (showFollowUp) tasks.push(listPatientsNeedingFollowUp().then((list) => setFollowUp(list.slice(0, 5))))
      if (showIntake) tasks.push(listUnreviewedIntakeSubmissions().then(setIntakeSubmissions))
      await Promise.all(tasks)
    } catch {
      setError('No se pudieron cargar las acciones pendientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFollowUp, showIntake])

  async function handleMarkReviewed(submission: IntakeSubmission) {
    setReviewingId(submission.id)
    setError('')
    try {
      await markIntakeSubmissionReviewed(submission.id)
      setIntakeSubmissions((prev) => prev.filter((s) => s.id !== submission.id))
    } catch {
      setError('No se pudo marcar el registro como revisado.')
    } finally {
      setReviewingId(null)
    }
  }

  async function handleConfirm(appointment: Appointment) {
    setConfirmingId(appointment.id)
    setError('')
    try {
      await updateAppointmentStatus(appointment.id, 'confirmed')
      setPendingAppointments((prev) => prev.filter((a) => a.id !== appointment.id))
    } catch {
      setError('No se pudo confirmar la cita.')
    } finally {
      setConfirmingId(null)
    }
  }

  function handleWhatsAppConfirm(appointment: Appointment) {
    openShareWindow(buildWhatsAppShareUrl(appointment.patient?.phone, buildAppointmentConfirmMessage(appointment)))
  }

  function handleWhatsAppFollowUp(patient: FollowUpPatient) {
    openShareWindow(buildWhatsAppShareUrl(patient.phone, buildFollowUpReminderMessage(patient.full_name)))
  }

  if (!loading && !error && pendingAppointments.length === 0 && followUp.length === 0 && intakeSubmissions.length === 0) {
    return null
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <CalendarClock size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-midnight-950">Acciones pendientes</h3>
          <p className="text-xs text-slate-400">
            Citas por confirmar, pacientes en seguimiento{showIntake ? ' y registros nuevos por Google Forms' : ''}.
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <div className="space-y-5">
          {pendingAppointments.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Citas por confirmar</p>
              <ul className="space-y-2">
                {pendingAppointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-midnight-950">{a.patient?.full_name ?? '—'}</p>
                      <p className="text-xs text-slate-500">
                        {a.date} · {minutesToLabel(timeToMinutes(a.start_time))}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleWhatsAppConfirm(a)}
                        title="Confirmar por WhatsApp"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleConfirm(a)}
                        disabled={confirmingId === a.id}
                        className="rounded-lg bg-teal-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-600 disabled:opacity-40"
                      >
                        Confirmar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <Link to="/agenda" className="mt-2 inline-block text-xs text-teal-600 hover:underline">
                Ver toda la agenda →
              </Link>
            </div>
          )}

          {showFollowUp && followUp.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Pacientes en seguimiento</p>
              <ul className="space-y-2">
                {followUp.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-midnight-950">{p.full_name}</p>
                      <p className="text-xs text-slate-500">{p.days_since} días sin cita</p>
                    </div>
                    <button
                      onClick={() => handleWhatsAppFollowUp(p)}
                      title="Enviar recordatorio por WhatsApp"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <Link to="/patients?followup=true" className="mt-2 inline-block text-xs text-teal-600 hover:underline">
                Ver todos en seguimiento →
              </Link>
            </div>
          )}

          {showIntake && intakeSubmissions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Registros nuevos (Google Forms)
              </p>
              <ul className="space-y-2">
                {intakeSubmissions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-midnight-950">{s.patient?.full_name ?? 'Paciente sin vincular'}</p>
                      <p className="text-xs text-slate-500">{new Date(s.created_at).toLocaleString('es-ES')}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {s.patient_id && (
                        <Link
                          to={`/patients/${s.patient_id}`}
                          title="Ver ficha del paciente"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-teal-600 hover:bg-teal-50"
                        >
                          <UserPlus size={16} />
                        </Link>
                      )}
                      <button
                        onClick={() => handleMarkReviewed(s)}
                        disabled={reviewingId === s.id}
                        className="rounded-lg bg-teal-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-600 disabled:opacity-40"
                      >
                        Marcar revisado
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
