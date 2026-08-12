import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Alert } from '../../components/ui/Alert'
import type { Appointment, AppointmentStatus } from '../../services/appointments'
import { deleteAppointment } from '../../services/appointments'
import { buildWhatsAppShareUrl, openShareWindow } from '../../utils/share'
import { buildAppointmentConfirmMessage } from '../../utils/messages'
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

export function AppointmentDetailModal({
  appointment,
  onClose,
  onConfirm,
  onCancel,
  onComplete,
  onReschedule,
  onConfirmReschedule,
  onEdit,
  onDeleted,
}: {
  appointment: Appointment
  onClose: () => void
  onConfirm: (a: Appointment) => void
  onCancel: (a: Appointment) => void
  onComplete: (a: Appointment) => void
  onReschedule: (a: Appointment) => void
  onConfirmReschedule: (a: Appointment) => void
  onEdit: (a: Appointment) => void
  onDeleted: () => void
}) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  function handleWhatsAppConfirm() {
    openShareWindow(buildWhatsAppShareUrl(appointment.patient?.phone, buildAppointmentConfirmMessage(appointment)))
  }

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      await deleteAppointment(appointment.id, {
        date: appointment.date,
        start_time: appointment.start_time,
        patient_id: appointment.patient_id,
      })
      onDeleted()
    } catch {
      setError('No se pudo eliminar la cita.')
      setDeleting(false)
    }
  }

  return (
    <Modal open title="Detalle de la cita" size="sm" onClose={onClose}>
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-midnight-950">{appointment.patient?.full_name ?? '—'}</p>
            <p className="text-sm text-slate-500">
              {appointment.date} · {minutesToLabel(timeToMinutes(appointment.start_time))}
              {appointment.end_time ? ` – ${appointment.end_time.slice(0, 5)}` : ''}
            </p>
          </div>
          <Badge tone={STATUS_TONE[appointment.status]}>{STATUS_LABEL[appointment.status]}</Badge>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-400">Clínico / técnico</dt>
            <dd className="text-slate-700">{appointment.clinician?.full_name ?? 'Sin asignar'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Protocolo</dt>
            <dd className="text-slate-700">{appointment.protocol?.name ?? 'Sin definir'}</dd>
          </div>
          {appointment.notes && (
            <div>
              <dt className="text-slate-400">Notas</dt>
              <dd className="mt-1 text-slate-700">{appointment.notes}</dd>
            </div>
          )}
          {appointment.status === 'reschedule_requested' && appointment.requested_date && (
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              Propuesta: {appointment.requested_date} {appointment.requested_start_time?.slice(0, 5)}
            </div>
          )}
        </dl>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
            <Button size="sm" variant="secondary" onClick={handleWhatsAppConfirm}>
              Confirmar por WhatsApp
            </Button>
          )}
          {appointment.status === 'pending' && (
            <Button size="sm" onClick={() => onConfirm(appointment)}>
              Confirmar
            </Button>
          )}
          {appointment.status === 'reschedule_requested' && (
            <Button size="sm" onClick={() => onConfirmReschedule(appointment)}>
              Confirmar reprogramación
            </Button>
          )}
          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
            <>
              <Button size="sm" variant="secondary" onClick={() => onReschedule(appointment)}>
                Reprogramar
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onComplete(appointment)}>
                Marcar completada
              </Button>
              <Button size="sm" variant="danger" onClick={() => onCancel(appointment)}>
                Cancelar
              </Button>
            </>
          )}
          <Button size="sm" variant="secondary" onClick={() => onEdit(appointment)}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmDeleteOpen(true)}>
            Eliminar
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Eliminar cita"
        message={`Se elimina por completo la cita de ${appointment.patient?.full_name ?? 'este paciente'} del ${appointment.date}. No se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </Modal>
  )
}
