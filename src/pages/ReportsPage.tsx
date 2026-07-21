import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { useAuth } from '../hooks/useAuth'
import type { Invoice } from '../services/invoices'
import { listInvoicesInRange } from '../services/invoices'
import type { SessionRecord } from '../services/sessions'
import { listSessionsInRange } from '../services/sessions'
import type { AdverseEvent } from '../services/adverseEvents'
import { listAdverseEventsInRange } from '../services/adverseEvents'
import { toISODate } from '../utils/dates'

function startOfMonth(): string {
  const d = new Date()
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1))
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-midnight-950">{value}</p>
    </div>
  )
}

function GroupTable({ title, rows }: { title: string; rows: { label: string; value: string | number }[] }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <p className="mb-3 text-sm font-semibold text-midnight-950">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Sin datos en el período.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{row.label}</span>
              <span className="font-medium text-midnight-950">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ReportsPage() {
  const { profile } = useAuth()
  const canSeeFiscal = profile?.role === 'admin' || profile?.role === 'contable' || profile?.role === 'recepcionista'
  const canSeeClinical = profile?.role === 'admin' || profile?.role === 'medico' || profile?.role === 'tecnico'

  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(toISODate(new Date()))
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [adverseEvents, setAdverseEvents] = useState<AdverseEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const tasks: Promise<void>[] = []
      if (canSeeFiscal) tasks.push(listInvoicesInRange(from, to).then(setInvoices))
      if (canSeeClinical) {
        tasks.push(listSessionsInRange(from, to).then(setSessions))
        tasks.push(listAdverseEventsInRange(from, to).then(setAdverseEvents))
      }
      await Promise.all(tasks)
    } catch {
      setError('No se pudieron cargar los reportes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fiscal = useMemo(() => {
    const totalFacturado = invoices.reduce((sum, i) => sum + i.total, 0)
    const totalItbis = invoices.reduce((sum, i) => sum + i.tax_amount, 0)
    const byType = new Map<string, number>()
    for (const inv of invoices) byType.set(inv.ncf_type, (byType.get(inv.ncf_type) ?? 0) + inv.total)
    return {
      totalFacturado,
      totalItbis,
      cantidad: invoices.length,
      byType: [...byType.entries()].map(([label, value]) => ({ label, value: value.toFixed(2) })),
    }
  }, [invoices])

  const clinical = useMemo(() => {
    const byProtocol = new Map<string, number>()
    const patients = new Set<string>()
    for (const s of sessions) {
      const label = s.protocol?.name ?? 'Sin protocolo'
      byProtocol.set(label, (byProtocol.get(label) ?? 0) + 1)
      patients.add(s.patient_id)
    }
    const bySeverity = new Map<string, number>()
    for (const e of adverseEvents) bySeverity.set(e.severity, (bySeverity.get(e.severity) ?? 0) + 1)
    return {
      totalSesiones: sessions.length,
      pacientesActivos: patients.size,
      byProtocol: [...byProtocol.entries()].map(([label, value]) => ({ label, value })),
      bySeverity: [...bySeverity.entries()].map(([label, value]) => ({ label, value })),
    }
  }, [sessions, adverseEvents])

  return (
    <AppShell title="Reportes">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-midnight-950">Reportes clínicos y fiscales</h2>
          <p className="text-sm text-slate-500">Filtrá por fecha para ver métricas del período.</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-3xl bg-white p-4 shadow-card">
          <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button
            onClick={() => void load()}
            className="h-11 rounded-2xl bg-teal-500 px-4 text-sm font-medium text-white hover:bg-teal-600"
          >
            Aplicar
          </button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {loading && <p className="text-sm text-slate-500">Cargando...</p>}

        {!loading && canSeeFiscal && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-midnight-950">Fiscal</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total facturado" value={fiscal.totalFacturado.toFixed(2)} />
              <StatCard label="ITBIS recaudado" value={fiscal.totalItbis.toFixed(2)} />
              <StatCard label="Facturas emitidas" value={fiscal.cantidad} />
            </div>
            <GroupTable title="Facturado por tipo de NCF" rows={fiscal.byType} />
          </div>
        )}

        {!loading && canSeeClinical && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-midnight-950">Clínico</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Sesiones realizadas" value={clinical.totalSesiones} />
              <StatCard label="Pacientes atendidos" value={clinical.pacientesActivos} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <GroupTable title="Sesiones por protocolo" rows={clinical.byProtocol} />
              <GroupTable title="Eventos adversos por severidad" rows={clinical.bySeverity} />
            </div>
          </div>
        )}

        {!loading && !canSeeFiscal && !canSeeClinical && (
          <Alert variant="info">Tu rol no tiene reportes configurados todavía.</Alert>
        )}
      </div>
    </AppShell>
  )
}
