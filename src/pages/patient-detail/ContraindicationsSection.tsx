import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { PatientContraindication } from '../../services/patientContraindications'
import {
  addPatientContraindication,
  deactivatePatientContraindication,
  listPatientContraindications,
} from '../../services/patientContraindications'

const emptyForm = { contraindication: '', severity: 'media', notes: '' }

const SEVERITY_TONE: Record<string, 'danger' | 'warning' | 'neutral'> = {
  alta: 'danger',
  media: 'warning',
  baja: 'neutral',
}

export function ContraindicationsSection({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<PatientContraindication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listPatientContraindications(patientId))
    } catch {
      setError('No se pudieron cargar las contraindicaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [patientId])

  async function handleAdd() {
    if (!form.contraindication.trim()) return
    setSaving(true)
    try {
      await addPatientContraindication(patientId, form)
      setForm(emptyForm)
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo agregar la contraindicación.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivatePatientContraindication(id)
      await load()
    } catch {
      setError('No se pudo desactivar la contraindicación.')
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Contraindicaciones</h3>
          <p className="text-sm text-slate-500">Registro clínico inmutable — una corrección agrega una entrada nueva.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          Agregar contraindicación
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Sin contraindicaciones registradas.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-midnight-950">{item.contraindication}</p>
                    {item.severity && <Badge tone={SEVERITY_TONE[item.severity] ?? 'neutral'}>{item.severity}</Badge>}
                  </div>
                  {item.notes && <p className="mt-1 text-sm text-slate-500">{item.notes}</p>}
                  <p className="mt-2 text-xs text-slate-400">{new Date(item.created_at).toLocaleString('es-ES')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Activa' : 'Desactivada'}</Badge>
                  {item.is_active && (
                    <button className="text-sm text-slate-500 hover:underline" onClick={() => handleDeactivate(item.id)}>
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        title="Agregar contraindicación"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} loading={saving} disabled={!form.contraindication.trim()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Contraindicación"
            required
            value={form.contraindication}
            onChange={(e) => setForm({ ...form, contraindication: e.target.value })}
          />
          <Select label="Severidad" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </Select>
          <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
