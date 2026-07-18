import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-midnight-950 px-10 py-12 text-white lg:flex">
        <div>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-teal-400 text-lg font-semibold">E</div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-200">EMT Clinic</p>
              <p className="text-2xl font-semibold tracking-tight">Neuromodulación avanzada</p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-teal-100">
            Plataforma para gestión clínica, protocolos y sesiones de Estimulación Magnética Transcraneal.
          </p>
        </div>
        <div className="text-sm text-slate-400">© {new Date().getFullYear()} EMT Clinic</div>
        <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
      </aside>

      <main className="flex items-center justify-center bg-canvas px-5 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-teal-500 text-lg font-semibold text-white">E</div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-600">EMT Clinic</p>
              <p className="text-xl font-semibold text-midnight-950">Neuromodulación clínica</p>
            </div>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-midnight-950">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8 rounded-3xl bg-white p-8 shadow-card">{children}</div>
          {footer && <div className="mt-5 text-center text-sm text-slate-400">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
