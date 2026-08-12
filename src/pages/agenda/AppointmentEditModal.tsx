import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import { TimePicker12h } from '../../components/ui/TimePicker12h'
import { ProtocolPicker } from '../../components/protocols/ProtocolPicker'
import type { Patient } from '../../services/patients'
import { listPatients } from '../../services/patients'
import type { Profile } from '../../types/auth'
import { listUsers } from '../../services/users'
import type { Protocol } from '../../services/protocols'
import { listProtocols } from '../../services/protocols'
import type { ProtocolCategory } from '../../services/protocolCategories'
import { listProtocolCategories } from '../../services/protocolCategories'
import type { Appointment } from '../../services/appointments'
import { updateAppointment } from '../../services/appointments'

function buildForm(appointment: Appointment) {
  return {
    patient_id: appointment.patient_id,
    clinician_id: appointment.clinician_id ?? '',
    protocol_id: appointment.protocol_id ?? '',
    date: appointment.date,
    start_time: appointment.start_time.slice(0, 5),
    notes: appointment.notes ?? '',
  }
}

export function AppointmentEditModal({
  appointment,
  onClose,
  onSaved,
}: {
  appointment: Appointment
  onClose: () => void
  onSaved: () => void
}) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [protocolCategories, setProtocolCategories] = useState<ProtocolCategory[]>([])
  const [form, setForm] = useState(() => buildForm(appointment))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(buildForm(appointment))
    setError('')
    Promise.all([listPatients(), listUsers(), listProtocols(), listProtocolCategories()])
      .then(([p, u, pr, cats]) => {
        setPatients(p)
        setStaff(u.filter((x) => x.role === 'admin' || x.role === 'medico' || x.role === 'tecnico'))
        setProtocols(pr)
        setProtocolCategories(cats)
      })
      .catch(() => setError('No se pudieron cargar pacientes/protocolos.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment.id])

  async function handleSubmit() {
    if (!form.patient_id || !form.date || !form.start_time) {
      setError('Paciente, fecha y hora son obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateAppointment(appointment.id, {
        patient_id: form.patient_id,
        clinician_id: form.clinician_id || null,
        protocol_id: form.protocol_id || null,
        date: form.date,
        start_time: form.start_time,
        notes: form.notes || null,
      })
      onSaved()
    } catch {
      setError('No se pudo guardar la cita.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title="Editar cita"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select label="Paciente" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
          <option value="">Seleccioná un paciente</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Fecha" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <TimePicker12h label="Hora" required value={form.start_time} onChange={(time) => setForm({ ...form, start_time: time })} />
        </div>

        <Select
          label="Clínico / técnico asignado"
          value={form.clinician_id}
          onChange={(e) => setForm({ ...form, clinician_id: e.target.value })}
        >
          <option value="">Sin asignar</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </Select>

        <ProtocolPicker
          label="Protocolo (opcional)"
          protocols={protocols}
          categories={protocolCategories}
          value={form.protocol_id}
          onChange={(protocolId) => setForm({ ...form, protocol_id: protocolId })}
        />

        <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
    </Modal>
  )
}
