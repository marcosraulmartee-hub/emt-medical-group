import { type FormEvent, useMemo, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = useMemo(() => new URLSearchParams(location.search).get('from') ?? '/dashboard', [location.search])
  const pendingConfirmation = useMemo(
    () => new URLSearchParams(location.search).get('pendingConfirmation') === 'true',
    [location.search],
  )
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      let message = 'Correo o contraseña incorrectos.'
      if (err instanceof Error) {
        const lower = err.message.toLowerCase()
        if (lower.includes('not confirmed') || lower.includes('account not confirmed') || lower.includes('confirm')) {
          message = 'Debes confirmar tu correo antes de iniciar sesión.'
        } else if (!lower.includes('invalid login credentials')) {
          message = err.message
        }
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Bienvenido a EMT Clinic" subtitle="Inicia sesión para continuar">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input label="Correo electrónico" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input label="Contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {pendingConfirmation && (
          <p className="text-sm text-[#DC4B3E]">Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.</p>
        )}
        {error && <p className="text-sm text-[#DC4B3E]">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          Iniciar sesión
        </Button>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <Link className="text-teal-600 hover:underline" to="/forgot-password">
            Olvidé mi contraseña
          </Link>
          <Link className="text-teal-600 hover:underline" to="/register">
            Crear cuenta
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
