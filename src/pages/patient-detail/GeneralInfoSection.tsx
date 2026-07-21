import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import type { Patient } from '../../services/patients'
import { updatePatient } from '../../services/patients'

function field(patient: Patient, key: keyof Patient) {
  return (patient[key] as string | null) || ''
}

export function GeneralInfoSection({ patient, onUpdated }: { patient: Patient; onUpdated: (p: Patient) => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: patient.full_name,
    national_id: field(patient, 'national_id'),
    birth_date: patient.birth_date,
    gender: patient.gender,
    email: patient.email,
    phone: patient.phone,
    address: field(patient, 'address'),
    city: field(patient, 'city'),
    occupation: field(patient, 'occupation'),
    education_level: field(patient, 'education_level'),
    marital_status: field(patient, 'marital_status'),
    emergency_contact_name: field(patient, 'emergency_contact_name'),
    emergency_contact_phone: field(patient, 'emergency_contact_phone'),
    referred_by: field(patient, 'referred_by'),
    insurance_provider: field(patient, 'insurance_provider'),
    medical_record: patient.medical_record ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const updated = await updatePatient(patient.id, {
        full_name: form.full_name,
        national_id: form.national_id || null,
        birth_date: form.birth_date,
        gender: form.gender,
        email: form.email,
        phone: form.phone,
        address: form.address || null,
        city: form.city || null,
        occupation: form.occupation || null,
        education_level: form.education_level || null,
        marital_status: form.marital_status || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        referred_by: form.referred_by || null,
        insurance_provider: form.insurance_provider || null,
        medical_record: form.medical_record || null,
      })
      onUpdated(updated)
      setEditing(false)
    } catch {
      setError('No se pudo guardar la información.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-midnight-950">Datos generales</h3>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Editar
          </Button>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" value={patient.full_name} />
          <Field label="Cédula" value={field(patient, 'national_id')} />
          <Field label="Fecha de nacimiento" value={patient.birth_date} />
          <Field label="Género" value={patient.gender} />
          <Field label="Email" value={patient.email} />
          <Field label="Teléfono" value={patient.phone} />
          <Field label="Dirección" value={field(patient, 'address')} />
          <Field label="Ciudad" value={field(patient, 'city')} />
          <Field label="Ocupación" value={field(patient, 'occupation')} />
          <Field label="Nivel educativo" value={field(patient, 'education_level')} />
          <Field label="Estado civil" value={field(patient, 'marital_status')} />
          <Field label="Contacto de emergencia" value={field(patient, 'emergency_contact_name')} />
          <Field label="Teléfono de emergencia" value={field(patient, 'emergency_contact_phone')} />
          <Field label="Referido por" value={field(patient, 'referred_by')} />
          <Field label="Seguro médico" value={field(patient, 'insurance_provider')} />
          <Field label="Historia clínica" value={patient.medical_record ?? ''} />
        </dl>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <h3 className="mb-4 text-base font-semibold text-midnight-950">Editar datos generales</h3>
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre completo" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          <Input label="Teléfono" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Dirección" value={form.address} onChange={(e) => update('address', e.target.value)} />
          <Input label="Ciudad" value={form.city} onChange={(e) => update('city', e.target.value)} />
        </div>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Contacto de emergencia"
            value={form.emergency_contact_name}
            onChange={(e) => update('emergency_contact_name', e.target.value)}
          />
          <Input
            label="Teléfono de emergencia"
            value={form.emergency_contact_phone}
            onChange={(e) => update('emergency_contact_phone', e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Referido por" value={form.referred_by} onChange={(e) => update('referred_by', e.target.value)} />
          <Input label="Seguro médico" value={form.insurance_provider} onChange={(e) => update('insurance_provider', e.target.value)} />
        </div>
        <Input label="Historia clínica" value={form.medical_record} onChange={(e) => update('medical_record', e.target.value)} />

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700">{value || '—'}</dd>
    </div>
  )
}
