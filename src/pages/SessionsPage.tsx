import { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Table } from '../components/ui/Table'
import type { SessionRecord } from '../services/sessions'
import { listSessions } from '../services/sessions'

export function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await listSessions()
        setSessions(data)
      } catch {
        setError('No se pudieron cargar las sesiones.')
      } finally {
        setLoading(false)
      }
    }

    void loadSessions()
  }, [])

  return (
    <AppShell title="Sesiones EMT">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Registro de sesiones</h2>
            <p className="text-sm text-slate-500">Control técnico y clínico de cada sesión.</p>
          </div>
          <Button>Registrar sesión</Button>
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
                headers={["Paciente", "Fecha", "Protocolo", "Equipo", "Estado"]}
                rows={sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{session.patient_id}</td>
                    <td className="px-4 py-4 text-slate-500">{session.date}</td>
                    <td className="px-4 py-4 text-slate-500">{session.protocol_id}</td>
                    <td className="px-4 py-4 text-slate-500">{session.equipment_id}</td>
                    <td className="px-4 py-4 text-slate-500">{session.clinical_response ? 'Completada' : 'Pendiente'}</td>
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
