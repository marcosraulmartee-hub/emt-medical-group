import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { firstAllowedRoute } from '../types/permissions'

export function PermissionRoute({ perm }: { perm: string }) {
  const { permissions, loading, session } = useAuthContext()

  if (loading) return null

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (perm === 'dashboard.view') {
    return <Outlet />
  }

  if (!permissions.has(perm)) {
    return <Navigate to={firstAllowedRoute(permissions)} replace />
  }

  return <Outlet />
}

export function HomeRedirect() {
  const { permissions, loading, session } = useAuthContext()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={firstAllowedRoute(permissions)} replace />
}
