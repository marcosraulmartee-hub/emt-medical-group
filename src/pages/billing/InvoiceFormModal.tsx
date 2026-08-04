import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import type { Patient } from '../../services/patients'
import { listPatients } from '../../services/patients'
import type { PriceListItem } from '../../services/priceList'
import { listPriceList } from '../../services/priceList'
import { createDraftInvoice } from '../../services/invoices'
import { getSetting } from '../../services/clinicSettings'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

export function InvoiceFormModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [priceList, setPriceList] = useState<PriceListItem[]>([])
  const [patientId, setPatientId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setPatientId('')
    setDueDate('')
    setDiscount(0)
    setNotes('')
    setItems([{ description: '', quantity: 1, unit_price: 0 }])
    setError('')
    Promise.all([listPatients(), listPriceList(), getSetting('tax_rate')])
      .then(([p, pl, tax]) => {
        setPatients(p)
        setPriceList(pl.filter((x) => x.is_active))
        setTaxRate(Number(tax ?? '0'))
      })
      .catch(() => setError('No se pudieron cargar los pacientes o el tarifario.'))
  }, [open])

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addFromPriceList(code: string) {
    const priceItem = priceList.find((p) => p.code === code)
    if (!priceItem) return
    setItems((prev) => [...prev, { description: priceItem.label, quantity: 1, unit_price: priceItem.price }])
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxable = Math.max(subtotal - discount, 0)
  const taxAmount = (taxable * taxRate) / 100
  const total = taxable + taxAmount

  async function handleSubmit() {
    const validItems = items.filter((item) => item.description.trim() && item.quantity > 0)
    if (!patientId || validItems.length === 0) {
      setError('Seleccioná un paciente y agregá al menos un ítem.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createDraftInvoice(
        { patient_id: patientId, due_date: dueDate || null, tax_rate: taxRate, discount_amount: discount, notes },
        validItems,
      )
      onCreated()
    } catch {
      setError('No se pudo crear la factura.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Nueva factura (borrador)"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Crear borrador
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select label="Paciente" required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">Seleccioná un paciente</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>

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

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Fecha de vencimiento" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Input
            label="ITBIS (%)"
            type="number"
            helper="Servicios de salud exentos — dejalo en 0 salvo que factures algo no exento."
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
          />
          <Input label="Descuento" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
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
          <div className="flex justify-between">
            <span>ITBIS ({taxRate}%)</span>
            <span>{taxAmount.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-midnight-950">
            <span>Total</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>

        <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  )
}
