import type { ReactNode } from 'react'

interface TableProps {
  headers: string[]
  rows: ReactNode[]
}

export function Table({ headers, rows }: TableProps) {
  return (
    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          {headers.map((header) => (
            <th key={header} className="px-4 py-3 font-medium uppercase tracking-[0.16em] text-slate-500">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200 bg-white">
        {rows}
      </tbody>
    </table>
  )
}
