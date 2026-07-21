import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { Equipment } from '../../services/equipment'
import { createEquipment, listEquipment, updateEquipment } from '../../services/equipment'

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

const emptyForm = { name: '', manufacturer: '', model: '', serial_number: '', status: 'active' }

export function EquipmentSection() {
  const [items, setItems] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listEquipment())
    } catch {
      setError('No se pudieron cargar los equipos.')
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

  function openEdit(item: Equipment) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      manufacturer: item.manufacturer ?? '',
      model: item.model ?? '',
      serial_number: item.serial_number ?? '',
      status: item.status,
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      if (editingId) {
        await updateEquipment(editingId, form)
      } else {
        await createEquipment(form)
      }
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo guardar el equipo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Equipos EMT</h3>
          <p className="text-sm text-slate-500">Neuroestimuladores y su estado de mantenimiento.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          Nuevo equipo
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        {loading ? (
          <div className="p-6 text-slate-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-slate-500">No hay equipos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={['Nombre', 'Fabricante', 'Modelo', 'Serie', 'Estado', '']}
              rows={items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-700">{item.name}</td>
                  <td className="px-4 py-4 text-slate-500">{item.manufacturer || '—'}</td>
                  <td className="px-4 py-4 text-slate-500">{item.model || '—'}</td>
                  <td className="px-4 py-4 text-slate-500">{item.serial_number || '—'}</td>
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
        title={editingId ? 'Editar equipo' : 'Nuevo equipo'}
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
          <Input
            label="Fabricante"
            value={form.manufacturer}
            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
          />
          <Input label="Modelo" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <Input
            label="Número de serie"
            value={form.serial_number}
            onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
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
