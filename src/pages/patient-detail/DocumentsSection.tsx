import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import type { PatientDocument } from '../../services/patientDocuments'
import { addPatientDocument, listPatientDocuments } from '../../services/patientDocuments'

const emptyForm = { name: '', url: '', type: '' }

export function DocumentsSection({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<PatientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listPatientDocuments(patientId))
    } catch {
      setError('No se pudieron cargar los documentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [patientId])

  async function handleAdd() {
    if (!form.name.trim() || !form.url.trim()) return
    setSaving(true)
    try {
      await addPatientDocument(patientId, form)
      setForm(emptyForm)
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo agregar el documento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Documentos</h3>
          <p className="text-sm text-slate-500">Consentimientos, informes y otros archivos del paciente.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          Agregar documento
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Sin documentos registrados.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
              <div>
                <a href={item.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-teal-600 hover:underline">
                  {item.name}
                </a>
                {item.type && <p className="mt-1 text-xs text-slate-400">{item.type}</p>}
              </div>
              <p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('es-ES')}</p>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        title="Agregar documento"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} loading={saving} disabled={!form.name.trim() || !form.url.trim()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input
            label="URL"
            required
            helper="Enlace al archivo (Supabase Storage, Drive, etc.)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <Input label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
