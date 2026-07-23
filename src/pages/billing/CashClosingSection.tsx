import { useEffect, useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/ui/Alert'
import { Table } from '../../components/ui/Table'
import type { PaymentWithInvoice } from '../../services/payments'
import { listPaymentsForDate } from '../../services/payments'
import { countDraftInvoices, listInvoicesInRange } from '../../services/invoices'
import type { CashClosing } from '../../services/cashClosings'
import { createCashClosing, listCashClosings } from '../../services/cashClosings'
import type { CashRegister } from '../../services/cashRegister'
import { closeCashRegister, getCashRegister, openCashRegister } from '../../services/cashRegister'
import type { CashExpense } from '../../services/cashExpenses'
import { addExpense, listExpensesForDate } from '../../services/cashExpenses'
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
  const [register, setRegister] = useState<CashRegister | null>(null)
  const [payments, setPayments] = useState<PaymentWithInvoice[]>([])
  const [expenses, setExpenses] = useState<CashExpense[]>([])
  const [invoicesCount, setInvoicesCount] = useState(0)
  const [invoicesTotal, setInvoicesTotal] = useState(0)
  const [countedCash, setCountedCash] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<CashClosing[]>([])
  const [draftCount, setDraftCount] = useState(0)

  const [openModalOpen, setOpenModalOpen] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('0')
  const [opening, setOpening] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseConcept, setExpenseConcept] = useState('')
  const [expenseMethod, setExpenseMethod] = useState('efectivo')
  const [savingExpense, setSavingExpense] = useState(false)

  async function load() {
    setLoading(true)
    setSaved(false)
    setError('')
    try {
      const [reg, p, exp, invoices, closings, drafts] = await Promise.all([
        getCashRegister(date),
        listPaymentsForDate(date),
        listExpensesForDate(date),
        listInvoicesInRange(date, date),
        listCashClosings(),
        countDraftInvoices().catch(() => 0),
      ])
      setRegister(reg)
      setPayments(p)
      setExpenses(exp)
      setInvoicesCount(invoices.length)
      setInvoicesTotal(invoices.reduce((sum, inv) => sum + inv.total, 0))
      setHistory(closings)
      setDraftCount(drafts)
    } catch {
      setError('No se pudo cargar la caja del día.')
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
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const pendingToCollect = Math.max(invoicesTotal - totalCollected, 0)
  const finalBalance = totalCollected - totalExpenses
  const countedCashNumber = countedCash === '' ? null : Number(countedCash)
  const difference = countedCashNumber === null ? null : countedCashNumber - totals.total_efectivo
  const isOpen = register?.status === 'open'

  const movements = [
    ...payments.map((p) => ({
      id: `pago-${p.id}`,
      time: p.paid_at,
      type: 'ingreso' as const,
      description: p.invoice?.patient?.full_name ?? p.invoice?.invoice_number ?? 'Cobro',
      method: p.method,
      amount: p.amount,
    })),
    ...expenses.map((e) => ({
      id: `egreso-${e.id}`,
      time: e.created_at,
      type: 'egreso' as const,
      description: e.concept,
      method: e.method,
      amount: e.amount,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  async function handleOpenRegister() {
    setOpening(true)
    setError('')
    try {
      const reg = await openCashRegister(date, Number(openingAmount) || 0)
      setRegister(reg)
      setOpenModalOpen(false)
      setOpeningAmount('0')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la caja.')
    } finally {
      setOpening(false)
    }
  }

  async function handleAddExpense() {
    if (!expenseAmount || !expenseConcept.trim()) return
    setSavingExpense(true)
    setError('')
    try {
      await addExpense({ business_date: date, amount: Number(expenseAmount), concept: expenseConcept, method: expenseMethod })
      setExpenseAmount('')
      setExpenseConcept('')
      setExpenseModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el egreso.')
    } finally {
      setSavingExpense(false)
    }
  }

  async function handleCloseRegister() {
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
      await closeCashRegister(date)
      setSaved(true)
      setNotes('')
      setCountedCash('')
      setCloseModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la caja.')
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
        <div>
          <p className="text-sm font-semibold text-midnight-950">Caja diaria</p>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 sm:max-w-xs" />
        </div>
        <Button variant="secondary" onClick={handleExportPdf} disabled={loading || payments.length === 0}>
          Exportar PDF
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Caja del {date} cerrada correctamente.</Alert>}
      {!loading && draftCount > 0 && (
        <Alert variant="info">
          Hay {draftCount} factura{draftCount === 1 ? '' : 's'} en borrador en el sistema (de cualquier fecha) — el cuadre solo
          cuenta facturas ya emitidas. Revísalas en la pestaña "Facturas".
        </Alert>
      )}

      {loading ? (
        <div className="p-6 text-slate-500">Cargando...</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {isOpen ? <Unlock size={18} /> : <Lock size={18} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-midnight-950">{isOpen ? 'Caja abierta' : 'Caja cerrada'}</p>
                <p className="text-xs text-slate-500">
                  {isOpen
                    ? `Desde ${register?.opened_at ? new Date(register.opened_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''} · monto inicial RD$ ${register?.opening_amount.toFixed(2)}`
                    : 'Abre la caja para registrar egresos y cerrar el día.'}
                </p>
              </div>
            </div>
            {isOpen ? (
              <Button variant="danger" onClick={() => setCloseModalOpen(true)}>
                Cerrar caja
              </Button>
            ) : (
              <Button onClick={() => setOpenModalOpen(true)}>Abrir caja</Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs uppercase tracking-wide text-slate-400">Ventas del día</p>
              <p className="mt-1 text-xl font-semibold text-midnight-950">RD$ {invoicesTotal.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total cobrado</p>
              <p className="mt-1 text-xl font-semibold text-midnight-950">RD$ {totalCollected.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs uppercase tracking-wide text-slate-400">Pendiente por cobrar</p>
              <p className="mt-1 text-xl font-semibold text-midnight-950">RD$ {pendingToCollect.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs uppercase tracking-wide text-slate-400">Egresos</p>
              <p className="mt-1 text-xl font-semibold text-midnight-950">RD$ {totalExpenses.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-700">Balance final</p>
              <p className="mt-1 text-xl font-semibold text-amber-800">RD$ {finalBalance.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-card">
              <p className="mb-3 text-sm font-semibold text-midnight-950">Ingresos por método de pago</p>
              {payments.length === 0 ? (
                <p className="text-sm text-slate-500">Sin cobros hoy.</p>
              ) : (
                <ul className="space-y-2">
                  {(['efectivo', 'tarjeta', 'transferencia', 'otro'] as const)
                    .filter((m) => totals[`total_${m}` as keyof typeof totals] > 0)
                    .map((m) => (
                      <li key={m} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{METHOD_LABEL[m]}</span>
                        <span className="font-medium text-midnight-950">
                          RD$ {totals[`total_${m}` as keyof typeof totals].toFixed(2)}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-midnight-950">Historial de movimientos</p>
                <Button size="sm" variant="secondary" onClick={() => setExpenseModalOpen(true)} disabled={!isOpen}>
                  + Egreso
                </Button>
              </div>
              {!register ? (
                <p className="text-sm text-slate-500">Abre la caja para ver movimientos.</p>
              ) : movements.length === 0 ? (
                <p className="text-sm text-slate-500">Sin movimientos todavía.</p>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto">
                  {movements.map((m) => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-slate-700">{m.description}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(m.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ·{' '}
                          {METHOD_LABEL[m.method] ?? m.method}
                        </p>
                      </div>
                      <span className={`shrink-0 font-medium ${m.type === 'ingreso' ? 'text-emerald-600' : 'text-[#DC4B3E]'}`}>
                        {m.type === 'ingreso' ? '+' : '-'}RD$ {m.amount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-card">
            {payments.length === 0 ? (
              <div className="p-6 text-slate-500">No hay pagos registrados para esta fecha.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  headers={['Hora', 'No. Factura', 'Paciente', 'Método', 'Referencia', 'Monto']}
                  rows={payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(p.paid_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{p.invoice?.invoice_number ?? '—'}</td>
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

      <Modal
        open={openModalOpen}
        title="Abrir caja"
        onClose={() => setOpenModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenModalOpen(false)} disabled={opening}>
              Cancelar
            </Button>
            <Button onClick={handleOpenRegister} loading={opening}>
              Abrir caja
            </Button>
          </>
        }
      >
        <Input
          label="Monto inicial en caja (efectivo)"
          type="number"
          helper="El fondo con el que arranca la caja hoy — normalmente 0 si no se deja base fija."
          value={openingAmount}
          onChange={(e) => setOpeningAmount(e.target.value)}
        />
      </Modal>

      <Modal
        open={expenseModalOpen}
        title="Registrar egreso"
        onClose={() => setExpenseModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setExpenseModalOpen(false)} disabled={savingExpense}>
              Cancelar
            </Button>
            <Button onClick={handleAddExpense} loading={savingExpense} disabled={!expenseAmount || !expenseConcept.trim()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Concepto" required value={expenseConcept} onChange={(e) => setExpenseConcept(e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Monto" type="number" required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
            <Select label="Método" value={expenseMethod} onChange={(e) => setExpenseMethod(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </Select>
          </div>
        </div>
      </Modal>

      <Modal
        open={closeModalOpen}
        title="Cerrar caja"
        onClose={() => setCloseModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCloseModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleCloseRegister} loading={saving}>
              Confirmar cierre
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Cuenta el efectivo en caja y compáralo contra el sistema antes de cerrar.</p>
          <div className="grid gap-3 sm:grid-cols-2">
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
          <Textarea label="Notas" placeholder="Observaciones del cierre (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
