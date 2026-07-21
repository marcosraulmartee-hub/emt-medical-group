interface Point {
  label: string
  value: number
}

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

export function BarTrendChart({ title, subtitle, data }: { title: string; subtitle?: string; data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const chartWidth = 700
  const chartHeight = 160
  const axisY = 132
  const barGap = 4
  const barWidth = Math.min(24, (chartWidth - barGap * (data.length - 1)) / data.length)
  const totalWidth = barWidth * data.length + barGap * (data.length - 1)
  const startX = (chartWidth - totalWidth) / 2
  const maxIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0)

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <p className="text-sm font-semibold text-midnight-950">{title}</p>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      {data.every((d) => d.value === 0) ? (
        <p className="mt-8 pb-8 text-center text-sm text-slate-400">Sin datos en este período.</p>
      ) : (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mt-3 w-full" role="img" aria-label={title}>
          <line x1={0} y1={axisY} x2={chartWidth} y2={axisY} stroke="#e1e0d9" strokeWidth={1} />
          {data.map((d, i) => {
            const x = startX + i * (barWidth + barGap)
            const barHeight = (d.value / max) * (axisY - 20)
            const y = axisY - barHeight
            return (
              <g key={`${d.label}-${i}`}>
                <path d={roundedTopBarPath(x, y, barWidth, barHeight, 4)} fill="#00578E">
                  <title>{`${d.label}: ${d.value}`}</title>
                </path>
                {i === maxIndex && d.value > 0 && (
                  <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize={10} fill="#52514e">
                    {d.value}
                  </text>
                )}
                {(data.length <= 10 || i % 2 === 0) && (
                  <text x={x + barWidth / 2} y={axisY + 14} textAnchor="middle" fontSize={9} fill="#898781">
                    {d.label}
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
