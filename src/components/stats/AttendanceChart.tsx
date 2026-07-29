import type { WeeklyAttendance } from '../../services/stats'

const COMPLETED_COLOR = '#059669'
const CANCELLED_COLOR = '#DC4B3E'

function roundedTopBarPath(x: number, y: number, width: number, height: number, radius: number): string {
  if (height <= 0) return ''
  const r = Math.min(radius, width / 2, height)
  return `M ${x} ${y + height}
    L ${x} ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    L ${x + width - r} ${y}
    Q ${x + width} ${y} ${x + width} ${y + r}
    L ${x + width} ${y + height}
    Z`
}

export function AttendanceChart({ data }: { data: WeeklyAttendance[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.completed, d.cancelled]))
  const chartWidth = 760
  const chartHeight = 200
  const axisY = 160
  const topPad = 16
  const groupGap = 10
  const barGap = 2
  const groupWidth = Math.min(28, (chartWidth - groupGap * (data.length - 1)) / data.length)
  const barWidth = (groupWidth - barGap) / 2
  const totalWidth = groupWidth * data.length + groupGap * (data.length - 1)
  const startX = (chartWidth - totalWidth) / 2
  const allZero = data.every((d) => d.completed === 0 && d.cancelled === 0)

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-midnight-950">Asistencias vs. cancelaciones</p>
          <p className="text-xs text-slate-400">Citas completadas y canceladas por semana.</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COMPLETED_COLOR }} />
            Completadas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CANCELLED_COLOR }} />
            Canceladas
          </span>
        </div>
      </div>

      {allZero ? (
        <p className="mt-8 pb-8 text-center text-sm text-slate-400">Sin citas registradas en este período.</p>
      ) : (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mt-3 w-full" role="img" aria-label="Asistencias vs cancelaciones por semana">
          <line x1={0} y1={axisY} x2={chartWidth} y2={axisY} stroke="#e1e0d9" strokeWidth={1} />
          {data.map((d, i) => {
            const x = startX + i * (groupWidth + groupGap)
            const completedHeight = (d.completed / max) * (axisY - topPad)
            const cancelledHeight = (d.cancelled / max) * (axisY - topPad)
            return (
              <g key={d.weekStart}>
                <path d={roundedTopBarPath(x, axisY - completedHeight, barWidth, completedHeight, 3)} fill={COMPLETED_COLOR}>
                  <title>{`Semana del ${d.weekLabel}: ${d.completed} completadas`}</title>
                </path>
                <path
                  d={roundedTopBarPath(x + barWidth + barGap, axisY - cancelledHeight, barWidth, cancelledHeight, 3)}
                  fill={CANCELLED_COLOR}
                >
                  <title>{`Semana del ${d.weekLabel}: ${d.cancelled} canceladas`}</title>
                </path>
                {(data.length <= 8 || i % 2 === 0) && (
                  <text x={x + groupWidth / 2} y={axisY + 14} textAnchor="middle" fontSize={9} fill="#898781">
                    {d.weekLabel}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
