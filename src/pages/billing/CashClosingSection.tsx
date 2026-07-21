import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import { Table } from '../../components/ui/Table'
import type { PaymentWithInvoice } from '../../services/payments'
import { listPaymentsForDate } from '../../services/payments'
import { listInvoicesInRange } from '../../services/invoices'
import type { CashClosing } from '../../services/cashClosings'
import { createCashClosing, listCashClosings } from '../../services/cashClosings'
import { toISODate } from '../../utils/dates'

const METHOD_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

function sumByMethod(payments: PaymentWithInvoice[], method: string) {
  return payments.filter((p) => p.method === method).reduce((sum, p) => sum + p.amount, 0)
}

export function CashClosingSection() {
  const [date, setDate] = useState(toISODate(new Date()))
  const [payments, setPayments] = useState<PaymentWithInvoice[]>([])
  const [invoicesCount, setInvoicesCount] = useState(0)
  const [invoicesTotal, setInvoicesTotal] = useState(0)
  const [countedCash, setCountedCash] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<CashClosing[]>([])

  async function load() {
    setLoading(true)
    setSaved(false)
    setError('')
    try {
      const [p, invoices, closings] = await Promise.all([
        listPaymentsForDate(date),
        listInvoicesInRange(date, date),
        listCashClosings(),
      ])
      setPayments(p)
      setInvoicesCount(invoices.length)
      setInvoicesTotal(invoices.reduce((sum, inv) => sum + inv.total, 0))
      setHistory(closings)
    } catch {
      setError('No se pudo cargar el cuadre del día.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const totals = {
    total_efectivo: sumByMethod(payments, 'efectivo'),
    total_tarjeta: sumByMethod(payments, 'tarjeta'),
    total_transferencia: sumByMethod(payments, 'transferencia'),
    total_otro: sumByMethod(payments, 'otro'),
  }
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)
  const countedCashNumber = countedCash === '' ? null : Number(countedCash)
  const difference = countedCashNumber === null ? null : countedCashNumber - totals.total_efectivo

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await createCashClosing({
        closing_date: date,
        total_efectivo: totals.total_efectivo,
        total_tarjeta: totals.total_tarjeta,
        total_transferencia: totals.total_transferencia,
        total_otro: totals.total_otro,
        total_collected: totalCollected,
        invoices_issued_count: invoicesCount,
        invoices_issued_total: invoicesTotal,
        counted_cash: countedCashNumber,
        notes,
      })
      setSaved(true)
      setNotes('')
      setCountedCash('')
      const closings = await listCashClosings()
      setHistory(closings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cuadre.')
    } finally {
      setSaving(false)
    }
  }

  async function handleExportPdf() {
    const { exportCashClosingPdf } = await import('../../utils/cashClosingPdf')
    exportCashClosingPdf(
      date,
      { ...totals, total_collected: totalCollected, invoices_issued_count: invoicesCount, invoices_issued_total: invoicesTotal, counted_cash: countedCashNumber },
      payments,
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Input label="Fecha del cuadre" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:max-w-xs" />
        <Button variant="secondary" onClick={handleExportPdf} disabled={loading || payments.length === 0}>
          Exportar PDF
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Cuadre del {date} guardado correctamente.</Alert>}

      {loading ? (
        <div className="p-6 text-slate-500">Cargando...</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(['efectivo', 'tarjeta', 'transferencia', 'otro'] as const).map((method) => (
              <div key={method} className="rounded-2xl bg-white p-4 shadow-card">
                <p className="text-xs uppercase tracking-wide text-slate-400">{METHOD_LABEL[method]}</p>
                <p className="mt-1 text-xl font-semibold text-midnight-950">
                  {totals[`total_${method}` as keyof typeof totals].toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-teal-50 p-4">
              <p className="text-xs uppercase tracking-wide text-teal-700">Total cobrado</p>
              <p className="mt-1 text-xl font-semibold text-teal-800">{totalCollected.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Facturas emitidas</p>
              <p className="mt-1 text-xl font-semibold text-midnight-950">{invoicesCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total facturado</p>
              <p className="mt-1 text-xl font-semibold text-midnight-950">{invoicesTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-card">
            {payments.length === 0 ? (
              <div className="p-6 text-slate-500">No hay pagos registrados para esta fecha.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  headers={['Hora', 'NCF', 'Paciente', 'Método', 'Referencia', 'Monto']}
                  rows={payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(p.paid_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{p.invoice?.ncf_number ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{p.invoice?.patient?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{METHOD_LABEL[p.method] ?? p.method}</td>
                      <td className="px-4 py-3 text-slate-500">{p.reference ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{p.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                />
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-card">
            <h3 className="text-base font-semibold text-midnight-950">Cerrar el día</h3>
            <p className="mt-1 text-sm text-slate-500">
              Cuenta el efectivo en caja y compáralo contra el sistema antes de guardar el cuadre.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                label="Efectivo contado físicamente"
                type="number"
                placeholder={totals.total_efectivo.toFixed(2)}
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
              />
              <div>
                <p className="mb-1.5 block text-sm font-medium text-slate-600">Diferencia (contado - sistema)</p>
                <p
                  className={
                    'flex h-11 items-center rounded-2xl border px-3 text-sm font-semibold ' +
                    (difference === null
                      ? 'border-slate-200 text-slate-400'
                      : difference === 0
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700')
                  }
                >
                  {difference === null ? 'Ingresa el conteo' : difference.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Textarea label="Notas" placeholder="Observaciones del cierre (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button className="mt-4" onClick={handleSave} loading={saving}>
              Guardar cuadre
            </Button>
          </div>

          {history.length > 0 && (
            <div className="overflow-hidden rounded-3xl bg-white shadow-card">
              <div className="border-b border-slate-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-midnight-950">Historial de cuadres</h3>
              </div>
              <div className="overflow-x-auto">
                <Table
                  headers={['Fecha', 'Cobrado', 'Facturado', 'Efectivo contado', 'Diferencia', 'Cerrado por']}
                  rows={history.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 text-slate-700">{c.closing_date}</td>
                      <td className="px-4 py-3 text-slate-500">{c.total_collected.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500">{c.invoices_issued_total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500">{c.counted_cash !== null ? c.counted_cash.toFixed(2) : '—'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {c.counted_cash !== null ? (c.counted_cash - c.total_efectivo).toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{c.closer?.full_name ?? '—'}</td>
                    </tr>
                  ))}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
