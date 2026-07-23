import { useEffect, useMemo, useState } from 'react'
import { Alert } from '../../components/ui/Alert'
import type { PermissionDef, RoleDef } from '../../services/rolePermissions'
import {
  grantRolePermission,
  listPermissionDefs,
  listRoleDefs,
  listRolePermissionPairs,
  revokeRolePermission,
} from '../../services/rolePermissions'

export function PermissionsSection() {
  const [permissions, setPermissions] = useState<PermissionDef[]>([])
  const [roles, setRoles] = useState<RoleDef[]>([])
  const [granted, setGranted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [perms, roleDefs, pairs] = await Promise.all([listPermissionDefs(), listRoleDefs(), listRolePermissionPairs()])
      setPermissions(perms)
      setRoles(roleDefs.filter((r) => r.code !== 'admin'))
      setGranted(new Set(pairs.map((p) => `${p.role_code}:${p.permission_key}`)))
    } catch {
      setError('No se pudieron cargar los permisos. Si acabás de correr la migración, recargá la página.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleToggle(roleCode: string, permissionKey: string) {
    const cellKey = `${roleCode}:${permissionKey}`
    const isGranted = granted.has(cellKey)
    setPendingKey(cellKey)
    setError('')

    const next = new Set(granted)
    if (isGranted) next.delete(cellKey)
    else next.add(cellKey)
    setGranted(next)

    try {
      if (isGranted) await revokeRolePermission(roleCode, permissionKey)
      else await grantRolePermission(roleCode, permissionKey)
    } catch {
      setError('No se pudo actualizar el permiso — intenta de nuevo.')
      await load()
    } finally {
      setPendingKey(null)
    }
  }

  const roleColumns = useMemo(() => roles, [roles])

  if (loading) return <p className="text-sm text-slate-500">Cargando...</p>

  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
      <div>
        <h3 className="text-base font-semibold text-midnight-950">Permisos por rol</h3>
        <p className="text-sm text-slate-500">
          Qué secciones ve cada rol. El administrador siempre tiene acceso completo — no aparece en la tabla porque no se
          puede restringir. Los cambios aplican al recargar la sesión de cada usuario.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {permissions.length === 0 ? (
        <Alert variant="info">
          Todavía no hay catálogo de permisos cargado — corré la Migración 018 (`supabase/schema.sql`) en el SQL Editor de
          Supabase y volvé a entrar a esta pantalla.
        </Alert>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium uppercase tracking-[0.12em] text-slate-500">Sección</th>
                {roleColumns.map((r) => (
                  <th key={r.code} className="px-4 py-3 text-center font-medium uppercase tracking-[0.12em] text-slate-500">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {permissions.map((perm) => (
                <tr key={perm.key}>
                  <td className="px-4 py-3 text-slate-700">{perm.label}</td>
                  {roleColumns.map((r) => {
                    const cellKey = `${r.code}:${perm.key}`
                    return (
                      <td key={r.code} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={granted.has(cellKey)}
                          disabled={pendingKey === cellKey}
                          onChange={() => handleToggle(r.code, perm.key)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-500 focus:ring-teal-400 disabled:opacity-40"
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
