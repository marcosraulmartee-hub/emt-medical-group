import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, FolderOpen, Search } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Table } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import type { SessionRecord } from '../services/sessions'
import { listSessions } from '../services/sessions'
import { SessionFormModal } from './sessions/SessionFormModal'
import { computeCycleProgress } from '../utils/cycleProgress'
import { useAuth } from '../hooks/useAuth'

interface PatientFolder {
  patientId: string
  patientName: string
  sessions: SessionRecord[]
  lastDate: string
  adverseCount: number
}

export function SessionsPage() {
  const { profile } = useAuth()
  const canRegister = profile?.role === 'admin' || profile?.role === 'medico' || profile?.role === 'tecnico'
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [openPatientId, setOpenPatientId] = useState<string | null>(null)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportError, setExportError] = useState('')

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

  const folders = useMemo<PatientFolder[]>(() => {
    const byPatient = new Map<string, PatientFolder>()
    for (const session of sessions) {
      const patientId = session.patient_id
      const patientName = session.patient?.full_name ?? 'Paciente sin nombre'
      let folder = byPatient.get(patientId)
      if (!folder) {
        folder = { patientId, patientName, sessions: [], lastDate: session.date, adverseCount: 0 }
        byPatient.set(patientId, folder)
      }
      folder.sessions.push(session)
      if (session.date > folder.lastDate) folder.lastDate = session.date
      if (session.adverse_events) folder.adverseCount += 1
    }
    return Array.from(byPatient.values()).sort((a, b) => (a.lastDate < b.lastDate ? 1 : -1))
  }, [sessions])

  const filteredFolders = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return folders
    return folders.filter((folder) => folder.patientName.toLowerCase().includes(term))
  }, [folders, search])

  async function handleExportExcel() {
    setExportingExcel(true)
    setExportError('')
    try {
      const XLSX = await import('xlsx')
      const rows = filteredFolders.flatMap((folder) =>
        folder.sessions.map((session) => ({
          Paciente: folder.patientName,
          Fecha: session.date,
          Hora: session.start_time?.slice(0, 5) ?? '',
          Protocolo: session.protocol?.name ?? '',
          Equipo: session.equipment?.name ?? '',
          Bobina: session.coil?.name ?? '',
          'Región estimulada': session.stimulated_region || '',
          Lateralidad: session.laterality || '',
          'Frecuencia (Hz)': session.frequency_hz ?? '',
          'Intensidad (%)': session.intensity_pct ?? '',
          'Duración (min)': session.duration_minutes ?? '',
          Ciclo: progressBySession.get(session.id) ?? '',
          'Eventos adversos': session.adverse_events || 'No',
          Notas: session.notes || '',
        })),
      )
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sesiones')
      XLSX.writeFile(workbook, `sesiones_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch {
      setExportError('No se pudo generar el Excel. Recargá la página e intentá de nuevo.')
    } finally {
      setExportingExcel(false)
    }
  }

  return (
    <AppShell title="Sesiones EMT">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Registro de sesiones</h2>
            <p className="text-sm text-slate-500">Control técnico y clínico de cada sesión aplicada, agrupado por paciente.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportExcel} loading={exportingExcel} disabled={sessions.length === 0}>
              Exportar Excel
            </Button>
            {canRegister && <Button onClick={() => setModalOpen(true)}>Registrar sesión</Button>}
          </div>
        </div>

        {exportError && <Alert variant="error">{exportError}</Alert>}

        <div className="relative sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-card">Cargando sesiones...</div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-6 text-red-600 shadow-card">{error}</div>
        ) : filteredFolders.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-card">
            {search ? 'Ningún paciente coincide con la búsqueda.' : 'No hay sesiones registradas.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFolders.map((folder) => {
              const open = openPatientId === folder.patientId
              return (
                <div key={folder.patientId} className="overflow-hidden rounded-3xl bg-white shadow-card">
                  <button
                    type="button"
                    onClick={() => setOpenPatientId(open ? null : folder.patientId)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                        <FolderOpen size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-midnight-950">{folder.patientName}</p>
                        <p className="text-xs text-slate-400">
                          {folder.sessions.length} {folder.sessions.length === 1 ? 'sesión' : 'sesiones'} · última: {folder.lastDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {folder.adverseCount > 0 && <Badge tone="warning">{folder.adverseCount} evento(s) adverso(s)</Badge>}
                      <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {open && (
                    <div className="overflow-x-auto border-t border-slate-100">
                      <Table
                        headers={['Fecha', 'Protocolo', 'Equipo / Bobina', 'Región / Lateralidad', 'Parámetros', 'Ciclo', 'Eventos adversos', 'Notas']}
                        rows={folder.sessions.map((session) => (
                          <tr key={session.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 text-slate-500">
                              {session.date} {session.start_time?.slice(0, 5) ?? ''}
                            </td>
                            <td className="px-4 py-4 text-slate-500">{session.protocol?.name ?? '—'}</td>
                            <td className="px-4 py-4 text-slate-500">
                              {session.equipment?.name ?? '—'} {session.coil?.name ? `/ ${session.coil.name}` : ''}
                            </td>
                            <td className="px-4 py-4 text-slate-500">
                              {session.stimulated_region || '—'} {session.laterality ? `(${session.laterality})` : ''}
                            </td>
                            <td className="px-4 py-4 text-slate-500">
                              {session.frequency_hz != null ? `${session.frequency_hz} Hz` : '—'}
                              {session.intensity_pct != null ? ` · ${session.intensity_pct}%` : ''}
                              {session.duration_minutes != null ? ` · ${session.duration_minutes} min` : ''}
                            </td>
                            <td className="px-4 py-4 text-slate-500">{progressBySession.get(session.id) ?? '—'}</td>
                            <td className="px-4 py-4">
                              {session.adverse_events ? (
                                <Badge tone="warning">{session.adverse_events}</Badge>
                              ) : (
                                <Badge tone="neutral">No</Badge>
                              )}
                            </td>
                            <td className="px-4 py-4 max-w-xs text-slate-500">{session.notes || '—'}</td>
                          </tr>
                        ))}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
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
