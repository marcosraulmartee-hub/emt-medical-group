import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Table } from '../components/ui/Table'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { PatientCreateModal } from '../components/patients/PatientCreateModal'
import type { Patient } from '../services/patients'
import { listPatients } from '../services/patients'
import type { FollowUpPatient } from '../services/followUp'
import { listPatientsNeedingFollowUp } from '../services/followUp'
import { buildMailtoUrl, buildWhatsAppShareUrl, openShareWindow } from '../utils/share'
import { buildFollowUpReminderMessage } from '../utils/messages'

export function PatientsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [patients, setPatients] = useState<Patient[]>([])
  const [followUp, setFollowUp] = useState<FollowUpPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [showDischarged, setShowDischarged] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [followUpOnly, setFollowUpOnly] = useState(
    () => new URLSearchParams(location.search).get('followup') === 'true',
  )

  async function load() {
    setLoading(true)
    try {
      const [p, f] = await Promise.all([listPatients(), listPatientsNeedingFollowUp()])
      setPatients(p)
      setFollowUp(f)
    } catch {
      setError('No se pudieron cargar los pacientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const followUpIds = useMemo(() => new Set(followUp.map((f) => f.id)), [followUp])
  const followUpDays = useMemo(() => new Map(followUp.map((f) => [f.id, f.days_since])), [followUp])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return patients.filter((p) => {
      if (!showDischarged && p.status === 'discharged') return false
      if (followUpOnly && !followUpIds.has(p.id)) return false
      if (term && !(p.full_name.toLowerCase().includes(term) || (p.email ?? '').toLowerCase().includes(term))) return false
      return true
    })
  }, [search, patients, showDischarged, followUpOnly, followUpIds])

  function sendReminder(patient: Patient, channel: 'whatsapp' | 'email') {
    const message = buildFollowUpReminderMessage(patient.full_name)
    if (channel === 'whatsapp') {
      openShareWindow(buildWhatsAppShareUrl(patient.phone, message))
    } else {
      openShareWindow(buildMailtoUrl(patient.email, 'EMT Medical Group — seguimiento de tratamiento', message))
    }
  }

  async function handleExportExcel() {
    setExportingExcel(true)
    setPdfError('')
    try {
      const XLSX = await import('xlsx')
      const rows = filtered.map((p) => ({
        Nombre: p.full_name,
        Email: p.email || '',
        Teléfono: p.phone || '',
        Estado: p.status === 'discharged' ? 'Dado de alta' : 'Activo',
        'Fecha de nacimiento': p.birth_date || '',
        Género: p.gender || '',
        Cédula: p.national_id || '',
        Dirección: p.address || '',
        Ciudad: p.city || '',
        Ocupación: p.occupation || '',
        'Estado civil': p.marital_status || '',
        'Contacto de emergencia': p.emergency_contact_name || '',
        'Teléfono de emergencia': p.emergency_contact_phone || '',
        'Referido por': p.referred_by || '',
        'Seguro médico': p.insurance_provider || '',
      }))
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pacientes')
      XLSX.writeFile(workbook, `pacientes_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch {
      setPdfError('No se pudo generar el Excel. Recargá la página e intentá de nuevo.')
    } finally {
      setExportingExcel(false)
    }
  }

  async function handleDownloadIntakeForm() {
    setPdfError('')
    setDownloadingPdf(true)
    try {
      const { downloadPatientIntakePdf } = await import('../utils/patientIntakePdf')
      downloadPatientIntakePdf()
    } catch {
      setPdfError(
        'No se pudo generar el PDF. Si la app estaba abierta desde antes de la última actualización, recargá la página (Ctrl+Shift+R) e intentá de nuevo.',
      )
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <AppShell title="Pacientes">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Lista de pacientes</h2>
            <p className="text-sm text-slate-500">Registra, filtra y revisa historiales clínicos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleExportExcel} loading={exportingExcel} disabled={filtered.length === 0}>
              Exportar Excel
            </Button>
            <Button variant="secondary" onClick={handleDownloadIntakeForm} loading={downloadingPdf}>
              Descargar ficha en blanco (PDF)
            </Button>
            <Button onClick={() => setModalOpen(true)}>Nueva ficha</Button>
          </div>
        </div>

        {pdfError && <Alert variant="error">{pdfError}</Alert>}

        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-sm"
          />
          <button
            onClick={() => setFollowUpOnly((v) => !v)}
            className={
              'rounded-2xl px-4 py-2.5 text-sm font-medium transition ' +
              (followUpOnly ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 shadow-card hover:bg-slate-50')
            }
          >
            Seguimiento (30+ días) · {followUp.length}
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={showDischarged} onChange={(e) => setShowDischarged(e.target.checked)} />
            Incluir dados de alta
          </label>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          {loading ? (
            <div className="p-6 text-slate-500">Cargando pacientes...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-slate-500">No hay pacientes que coincidan con el filtro.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                headers={['Nombre', 'Email', 'Teléfono', 'Estado', 'Sin contacto hace', 'Acciones']}
                rows={filtered.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td className="cursor-pointer px-4 py-4 text-slate-700" onClick={() => navigate(`/patients/${patient.id}`)}>
                      {patient.full_name}
                    </td>
                    <td className="px-4 py-4 text-slate-500">{patient.email || '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{patient.phone || '—'}</td>
                    <td className="px-4 py-4">
                      <Badge tone={patient.status === 'discharged' ? 'neutral' : 'success'}>
                        {patient.status === 'discharged' ? 'Dado de alta' : 'Activo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {followUpDays.has(patient.id) ? `${followUpDays.get(patient.id)} días` : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button className="text-sm text-teal-600 hover:underline" onClick={() => navigate(`/patients/${patient.id}`)}>
                          Ver ficha
                        </button>
                        {followUpIds.has(patient.id) && (
                          <>
                            <button
                              className="text-xs text-slate-500 hover:underline"
                              onClick={() => sendReminder(patient, 'whatsapp')}
                            >
                              WhatsApp
                            </button>
                            <button className="text-xs text-slate-500 hover:underline" onClick={() => sendReminder(patient, 'email')}>
                              Correo
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}
        </div>
      </div>

      <PatientCreateModal
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
