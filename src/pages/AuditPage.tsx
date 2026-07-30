import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Table } from '../components/ui/Table'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import type { AuditLog } from '../services/audit'
import { listAuditLogs } from '../services/audit'
import type { Profile } from '../types/auth'
import { listUsers } from '../services/users'

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
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [entity, setEntity] = useState('')
  const [userId, setUserId] = useState('')

  async function load() {
    setLoading(true)
    try {
      setLogs(
        await listAuditLogs({
          from: from ? `${from}T00:00:00` : undefined,
          to: to ? `${to}T23:59:59` : undefined,
          entity: entity || undefined,
          userId: userId || undefined,
        }),
      )
    } catch {
      setError('No se pudo cargar la auditoría.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    listUsers().then(setUsers).catch(() => setUsers([]))
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const actionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const log of logs) counts.set(log.action, (counts.get(log.action) ?? 0) + 1)
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [logs])

  const selectedUserName = users.find((u) => u.id === userId)?.full_name

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
          <Select label="Cuenta (usuario)" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-56">
            <option value="">Todas las cuentas</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
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

        {!loading && logs.length > 0 && (
          <div className="rounded-3xl bg-white p-4 shadow-card">
            <p className="mb-2 text-sm font-semibold text-midnight-950">
              {selectedUserName ? `Movimientos de ${selectedUserName}` : 'Resumen de movimientos (todas las cuentas)'}
              <span className="ml-2 font-normal text-slate-400">· {logs.length} en total</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {actionCounts.map(([action, count]) => (
                <span key={action} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {action}: <span className="font-semibold text-midnight-950">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

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
