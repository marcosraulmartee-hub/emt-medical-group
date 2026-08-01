import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { Table } from '../../components/ui/Table'
import { getSetting, setSetting } from '../../services/clinicSettings'
import type { IntakeSubmission } from '../../services/patientIntake'
import { listIntakeSubmissions } from '../../services/patientIntake'

function FormUrlSettings() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSetting('patient_intake_form_url').then((value) => {
      setUrl(value ?? '')
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await setSetting('patient_intake_form_url', url.trim())
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Cargando...</p>

  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
      <div>
        <h3 className="text-base font-semibold text-midnight-950">Formulario de registro (Google Forms)</h3>
        <p className="text-sm text-slate-500">
          Pega aquí el link del Google Form ya publicado (ficha + consentimiento + cuestionario de cribado EMT). El botón
          "Enviar formulario de registro" en Pacientes comparte este link por WhatsApp o correo.
        </p>
      </div>
      {saved && <Alert variant="success">Guardado.</Alert>}
      <Input
        label="URL del formulario"
        placeholder="https://forms.gle/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button size="sm" onClick={handleSave} loading={saving}>
        Guardar
      </Button>
    </div>
  )
}

function SubmissionsLog() {
  const [submissions, setSubmissions] = useState<IntakeSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listIntakeSubmissions()
      .then(setSubmissions)
      .catch(() => setError('No se pudo cargar el historial de envíos.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
      <div>
        <h3 className="text-base font-semibold text-midnight-950">Envíos recibidos</h3>
        <p className="text-sm text-slate-500">
          Cada envío del formulario público, con el paciente al que quedó vinculado. Los pacientes se crean automáticamente,
          sin revisión previa — revisa aquí si algo se ve mal.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay envíos.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table
            headers={['Fecha', 'Paciente vinculado', 'Origen']}
            rows={submissions.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{new Date(s.created_at).toLocaleString('es-ES')}</td>
                <td className="px-4 py-3 text-slate-700">{s.patient?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{s.source}</td>
              </tr>
            ))}
          />
        </div>
      )}
    </div>
  )
}

export function IntakeFormSection() {
  return (
    <div className="space-y-6">
      <FormUrlSettings />
      <SubmissionsLog />
    </div>
  )
}
