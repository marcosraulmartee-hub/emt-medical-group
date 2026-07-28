interface Point {
  code: string
  x: number
  y: number
  side: 'left' | 'right' | 'mid'
}

const POINTS: Point[] = [
  { code: 'Nz', x: 50, y: 4, side: 'mid' },
  { code: 'Fp1', x: 37, y: 15, side: 'left' },
  { code: 'Fpz', x: 50, y: 13, side: 'mid' },
  { code: 'Fp2', x: 63, y: 15, side: 'right' },
  { code: 'F7', x: 19, y: 28, side: 'left' },
  { code: 'F3', x: 37, y: 28, side: 'left' },
  { code: 'Fz', x: 50, y: 28, side: 'mid' },
  { code: 'F4', x: 63, y: 28, side: 'right' },
  { code: 'F8', x: 81, y: 28, side: 'right' },
  { code: 'A1', x: 5, y: 50, side: 'left' },
  { code: 'T3', x: 18, y: 50, side: 'left' },
  { code: 'C3', x: 34, y: 50, side: 'left' },
  { code: 'Cz', x: 50, y: 50, side: 'mid' },
  { code: 'C4', x: 66, y: 50, side: 'right' },
  { code: 'T4', x: 82, y: 50, side: 'right' },
  { code: 'A2', x: 95, y: 50, side: 'right' },
  { code: 'T5', x: 19, y: 72, side: 'left' },
  { code: 'P3', x: 37, y: 72, side: 'left' },
  { code: 'Pz', x: 50, y: 72, side: 'mid' },
  { code: 'P4', x: 63, y: 72, side: 'right' },
  { code: 'T6', x: 81, y: 72, side: 'right' },
  { code: 'O1', x: 38, y: 85, side: 'left' },
  { code: 'Oz', x: 50, y: 87, side: 'mid' },
  { code: 'O2', x: 62, y: 85, side: 'right' },
  { code: 'Iz', x: 50, y: 96, side: 'mid' },
]

const SIDE_LATERALITY: Record<Point['side'], string> = { left: 'izquierda', right: 'derecha', mid: '' }

interface HeadMap1020Props {
  value: string
  onSelect: (code: string, laterality: string) => void
}

export function HeadMap1020({ value, onSelect }: HeadMap1020Props) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <svg viewBox="0 0 100 100" className="mx-auto w-full max-w-xs">
        <ellipse cx="50" cy="50" rx="41" ry="46" fill="#fff" stroke="#94a3b8" strokeWidth="1" />
        <rect x="0.5" y="43" width="5" height="14" rx="2.5" fill="#fff" stroke="#94a3b8" strokeWidth="1" />
        <rect x="94.5" y="43" width="5" height="14" rx="2.5" fill="#fff" stroke="#94a3b8" strokeWidth="1" />
        {POINTS.map((p) => {
          const selected = value === p.code
          return (
            <g
              key={p.code}
              onClick={() => onSelect(p.code, SIDE_LATERALITY[p.side])}
              className="cursor-pointer"
              role="button"
              aria-label={`Marcar punto ${p.code}`}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="4.6"
                fill={selected ? '#14b8a6' : '#fff'}
                stroke={selected ? '#0f766e' : '#64748b'}
                strokeWidth="0.8"
              />
              <text
                x={p.x}
                y={p.y + 1.1}
                textAnchor="middle"
                fontSize="2.9"
                fontWeight={selected ? 700 : 500}
                fill={selected ? '#fff' : '#334155'}
                className="pointer-events-none select-none"
              >
                {p.code}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="mt-2 text-center text-xs text-slate-500">
        Sistema 10-20 · hacé clic en el punto donde se aplicó la estimulación
      </p>
    </div>
  )
}
