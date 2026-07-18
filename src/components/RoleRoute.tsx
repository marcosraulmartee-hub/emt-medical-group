import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from './ui/Spinner'
import type { AppRole } from '../types/auth'

export function RoleRoute({ allow }: { allow: AppRole[] }) {
  const { profile, loading } = useAuth()

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Spinner className="h-6 w-6 text-teal-500" />
      </div>
    )
  }

  if (!allow.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
