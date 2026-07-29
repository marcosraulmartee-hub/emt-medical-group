import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarX, DollarSign } from 'lucide-react'
import type { Appointment } from '../../services/appointments'
import { getOutstandingBalanceByPatient, listAppointmentsForStats } from '../../services/stats'
import { addDays, toISODate } from '../../utils/dates'

export function CancelledAppointmentsCard() {
  const [cancelled, setCancelled] = useState<Appointment[]>([])
  const [outstanding, setOutstanding] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const today = new Date()
      const all = await listAppointmentsForStats(toISODate(addDays(today, -14)), toISODate(today))
      const cancelledOnly = all.filter((a) => a.status === 'cancelled').slice(0, 6)
      setCancelled(cancelledOnly)
      const balances = await getOutstandingBalanceByPatient(cancelledOnly.map((a) => a.patient_id)).catch(() => new Set<string>())
      setOutstanding(balances)
    } catch {
      setCancelled([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (!loading && cancelled.length === 0) return null

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FBEAE8] text-[#DC4B3E]">
          <CalendarX size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-midnight-950">Citas canceladas</h3>
          <p className="text-xs text-slate-400">Últimos 14 días.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <>
          <ul className="space-y-2">
            {cancelled.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-midnight-950">{a.patient?.full_name ?? '—'}</p>
                  <p className="text-xs text-slate-500">
                    {a.date} · {a.start_time.slice(0, 5)} {a.protocol?.name ? `· ${a.protocol.name}` : ''}
                  </p>
                </div>
                {outstanding.has(a.patient_id) && (
                  <span
                    title="Tiene facturas pendientes por cobrar"
                    className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                  >
                    <DollarSign size={12} /> Por cobrar
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Link to="/agenda" className="mt-2 inline-block text-xs text-teal-600 hover:underline">
            Ver en la agenda →
          </Link>
        </>
      )}
    </div>
  )
}
