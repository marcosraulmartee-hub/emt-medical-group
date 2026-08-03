import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import type { Patient } from '../../services/patients'
import { listPatients } from '../../services/patients'
import { PatientCreateModal } from '../../components/patients/PatientCreateModal'
import type { Profile } from '../../types/auth'
import { listUsers } from '../../services/users'
import type { Protocol } from '../../services/protocols'
import { listProtocols } from '../../services/protocols'
import type { ProtocolCategory } from '../../services/protocolCategories'
import { listProtocolCategories } from '../../services/protocolCategories'
import { ProtocolOptionGroups } from '../../components/protocols/ProtocolOptionGroups'
import { countAppointmentsOnDate, createAppointment } from '../../services/appointments'
import { getSetting } from '../../services/clinicSettings'
import { toISODate } from '../../utils/dates'

interface AppointmentFormModalProps {
  open: boolean
  defaultDate: Date
  onClose: () => void
  onCreated: () => void
}

const emptyForm = { patient_id: '', clinician_id: '', protocol_id: '', date: '', start_time: '09:00', end_time: '', notes: '' }

export function AppointmentFormModal({ open, defaultDate, onClose, onCreated }: AppointmentFormModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [protocolCategories, setProtocolCategories] = useState<ProtocolCategory[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [capacityWarning, setCapacityWarning] = useState('')
  const [newPatientOpen, setNewPatientOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ ...emptyForm, date: toISODate(defaultDate) })
    setError('')
    setCapacityWarning('')
    Promise.all([listPatients(), listUsers(), listProtocols(), listProtocolCategories()])
      .then(([p, u, pr, cats]) => {
        setPatients(p)
        setStaff(u.filter((x) => x.role === 'admin' || x.role === 'medico' || x.role === 'tecnico'))
        setProtocols(pr)
        setProtocolCategories(cats)
      })
      .catch(() => setError('No se pudieron cargar pacientes/protocolos.'))
  }, [open, defaultDate])

  useEffect(() => {
    if (!open || !form.date) return
    let active = true
    Promise.all([countAppointmentsOnDate(form.date), getSetting('daily_appointment_limit')]).then(([count, limit]) => {
      if (!active) return
      const max = Number(limit ?? '12')
      setCapacityWarning(count >= max ? `Ya hay ${count} citas ese día (cupo configurado: ${max}).` : '')
    })
    return () => {
      active = false
    }
  }, [open, form.date])

  function handlePatientCreated(patient: Patient) {
    setPatients((prev) => [...prev, patient].sort((a, b) => a.full_name.localeCompare(b.full_name)))
    setForm((prev) => ({ ...prev, patient_id: patient.id }))
    setNewPatientOpen(false)
  }

  async function handleSubmit() {
    if (!form.patient_id || !form.date || !form.start_time) {
      setError('Paciente, fecha y hora son obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createAppointment({
        patient_id: form.patient_id,
        clinician_id: form.clinician_id || null,
        protocol_id: form.protocol_id || null,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time || null,
        notes: form.notes || null,
      })
      onCreated()
    } catch {
      setError('No se pudo crear la cita.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Nueva cita"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Agendar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {capacityWarning && <Alert variant="info">{capacityWarning}</Alert>}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select
              label="Paciente"
              required
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
            >
              <option value="">Seleccioná un paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={() => setNewPatientOpen(true)}>
            + Nuevo
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Fecha" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input
            label="Hora"
            type="time"
            required
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
          />
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
        <Select
          label="Protocolo (opcional)"
          value={form.protocol_id}
          onChange={(e) => setForm({ ...form, protocol_id: e.target.value })}
        >
          <option value="">Sin definir</option>
          <ProtocolOptionGroups protocols={protocols} categories={protocolCategories} />
        </Select>
        <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      <PatientCreateModal open={newPatientOpen} onClose={() => setNewPatientOpen(false)} onCreated={handlePatientCreated} />
    </Modal>
  )
}
