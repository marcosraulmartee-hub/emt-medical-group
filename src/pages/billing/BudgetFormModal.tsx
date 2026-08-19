import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import type { Patient } from '../../services/patients'
import { listPatients } from '../../services/patients'
import type { Protocol } from '../../services/protocols'
import { listProtocols } from '../../services/protocols'
import type { ProtocolCategory } from '../../services/protocolCategories'
import { listProtocolCategories } from '../../services/protocolCategories'
import { ProtocolPicker } from '../../components/protocols/ProtocolPicker'
import { PatientPicker } from '../../components/patients/PatientPicker'
import type { PriceListItem } from '../../services/priceList'
import { listPriceList } from '../../services/priceList'
import { createBudget } from '../../services/budgets'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

export function BudgetFormModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [protocolCategories, setProtocolCategories] = useState<ProtocolCategory[]>([])
  const [priceList, setPriceList] = useState<PriceListItem[]>([])
  const [patientId, setPatientId] = useState('')
  const [protocolId, setProtocolId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [sessionCount, setSessionCount] = useState(30)
  const [items, setItems] = useState<LineItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setPatientId('')
    setProtocolId('')
    setValidUntil('')
    setDiscount(0)
    setNotes('')
    setSessionCount(30)
    setItems([])
    setError('')
    Promise.all([listPatients(), listProtocols(), listProtocolCategories(), listPriceList()])
      .then(([p, pr, cats, pl]) => {
        setPatients(p)
        setProtocols(pr)
        setProtocolCategories(cats)
        setPriceList(pl.filter((x) => x.is_active))
      })
      .catch(() => setError('No se pudieron cargar los pacientes, protocolos o el tarifario.'))
  }, [open])

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addSessionsFromPriceList() {
    const sessionPrice = priceList.find((p) => p.code === 'tms_session')
    if (!sessionPrice || sessionCount <= 0) return
    setItems((prev) => [...prev, { description: `${sessionPrice.label} (ciclo)`, quantity: sessionCount, unit_price: sessionPrice.price }])
  }

  function addFromPriceList(code: string) {
    const priceItem = priceList.find((p) => p.code === code)
    if (!priceItem) return
    setItems((prev) => [...prev, { description: priceItem.label, quantity: 1, unit_price: priceItem.price }])
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const total = Math.max(subtotal - discount, 0)

  async function handleSubmit() {
    const validItems = items.filter((item) => item.description.trim() && item.quantity > 0)
    if (!patientId || validItems.length === 0) {
      setError('Seleccioná un paciente y agregá al menos un ítem.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createBudget(
        { patient_id: patientId, protocol_id: protocolId || null, valid_until: validUntil || null, discount_amount: discount, notes },
        validItems,
      )
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el presupuesto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Nuevo presupuesto"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Crear presupuesto
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <PatientPicker label="Paciente" required patients={patients} value={patientId} onChange={setPatientId} />
          <ProtocolPicker
            label="Protocolo (opcional)"
            protocols={protocols}
            categories={protocolCategories}
            value={protocolId}
            onChange={setProtocolId}
            emptyLabel="Sin protocolo específico"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-teal-50 p-4">
          <Input
            label="Número de sesiones del ciclo"
            type="number"
            min={1}
            value={sessionCount}
            onChange={(e) => setSessionCount(Number(e.target.value))}
            className="w-48"
          />
          <Button type="button" size="sm" variant="secondary" onClick={addSessionsFromPriceList}>
            + Agregar ciclo de sesiones al presupuesto
          </Button>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-midnight-950">Ítems</p>
            {priceList.length > 0 && (
              <Select className="h-9 w-56" value="" onChange={(e) => e.target.value && addFromPriceList(e.target.value)}>
                <option value="">+ Agregar del tarifario</option>
                {priceList.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label} · {p.price}
                  </option>
                ))}
              </Select>
            )}
          </div>
          {items.length === 0 && <p className="text-sm text-slate-400">Sin ítems todavía.</p>}
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <input
                placeholder="Descripción"
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                className="col-span-6 h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <input
                type="number"
                placeholder="Cant."
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                className="col-span-2 h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <input
                type="number"
                placeholder="Precio"
                value={item.unit_price}
                onChange={(e) => updateItem(index, { unit_price: Number(e.target.value) })}
                className="col-span-3 h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <button
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                className="col-span-1 text-sm text-[#DC4B3E]"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="text-sm text-teal-600 hover:underline"
            onClick={() => setItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0 }])}
          >
            + Agregar línea
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Válido hasta" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          <Input label="Descuento (RD$)" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Descuento</span>
            <span>-{discount.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-midnight-950">
            <span>Total estimado</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>

        <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  )
}
