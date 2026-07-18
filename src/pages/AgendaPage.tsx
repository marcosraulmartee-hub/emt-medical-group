import { AppShell } from '../components/layout/AppShell'

export function AgendaPage() {
  return (
    <AppShell title="Agenda">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-midnight-950">Calendario de sesiones</h2>
        <p className="mt-3 text-sm text-slate-500">
          Vista general de la agenda con día, semana y mes.
        </p>
      </div>
    </AppShell>
  )
}
