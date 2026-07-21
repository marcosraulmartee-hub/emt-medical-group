import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { SafetyChecklistItem } from '../../services/safetyChecklist'
import { createChecklistItem, listAllChecklistItems, updateChecklistItem } from '../../services/safetyChecklist'

const emptyForm = { code: '', label: '', order_index: 0 }

export function ChecklistSection() {
  const [items, setItems] = useState<SafetyChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listAllChecklistItems())
    } catch {
      setError('No se pudo cargar el checklist.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, order_index: items.length + 1 })
    setModalOpen(true)
  }

  function openEdit(item: SafetyChecklistItem) {
    setEditingId(item.id)
    setForm({ code: item.code, label: item.label, order_index: item.order_index })
    setModalOpen(true)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      if (editingId) {
        await updateChecklistItem(editingId, { label: form.label, order_index: form.order_index })
      } else {
        await createChecklistItem(form)
      }
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo guardar el ítem.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(item: SafetyChecklistItem) {
    try {
      await updateChecklistItem(item.id, { is_active: !item.is_active })
      await load()
    } catch {
      setError('No se pudo actualizar el ítem.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Checklist de seguridad</h3>
          <p className="text-sm text-slate-500">Screening obligatorio antes de cada sesión TMS.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          Nuevo ítem
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        {loading ? (
          <div className="p-6 text-slate-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={['#', 'Ítem', 'Estado', '']}
              rows={items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-500">{item.order_index}</td>
                  <td className="px-4 py-4 text-slate-700">{item.label}</td>
                  <td className="px-4 py-4">
                    <Badge tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="mr-3 text-sm text-teal-600 hover:underline" onClick={() => openEdit(item)}>
                      Editar
                    </button>
                    <button className="text-sm text-slate-500 hover:underline" onClick={() => toggleActive(item)}>
                      {item.is_active ? 'Desactivar' : 'Activar'}
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
        title={editingId ? 'Editar ítem' : 'Nuevo ítem'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving} disabled={!form.label}>
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
            helper={editingId ? 'El código no se puede modificar.' : 'Identificador único, ej: no_seizure_history'}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <Input label="Texto del ítem" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Input
            label="Orden"
            type="number"
            value={form.order_index}
            onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
          />
        </div>
      </Modal>
    </div>
  )
}
