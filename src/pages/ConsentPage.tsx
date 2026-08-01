import { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Alert } from '../components/ui/Alert'
import type { Patient } from '../services/patients'
import { listPatients } from '../services/patients'
import { buildMailtoUrl, buildWhatsAppShareUrl, openShareWindow } from '../utils/share'

export function ConsentPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [shared, setShared] = useState(false)

  useEffect(() => {
    listPatients().then(setPatients).catch(() => setPatients([]))
  }, [])

  const patient = patients.find((p) => p.id === patientId) ?? null

  async function handleDownload() {
    setDownloading(true)
    setError('')
    try {
      const { downloadConsentPdf } = await import('../utils/consentPdf')
      downloadConsentPdf()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`No se pudo generar el formulario: ${message}`)
    } finally {
      setDownloading(false)
    }
  }

  function shareMessage() {
    const name = patient?.full_name ?? 'estimado/a paciente'
    return `Hola ${name}, te compartimos de EMT Medical Group el Consentimiento Informado para tu tratamiento de EMT. Descárgalo aquí y tráelo firmado (o lo firmamos en la clínica) el día de tu evaluación.`
  }

  async function handleShare(channel: 'whatsapp' | 'email') {
    setError('')
    setShared(false)
    try {
      const { downloadConsentPdf } = await import('../utils/consentPdf')
      downloadConsentPdf()
      const message = shareMessage()
      if (channel === 'whatsapp') {
        openShareWindow(buildWhatsAppShareUrl(patient?.phone, message))
      } else {
        openShareWindow(buildMailtoUrl(patient?.email, 'EMT Medical Group — Consentimiento informado', message))
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Consentimientos informados</h2>
            <p className="text-sm text-slate-500">Gestión y firmas de consentimientos clínicos.</p>
          </div>
          <Button onClick={handleDownload} loading={downloading}>
            Descargar formulario (PDF)
          </Button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {shared && (
          <Alert variant="success">
            El PDF se descargó a tu equipo y se abrió la ventana para enviarlo — adjúntalo manualmente en la conversación/correo.
          </Alert>
        )}

        <div className="rounded-3xl bg-white p-6 shadow-card">
          <p className="text-sm text-slate-500">
            El formulario de Consentimiento Informado para EMT en blanco, listo para imprimir y firmar con el paciente.
            El repositorio de consentimientos firmados por paciente (historial, estado, adjuntos) todavía está pendiente
            de construir.
          </p>

          <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5">
            <Select label="Paciente (opcional, para prellenar el mensaje)" value={patientId} onChange={(e) => setPatientId(e.target.value)} className="sm:max-w-xs">
              <option value="">Sin paciente específico</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={() => handleShare('whatsapp')}>
              Compartir por WhatsApp
            </Button>
            <Button variant="secondary" onClick={() => handleShare('email')}>
              Enviar por correo
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
