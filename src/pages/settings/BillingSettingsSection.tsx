import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import type { PriceListItem } from '../../services/priceList'
import { createPriceListItem, listPriceList, updatePriceListItem } from '../../services/priceList'
import { getSetting, setSetting } from '../../services/clinicSettings'

function GeneralSettings() {
  const [taxRate, setTaxRate] = useState('0')
  const [exempt, setExempt] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSetting('tax_rate')
      .then((tax) => {
        const value = tax ?? '0'
        setTaxRate(value)
        setExempt(Number(value) === 0)
      })
      .catch(() => setError('No se pudo cargar la configuración de ITBIS.'))
      .finally(() => setLoading(false))
  }, [])

  function handleExemptToggle(checked: boolean) {
    setExempt(checked)
    if (checked) setTaxRate('0')
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await setSetting('tax_rate', exempt ? '0' : taxRate)
      setSaved(true)
    } catch {
      setError('No se pudo guardar la configuración de ITBIS.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Cargando...</p>

  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
      <h3 className="text-base font-semibold text-midnight-950">Configuración general</h3>
      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Guardado.</Alert>}
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={exempt}
          onChange={(e) => handleExemptToggle(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-teal-500 focus:ring-teal-400"
        />
        Exento de ITBIS (servicios de salud) — aplica 0%
      </label>
      <Input
        label="ITBIS (%)"
        type="number"
        disabled={exempt}
        helper={exempt ? 'Exento — no se cobra ITBIS en las facturas nuevas.' : 'Tasa que se aplica a las facturas nuevas.'}
        value={taxRate}
        onChange={(e) => setTaxRate(e.target.value)}
        className="sm:max-w-xs"
      />
      <Button size="sm" onClick={handleSave} loading={saving}>
        Guardar
      </Button>
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
      <PriceListSettings />
    </div>
  )
}
