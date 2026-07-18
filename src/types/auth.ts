export type AppRole = 'admin' | 'clinician' | 'technician' | 'reception'

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
  clinician: 'Clínico',
  technician: 'Técnico',
  reception: 'Recepción',
}
