import { type FormEvent, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

export function ChangePasswordPage() {
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
      setMessage('Contraseña actualizada.')
      setPassword('')
      setConfirm('')
    } catch {
      setMessage('Error al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell title="Cambiar contraseña">
      <div className="rounded-3xl bg-white p-8 shadow-card">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input label="Nueva contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Input label="Confirmar contraseña" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
          {message && <p className="text-sm text-teal-700">{message}</p>}
          <Button type="submit" loading={loading}>
            Cambiar contraseña
          </Button>
        </form>
      </div>
    </AppShell>
  )
}
