import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  ChartBar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Layers,
  ListTree,
  MapPin,
  Receipt,
  Ruler,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_LABELS } from '../../types/auth'
import { initials } from '../../utils/format'
import { Logo } from '../Logo'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  perm: string
}

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Operación',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view' },
      { to: '/agenda', label: 'Agenda', icon: CalendarDays, perm: 'agenda.view' },
      { to: '/patients', label: 'Pacientes', icon: Users, perm: 'patients.view' },
      { to: '/protocols', label: 'Protocolos', icon: Layers, perm: 'protocols.view' },
      { to: '/protocol-categories', label: 'Categorías de protocolo', icon: ListTree, perm: 'protocol_categories.view' },
      { to: '/consents', label: 'Consentimientos', icon: FileText, perm: 'consents.view' },
      { to: '/sessions', label: 'Sesiones', icon: ClipboardList, perm: 'sessions.view' },
      { to: '/scales', label: 'Escalas clínicas', icon: Ruler, perm: 'scales.view' },
    ],
  },
  {
    title: 'Análisis',
    items: [
      { to: '/research', label: 'Investigación', icon: ChartBar, perm: 'research.view' },
      { to: '/billing', label: 'Facturación', icon: Receipt, perm: 'billing.view' },
      { to: '/reports', label: 'Reportes', icon: ShieldCheck, perm: 'reports.view' },
      { to: '/stats', label: 'Estadísticas', icon: BarChart3, perm: 'stats.view' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { to: '/settings', label: 'Configuración', icon: Settings, perm: 'settings.view' },
      { to: '/audit', label: 'Auditoría', icon: MapPin, perm: 'audit.view' },
    ],
  },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, user, can } = useAuth()
  const navigate = useNavigate()
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.perm)) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200 text-midnight-950">
      <div className="flex items-center gap-3 px-5 py-5">
        <Logo variant="full" />
      </div>

      <div className="px-3 pb-4">
        <button
          className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-teal-500 text-sm font-medium text-white transition hover:bg-teal-600"
          onClick={() => {
            navigate('/agenda')
            onNavigate?.()
          }}
        >
          Agenda rápida
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {visibleGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {group.title}
            </p>
            {group.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ' +
                  (isActive
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-midnight-950')
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {initials(profile?.full_name || user?.email || 'U')}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile?.full_name || user?.email}</p>
            <p className="truncate text-xs text-slate-400">{profile ? ROLE_LABELS[profile.role] : ''}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
