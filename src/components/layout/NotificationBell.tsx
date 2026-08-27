import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import type { IntakeSubmission } from '../../services/patientIntake'
import { listUnreviewedIntakeSubmissions, markIntakeSubmissionReviewed } from '../../services/patientIntake'
import { useAuth } from '../../hooks/useAuth'
import { getNotificationRetention, isWithinRetention, type NotificationRetention } from '../../services/notificationSettings'

export function NotificationBell() {
  const { profile, permissions } = useAuth()
  const canManage = profile?.role === 'admin' || profile?.role === 'recepcionista'
  const canViewPatients = permissions.has('patients.view')
  const [items, setItems] = useState<IntakeSubmission[]>([])
  const [retention, setRetention] = useState<NotificationRetention>('never')
  const [open, setOpen] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  async function load() {
    try {
      setItems(await listUnreviewedIntakeSubmissions())
    } catch {
      // silencioso: un error acá no debe bloquear el resto de la app
    }
  }

  useEffect(() => {
    void load()
    getNotificationRetention()
      .then(setRetention)
      .catch(() => {
        // silencioso: si falla, se usa el valor por defecto ("never")
      })
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [])

  const visibleItems = items.filter((s) => isWithinRetention(s.created_at, retention))

  async function handleMarkReviewed(submissionId: string) {
    setReviewingId(submissionId)
    try {
      await markIntakeSubmissionReviewed(submissionId)
      setItems((prev) => prev.filter((s) => s.id !== submissionId))
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 hover:bg-slate-100"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {visibleItems.length > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#DC4B3E] px-1 text-[10px] font-semibold text-white">
            {visibleItems.length > 9 ? '9+' : visibleItems.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-modal">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Registros nuevos (Google Forms)
            </p>
            {visibleItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">Sin notificaciones nuevas.</p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {visibleItems.map((s) => (
                  <li key={s.id} className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="truncate text-sm font-medium text-midnight-950">
                      {s.patient?.full_name ?? 'Paciente sin vincular'}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(s.created_at).toLocaleString('es-ES')}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      {s.patient_id && canViewPatients && (
                        <Link
                          to={`/patients/${s.patient_id}`}
                          onClick={() => setOpen(false)}
                          className="text-xs text-teal-600 hover:underline"
                        >
                          Ver ficha
                        </Link>
                      )}
                      {canManage && (
                        <button
                          onClick={() => handleMarkReviewed(s.id)}
                          disabled={reviewingId === s.id}
                          className="text-xs text-slate-500 hover:underline disabled:opacity-40"
                        >
                          Marcar revisado
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
