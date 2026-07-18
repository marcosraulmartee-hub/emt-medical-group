import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'

export function ConsentPage() {
  return (
    <AppShell title="Consentimientos">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Consentimientos informados</h2>
            <p className="text-sm text-slate-500">Gestión y firmas de consentimientos clínicos.</p>
          </div>
          <Button>Nuevo consentimiento</Button>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-card text-sm text-slate-500">
          Aquí se mostrará el repositorio de documentos de consentimiento.
        </div>
      </div>
    </AppShell>
  )
}
