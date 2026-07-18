import { AppShell } from '../components/layout/AppShell'

export function ResearchPage() {
  return (
    <AppShell title="Investigación">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-midnight-950">Investigación clínica</h2>
        <p className="mt-3 text-sm text-slate-500">Comparaciones, análisis y dashboards científicos.</p>
      </div>
    </AppShell>
  )
}
