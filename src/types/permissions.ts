export const ALL_PERMISSIONS: string[] = [
  'dashboard.view',
  'agenda.view',
  'patients.view',
  'protocols.view',
  'protocol_categories.view',
  'consents.view',
  'sessions.view',
  'scales.view',
  'research.view',
  'billing.view',
  'reports.view',
  'settings.view',
  'audit.view',
  'reminders.view',
  'stats.view',
]

export const ROLE_MATRIX: Record<string, string[]> = {
  admin: ALL_PERMISSIONS,
  medico: [
    'dashboard.view',
    'agenda.view',
    'patients.view',
    'protocols.view',
    'protocol_categories.view',
    'consents.view',
    'sessions.view',
    'scales.view',
    'research.view',
    'stats.view',
  ],
  tecnico: [
    'dashboard.view',
    'agenda.view',
    'protocols.view',
    'protocol_categories.view',
    'sessions.view',
    'scales.view',
  ],
  recepcionista: [
    'dashboard.view',
    'agenda.view',
    'patients.view',
    'protocols.view',
    'protocol_categories.view',
    'consents.view',
    'scales.view',
    'billing.view',
    'reminders.view',
  ],
  contable: [
    'dashboard.view',
    'protocol_categories.view',
    'scales.view',
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
  { path: '/protocol-categories', perm: 'protocol_categories.view' },
  { path: '/consents', perm: 'consents.view' },
  { path: '/sessions', perm: 'sessions.view' },
  { path: '/scales', perm: 'scales.view' },
  { path: '/research', perm: 'research.view' },
  { path: '/billing', perm: 'billing.view' },
  { path: '/reports', perm: 'reports.view' },
  { path: '/stats', perm: 'stats.view' },
  { path: '/settings', perm: 'settings.view' },
  { path: '/audit', perm: 'audit.view' },
]

export function firstAllowedRoute(perms: Set<string>): string {
  for (const m of MODULE_ROUTES) {
    if (perms.has(m.perm)) return m.path
  }
  return '/dashboard'
}
