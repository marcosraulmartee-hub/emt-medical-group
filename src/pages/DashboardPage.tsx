import { AppShell } from '../components/layout/AppShell'

export function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-midnight-950">Resumen clínico</h2>
          <p className="mt-3 text-sm text-slate-500">
            Indicadores de sesiones, protocolos activos y pacientes en curso.
          </p>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-midnight-950">Agenda del día</h2>
          <p className="mt-3 text-sm text-slate-500">Tus próximas sesiones y bloqueos de tiempo.</p>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-midnight-950">Biblioteca de protocolos</h2>
          <p className="mt-3 text-sm text-slate-500">Protocolos aprobados, en investigación y favoritos.</p>
        </section>
      </div>
    </AppShell>
  )
}
