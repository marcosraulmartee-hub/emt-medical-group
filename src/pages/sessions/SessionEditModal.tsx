import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import { ChecklistForm } from './ChecklistForm'
import { SessionParametersFields, computeTrains } from '../../components/sessions/SessionParametersFields'
import { ProtocolPicker } from '../../components/protocols/ProtocolPicker'
import type { Protocol } from '../../services/protocols'
import { listProtocols } from '../../services/protocols'
import type { ProtocolCategory } from '../../services/protocolCategories'
import { listProtocolCategories } from '../../services/protocolCategories'
import type { Equipment } from '../../services/equipment'
import { listEquipment } from '../../services/equipment'
import type { Coil } from '../../services/coils'
import { listCoils } from '../../services/coils'
import type { ChecklistAnswer, SafetyChecklistItem } from '../../services/safetyChecklist'
import { listAllChecklistItems } from '../../services/safetyChecklist'
import type { SessionRecord } from '../../services/sessions'
import { updateSession } from '../../services/sessions'

function buildForm(session: SessionRecord) {
  return {
    date: session.date,
    start_time: session.start_time?.slice(0, 5) ?? '',
    equipment_id: session.equipment_id,
    coil_id: session.coil_id,
    protocol_id: session.protocol_id,
    stimulated_region: session.stimulated_region ?? '',
    laterality: session.laterality ?? '',
    frequency_hz: session.frequency_hz != null ? String(session.frequency_hz) : '',
    intensity_pct: session.intensity_pct != null ? String(session.intensity_pct) : '',
    rmt_pct: session.rmt_pct != null ? String(session.rmt_pct) : '',
    pulses: session.pulses != null ? String(session.pulses) : '',
    totalPulses: session.pulses != null && session.trains != null ? String(session.pulses * session.trains) : '',
    duration_minutes: session.duration_minutes != null ? String(session.duration_minutes) : '',
    clinical_response: session.clinical_response ?? '',
    adverse_events: session.adverse_events ?? '',
    notes: session.notes ?? '',
  }
}

export function SessionEditModal({
  session,
  onClose,
  onSaved,
}: {
  session: SessionRecord
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(() => buildForm(session))
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [protocolCategories, setProtocolCategories] = useState<ProtocolCategory[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [coils, setCoils] = useState<Coil[]>([])
  const [checklistItems, setChecklistItems] = useState<SafetyChecklistItem[]>([])
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>(() =>
    Object.fromEntries(session.safety_checklist.map((a) => [a.code, a])),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(buildForm(session))
    setAnswers(Object.fromEntries(session.safety_checklist.map((a) => [a.code, a])))
    setError('')
    Promise.all([listProtocols(), listProtocolCategories(), listEquipment(), listCoils(), listAllChecklistItems()])
      .then(([pr, cats, eq, co, items]) => {
        setProtocols(pr)
        setProtocolCategories(cats)
        setEquipment(eq)
        setCoils(co)
        setChecklistItems(items)
      })
      .catch(() => setError('No se pudieron cargar los datos necesarios.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

  function handleAnswer(code: string, answer: ChecklistAnswer) {
    setAnswers((prev) => ({ ...prev, [code]: answer }))
  }

  async function handleSubmit() {
    if (!form.date || !form.equipment_id || !form.coil_id) {
      setError('Fecha, equipo y bobina son obligatorios.')
      return
    }
    if (form.frequency_hz && Number(form.frequency_hz) > 100) {
      setError('El Neuro-MSX SLIM opera hasta 100 Hz. Revisá la frecuencia.')
      return
    }
    if (form.intensity_pct && (Number(form.intensity_pct) < 1 || Number(form.intensity_pct) > 150)) {
      setError('La intensidad debe estar entre 1% y 150% del umbral motor de reposo.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateSession(session.id, {
        date: form.date,
        start_time: form.start_time || null,
        equipment_id: form.equipment_id,
        coil_id: form.coil_id,
        protocol_id: form.protocol_id,
        stimulated_region: form.stimulated_region,
        laterality: form.laterality,
        frequency_hz: form.frequency_hz ? Number(form.frequency_hz) : null,
        intensity_pct: form.intensity_pct ? Number(form.intensity_pct) : null,
        rmt_pct: form.rmt_pct ? Number(form.rmt_pct) : null,
        pulses: form.pulses ? Number(form.pulses) : null,
        trains: computeTrains(form).trainsRounded,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        clinical_response: form.clinical_response,
        adverse_events: form.adverse_events,
        notes: form.notes,
        safety_checklist: Object.values(answers),
      })
      onSaved()
    } catch {
      setError('No se pudo guardar la sesión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title="Editar sesión"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Paciente</p>
          <p className="text-sm font-medium text-midnight-950">
            {session.patient?.full_name ?? '—'}
            {session.cycle ? ` · ciclo de ${session.cycle.planned_sessions} sesiones` : ''}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Fecha" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Hora" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        </div>

        <ProtocolPicker
          label="Protocolo aplicado en esta sesión"
          protocols={protocols}
          categories={protocolCategories}
          value={form.protocol_id}
          onChange={(protocolId) => setForm({ ...form, protocol_id: protocolId })}
          emptyLabel="Seleccioná un protocolo"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Equipo" required value={form.equipment_id} onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}>
            <option value="">Seleccioná un equipo</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </Select>
          <Select label="Bobina" required value={form.coil_id} onChange={(e) => setForm({ ...form, coil_id: e.target.value })}>
            <option value="">Seleccioná una bobina</option>
            {coils.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <SessionParametersFields values={form} onChange={(patch) => setForm({ ...form, ...patch })} onError={setError} />

        <ChecklistForm items={checklistItems} answers={answers} onChange={handleAnswer} />

        <Textarea label="Respuesta clínica" value={form.clinical_response} onChange={(e) => setForm({ ...form, clinical_response: e.target.value })} />
        <Textarea label="Eventos adversos" value={form.adverse_events} onChange={(e) => setForm({ ...form, adverse_events: e.target.value })} />
        <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
    </Modal>
  )
}
