import { useEffect, useMemo, useState } from 'react'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { SessionRecord } from '../../services/sessions'
import { listSessionsByPatient } from '../../services/sessions'
import { computeCycleProgress } from '../../utils/cycleProgress'

export function SessionsHistorySection({ patientId }: { patientId: string }) {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    listSessionsByPatient(patientId)
      .then(setSessions)
      .catch(() => setError('No se pudo cargar el historial de sesiones.'))
      .finally(() => setLoading(false))
  }, [patientId])

  const progress = useMemo(() => computeCycleProgress(sessions), [sessions])

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <h3 className="mb-4 text-base font-semibold text-midnight-950">Historial de sesiones</h3>
      {error && <Alert variant="error">{error}</Alert>}
      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-slate-500">Sin sesiones registradas todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table
            headers={['Fecha', 'Protocolo', 'Ciclo', 'Región', 'Eventos adversos']}
            rows={sessions.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 text-slate-700">
                  {s.date} {s.start_time?.slice(0, 5) ?? ''}
                </td>
                <td className="px-4 py-4 text-slate-500">{s.protocol?.name ?? '—'}</td>
                <td className="px-4 py-4 text-slate-500">{progress.get(s.id) ?? '—'}</td>
                <td className="px-4 py-4 text-slate-500">{s.stimulated_region || '—'}</td>
                <td className="px-4 py-4">
                  {s.adverse_events ? <Badge tone="warning">Sí</Badge> : <Badge tone="neutral">No</Badge>}
                </td>
              </tr>
            ))}
          />
        </div>
      )}
    </div>
  )
}
