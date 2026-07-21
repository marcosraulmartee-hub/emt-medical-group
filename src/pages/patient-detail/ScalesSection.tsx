import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import type { ClinicalScale } from '../../services/clinicalScales'
import { listClinicalScales } from '../../services/clinicalScales'
import type { AssessmentPoint, PatientScaleScore } from '../../services/patientScaleScores'
import { addPatientScaleScore, listPatientScaleScores } from '../../services/patientScaleScores'
import type { TreatmentCycle } from '../../services/treatmentCycles'
import { listPatientCycles } from '../../services/treatmentCycles'
import { toISODate } from '../../utils/dates'
import { ASSESSMENT_POINT_LABEL, computeScaleOutcome, supportsOutcomeCriteria } from '../../utils/scaleThresholds'

const emptyForm = {
  scale_code: '',
  cycle_id: '',
  score: '',
  administered_at: toISODate(new Date()),
  assessment_point: 'otro' as AssessmentPoint,
  notes: '',
}

export function ScalesSection({ patientId, patientName }: { patientId: string; patientName: string }) {
  const { user } = useAuth()
  const [scores, setScores] = useState<PatientScaleScore[]>([])
  const [scales, setScales] = useState<ClinicalScale[]>([])
  const [cycles, setCycles] = useState<TreatmentCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [s, sc, cy] = await Promise.all([listPatientScaleScores(patientId), listClinicalScales(), listPatientCycles(patientId)])
      setScores(s)
      setScales(sc)
      setCycles(cy)
    } catch {
      setError('No se pudieron cargar las escalas clínicas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [patientId])

  function openCreate() {
    setForm({ ...emptyForm, scale_code: scales[0]?.code ?? '' })
    setModalOpen(true)
  }

  async function handleExportPdf() {
    const { exportScaleHistoryPdf } = await import('../../utils/scalePdf')
    exportScaleHistoryPdf(patientName, scores)
  }

  const selectedScale = scales.find((s) => s.code === form.scale_code)

  async function handleAdd() {
    if (!form.scale_code || !form.score) return
    setSaving(true)
    try {
      await addPatientScaleScore({
        patient_id: patientId,
        cycle_id: form.cycle_id || null,
        scale_code: form.scale_code,
        score: Number(form.score),
        notes: form.notes,
        administered_at: form.administered_at,
        administered_by: user?.id ?? null,
        assessment_point: form.assessment_point,
      })
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo registrar la escala.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Escalas clínicas</h3>
          <p className="text-sm text-slate-500">Historial de puntajes (PHQ-9, MADRS, Y-BOCS, GAD-7...) por ciclo.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleExportPdf} disabled={scores.length === 0}>
            Exportar PDF
          </Button>
          <Button size="sm" onClick={openCreate}>
            Registrar escala
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : scores.length === 0 ? (
        <p className="text-sm text-slate-500">Sin escalas registradas todavía.</p>
      ) : (
        <ul className="space-y-3">
          {scores.map((item) => {
            const outcome = supportsOutcomeCriteria(item.scale_code) ? computeScaleOutcome(item, scores) : null
            return (
              <li key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-midnight-950">
                      {item.scale?.label ?? item.scale_code} — {item.score}
                    </p>
                    {item.notes && <p className="mt-1 text-sm text-slate-500">{item.notes}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      {item.administered_at} · {ASSESSMENT_POINT_LABEL[item.assessment_point] ?? item.assessment_point}
                    </p>
                    <div className="mt-1 flex gap-3">
                      {item.scale?.pdf_url && (
                        <a href={item.scale.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline">
                          Cuestionario (Inglés)
                        </a>
                      )}
                      {item.scale?.pdf_url_es && (
                        <a href={item.scale.pdf_url_es} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline">
                          Cuestionario (Español)
                        </a>
                      )}
                    </div>
                  </div>
                  {outcome && item.assessment_point !== 'baseline' && (
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={outcome.isRemission ? 'success' : outcome.isResponse ? 'info' : 'neutral'}>
                        {outcome.isRemission ? 'Remisión' : outcome.isResponse ? 'Respuesta' : 'Sin respuesta'}
                      </Badge>
                      <span className="text-xs text-slate-400">{outcome.reductionPct.toFixed(0)}% vs. basal</span>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={modalOpen}
        title="Registrar escala clínica"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} loading={saving} disabled={!form.scale_code || !form.score}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Escala" required value={form.scale_code} onChange={(e) => setForm({ ...form, scale_code: e.target.value })}>
            {scales.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </Select>
          {(selectedScale?.pdf_url || selectedScale?.pdf_url_es) && (
            <div className="flex gap-2">
              {selectedScale?.pdf_url && (
                <a href={selectedScale.pdf_url} target="_blank" rel="noreferrer">
                  <Button type="button" size="sm" variant="secondary">
                    Cuestionario (Inglés)
                  </Button>
                </a>
              )}
              {selectedScale?.pdf_url_es && (
                <a href={selectedScale.pdf_url_es} target="_blank" rel="noreferrer">
                  <Button type="button" size="sm" variant="secondary">
                    Cuestionario (Español)
                  </Button>
                </a>
              )}
            </div>
          )}
          <Select label="Ciclo (opcional)" value={form.cycle_id} onChange={(e) => setForm({ ...form, cycle_id: e.target.value })}>
            <option value="">Sin ciclo asociado</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.protocol?.name ?? 'Ciclo'} · desde {c.started_at}
              </option>
            ))}
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Puntaje" type="number" required value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
            <Input
              label="Fecha de administración"
              type="date"
              value={form.administered_at}
              onChange={(e) => setForm({ ...form, administered_at: e.target.value })}
            />
          </div>
          <Select
            label="Momento de evaluación"
            value={form.assessment_point}
            onChange={(e) => setForm({ ...form, assessment_point: e.target.value as AssessmentPoint })}
          >
            {Object.entries(ASSESSMENT_POINT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
