import type { ReactNode } from 'react'
import { Logo } from './Logo'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-midnight-900 px-10 py-12 text-white lg:flex">
        <div>
          <div className="mb-10">
            <Logo variant="full" negative />
          </div>
          <p className="max-w-md text-2xl font-display font-medium tracking-tight">Neuromodulación avanzada</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-midnight-100">
            Plataforma para gestión clínica, protocolos y sesiones de Estimulación Magnética Transcraneal.
          </p>
        </div>
        <div className="text-sm text-midnight-300">© {new Date().getFullYear()} EMT Medical Group</div>
        <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-brand-yellow/10 blur-3xl" />
      </aside>

      <main className="flex items-center justify-center bg-canvas px-5 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <Logo variant="full" />
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-midnight-900">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8 rounded-3xl bg-white p-8 shadow-card">{children}</div>
          {footer && <div className="mt-5 text-center text-sm text-slate-400">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
