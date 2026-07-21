export const ALL_PERMISSIONS: string[] = [
  'dashboard.view',
  'agenda.view',
  'patients.view',
  'protocols.view',
  'consents.view',
  'sessions.view',
  'research.view',
  'billing.view',
  'reports.view',
  'settings.view',
  'audit.view',
]

export const ROLE_MATRIX: Record<string, string[]> = {
  admin: ALL_PERMISSIONS,
  medico: [
    'dashboard.view',
    'agenda.view',
    'patients.view',
    'protocols.view',
    'consents.view',
    'sessions.view',
    'research.view',
  ],
  tecnico: [
    'dashboard.view',
    'agenda.view',
    'protocols.view',
    'sessions.view',
  ],
  recepcionista: [
    'dashboard.view',
    'agenda.view',
    'patients.view',
    'consents.view',
    'billing.view',
  ],
  contable: [
    'dashboard.view',
    'billing.view',
    'reports.view',
  ],
  paciente: [],
}

export const MODULE_ROUTES: { path: string; perm: string }[] = [
  { path: '/dashboard', perm: 'dashboard.view' },
  { path: '/agenda', perm: 'agenda.view' },
  { path: '/patients', perm: 'patients.view' },
  { path: '/protocols', perm: 'protocols.view' },
  { path: '/consents', perm: 'consents.view' },
  { path: '/sessions', perm: 'sessions.view' },
  { path: '/research', perm: 'research.view' },
  { path: '/billing', perm: 'billing.view' },
  { path: '/reports', perm: 'reports.view' },
  { path: '/settings', perm: 'settings.view' },
  { path: '/audit', perm: 'audit.view' },
]

export function firstAllowedRoute(perms: Set<string>): string {
  for (const m of MODULE_ROUTES) {
    if (perms.has(m.perm)) return m.path
  }
  return '/dashboard'
}
