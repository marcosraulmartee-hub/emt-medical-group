import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { getSetting, setSetting } from '../../services/clinicSettings'
import type { IntakeSubmission } from '../../services/patientIntake'
import { listIntakeSubmissions, markIntakeSubmissionReviewed } from '../../services/patientIntake'

function FormUrlSettings() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSetting('patient_intake_form_url')
      .then((value) => setUrl(value ?? ''))
      .catch(() => setError('No se pudo cargar el link del formulario.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await setSetting('patient_intake_form_url', url.trim())
      setSaved(true)
    } catch {
      setError('No se pudo guardar el link del formulario.')
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
      {error && <Alert variant="error">{error}</Alert>}
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
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  useEffect(() => {
    listIntakeSubmissions()
      .then(setSubmissions)
      .catch(() => setError('No se pudo cargar el historial de envíos.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleMarkReviewed(id: string) {
    setReviewingId(id)
    setError('')
    try {
      await markIntakeSubmissionReviewed(id)
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, reviewed: true } : s)))
    } catch {
      setError('No se pudo actualizar el envío.')
    } finally {
      setReviewingId(null)
    }
  }

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
            headers={['Fecha', 'Paciente vinculado', 'Origen', 'Estado', '']}
            rows={submissions.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{new Date(s.created_at).toLocaleString('es-ES')}</td>
                <td className="px-4 py-3 text-slate-700">{s.patient?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{s.source}</td>
                <td className="px-4 py-3">
                  <Badge tone={s.reviewed ? 'neutral' : 'warning'}>{s.reviewed ? 'Revisado' : 'Nuevo'}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {!s.reviewed && (
                    <button
                      onClick={() => handleMarkReviewed(s.id)}
                      disabled={reviewingId === s.id}
                      className="text-sm text-teal-600 hover:underline disabled:opacity-40"
                    >
                      Marcar revisado
                    </button>
                  )}
                </td>
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
