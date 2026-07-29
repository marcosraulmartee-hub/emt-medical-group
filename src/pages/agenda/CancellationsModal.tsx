import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { Appointment } from '../../services/appointments'
import { getOutstandingBalanceByPatient, listAppointmentsForStats } from '../../services/stats'
import { addDays, toISODate } from '../../utils/dates'

export function CancellationsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [from, setFrom] = useState(() => toISODate(addDays(new Date(), -30)))
  const [to, setTo] = useState(() => toISODate(new Date()))
  const [cancelled, setCancelled] = useState<Appointment[]>([])
  const [outstanding, setOutstanding] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const all = await listAppointmentsForStats(from, to)
      const list = all.filter((a) => a.status === 'cancelled')
      setCancelled(list)
      const balances = await getOutstandingBalanceByPatient(list.map((a) => a.patient_id)).catch(() => new Set<string>())
      setOutstanding(balances)
    } catch {
      setError('No se pudieron cargar las cancelaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, from, to])

  return (
    <Modal open={open} title="Citas canceladas" size="lg" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <p className="pb-2.5 text-sm text-slate-500">
            {loading ? 'Cargando...' : `${cancelled.length} cancelación${cancelled.length === 1 ? '' : 'es'}`}
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {!loading && cancelled.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No hay citas canceladas en este período.</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-100">
            <Table
              headers={['Fecha', 'Hora', 'Paciente', 'Protocolo', 'Cuentas por cobrar']}
              rows={cancelled.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{a.date}</td>
                  <td className="px-4 py-3 text-slate-500">{a.start_time.slice(0, 5)}</td>
                  <td className="px-4 py-3 text-slate-500">{a.patient?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{a.protocol?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {outstanding.has(a.patient_id) ? (
                      <Badge tone="warning">Sí</Badge>
                    ) : (
                      <Badge tone="neutral">No</Badge>
                    )}
                  </td>
                </tr>
              ))}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
