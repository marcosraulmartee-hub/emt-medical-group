import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Table } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import type { SessionRecord } from '../services/sessions'
import { listSessions } from '../services/sessions'
import { SessionFormModal } from './sessions/SessionFormModal'
import { computeCycleProgress } from '../utils/cycleProgress'
import { useAuth } from '../hooks/useAuth'

export function SessionsPage() {
  const { profile } = useAuth()
  const canRegister = profile?.role === 'admin' || profile?.role === 'medico' || profile?.role === 'tecnico'
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setSessions(await listSessions())
    } catch {
      setError('No se pudieron cargar las sesiones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const progressBySession = useMemo(() => computeCycleProgress(sessions), [sessions])

  return (
    <AppShell title="Sesiones EMT">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Registro de sesiones</h2>
            <p className="text-sm text-slate-500">Control técnico y clínico de cada sesión aplicada.</p>
          </div>
          {canRegister && <Button onClick={() => setModalOpen(true)}>Registrar sesión</Button>}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          {loading ? (
            <div className="p-6 text-slate-500">Cargando sesiones...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-slate-500">No hay sesiones registradas.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                headers={['Paciente', 'Fecha', 'Protocolo', 'Equipo', 'Ciclo', 'Eventos adversos']}
                rows={sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{session.patient?.full_name ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-500">
                      {session.date} {session.start_time?.slice(0, 5) ?? ''}
                    </td>
                    <td className="px-4 py-4 text-slate-500">{session.protocol?.name ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{session.equipment?.name ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{progressBySession.get(session.id) ?? '—'}</td>
                    <td className="px-4 py-4">
                      {session.adverse_events ? (
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
      </div>

      <SessionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false)
          void load()
        }}
      />
    </AppShell>
  )
}
