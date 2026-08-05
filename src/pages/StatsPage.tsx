import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, CalendarX, DollarSign, ListChecks, TrendingUp, Users } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Input } from '../components/ui/Input'
import { Table } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { StatTile } from '../components/dashboard/StatTile'
import { AttendanceChart } from '../components/stats/AttendanceChart'
import { TopProtocolsChart } from '../components/stats/TopProtocolsChart'
import type { Appointment } from '../services/appointments'
import type { ProtocolUsage, StatsSummary } from '../services/stats'
import {
  bucketAttendanceByWeek,
  getOutstandingBalanceByPatient,
  getStatsSummary,
  getTopProtocolsByUsage,
  listAppointmentsForStats,
} from '../services/stats'
import { addDays, toISODate } from '../utils/dates'
import { minutesToLabel, timeToMinutes } from '../utils/timeGrid'

type ViewMode = 'lista' | 'grafico'

const STATUS_LABEL: Record<Appointment['status'], string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  reschedule_requested: 'Reprogramación solicitada',
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

export function StatsPage() {
  const [view, setView] = useState<ViewMode>('grafico')
  const [from, setFrom] = useState(() => toISODate(addDays(new Date(), -89)))
  const [to, setTo] = useState(() => toISODate(new Date()))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all')

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [outstanding, setOutstanding] = useState<Set<string>>(new Set())
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [topProtocols, setTopProtocols] = useState<ProtocolUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const today = new Date()
      const protocolsFrom = toISODate(addDays(today, -179))
      const [appts, protocols] = await Promise.all([
        listAppointmentsForStats(from, to),
        getTopProtocolsByUsage(protocolsFrom, toISODate(today)),
      ])
      setAppointments(appts)
      setTopProtocols(protocols)
      const summaryData = await getStatsSummary(appts)
      setSummary(summaryData)
      const balances = await getOutstandingBalanceByPatient(appts.map((a) => a.patient_id)).catch(() => new Set<string>())
      setOutstanding(balances)
    } catch {
      setError('No se pudieron cargar las estadísticas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  const rangeDays = useMemo(() => {
    const d1 = new Date(from)
    const d2 = new Date(to)
    return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1)
  }, [from, to])

  const weeklyAttendance = useMemo(
    () => bucketAttendanceByWeek(appointments, Math.min(26, Math.max(1, Math.ceil(rangeDays / 7)))),
    [appointments, rangeDays],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return appointments.filter((a) => {
      if (statusFilter === 'completed' && a.status !== 'completed') return false
      if (statusFilter === 'cancelled' && a.status !== 'cancelled') return false
      if (term && !(a.patient?.full_name ?? '').toLowerCase().includes(term)) return false
      return true
    })
  }, [appointments, search, statusFilter])

  return (
    <AppShell title="Estadísticas">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Estadísticas</h2>
            <p className="text-sm text-slate-500">Asistencias, cancelaciones y actividad general de la clínica.</p>
          </div>
          <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-card">
            <button
              onClick={() => setView('grafico')}
              className={
                'rounded-xl px-4 py-2 text-sm font-medium transition ' +
                (view === 'grafico' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              Gráfico
            </button>
            <button
              onClick={() => setView('lista')}
              className={
                'rounded-xl px-4 py-2 text-sm font-medium transition ' +
                (view === 'lista' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              Lista
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile label="Pacientes registrados" value={loading ? '—' : (summary?.totalPatients ?? 0)} icon={Users} />
          <StatTile label="Sesiones registradas (histórico)" value={loading ? '—' : (summary?.totalSessions ?? 0)} icon={ListChecks} />
          <StatTile
            label="Tasa de asistencia"
            value={loading || summary?.attendanceRate == null ? '—' : `${Math.round(summary.attendanceRate * 100)}%`}
            hint="Completadas / (completadas + canceladas) en el rango"
            icon={CalendarCheck}
          />
          <StatTile
            label="Tasa de cancelación"
            value={loading || summary?.cancellationRate == null ? '—' : `${Math.round(summary.cancellationRate * 100)}%`}
            hint="Canceladas / (completadas + canceladas) en el rango"
            icon={CalendarX}
          />
          <StatTile
            label="Facturado (últimos 30 días)"
            value={loading ? '—' : `RD$ ${(summary?.revenue30d ?? 0).toLocaleString('es-DO', { maximumFractionDigits: 0 })}`}
            icon={DollarSign}
          />
          <StatTile label="Presupuestos pendientes" value={loading ? '—' : (summary?.pendingBudgets ?? 0)} icon={TrendingUp} />
        </div>

        {view === 'grafico' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <AttendanceChart data={weeklyAttendance} />
            <TopProtocolsChart data={topProtocols} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Buscar por paciente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:max-w-sm"
              />
              <div className="flex gap-2">
                {(['all', 'completed', 'cancelled'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={
                      'rounded-2xl px-3 py-2 text-xs font-medium transition ' +
                      (statusFilter === s ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 shadow-card hover:bg-slate-50')
                    }
                  >
                    {s === 'all' ? 'Todas' : s === 'completed' ? 'Completadas' : 'Canceladas'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-card">
              {loading ? (
                <div className="p-6 text-slate-500">Cargando...</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-slate-500">No hay citas que coincidan con el filtro.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table
                    headers={['Fecha', 'Hora', 'Paciente', 'Protocolo', 'Estado', 'Cuentas por cobrar']}
                    rows={filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{a.date}</td>
                        <td className="px-4 py-3 text-slate-500">{minutesToLabel(timeToMinutes(a.start_time))}</td>
                        <td className="px-4 py-3 text-slate-500">{a.patient?.full_name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{a.protocol?.name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {outstanding.has(a.patient_id) ? <Badge tone="warning">Sí</Badge> : <Badge tone="neutral">No</Badge>}
                        </td>
                      </tr>
                    ))}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
