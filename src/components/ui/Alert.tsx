import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

type Variant = 'info' | 'success' | 'error'

const variants: Record<Variant, { wrap: string; icon: ReactNode }> = {
  info: { wrap: 'bg-teal-50 text-teal-700', icon: <Info size={18} /> },
  success: { wrap: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 size={18} /> },
  error: { wrap: 'bg-[#FBEAE8] text-[#DC4B3E]', icon: <AlertTriangle size={18} /> },
}

export function Alert({ variant = 'info', children }: { variant?: Variant; children: ReactNode }) {
  const { wrap, icon } = variants[variant]
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm ${wrap}`}>
      {icon}
      <div>{children}</div>
    </div>
  )
}
