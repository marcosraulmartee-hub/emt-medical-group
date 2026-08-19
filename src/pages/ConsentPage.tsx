import { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { PatientPicker } from '../components/patients/PatientPicker'
import type { Patient } from '../services/patients'
import { listPatients } from '../services/patients'
import { buildMailtoUrl, buildWhatsAppShareUrl, openShareWindow } from '../utils/share'

interface DocumentDef {
  key: string
  title: string
  description: string
  download: () => Promise<void>
  shareTitle: string
  shareMessage: (patientName: string) => string
}

const DOCUMENTS: DocumentDef[] = [
  {
    key: 'consent',
    title: 'Consentimiento informado',
    description:
      'Consentimiento informado para EMT en blanco, listo para imprimir y firmar con el paciente. El repositorio de consentimientos firmados por paciente (historial, estado, adjuntos) todavía está pendiente de construir.',
    download: async () => {
      const { downloadConsentPdf } = await import('../utils/consentPdf')
      downloadConsentPdf()
    },
    shareTitle: 'EMT Medical Group — Consentimiento informado',
    shareMessage: (name) =>
      `Hola ${name}, te compartimos de EMT Medical Group el Consentimiento Informado para tu tratamiento de EMT. Descárgalo aquí y tráelo firmado (o lo firmamos en la clínica) el día de tu evaluación.`,
  },
  {
    key: 'screening',
    title: 'Cuestionario de cribado de seguridad',
    description:
      'Cuestionario de 20 preguntas de seguridad para EMT (antecedentes, dispositivos implantados, metal en el cuerpo, medicación, embarazo, etc.), en blanco para completar y firmar antes de la primera sesión.',
    download: async () => {
      const { downloadSafetyScreeningPdf } = await import('../utils/safetyScreeningPdf')
      downloadSafetyScreeningPdf()
    },
    shareTitle: 'EMT Medical Group — Cuestionario de cribado de seguridad',
    shareMessage: (name) =>
      `Hola ${name}, te compartimos de EMT Medical Group el Cuestionario de cribado de seguridad para EMT. Descárgalo aquí y tráelo completado (o lo llenamos en la clínica) el día de tu evaluación.`,
  },
]

export function ConsentPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState('')
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [shared, setShared] = useState(false)

  useEffect(() => {
    listPatients().then(setPatients).catch(() => setPatients([]))
  }, [])

  const patient = patients.find((p) => p.id === patientId) ?? null

  async function handleDownload(docDef: DocumentDef) {
    setDownloadingKey(docDef.key)
    setError('')
    try {
      await docDef.download()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`No se pudo generar el formulario: ${message}`)
    } finally {
      setDownloadingKey(null)
    }
  }

  async function handleShare(docDef: DocumentDef, channel: 'whatsapp' | 'email') {
    setError('')
    setShared(false)
    try {
      await docDef.download()
      const name = patient?.full_name ?? 'estimado/a paciente'
      const message = docDef.shareMessage(name)
      if (channel === 'whatsapp') {
        openShareWindow(buildWhatsAppShareUrl(patient?.phone, message))
      } else {
        openShareWindow(buildMailtoUrl(patient?.email, docDef.shareTitle, message))
      }
      setShared(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`No se pudo generar el formulario: ${message}`)
    }
  }

  return (
    <AppShell title="Consentimientos">
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-midnight-950">Consentimientos informados</h2>
          <p className="text-sm text-slate-500">Gestión y firmas de consentimientos y cribado de seguridad clínico.</p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {shared && (
          <Alert variant="success">
            El PDF se descargó a tu equipo y se abrió la ventana para enviarlo — adjúntalo manualmente en la conversación/correo.
          </Alert>
        )}

        <PatientPicker
          label="Paciente (opcional, para prellenar el mensaje)"
          patients={patients}
          value={patientId}
          onChange={setPatientId}
          emptyLabel="Sin paciente específico"
          className="sm:max-w-xs"
        />

        {DOCUMENTS.map((docDef) => (
          <div key={docDef.key} className="rounded-3xl bg-white p-6 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-midnight-950">{docDef.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{docDef.description}</p>
              </div>
              <Button onClick={() => handleDownload(docDef)} loading={downloadingKey === docDef.key} className="shrink-0">
                Descargar (PDF)
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <Button variant="secondary" onClick={() => handleShare(docDef, 'whatsapp')}>
                Compartir por WhatsApp
              </Button>
              <Button variant="secondary" onClick={() => handleShare(docDef, 'email')}>
                Enviar por correo
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
