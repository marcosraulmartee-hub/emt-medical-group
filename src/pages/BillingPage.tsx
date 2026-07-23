import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Table } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import type { Invoice, InvoiceStatus } from '../services/invoices'
import { listInvoices } from '../services/invoices'
import { InvoiceFormModal } from './billing/InvoiceFormModal'
import { InvoiceDetailModal } from './billing/InvoiceDetailModal'
import { CashClosingSection } from './billing/CashClosingSection'
import { BudgetsSection } from './billing/BudgetsSection'

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  cancelled: 'Anulada',
}

const STATUS_TONE: Record<InvoiceStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  issued: 'success',
  cancelled: 'danger',
}

type Tab = 'invoices' | 'closing' | 'budgets'

export function BillingPage() {
  const [tab, setTab] = useState<Tab>('invoices')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Invoice | null>(null)

  async function load() {
    setLoading(true)
    try {
      setInvoices(await listInvoices())
    } catch {
      setError('No se pudieron cargar las facturas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const draftCount = useMemo(() => invoices.filter((inv) => inv.status === 'draft').length, [invoices])

  async function exportPdf() {
    const { exportInvoiceListPdf } = await import('../utils/invoicePdf')
    exportInvoiceListPdf(invoices)
  }

  function exportExcel() {
    const rows = invoices.map((inv) => ({
      'No. Factura': inv.invoice_number ?? '',
      Paciente: inv.patient?.full_name ?? '',
      Estado: STATUS_LABEL[inv.status],
      'Fecha emisión': inv.issue_date ?? '',
      Subtotal: inv.subtotal,
      Descuento: inv.discount_amount,
      ITBIS: inv.tax_amount,
      Total: inv.total,
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas')
    XLSX.writeFile(workbook, `facturas_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <AppShell title="Facturación">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Facturación</h2>
            <p className="text-sm text-slate-500">Cobros por sesión, paquetes de sesiones y cuadre de caja.</p>
          </div>
          {tab === 'invoices' && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={exportExcel} disabled={invoices.length === 0}>
                Exportar Excel
              </Button>
              <Button variant="secondary" onClick={exportPdf} disabled={invoices.length === 0}>
                Exportar PDF
              </Button>
              <Button onClick={() => setCreateOpen(true)}>Nueva factura</Button>
            </div>
          )}
        </div>

        {!loading && draftCount > 0 && (
          <Alert variant="info">
            Hay {draftCount} factura{draftCount === 1 ? '' : 's'} en borrador sin emitir — hasta que se emitan (botón "Emitir
            factura" dentro de cada una) no cuentan como facturado ni aparecen en el Cuadre del día.
          </Alert>
        )}

        <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-card sm:w-fit">
          <button
            onClick={() => setTab('invoices')}
            className={
              'rounded-xl px-4 py-2 text-sm font-medium transition ' +
              (tab === 'invoices' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
            }
          >
            Facturas
          </button>
          <button
            onClick={() => setTab('closing')}
            className={
              'rounded-xl px-4 py-2 text-sm font-medium transition ' +
              (tab === 'closing' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
            }
          >
            Cuadre del día
          </button>
          <button
            onClick={() => setTab('budgets')}
            className={
              'rounded-xl px-4 py-2 text-sm font-medium transition ' +
              (tab === 'budgets' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
            }
          >
            Presupuestos
          </button>
        </div>

        {tab === 'closing' ? (
          <CashClosingSection />
        ) : tab === 'budgets' ? (
          <BudgetsSection />
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-card">
            {loading ? (
              <div className="p-6 text-slate-500">Cargando facturas...</div>
            ) : error ? (
              <div className="p-6 text-red-600">{error}</div>
            ) : invoices.length === 0 ? (
              <div className="p-6 text-slate-500">No hay facturas todavía.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  headers={['No. Factura', 'Paciente', 'Fecha', 'Estado', 'Total']}
                  rows={invoices.map((inv) => (
                    <tr key={inv.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelected(inv)}>
                      <td className="px-4 py-4 text-slate-700">{inv.invoice_number ?? 'Borrador'}</td>
                      <td className="px-4 py-4 text-slate-500">{inv.patient?.full_name ?? '—'}</td>
                      <td className="px-4 py-4 text-slate-500">{inv.issue_date ?? '—'}</td>
                      <td className="px-4 py-4">
                        <Badge tone={STATUS_TONE[inv.status]}>{STATUS_LABEL[inv.status]}</Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{inv.total.toFixed(2)}</td>
                    </tr>
                  ))}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <InvoiceFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false)
          void load()
        }}
      />

      {selected && (
        <InvoiceDetailModal
          invoice={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null)
            void load()
          }}
        />
      )}
    </AppShell>
  )
}
