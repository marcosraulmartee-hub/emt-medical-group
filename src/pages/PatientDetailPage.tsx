import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Alert } from '../components/ui/Alert'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import type { Patient } from '../services/patients'
import { deletePatient, getPatient } from '../services/patients'
import { useAuth } from '../hooks/useAuth'
import { GeneralInfoSection } from './patient-detail/GeneralInfoSection'
import { DiagnosesSection } from './patient-detail/DiagnosesSection'
import { MedicationsSection } from './patient-detail/MedicationsSection'
import { ContraindicationsSection } from './patient-detail/ContraindicationsSection'
import { DocumentsSection } from './patient-detail/DocumentsSection'
import { SessionsHistorySection } from './patient-detail/SessionsHistorySection'
import { ScalesSection } from './patient-detail/ScalesSection'
import { AdverseEventsSection } from './patient-detail/AdverseEventsSection'
import { PackagesSection } from './patient-detail/PackagesSection'
import { ResearchSection } from './patient-detail/ResearchSection'
import { DischargeControl } from './patient-detail/DischargeControl'

const TABS = [
  { key: 'general', label: 'Datos generales' },
  { key: 'diagnoses', label: 'Diagnósticos' },
  { key: 'medications', label: 'Medicación' },
  { key: 'contraindications', label: 'Contraindicaciones' },
  { key: 'documents', label: 'Documentos' },
  { key: 'sessions', label: 'Sesiones' },
  { key: 'scales', label: 'Escalas clínicas' },
  { key: 'adverse', label: 'Eventos adversos' },
  { key: 'packages', label: 'Paquetes' },
  { key: 'research', label: 'Investigación clínica' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabKey>('general')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getPatient(id)
      .then(setPatient)
      .catch(() => setError('No se pudo cargar el paciente.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!patient) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deletePatient(patient.id)
      navigate('/patients')
    } catch {
      setDeleteError('No se pudo eliminar el paciente.')
      setDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  return (
    <AppShell title="Ficha del paciente">
      <div className="space-y-6">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-midnight-950"
        >
          <ArrowLeft size={16} /> Volver a pacientes
        </button>

        {loading ? (
          <div className="flex justify-center p-10">
            <Spinner className="h-6 w-6 text-teal-500" />
          </div>
        ) : error || !patient ? (
          <Alert variant="error">{error || 'Paciente no encontrado.'}</Alert>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-midnight-950">{patient.full_name}</h2>
                <p className="text-sm text-slate-500">Ficha clínica y administrativa</p>
              </div>
              {profile?.role === 'admin' && (
                <Button size="sm" variant="danger" onClick={() => setDeleteConfirmOpen(true)}>
                  Eliminar paciente
                </Button>
              )}
            </div>

            {deleteError && <Alert variant="error">{deleteError}</Alert>}

            <DischargeControl patient={patient} onUpdated={setPatient} />

            <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-1.5 shadow-card">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={
                    'rounded-xl px-4 py-2 text-sm font-medium transition ' +
                    (tab === t.key ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'general' && <GeneralInfoSection patient={patient} onUpdated={setPatient} />}
            {tab === 'diagnoses' && <DiagnosesSection patientId={patient.id} />}
            {tab === 'medications' && <MedicationsSection patientId={patient.id} />}
            {tab === 'contraindications' && <ContraindicationsSection patientId={patient.id} />}
            {tab === 'documents' && <DocumentsSection patientId={patient.id} />}
            {tab === 'sessions' && <SessionsHistorySection patientId={patient.id} />}
            {tab === 'scales' && <ScalesSection patientId={patient.id} patientName={patient.full_name} />}
            {tab === 'adverse' && <AdverseEventsSection patientId={patient.id} />}
            {tab === 'packages' && <PackagesSection patientId={patient.id} />}
            {tab === 'research' && <ResearchSection patientId={patient.id} />}
          </>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Eliminar paciente"
        message="Se elimina por completo la ficha de este paciente, incluyendo su historial clínico y administrativo asociado. No se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </AppShell>
  )
}
