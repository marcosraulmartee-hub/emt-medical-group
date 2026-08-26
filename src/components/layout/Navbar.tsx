import { useState, type FormEvent } from 'react'
import { Menu, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { formatLongDate, initials } from '../../utils/format'
import { NotificationBell } from './NotificationBell'

interface NavbarProps {
  title: string
  onOpenSidebar: () => void
}

export function Navbar({ title, onOpenSidebar }: NavbarProps) {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/patients?q=${encodeURIComponent(query.trim())}`)
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

      <form onSubmit={handleSearchSubmit} className="ml-auto hidden items-center gap-3 md:flex">
        <div className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 focus-within:border-teal-400">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar paciente..."
            className="w-48 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </form>

      <NotificationBell />

      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
        {initials(profile?.full_name || user?.email || 'U')}
      </div>

      <button
        onClick={handleSignOut}
        className="flex h-10 items-center rounded-2xl bg-slate-100 px-3 text-sm text-slate-600 hover:bg-slate-200"
      >
        Cerrar sesión
      </button>
    </header>
  )
}
