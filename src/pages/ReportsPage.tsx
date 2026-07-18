import { AppShell } from '../components/layout/AppShell'

export function ReportsPage() {
  return (
    <AppShell title="Reportes">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-midnight-950">Reportes</h2>
        <p className="mt-3 text-sm text-slate-500">Genera métricas y exportaciones para tu clínica EMT.</p>
      </div>
    </AppShell>
  )
}
