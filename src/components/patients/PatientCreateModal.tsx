import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Alert } from '../ui/Alert'
import type { Patient } from '../../services/patients'
import { createPatient } from '../../services/patients'

const emptyForm = {
  full_name: '',
  national_id: '',
  birth_date: '',
  gender: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  occupation: '',
  education_level: '',
  marital_status: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  referred_by: '',
  insurance_provider: '',
  medical_record: '',
}

interface PatientCreateModalProps {
  open: boolean
  onClose: () => void
  onCreated: (patient: Patient) => void
}

export function PatientCreateModal({ open, onClose, onCreated }: PatientCreateModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.full_name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const patient = await createPatient({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        birth_date: form.birth_date,
        gender: form.gender,
        medical_record: form.medical_record || null,
        national_id: form.national_id || null,
        address: form.address || null,
        city: form.city || null,
        occupation: form.occupation || null,
        education_level: form.education_level || null,
        marital_status: form.marital_status || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        referred_by: form.referred_by || null,
        insurance_provider: form.insurance_provider || null,
      })
      setForm(emptyForm)
      onCreated(patient)
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : ''
      setError(message ? `No se pudo crear el paciente: ${message}` : 'No se pudo crear el paciente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Nueva ficha de paciente"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Crear paciente
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Datos personales</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre completo" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
            <Input label="Cédula" value={form.national_id} onChange={(e) => update('national_id', e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Fecha de nacimiento" type="date" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} />
            <Select label="Género" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
              <option value="">Sin especificar</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contacto</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            <Input label="Teléfono" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Dirección" value={form.address} onChange={(e) => update('address', e.target.value)} />
            <Input label="Ciudad" value={form.city} onChange={(e) => update('city', e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Datos sociodemográficos</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Ocupación" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} />
            <Select label="Nivel educativo" value={form.education_level} onChange={(e) => update('education_level', e.target.value)}>
              <option value="">Sin especificar</option>
              <option value="primaria">Primaria</option>
              <option value="secundaria">Secundaria</option>
              <option value="universitaria">Universitaria</option>
              <option value="posgrado">Posgrado</option>
              <option value="otro">Otro</option>
            </Select>
          </div>
          <Select label="Estado civil" value={form.marital_status} onChange={(e) => update('marital_status', e.target.value)}>
            <option value="">Sin especificar</option>
            <option value="soltero_a">Soltero/a</option>
            <option value="casado_a">Casado/a</option>
            <option value="union_libre">Unión libre</option>
            <option value="divorciado_a">Divorciado/a</option>
            <option value="viudo_a">Viudo/a</option>
            <option value="otro">Otro</option>
          </Select>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contacto de emergencia</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={form.emergency_contact_name}
              onChange={(e) => update('emergency_contact_name', e.target.value)}
            />
            <Input
              label="Teléfono"
              value={form.emergency_contact_phone}
              onChange={(e) => update('emergency_contact_phone', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Referencia y cobertura</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Referido por"
              helper="Médico remitente u origen de la referencia"
              value={form.referred_by}
              onChange={(e) => update('referred_by', e.target.value)}
            />
            <Input
              label="Seguro médico"
              value={form.insurance_provider}
              onChange={(e) => update('insurance_provider', e.target.value)}
            />
          </div>
          <Input
            label="Historia clínica (opcional)"
            value={form.medical_record}
            onChange={(e) => update('medical_record', e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
