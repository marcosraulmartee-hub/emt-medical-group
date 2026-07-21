import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'

export function ConsentPage() {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

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

        <div className="rounded-3xl bg-white p-6 shadow-card text-sm text-slate-500">
          El formulario de Consentimiento Informado para EMT en blanco, listo para imprimir y firmar con el paciente.
          El repositorio de consentimientos firmados por paciente (historial, estado, adjuntos) todavía está pendiente
          de construir.
        </div>
      </div>
    </AppShell>
  )
}
