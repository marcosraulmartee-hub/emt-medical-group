import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { Appointment } from '../../services/appointments'
import type { AgendaSummaryRow } from '../../services/agendaSummary'
import { buildAgendaSummary, listAppointmentsForSummary } from '../../services/agendaSummary'
import { addDays, startOfWeek, toISODate } from '../../utils/dates'

type Range = 'hoy' | 'semana'

const STATUS_LABEL: Record<Appointment['status'], string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  reschedule_requested: 'Reprogramación',
  cancelled: 'Cancelada',
  completed: 'Completada',
}

const STATUS_TONE: Record<Appointment['status'], 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'neutral',
  confirmed: 'info',
  reschedule_requested: 'warning',
  cancelled: 'danger',
  completed: 'success',
}

const BILLING_TONE: Record<AgendaSummaryRow['billing']['kind'], 'success' | 'info' | 'neutral'> = {
  presupuesto: 'info',
  factura: 'success',
  ninguno: 'neutral',
}

export function AgendaSummaryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [range, setRange] = useState<Range>('hoy')
  const [rows, setRows] = useState<AgendaSummaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const today = new Date()
      const from = range === 'hoy' ? today : startOfWeek(today)
      const to = range === 'hoy' ? today : addDays(startOfWeek(today), 6)
      const appointments = await listAppointmentsForSummary(toISODate(from), toISODate(to))
      setRows(await buildAgendaSummary(appointments))
    } catch {
      setError('No se pudo cargar el resumen de agenda.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, range])

  return (
    <Modal open={open} title="Resumen clínico de agenda" size="lg" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5">
          <button
            onClick={() => setRange('hoy')}
            className={
              'rounded-xl px-4 py-2 text-sm font-medium transition ' +
              (range === 'hoy' ? 'bg-white text-midnight-950 shadow-card' : 'text-slate-600 hover:bg-white/60')
            }
          >
            Hoy
          </button>
          <button
            onClick={() => setRange('semana')}
            className={
              'rounded-xl px-4 py-2 text-sm font-medium transition ' +
              (range === 'semana' ? 'bg-white text-midnight-950 shadow-card' : 'text-slate-600 hover:bg-white/60')
            }
          >
            Esta semana
          </button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {!loading && rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            {range === 'hoy' ? 'No hay citas hoy.' : 'No hay citas esta semana.'}
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-100">
            {loading ? (
              <div className="p-6 text-slate-500">Cargando...</div>
            ) : (
              <Table
                headers={range === 'semana' ? ['Fecha', 'Hora', 'Paciente', 'Diagnóstico', 'Protocolo', 'Presupuesto / Factura', 'Estado'] : ['Hora', 'Paciente', 'Diagnóstico', 'Protocolo', 'Presupuesto / Factura', 'Estado']}
                rows={rows.map(({ appointment: a, diagnosis, billing }) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    {range === 'semana' && <td className="px-4 py-3 text-slate-700">{a.date}</td>}
                    <td className="px-4 py-3 text-slate-500">{a.start_time.slice(0, 5)}</td>
                    <td className="px-4 py-3 text-slate-700">{a.patient?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{diagnosis ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{a.protocol?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={BILLING_TONE[billing.kind]}>{billing.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                    </td>
                  </tr>
                ))}
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
