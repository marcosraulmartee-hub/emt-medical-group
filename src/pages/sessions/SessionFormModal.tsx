import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import { ChecklistForm } from './ChecklistForm'
import { HeadMap1020 } from '../../components/sessions/HeadMap1020'
import { useAuth } from '../../hooks/useAuth'
import type { Patient } from '../../services/patients'
import { listPatients } from '../../services/patients'
import type { Protocol } from '../../services/protocols'
import { listProtocols } from '../../services/protocols'
import type { Equipment } from '../../services/equipment'
import { listEquipment } from '../../services/equipment'
import type { Coil } from '../../services/coils'
import { listCoils } from '../../services/coils'
import type { TreatmentCycle } from '../../services/treatmentCycles'
import { createTreatmentCycle, listPatientCycles } from '../../services/treatmentCycles'
import type { ChecklistAnswer, SafetyChecklistItem } from '../../services/safetyChecklist'
import { listActiveChecklistItems } from '../../services/safetyChecklist'
import { createSession } from '../../services/sessions'
import { toISODate } from '../../utils/dates'

const NEW_CYCLE = '__new__'

const emptyForm = {
  patient_id: '',
  cycleChoice: '',
  newCycleProtocolId: '',
  newCyclePlanned: 30,
  protocol_id: '',
  date: toISODate(new Date()),
  start_time: '',
  equipment_id: '',
  coil_id: '',
  stimulated_region: '',
  laterality: '',
  frequency_hz: '',
  intensity_pct: '',
  rmt_pct: '',
  motor_threshold: '',
  pulses: '',
  trains: '',
  duration_minutes: '',
  clinical_response: '',
  adverse_events: '',
  notes: '',
}

