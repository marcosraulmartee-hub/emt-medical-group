import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import type { ProtocolCategory } from '../../services/protocolCategories'
import { createProtocolCategory, listProtocolCategories, updateProtocolCategory } from '../../services/protocolCategories'

const emptyForm = { code: '', label: '', description: '' }

export function ProtocolCategoriesSection() {
  const [items, setItems] = useState<ProtocolCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listProtocolCategories())
    } catch {
      setError('No se pudieron cargar las categorías.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(item: ProtocolCategory) {
    setEditingId(item.id)
    setForm({ code: item.code, label: item.label, description: item.description ?? '' })
    setModalOpen(true)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      if (editingId) {
        await updateProtocolCategory(editingId, form)
      } else {
        await createProtocolCategory(form)
      }
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo guardar la categoría.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Categorías de protocolo</h3>
          <p className="text-sm text-slate-500">Agrupan los protocolos EMT (rTMS, iTBS, cTBS, tDCS, etc.).</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          Nueva categoría
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        {loading ? (
          <div className="p-6 text-slate-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-slate-500">No hay categorías registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={['Código', 'Nombre', 'Descripción', '']}
              rows={items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-700">{item.code}</td>
                  <td className="px-4 py-4 text-slate-500">{item.label}</td>
                  <td className="px-4 py-4 text-slate-500">{item.description || '—'}</td>
                  <td className="px-4 py-4 text-right">
                    <button className="text-sm text-teal-600 hover:underline" onClick={() => openEdit(item)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar categoría' : 'Nueva categoría'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving} disabled={!form.code || !form.label}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Código"
            required
            disabled={!!editingId}
            helper={editingId ? 'El código no se puede modificar.' : 'Identificador único, ej: rtms'}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <Input label="Nombre" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Textarea
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  )
}
