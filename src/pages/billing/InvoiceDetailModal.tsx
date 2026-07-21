import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { Invoice, InvoiceItem, InvoiceStatus } from '../../services/invoices'
import { createCreditNote, issueInvoice, listInvoiceItems } from '../../services/invoices'
import type { Payment } from '../../services/payments'
import { addPayment, listPaymentsForInvoice } from '../../services/payments'

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  corrected: 'Corregida (nota de crédito)',
  cancelled: 'Anulada',
}

const STATUS_TONE: Record<InvoiceStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  issued: 'success',
  corrected: 'warning',
  cancelled: 'danger',
}

export function InvoiceDetailModal({
  invoice,
  onClose,
  onChanged,
}: {
  invoice: Invoice
  onClose: () => void
  onChanged: () => void
}) {
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [creditReason, setCreditReason] = useState('')
  const [creditOpen, setCreditOpen] = useState(false)
  const [creditSaving, setCreditSaving] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [paymentRef, setPaymentRef] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)

  async function handleDownloadPdf() {
    const { exportInvoicePdf } = await import('../../utils/invoicePdf')
    exportInvoicePdf(invoice, items, payments)
  }

  async function load() {
    setLoading(true)
    try {
      const [i, p] = await Promise.all([listInvoiceItems(invoice.id), listPaymentsForInvoice(invoice.id)])
      setItems(i)
      setPayments(p)
    } catch {
      setError('No se pudo cargar el detalle.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [invoice.id])

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const balance = invoice.total - paidAmount

  async function handleIssue() {
    setIssuing(true)
    setError('')
    try {
      await issueInvoice(invoice.id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo emitir la factura.')
    } finally {
      setIssuing(false)
    }
  }

  async function handleCreditNote() {
    setCreditSaving(true)
    setError('')
    try {
      await createCreditNote(invoice.id, creditReason)
      setCreditOpen(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la nota de crédito.')
    } finally {
      setCreditSaving(false)
    }
  }

  async function handleAddPayment() {
    if (!paymentAmount) return
    setSavingPayment(true)
    try {
      await addPayment({ invoice_id: invoice.id, amount: Number(paymentAmount), method: paymentMethod, reference: paymentRef })
      setPaymentAmount('')
      setPaymentRef('')
      await load()
    } catch {
      setError('No se pudo registrar el pago.')
    } finally {
      setSavingPayment(false)
    }
  }

  return (
    <Modal
      open
      title={invoice.ncf_number ? `Factura ${invoice.ncf_number}` : 'Factura (borrador)'}
      size="lg"
      onClose={onClose}
    >
      <div className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-midnight-950">{invoice.patient?.full_name}</p>
            <p className="text-xs text-slate-500">
              {invoice.ncf_type} · {invoice.issue_date ?? 'sin emitir'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={STATUS_TONE[invoice.status]}>{STATUS_LABEL[invoice.status]}</Badge>
            <Button size="sm" variant="secondary" onClick={handleDownloadPdf} disabled={loading}>
              Descargar PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Descripción</th>
                  <th className="px-3 py-2 text-right">Cant.</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{item.unit_price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Descuento</span>
            <span>-{invoice.discount_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>ITBIS ({invoice.tax_rate}%)</span>
            <span>{invoice.tax_amount.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-midnight-950">
            <span>Total</span>
            <span>{invoice.total.toFixed(2)}</span>
          </div>
          {invoice.status === 'issued' && (
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>Pagado {paidAmount.toFixed(2)}</span>
              <span>Saldo {balance.toFixed(2)}</span>
            </div>
          )}
        </div>

        {invoice.status === 'draft' && (
          <Button onClick={handleIssue} loading={issuing}>
            Emitir factura
          </Button>
        )}

        {invoice.status === 'issued' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-medium text-midnight-950">Registrar pago</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input placeholder="Monto" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </Select>
                <Input placeholder="Referencia" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </div>
              <Button size="sm" className="mt-3" onClick={handleAddPayment} loading={savingPayment} disabled={!paymentAmount}>
                Agregar pago
              </Button>
              {payments.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-slate-500">
                  {payments.map((p) => (
                    <li key={p.id}>
                      {new Date(p.paid_at).toLocaleDateString('es-ES')} · {p.method} · {p.amount.toFixed(2)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button variant="danger" onClick={() => setCreditOpen(true)}>
              Corregir con nota de crédito
            </Button>
          </div>
        )}

        {invoice.status === 'corrected' && (
          <Alert variant="info">Esta factura fue corregida mediante una nota de crédito.</Alert>
        )}
      </div>

      <Modal open={creditOpen} title="Nota de crédito" onClose={() => setCreditOpen(false)} size="sm" footer={
        <>
          <Button variant="secondary" onClick={() => setCreditOpen(false)} disabled={creditSaving}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleCreditNote} loading={creditSaving} disabled={!creditReason.trim()}>
            Emitir nota de crédito
          </Button>
        </>
      }>
        <div className="space-y-3">
          <Alert variant="info">Esto reversa el total de la factura y la marca como corregida. No se puede deshacer.</Alert>
          <Textarea label="Motivo" required value={creditReason} onChange={(e) => setCreditReason(e.target.value)} />
        </div>
      </Modal>
    </Modal>
  )
}
