import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirm) {
      setMessage('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      await updatePassword(password)
      setMessage('Contraseña actualizada correctamente.')
    } catch {
      setMessage('No se pudo actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Restablecer contraseña" subtitle="Define una nueva contraseña segura">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input label="Nueva contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <Input label="Confirmar contraseña" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
        {message && <p className="text-sm text-teal-700">{message}</p>}
        <Button type="submit" fullWidth loading={loading}>
          Guardar contraseña
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
