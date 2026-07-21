export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h < 12 ? 'a.m.' : 'p.m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export interface LaidOutEvent<T> {
  event: T
  startMin: number
  endMin: number
  col: number
  totalCols: number
}

/**
 * Greedy column assignment so overlapping events sit side by side instead of
 * stacking on top of each other — good enough for a single-room clinic where
 * overlaps are rare, not a full interval-graph coloring.
 */
export function layoutEvents<T>(events: T[], getStart: (e: T) => number, getEnd: (e: T) => number): LaidOutEvent<T>[] {
  const sorted = [...events].sort((a, b) => getStart(a) - getStart(b))
  const columnEnds: number[] = []
  const placed = sorted.map((event) => {
    const startMin = getStart(event)
    const endMin = getEnd(event)
    let col = columnEnds.findIndex((end) => end <= startMin)
    if (col === -1) {
      col = columnEnds.length
      columnEnds.push(endMin)
    } else {
      columnEnds[col] = endMin
    }
    return { event, startMin, endMin, col }
  })
  const totalCols = Math.max(1, columnEnds.length)
  return placed.map((p) => ({ ...p, totalCols }))
}
