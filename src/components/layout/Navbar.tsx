import { Menu, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { formatLongDate, initials } from '../../utils/format'

interface NavbarProps {
  title: string
  onOpenSidebar: () => void
}

export function Navbar({ title, onOpenSidebar }: NavbarProps) {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-[64px] items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        onClick={onOpenSidebar}
        className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-midnight-950">{title}</h1>
        <p className="text-xs text-slate-500 hidden sm:block">{formatLongDate()}</p>
      </div>

      <div className="ml-auto hidden items-center gap-3 md:flex">
        <button className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 hover:bg-slate-100">
          <Search size={16} />
          Buscar protocolo, paciente, sesión...
        </button>
      </div>

      <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
        {initials(profile?.full_name || user?.email || 'U')}
      </button>

      <button
        onClick={handleSignOut}
        className="flex h-10 items-center rounded-2xl bg-slate-100 px-3 text-sm text-slate-600 hover:bg-slate-200"
      >
        Cerrar sesión
      </button>
    </header>
  )
}
