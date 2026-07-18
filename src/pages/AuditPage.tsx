import { AppShell } from '../components/layout/AppShell'

export function AuditPage() {
  return (
    <AppShell title="Auditoría">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-midnight-950">Auditoría</h2>
        <p className="mt-3 text-sm text-slate-500">Registra acciones administrativas y de sesión.</p>
      </div>
    </AppShell>
  )
}
