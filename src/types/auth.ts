export type AppRole = 'admin' | 'medico' | 'tecnico' | 'recepcionista' | 'contable' | 'paciente'

export interface Profile {
  id: string
  full_name: string
  role: AppRole
  is_active?: boolean
  created_at: string
  updated_at: string
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  medico: 'Médico',
  tecnico: 'Técnico',
  recepcionista: 'Recepcionista',
  contable: 'Contable',
  paciente: 'Paciente',
}

export const STAFF_ROLES: AppRole[] = ['admin', 'medico', 'tecnico', 'recepcionista', 'contable']
