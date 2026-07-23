import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { Budget, BudgetItem, BudgetStatus } from '../../services/budgets'
import { listBudgetItems, updateBudgetStatus } from '../../services/budgets'
import { createDraftInvoice } from '../../services/invoices'
import { getSetting } from '../../services/clinicSettings'
import { buildMailtoUrl, buildWhatsAppShareUrl, openShareWindow } from '../../utils/share'

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

export function BudgetDetailModal({
  budget,
  onClose,
  onChanged,
  onConvertedToInvoice,
}: {
  budget: Budget
  onClose: () => void
  onChanged: () => void
  onConvertedToInvoice: () => void
}) {
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [converting, setConverting] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    setLoading(true)
    listBudgetItems(budget.id)
      .then(setItems)
      .catch(() => setError('No se pudo cargar el detalle.'))
      .finally(() => setLoading(false))
  }, [budget.id])

  async function handleDownloadPdf() {
    const { exportBudgetPdf } = await import('../../utils/budgetPdf')
    exportBudgetPdf(budget, items)
  }

  async function handleShare(channel: 'whatsapp' | 'email') {
    setError('')
    setShared(false)
    try {
      const { exportBudgetPdf } = await import('../../utils/budgetPdf')
      exportBudgetPdf(budget, items)
      const message = `Hola ${budget.patient?.full_name ?? ''}, te compartimos de EMT Medical Group el presupuesto de tu tratamiento (total estimado RD$ ${budget.total.toFixed(2)}). Revisa el PDF adjunto y cualquier duda nos avisas.`
      if (channel === 'whatsapp') {
        openShareWindow(buildWhatsAppShareUrl(budget.patient?.phone, message))
      } else {
        openShareWindow(buildMailtoUrl(budget.patient?.email, 'EMT Medical Group — Presupuesto de tratamiento', message))
      }
      setShared(true)
    } catch {
      setError('No se pudo generar el presupuesto para compartir.')
    }
  }

  async function handleStatusChange(status: BudgetStatus) {
    setUpdating(true)
    setError('')
    try {
      await updateBudgetStatus(budget.id, status)
      onChanged()
    } catch {
      setError('No se pudo actualizar el estado.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleConvertToInvoice() {
    setConverting(true)
    setError('')
    try {
      const taxRate = Number((await getSetting('tax_rate')) ?? '0')
      await createDraftInvoice(
        {
          patient_id: budget.patient_id,
          due_date: null,
          tax_rate: taxRate,
          discount_amount: budget.discount_amount,
          notes: `Generada desde presupuesto${budget.notes ? ` — ${budget.notes}` : ''}`,
        },
        items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })),
      )
      onConvertedToInvoice()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo convertir en factura.')
    } finally {
      setConverting(false)
    }
  }

  return (
    <Modal open title="Presupuesto" size="lg" onClose={onClose}>
      <div className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}
        {shared && (
          <Alert variant="success">
            El PDF se descargó y se abrió la ventana para enviarlo — adjúntalo manualmente en la conversación/correo.
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-midnight-950">{budget.patient?.full_name}</p>
            <p className="text-xs text-slate-500">
              {budget.protocol?.name ?? 'Sin protocolo específico'}
              {budget.valid_until ? ` · válido hasta ${budget.valid_until}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[budget.status]}>{STATUS_LABEL[budget.status]}</Badge>
            <Button size="sm" variant="secondary" onClick={handleDownloadPdf} disabled={loading}>
              Descargar PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleShare('whatsapp')} disabled={loading}>
              WhatsApp
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleShare('email')} disabled={loading}>
              Correo
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
            <span>{budget.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Descuento</span>
            <span>-{budget.discount_amount.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-midnight-950">
            <span>Total estimado</span>
            <span>{budget.total.toFixed(2)}</span>
          </div>
        </div>

        {budget.notes && <p className="text-sm text-slate-500">Notas: {budget.notes}</p>}

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {budget.status === 'draft' && (
            <Button size="sm" onClick={() => handleStatusChange('sent')} loading={updating}>
              Marcar enviado
            </Button>
          )}
          {(budget.status === 'draft' || budget.status === 'sent') && (
            <>
              <Button size="sm" variant="secondary" onClick={() => handleStatusChange('accepted')} loading={updating}>
                Marcar aceptado
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleStatusChange('rejected')} loading={updating}>
                Marcar rechazado
              </Button>
            </>
          )}
          {budget.status === 'accepted' && (
            <Button size="sm" onClick={handleConvertToInvoice} loading={converting}>
              Convertir en factura (borrador)
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
