import type { ProtocolUsage } from '../../services/stats'

export function TopProtocolsChart({ data }: { data: ProtocolUsage[] }) {
  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <p className="text-sm font-semibold text-midnight-950">Protocolos más usados</p>
      <p className="text-xs text-slate-400">Por número de sesiones aplicadas, últimos 180 días.</p>

      {data.length === 0 ? (
        <p className="mt-8 pb-8 text-center text-sm text-slate-400">Sin sesiones registradas en este período.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.map((d) => (
            <li key={d.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="truncate pr-2 text-slate-600">{d.name}</span>
                <span className="shrink-0 font-medium text-midnight-950">{d.count}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(4, (d.count / max) * 100)}%`, backgroundColor: '#00578E' }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
