const PALETTE = [
  { dot: '#0d9488', bg: 'bg-teal-50', text: 'text-teal-700' },
  { dot: '#db2777', bg: 'bg-pink-50', text: 'text-pink-700' },
  { dot: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-700' },
  { dot: '#1e293b', bg: 'bg-slate-100', text: 'text-slate-700' },
  { dot: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { dot: '#ea580c', bg: 'bg-orange-50', text: 'text-orange-700' },
  { dot: '#7c3aed', bg: 'bg-violet-50', text: 'text-violet-700' },
  { dot: '#0891b2', bg: 'bg-cyan-50', text: 'text-cyan-700' },
]

export function categoryColor(index: number) {
  return PALETTE[index % PALETTE.length]
}
