import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { Coil } from '../../services/coils'
import { createCoil, listCoils, updateCoil } from '../../services/coils'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'maintenance', label: 'En mantenimiento' },
  { value: 'inactive', label: 'Inactivo' },
]

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  maintenance: 'warning',
  inactive: 'neutral',
}

const emptyForm = { name: '', type: '', description: '', status: 'active' }

export function CoilsSection() {
  const [items, setItems] = useState<Coil[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listCoils())
    } catch {
      setError('No se pudieron cargar las bobinas.')
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

  function openEdit(item: Coil) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      type: item.type ?? '',
      description: item.description ?? '',
      status: item.status,
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      if (editingId) {
        await updateCoil(editingId, form)
      } else {
        await createCoil(form)
      }
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo guardar la bobina.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Bobinas</h3>
          <p className="text-sm text-slate-500">Bobinas disponibles para las sesiones de neuromodulación.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          Nueva bobina
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        {loading ? (
          <div className="p-6 text-slate-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-slate-500">No hay bobinas registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={['Nombre', 'Tipo', 'Descripción', 'Estado', '']}
              rows={items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-700">{item.name}</td>
                  <td className="px-4 py-4 text-slate-500">{item.type || '—'}</td>
                  <td className="px-4 py-4 text-slate-500">{item.description || '—'}</td>
                  <td className="px-4 py-4">
                    <Badge tone={STATUS_TONE[item.status] ?? 'neutral'}>
                      {STATUS_OPTIONS.find((s) => s.value === item.status)?.label ?? item.status}
                    </Badge>
                  </td>
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
        title={editingId ? 'Editar bobina' : 'Nueva bobina'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving} disabled={!form.name}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Textarea
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  )
}
