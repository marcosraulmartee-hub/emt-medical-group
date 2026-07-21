import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { Patient } from '../../services/patients'
import { dischargePatient, reactivatePatient } from '../../services/patients'
import type { TreatmentCycle } from '../../services/treatmentCycles'
import { countSessionsInCycle, listPatientCycles } from '../../services/treatmentCycles'

export function DischargeControl({ patient, onUpdated }: { patient: Patient; onUpdated: (p: Patient) => void }) {
  const [activeCycle, setActiveCycle] = useState<TreatmentCycle | null>(null)
  const [sessionCount, setSessionCount] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (patient.status === 'discharged') return
    listPatientCycles(patient.id).then(async (cycles) => {
      const active = cycles.find((c) => c.status === 'active') ?? null
      setActiveCycle(active)
      if (active) setSessionCount(await countSessionsInCycle(active.id))
    })
  }, [patient.id, patient.status])

  const cycleCompleted = !!activeCycle && sessionCount >= activeCycle.planned_sessions

  async function handleDischarge() {
    setSaving(true)
    setError('')
    try {
      const updated = await dischargePatient(patient.id, notes)
      onUpdated(updated)
      setModalOpen(false)
      setNotes('')
    } catch {
      setError('No se pudo dar de alta al paciente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleReactivate() {
    setSaving(true)
    setError('')
    try {
      const updated = await reactivatePatient(patient.id)
      onUpdated(updated)
    } catch {
      setError('No se pudo reactivar al paciente.')
    } finally {
      setSaving(false)
    }
  }

  if (patient.status === 'discharged') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
        <div>
          <Badge tone="neutral">Dado de alta</Badge>
          <p className="mt-1 text-sm text-slate-500">
            Alta el {patient.discharged_at}
            {patient.discharge_notes ? ` — ${patient.discharge_notes}` : ''}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={handleReactivate} loading={saving}>
          Reactivar paciente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}
      {cycleCompleted && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 size={20} className="shrink-0" />
          <p className="text-sm">
            Este paciente completó su ciclo activo ({sessionCount} de {activeCycle?.planned_sessions} sesiones). ¿Darlo de alta?
          </p>
        </div>
      )}
      <Button size="sm" variant={cycleCompleted ? 'primary' : 'secondary'} onClick={() => setModalOpen(true)}>
        Dar de alta
      </Button>

      <Modal
        open={modalOpen}
        title="Dar de alta al paciente"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleDischarge} loading={saving}>
              Confirmar alta
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            El paciente queda marcado como dado de alta (fecha de hoy). Puede reactivarse en cualquier momento si retoma
            tratamiento.
          </p>
          <Textarea label="Notas de alta (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
