import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import type { Budget, BudgetStatus } from '../../services/budgets'
import { listBudgets } from '../../services/budgets'
import { BudgetFormModal } from './BudgetFormModal'
import { BudgetDetailModal } from './BudgetDetailModal'

const STATUS_LABEL: Record<BudgetStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired: 'Vencido',
}

const STATUS_TONE: Record<BudgetStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'neutral',
  sent: 'info',
  accepted: 'success',
  rejected: 'danger',
  expired: 'warning',
}

export function BudgetsSection() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Budget | null>(null)
  const [convertedNotice, setConvertedNotice] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setBudgets(await listBudgets())
    } catch {
      setError('No se pudieron cargar los presupuestos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Propuestas de costo de tratamiento (ej. ciclo de 30 sesiones) para enviar al paciente en PDF antes de que decida iniciar.
        </p>
        <Button onClick={() => setCreateOpen(true)}>Nuevo presupuesto</Button>
      </div>

      {convertedNotice && (
        <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
          Factura borrador creada en la pestaña "Facturas" a partir del presupuesto aceptado.
        </div>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        {loading ? (
          <div className="p-6 text-slate-500">Cargando presupuestos...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : budgets.length === 0 ? (
          <div className="p-6 text-slate-500">No hay presupuestos todavía.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={['Paciente', 'Protocolo', 'Válido hasta', 'Estado', 'Total estimado']}
              rows={budgets.map((b) => (
                <tr key={b.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelected(b)}>
                  <td className="px-4 py-4 text-slate-700">{b.patient?.full_name ?? '—'}</td>
                  <td className="px-4 py-4 text-slate-500">{b.protocol?.name ?? '—'}</td>
                  <td className="px-4 py-4 text-slate-500">{b.valid_until ?? '—'}</td>
                  <td className="px-4 py-4">
                    <Badge tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{b.total.toFixed(2)}</td>
                </tr>
              ))}
            />
          </div>
        )}
      </div>

      <BudgetFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false)
          void load()
        }}
      />

      {selected && (
        <BudgetDetailModal
          budget={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null)
            void load()
          }}
          onConvertedToInvoice={() => {
            setSelected(null)
            setConvertedNotice(true)
            void load()
          }}
        />
      )}
    </div>
  )
}
