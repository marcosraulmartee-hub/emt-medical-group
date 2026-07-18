import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import type { AppRole } from '../types/auth'

const roles: { label: string; value: AppRole }[] = [
  { label: 'Recepción', value: 'reception' },
  { label: 'Clínico', value: 'clinician' },
  { label: 'Técnico', value: 'technician' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('reception')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { needsConfirmation } = await signUp({ email, password, fullName, role })
      if (needsConfirmation) {
        navigate('/login?pendingConfirmation=true', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la cuenta.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Crear cuenta" subtitle="Registra tu usuario para acceder al sistema">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input label="Nombre completo" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        <Input label="Correo electrónico" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input label="Contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <label className="block text-sm font-medium text-slate-600">Rol</label>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as AppRole)}
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-midnight-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
        >
          {roles.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-[#DC4B3E]">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          Registrarme
        </Button>
        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link className="text-teal-600 hover:underline" to="/login">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
