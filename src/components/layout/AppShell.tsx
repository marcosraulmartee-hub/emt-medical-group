import { useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-[270px] lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-midnight-950/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[270px] bg-white shadow-modal">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-md text-midnight-500 hover:bg-canvas"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-[270px]">
        <Navbar title={title} onOpenSidebar={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-[1240px] px-4 py-6 lg:px-8">
          <div className="min-h-[60vh]">{children}</div>
        </main>
      </div>
    </div>
  )
}
