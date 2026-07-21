import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { useAuth } from '../../hooks/useAuth'
import type { AdverseEvent, AdverseEventSeverity } from '../../services/adverseEvents'
import { listPatientAdverseEvents, reportAdverseEvent } from '../../services/adverseEvents'

const SEVERITY_TONE: Record<AdverseEventSeverity, 'neutral' | 'warning' | 'danger'> = {
  leve: 'neutral',
  moderado: 'warning',
  grave: 'danger',
}

const emptyForm = { severity: 'leve' as AdverseEventSeverity, description: '', action_taken: '' }

export function AdverseEventsSection({ patientId }: { patientId: string }) {
  const { user } = useAuth()
  const [events, setEvents] = useState<AdverseEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setEvents(await listPatientAdverseEvents(patientId))
    } catch {
      setError('No se pudieron cargar los eventos adversos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [patientId])

  async function handleAdd() {
    if (!form.description.trim()) return
    setSaving(true)
    try {
      await reportAdverseEvent({
        patient_id: patientId,
        session_id: null,
        severity: form.severity,
        description: form.description,
        action_taken: form.action_taken,
        reported_by: user?.id ?? null,
      })
      setForm(emptyForm)
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo registrar el evento adverso.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Eventos adversos</h3>
          <p className="text-sm text-slate-500">Registro clínico inmutable de severidad y acción tomada.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          Reportar evento
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-500">Sin eventos adversos registrados.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={SEVERITY_TONE[event.severity]}>{event.severity}</Badge>
                    <p className="text-xs text-slate-400">{new Date(event.occurred_at).toLocaleString('es-ES')}</p>
                  </div>
                  <p className="mt-2 text-sm text-midnight-950">{event.description}</p>
                  {event.action_taken && <p className="mt-1 text-sm text-slate-500">Acción tomada: {event.action_taken}</p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        title="Reportar evento adverso"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} loading={saving} disabled={!form.description.trim()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Severidad"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value as AdverseEventSeverity })}
          >
            <option value="leve">Leve</option>
            <option value="moderado">Moderado</option>
            <option value="grave">Grave</option>
          </Select>
          <Textarea
            label="Descripción"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Textarea
            label="Acción tomada"
            value={form.action_taken}
            onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  )
}
