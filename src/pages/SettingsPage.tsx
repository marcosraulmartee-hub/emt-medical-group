import { AppShell } from '../components/layout/AppShell'

export function SettingsPage() {
  return (
    <AppShell title="Configuración">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-midnight-950">Configuración</h2>
        <p className="mt-3 text-sm text-slate-500">Ajustes de clínica, usuarios y equipos EMT.</p>
      </div>
    </AppShell>
  )
}
