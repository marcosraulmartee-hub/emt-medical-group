import { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Table } from '../components/ui/Table'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import type { AuditLog } from '../services/audit'
import { listAuditLogs } from '../services/audit'

const ACTION_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  login: 'info',
  logout: 'neutral',
  create: 'success',
  update: 'warning',
  role_change: 'danger',
  activate: 'success',
  deactivate: 'danger',
  issue: 'success',
  credit_note: 'danger',
  status_change: 'warning',
}

const ENTITIES = ['patient', 'profile', 'emt_session', 'invoice', 'appointment', 'auth']

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [entity, setEntity] = useState('')

  async function load() {
    setLoading(true)
    try {
      setLogs(
        await listAuditLogs({
          from: from ? `${from}T00:00:00` : undefined,
          to: to ? `${to}T23:59:59` : undefined,
          entity: entity || undefined,
        }),
      )
    } catch {
      setError('No se pudo cargar la auditoría.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppShell title="Auditoría">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-midnight-950">Registro de auditoría</h2>
          <p className="text-sm text-slate-500">Acceso y acciones administrativas y clínicas — inmutable.</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-3xl bg-white p-4 shadow-card">
          <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select label="Entidad" value={entity} onChange={(e) => setEntity(e.target.value)} className="w-48">
            <option value="">Todas</option>
            {ENTITIES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
          <button
            onClick={() => void load()}
            className="h-11 rounded-2xl bg-teal-500 px-4 text-sm font-medium text-white hover:bg-teal-600"
          >
            Filtrar
          </button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          {loading ? (
            <div className="p-6 text-slate-500">Cargando...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-slate-500">No hay eventos registrados en este rango.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                headers={['Fecha', 'Usuario', 'Acción', 'Entidad', 'Detalle']}
                rows={logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-500">{new Date(log.created_at).toLocaleString('es-ES')}</td>
                    <td className="px-4 py-4 text-slate-700">{log.actor_name}</td>
                    <td className="px-4 py-4">
                      <Badge tone={ACTION_TONE[log.action] ?? 'neutral'}>{log.action}</Badge>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{log.entity}</td>
                    <td className="px-4 py-4 max-w-xs truncate text-xs text-slate-400">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
