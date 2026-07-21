import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

export function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { needsConfirmation } = await signUp({ email, password, fullName })
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
        <p className="text-xs text-slate-400">
          Tu cuenta se crea con acceso mínimo (Recepcionista). Un administrador te asigna el rol definitivo desde Configuración.
        </p>
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
