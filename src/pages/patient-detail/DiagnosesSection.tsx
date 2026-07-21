import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Textarea'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { PatientDiagnosis } from '../../services/patientDiagnoses'
import { addPatientDiagnosis, deactivatePatientDiagnosis, listPatientDiagnoses } from '../../services/patientDiagnoses'

export function DiagnosesSection({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<PatientDiagnosis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listPatientDiagnoses(patientId))
    } catch {
      setError('No se pudieron cargar los diagnósticos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [patientId])

  async function handleAdd() {
    if (!diagnosis.trim()) return
    setSaving(true)
    try {
      await addPatientDiagnosis(patientId, diagnosis, notes)
      setDiagnosis('')
      setNotes('')
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo agregar el diagnóstico.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivatePatientDiagnosis(id)
      await load()
    } catch {
      setError('No se pudo desactivar el diagnóstico.')
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Diagnósticos</h3>
          <p className="text-sm text-slate-500">Registro clínico inmutable — una corrección agrega una entrada nueva.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          Agregar diagnóstico
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Sin diagnósticos registrados.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-midnight-950">{item.diagnosis}</p>
                  {item.notes && <p className="mt-1 text-sm text-slate-500">{item.notes}</p>}
                  <p className="mt-2 text-xs text-slate-400">{new Date(item.created_at).toLocaleString('es-ES')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Activo' : 'Desactivado'}</Badge>
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
        title="Agregar diagnóstico"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} loading={saving} disabled={!diagnosis.trim()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Diagnóstico" required value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
