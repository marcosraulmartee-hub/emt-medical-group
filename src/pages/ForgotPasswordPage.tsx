import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

export function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)
    try {
      await sendPasswordReset(email)
      setMessage('Revisa tu correo para recuperar la contraseña.')
    } catch (err) {
      const defaultMessage = 'No se pudo enviar el enlace. Intenta nuevamente.'
      const message = err instanceof Error ? err.message : defaultMessage
      setMessage(message)
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Recuperar contraseña" subtitle="Te enviaremos un enlace al correo registrado">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input label="Correo electrónico" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        {message && (
          <p className={`text-sm ${isError ? 'text-[#DC4B3E]' : 'text-teal-700'}`}>{message}</p>
        )}
        <Button type="submit" fullWidth loading={loading}>
          Enviar enlace
        </Button>
        <p className="text-center text-sm text-slate-500">
          <Link className="text-teal-600 hover:underline" to="/login">
            Volver al inicio
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