export function SessionFormModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [coils, setCoils] = useState<Coil[]>([])
  const [cycles, setCycles] = useState<TreatmentCycle[]>([])
  const [checklistItems, setChecklistItems] = useState<SafetyChecklistItem[]>([])
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>({})
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showHeadMap, setShowHeadMap] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setAnswers({})
    setError('')
    setShowHeadMap(false)
    Promise.all([listPatients(), listProtocols(), listEquipment(), listCoils(), listActiveChecklistItems()])
      .then(([p, pr, eq, co, items]) => {
        setPatients(p)
        setProtocols(pr.filter((x) => x.is_active))
        setEquipment(eq.filter((x) => x.status === 'active'))
        setCoils(co.filter((x) => x.status === 'active'))
        setChecklistItems(items)
      })
      .catch(() => setError('No se pudieron cargar los datos necesarios.'))
  }, [open])

  useEffect(() => {
    if (!form.patient_id) {
      setCycles([])
      return
    }
    listPatientCycles(form.patient_id)
      .then((all) => setCycles(all.filter((c) => c.status === 'active')))
      .catch(() => setError('No se pudieron cargar los ciclos del paciente.'))
  }, [form.patient_id])

  function handleAnswer(code: string, answer: ChecklistAnswer) {
    setAnswers((prev) => ({ ...prev, [code]: answer }))
  }

  async function handleSubmit() {
    if (!form.patient_id || !form.date || !form.equipment_id || !form.coil_id) {
      setError('Paciente, fecha, equipo y bobina son obligatorios.')
      return
    }
    if (!form.cycleChoice) {
      setError('Seleccioná un ciclo existente o creá uno nuevo.')
      return
    }
    if (form.cycleChoice === NEW_CYCLE && !form.newCycleProtocolId) {
      setError('Elegí el protocolo del nuevo ciclo.')
      return
    }
    const missingAnswer = checklistItems.some((item) => answers[item.code] === undefined)
    if (missingAnswer) {
      setError('Completá todos los ítems del checklist de seguridad.')
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
      let cycleId = form.cycleChoice
      let protocolId = form.protocol_id
      if (form.cycleChoice === NEW_CYCLE) {
        const cycle = await createTreatmentCycle({
          patient_id: form.patient_id,
          protocol_id: form.newCycleProtocolId,
          planned_sessions: form.newCyclePlanned,
          notes: null,
        })
        cycleId = cycle.id
        protocolId = form.newCycleProtocolId
      } else {
        const selectedCycle = cycles.find((c) => c.id === form.cycleChoice)
        protocolId = selectedCycle?.protocol_id ?? protocolId
      }

      await createSession({
        patient_id: form.patient_id,
        clinician_id: user?.id ?? '',
        cycle_id: cycleId,
        appointment_id: null,
        date: form.date,
        start_time: form.start_time || null,
        end_time: null,
        equipment_id: form.equipment_id,
        coil_id: form.coil_id,
        stimulated_region: form.stimulated_region,
        laterality: form.laterality,
        protocol_id: protocolId,
        frequency_hz: form.frequency_hz ? Number(form.frequency_hz) : null,
        intensity_pct: form.intensity_pct ? Number(form.intensity_pct) : null,
        rmt_pct: form.rmt_pct ? Number(form.rmt_pct) : null,
        motor_threshold: form.motor_threshold ? Number(form.motor_threshold) : null,
        pulses: form.pulses ? Number(form.pulses) : null,
        trains: form.trains ? Number(form.trains) : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        clinical_response: form.clinical_response,
        adverse_events: form.adverse_events,
        notes: form.notes,
        safety_checklist: Object.values(answers),
      })
      onCreated()
    } catch {
      setError('No se pudo registrar la sesión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title="Registrar sesión" size="lg" onClose={onClose} footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={saving}>
          Guardar sesión
        </Button>
      </>
    }>
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select label="Paciente" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value, cycleChoice: '' })}>
          <option value="">Seleccioná un paciente</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>

        {form.patient_id && (
          <Select label="Ciclo de tratamiento" required value={form.cycleChoice} onChange={(e) => setForm({ ...form, cycleChoice: e.target.value })}>
            <option value="">Seleccioná un ciclo</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.protocol?.name ?? 'Sin protocolo'} · {c.planned_sessions} sesiones · desde {c.started_at}
              </option>
            ))}
            <option value={NEW_CYCLE}>+ Nuevo ciclo</option>
          </Select>
        )}

        {form.cycleChoice === NEW_CYCLE && (
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            <Select
              label="Protocolo del ciclo"
              required
              value={form.newCycleProtocolId}
              onChange={(e) => setForm({ ...form, newCycleProtocolId: e.target.value })}
            >
              <option value="">Seleccioná un protocolo</option>
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Input
              label="Sesiones planificadas"
              type="number"
              min={1}
              value={form.newCyclePlanned}
              onChange={(e) => setForm({ ...form, newCyclePlanned: Number(e.target.value) })}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Fecha" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Hora" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-end gap-2">
            <Input
              label="Región estimulada"
              value={form.stimulated_region}
              onChange={(e) => setForm({ ...form, stimulated_region: e.target.value })}
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={() => setShowHeadMap((v) => !v)}>
              {showHeadMap ? 'Ocultar mapa' : 'Marcar en mapa 10-20'}
            </Button>
          </div>
          <Select label="Lateralidad" value={form.laterality} onChange={(e) => setForm({ ...form, laterality: e.target.value })}>
            <option value="">Sin especificar</option>
            <option value="izquierda">Izquierda</option>
            <option value="derecha">Derecha</option>
            <option value="bilateral">Bilateral</option>
          </Select>
        </div>

        {showHeadMap && (
          <HeadMap1020
            value={form.stimulated_region}
            onSelect={(code, laterality) => setForm({ ...form, stimulated_region: code, laterality: laterality || form.laterality })}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Frecuencia (Hz)"
            type="number"
            max={100}
            helper="Neuro-MSX SLIM: hasta 100 Hz"
            value={form.frequency_hz}
            onChange={(e) => setForm({ ...form, frequency_hz: e.target.value })}
          />
          <Input
            label="Intensidad (%)"
            type="number"
            min={1}
            max={150}
            helper="1–150% del umbral motor de reposo"
            value={form.intensity_pct}
            onChange={(e) => setForm({ ...form, intensity_pct: e.target.value })}
          />
          <Input label="Umbral motor (%)" type="number" value={form.rmt_pct} onChange={(e) => setForm({ ...form, rmt_pct: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Motor threshold" type="number" value={form.motor_threshold} onChange={(e) => setForm({ ...form, motor_threshold: e.target.value })} />
          <Input label="Pulsos" type="number" value={form.pulses} onChange={(e) => setForm({ ...form, pulses: e.target.value })} />
          <Input label="Trenes" type="number" value={form.trains} onChange={(e) => setForm({ ...form, trains: e.target.value })} />
        </div>
        <Input label="Duración (minutos)" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />

        <ChecklistForm items={checklistItems} answers={answers} onChange={handleAnswer} />

        <Textarea label="Respuesta clínica" value={form.clinical_response} onChange={(e) => setForm({ ...form, clinical_response: e.target.value })} />
        <Textarea label="Eventos adversos" value={form.adverse_events} onChange={(e) => setForm({ ...form, adverse_events: e.target.value })} />
        <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
    </Modal>
  )
}
