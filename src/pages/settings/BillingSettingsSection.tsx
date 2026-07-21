import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { NcfSequence } from '../../services/ncfSequences'
import { listNcfSequences, updateNcfSequenceRange } from '../../services/ncfSequences'
import type { PriceListItem } from '../../services/priceList'
import { createPriceListItem, listPriceList, updatePriceListItem } from '../../services/priceList'
import { getSetting, setSetting } from '../../services/clinicSettings'

function GeneralSettings() {
  const [taxRate, setTaxRate] = useState('0')
  const [ecfEnabled, setEcfEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([getSetting('tax_rate'), getSetting('ecf_enabled')]).then(([tax, ecf]) => {
      setTaxRate(tax ?? '0')
      setEcfEnabled(ecf === 'true')
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await Promise.all([setSetting('tax_rate', taxRate), setSetting('ecf_enabled', String(ecfEnabled))])
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Cargando...</p>

  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
      <h3 className="text-base font-semibold text-midnight-950">Configuración general</h3>
      {saved && <Alert variant="success">Guardado.</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="ITBIS (%)" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        <Select
          label="e-CF (facturación electrónica DGII)"
          value={ecfEnabled ? 'true' : 'false'}
          onChange={(e) => setEcfEnabled(e.target.value === 'true')}
        >
          <option value="false">Apagado</option>
          <option value="true">Encendido</option>
        </Select>
      </div>
      <Button size="sm" onClick={handleSave} loading={saving}>
        Guardar
      </Button>
    </div>
  )
}

function NcfSequencesSettings() {
  const [items, setItems] = useState<NcfSequence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<NcfSequence | null>(null)
  const [form, setForm] = useState({ range_start: 0, range_end: 0, next_number: 0, authorized_until: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listNcfSequences())
    } catch {
      setError('No se pudieron cargar las secuencias NCF.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openEdit(item: NcfSequence) {
    setEditing(item)
    setForm({
      range_start: item.range_start,
      range_end: item.range_end,
      next_number: item.next_number || item.range_start,
      authorized_until: item.authorized_until ?? '',
    })
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      await updateNcfSequenceRange(editing.id, {
        range_start: form.range_start,
        range_end: form.range_end,
        next_number: form.next_number,
        authorized_until: form.authorized_until || null,
      })
      setEditing(null)
      await load()
    } catch {
      setError('No se pudo guardar la secuencia.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
      <div>
        <h3 className="text-base font-semibold text-midnight-950">Secuencias NCF</h3>
        <p className="text-sm text-slate-500">
          Cargá el rango autorizado por la DGII para cada tipo. Sin rango configurado no se pueden emitir facturas de ese tipo.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <Table
            headers={['Tipo', 'Rango', 'Próximo número', 'Vence', 'Estado', '']}
            rows={items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 text-slate-700">
                  {item.ncf_type} · {item.label}
                </td>
                <td className="px-4 py-4 text-slate-500">
                  {item.range_end > 0 ? `${item.range_start} — ${item.range_end}` : 'Sin configurar'}
                </td>
                <td className="px-4 py-4 text-slate-500">{item.next_number || '—'}</td>
                <td className="px-4 py-4 text-slate-500">{item.authorized_until || '—'}</td>
                <td className="px-4 py-4">
                  <Badge tone={item.range_end > 0 ? 'success' : 'neutral'}>
                    {item.range_end > 0 ? 'Configurada' : 'Pendiente'}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-right">
                  <button className="text-sm text-teal-600 hover:underline" onClick={() => openEdit(item)}>
                    Configurar
                  </button>
                </td>
              </tr>
            ))}
          />
        </div>
      )}

      <Modal
        open={!!editing}
        title={`Secuencia ${editing?.ncf_type ?? ''}`}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Desde"
              type="number"
              value={form.range_start}
              onChange={(e) => setForm({ ...form, range_start: Number(e.target.value) })}
            />
            <Input
              label="Hasta"
              type="number"
              value={form.range_end}
              onChange={(e) => setForm({ ...form, range_end: Number(e.target.value) })}
            />
          </div>
          <Input
            label="Próximo número a emitir"
            type="number"
            helper="Normalmente igual a 'Desde' la primera vez que cargás el rango."
            value={form.next_number}
            onChange={(e) => setForm({ ...form, next_number: Number(e.target.value) })}
          />
          <Input
            label="Vencimiento autorizado"
            type="date"
            value={form.authorized_until}
            onChange={(e) => setForm({ ...form, authorized_until: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  )
}

function PriceListSettings() {
  const [items, setItems] = useState<PriceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', label: '', price: 0, unit: 'sesión' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listPriceList())
    } catch {
      setError('No se pudo cargar el tarifario.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ code: '', label: '', price: 0, unit: 'sesión' })
    setModalOpen(true)
  }

  function openEdit(item: PriceListItem) {
    setEditingId(item.id)
    setForm({ code: item.code, label: item.label, price: item.price, unit: item.unit })
    setModalOpen(true)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      if (editingId) {
        await updatePriceListItem(editingId, { label: form.label, price: form.price, unit: form.unit })
      } else {
        await createPriceListItem(form)
      }
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo guardar el ítem del tarifario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Tarifario</h3>
          <p className="text-sm text-slate-500">Precios de referencia para armar facturas rápido.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          Nuevo ítem
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <Table
            headers={['Código', 'Nombre', 'Precio', 'Unidad', '']}
            rows={items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 text-slate-700">{item.code}</td>
                <td className="px-4 py-4 text-slate-500">{item.label}</td>
                <td className="px-4 py-4 text-slate-500">{item.price.toFixed(2)}</td>
                <td className="px-4 py-4 text-slate-500">{item.unit}</td>
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

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar ítem' : 'Nuevo ítem del tarifario'}
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
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <Input label="Nombre" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Precio"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
            <Input label="Unidad" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function BillingSettingsSection() {
  return (
    <div className="space-y-6">
      <GeneralSettings />
      <NcfSequencesSettings />
      <PriceListSettings />
    </div>
  )
}
