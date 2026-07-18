import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'

export function PatientDetailPage() {
  return (
    <AppShell title="Ficha del paciente">
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-midnight-950">Detalles del paciente</h2>
          <p className="mt-3 text-sm text-slate-500">Información personal, diagnósticos y antecedentes.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-midnight-950">Diagnósticos</h3>
            <p className="mt-3 text-sm text-slate-500">Lista de diagnósticos registrados.</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-midnight-950">Sesiones</h3>
            <p className="mt-3 text-sm text-slate-500">Historial de sesiones de neuromodulación.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button>Editar paciente</Button>
        </div>
      </div>
    </AppShell>
  )
}
