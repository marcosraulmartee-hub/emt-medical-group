import { useEffect, useState } from 'react'
import { Table } from '../../components/ui/Table'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_LABELS, STAFF_ROLES, type AppRole, type Profile } from '../../types/auth'
import { listUsers, setUserActive, updateUserRole } from '../../services/users'

const projectRef = (import.meta.env.VITE_SUPABASE_URL ?? '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const supabaseUsersUrl = projectRef ? `https://supabase.com/dashboard/project/${projectRef}/auth/users` : null

export function UsersSection() {
  const { user } = useAuth()
  const [items, setItems] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setItems(await listUsers())
    } catch {
      setError('No se pudieron cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleRoleChange(id: string, role: AppRole) {
    setSavingId(id)
    try {
      const updated = await updateUserRole(id, role)
      setItems((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } catch {
      setError('No se pudo actualizar el rol.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleToggleActive(id: string, is_active: boolean) {
    setSavingId(id)
    try {
      const updated = await setUserActive(id, is_active)
      setItems((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } catch {
      setError('No se pudo actualizar el estado.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Usuarios</h3>
          <p className="text-sm text-slate-500">Asigná el rol definitivo de cada cuenta nueva y desactivá accesos.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            Actualizar lista
          </Button>
          {supabaseUsersUrl && (
            <a href={supabaseUsersUrl} target="_blank" rel="noreferrer">
              <Button size="sm">Crear usuario</Button>
            </a>
          )}
        </div>
      </div>

      <Alert variant="info">
        Para crear una cuenta de personal: hacé clic en <strong>Crear usuario</strong> (abre Authentication → Users en
        Supabase), agregá el email y una contraseña temporal ahí. La cuenta va a entrar como <strong>Recepcionista</strong> por
        defecto — volvé acá y asignale el rol correcto.
      </Alert>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        {loading ? (
          <div className="p-6 text-slate-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-slate-500">No hay usuarios registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={['Nombre', 'Rol', 'Estado', '']}
              rows={items.map((item) => {
                const isSelf = item.id === user?.id
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">
                      {item.full_name || '—'}
                      {isSelf && <span className="ml-2 text-xs text-slate-400">(vos)</span>}
                    </td>
                    <td className="px-4 py-4">
                      <Select
                        value={item.role}
                        disabled={isSelf || savingId === item.id}
                        onChange={(e) => handleRoleChange(item.id, e.target.value as AppRole)}
                        className="h-9 w-44"
                      >
                        {STAFF_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={item.is_active === false ? 'neutral' : 'success'}>
                        {item.is_active === false ? 'Inactivo' : 'Activo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        className="text-sm text-teal-600 hover:underline disabled:opacity-40"
                        disabled={isSelf || savingId === item.id}
                        onClick={() => handleToggleActive(item.id, item.is_active === false)}
                      >
                        {item.is_active === false ? 'Activar' : 'Desactivar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            />
          </div>
        )}
      </div>
    </div>
  )
}
