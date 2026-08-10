import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { TimePicker12h } from '../../components/ui/TimePicker12h'
import type { Appointment } from '../../services/appointments'
import { requestReschedule } from '../../services/appointments'
import { minutesToLabel, timeToMinutes } from '../../utils/timeGrid'

export function RescheduleModal({
  appointment,
  onClose,
  onSaved,
}: {
  appointment: Appointment
  onClose: () => void
  onSaved: () => void
}) {
  const [date, setDate] = useState(appointment.date)
  const [time, setTime] = useState(appointment.start_time.slice(0, 5))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setSaving(true)
    setError('')
    try {
      await requestReschedule(appointment.id, date, time)
      onSaved()
    } catch {
      setError('No se pudo registrar la solicitud de reprogramación.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title={`Reprogramar cita de ${appointment.patient?.full_name ?? 'paciente'}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Registrar solicitud
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <p className="text-sm text-slate-500">
          Fecha y hora actuales: {appointment.date} {minutesToLabel(timeToMinutes(appointment.start_time))}
        </p>
        <Input label="Nueva fecha propuesta" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TimePicker12h label="Nueva hora propuesta" value={time} onChange={setTime} />
      </div>
    </Modal>
  )
}
