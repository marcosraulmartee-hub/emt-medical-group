import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { getPatientResearchProfile, savePatientResearchProfile } from '../../services/patientResearchProfile'
import type { PatientTreatmentHistory, TreatmentResponse, TreatmentType } from '../../services/patientTreatmentHistory'
import {
  addPatientTreatmentHistory,
  countAdequateFailedTrials,
  deactivatePatientTreatmentHistory,
  listPatientTreatmentHistory,
} from '../../services/patientTreatmentHistory'

const TREATMENT_TYPE_LABEL: Record<TreatmentType, string> = {
  antidepresivo: 'Antidepresivo',
  estabilizador: 'Estabilizador del ánimo',
  antipsicotico: 'Antipsicótico',
  ansiolitico: 'Ansiolítico',
  ect: 'Terapia electroconvulsiva (ECT)',
  ketamina_esketamina: 'Ketamina / esketamina',
  psicoterapia: 'Psicoterapia formal',
  tms_previo: 'TMS previo (otro centro)',
  otro: 'Otro',
}

const RESPONSE_LABEL: Record<TreatmentResponse, string> = {
  sin_respuesta: 'Sin respuesta',
  respuesta_parcial: 'Respuesta parcial',
  respuesta_completa: 'Respuesta completa',
  intolerancia: 'Intolerancia / efectos adversos',
  desconocido: 'Desconocido',
}

const emptyTreatmentForm = {
  treatment_type: 'antidepresivo' as TreatmentType,
  treatment_name: '',
  adequate_trial: '' as '' | 'true' | 'false',
  response: '' as '' | TreatmentResponse,
  start_date: '',
  end_date: '',
  notes: '',
}

const emptyProfileForm = {
  current_episode_onset_date: '',
  lifetime_depressive_episodes: '',
  family_psychiatric_history: '',
  research_consent: false,
  research_consent_date: '',
  research_consent_notes: '',
}

export function ResearchSection({ patientId }: { patientId: string }) {
  const [profileForm, setProfileForm] = useState(emptyProfileForm)
  const [history, setHistory] = useState<PatientTreatmentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [treatmentForm, setTreatmentForm] = useState(emptyTreatmentForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [p, h] = await Promise.all([getPatientResearchProfile(patientId), listPatientTreatmentHistory(patientId)])
      setHistory(h)
      setProfileForm({
        current_episode_onset_date: p?.current_episode_onset_date ?? '',
        lifetime_depressive_episodes: p?.lifetime_depressive_episodes?.toString() ?? '',
        family_psychiatric_history: p?.family_psychiatric_history ?? '',
        research_consent: p?.research_consent ?? false,
        research_consent_date: p?.research_consent_date ?? '',
        research_consent_notes: p?.research_consent_notes ?? '',
      })
    } catch {
      setError('No se pudo cargar el perfil de investigación.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [patientId])

  async function handleSaveProfile() {
    setSavingProfile(true)
    setProfileSaved(false)
    setError('')
    try {
      const saved = await savePatientResearchProfile(patientId, {
        current_episode_onset_date: profileForm.current_episode_onset_date || null,
        lifetime_depressive_episodes: profileForm.lifetime_depressive_episodes ? Number(profileForm.lifetime_depressive_episodes) : null,
        family_psychiatric_history: profileForm.family_psychiatric_history,
        research_consent: profileForm.research_consent,
        research_consent_date: profileForm.research_consent
          ? profileForm.research_consent_date || new Date().toISOString().slice(0, 10)
          : '',
        research_consent_notes: profileForm.research_consent_notes,
      })
      setProfileForm({
        current_episode_onset_date: saved.current_episode_onset_date ?? '',
        lifetime_depressive_episodes: saved.lifetime_depressive_episodes?.toString() ?? '',
        family_psychiatric_history: saved.family_psychiatric_history ?? '',
        research_consent: saved.research_consent,
        research_consent_date: saved.research_consent_date ?? '',
        research_consent_notes: saved.research_consent_notes ?? '',
      })
      setProfileSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil de investigación.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleAddTreatment() {
    setSaving(true)
    try {
      await addPatientTreatmentHistory({
        patient_id: patientId,
        treatment_type: treatmentForm.treatment_type,
        treatment_name: treatmentForm.treatment_name,
        adequate_trial: treatmentForm.adequate_trial === '' ? null : treatmentForm.adequate_trial === 'true',
        response: treatmentForm.response || null,
        start_date: treatmentForm.start_date,
        end_date: treatmentForm.end_date,
        notes: treatmentForm.notes,
      })
      setTreatmentForm(emptyTreatmentForm)
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo agregar el tratamiento previo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivatePatientTreatmentHistory(id)
      await load()
    } catch {
      setError('No se pudo desactivar el registro.')
    }
  }

  const adequateFailedTrials = countAdequateFailedTrials(history)

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="rounded-3xl bg-white p-6 shadow-card">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-midnight-950">Perfil de investigación</h3>
          <p className="text-sm text-slate-500">
            Historia del episodio actual y consentimiento para uso de datos en investigación/publicaciones — separado del
            consentimiento de tratamiento.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-teal-50 p-3 text-sm text-teal-800">
              Antidepresivos con ensayo adecuado sin respuesta o con respuesta parcial: <strong>{adequateFailedTrials}</strong>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Inicio del episodio actual"
                type="date"
                value={profileForm.current_episode_onset_date}
                onChange={(e) => setProfileForm({ ...profileForm, current_episode_onset_date: e.target.value })}
              />
              <Input
                label="Episodios depresivos previos (a lo largo de la vida)"
                type="number"
                min={0}
                value={profileForm.lifetime_depressive_episodes}
                onChange={(e) => setProfileForm({ ...profileForm, lifetime_depressive_episodes: e.target.value })}
              />
            </div>
            <Textarea
              label="Historia psiquiátrica familiar"
              placeholder="Ej. madre con trastorno depresivo mayor, hermano con trastorno bipolar..."
              value={profileForm.family_psychiatric_history}
              onChange={(e) => setProfileForm({ ...profileForm, family_psychiatric_history: e.target.value })}
            />

            <div className="rounded-2xl border border-slate-200 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-midnight-950">
                <input
                  type="checkbox"
                  checked={profileForm.research_consent}
                  onChange={(e) => setProfileForm({ ...profileForm, research_consent: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-teal-500 focus:ring-teal-400"
                />
                El paciente autoriza el uso de sus datos clínicos (anonimizados) en investigación/publicaciones
              </label>
              {profileForm.research_consent && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Fecha del consentimiento"
                    type="date"
                    value={profileForm.research_consent_date}
                    onChange={(e) => setProfileForm({ ...profileForm, research_consent_date: e.target.value })}
                  />
                  <Input
                    label="Notas (opcional)"
                    value={profileForm.research_consent_notes}
                    onChange={(e) => setProfileForm({ ...profileForm, research_consent_notes: e.target.value })}
                  />
                </div>
              )}
            </div>

            {profileSaved && <Alert variant="success">Perfil de investigación guardado.</Alert>}
            <Button onClick={handleSaveProfile} loading={savingProfile}>
              Guardar perfil
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-midnight-950">Tratamientos previos</h3>
            <p className="text-sm text-slate-500">Registro clínico inmutable — una corrección agrega una entrada nueva.</p>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Agregar tratamiento
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500">Sin tratamientos previos registrados.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((item) => (
              <li key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-midnight-950">
                      {TREATMENT_TYPE_LABEL[item.treatment_type]}
                      {item.treatment_name ? ` — ${item.treatment_name}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.adequate_trial === true ? 'Ensayo adecuado' : item.adequate_trial === false ? 'Ensayo no adecuado' : 'Adecuación desconocida'}
                      {item.response ? ` · ${RESPONSE_LABEL[item.response]}` : ''}
                    </p>
                    {(item.start_date || item.end_date) && (
                      <p className="mt-1 text-xs text-slate-400">
                        {item.start_date ?? '—'} a {item.end_date ?? 'presente'}
                      </p>
                    )}
                    {item.notes && <p className="mt-1 text-sm text-slate-500">{item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Activo' : 'Desactivado'}</Badge>
                    {item.is_active && (
                      <button className="text-sm text-slate-500 hover:underline" onClick={() => handleDeactivate(item.id)}>
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={modalOpen}
        title="Agregar tratamiento previo"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAddTreatment} loading={saving}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Tipo de tratamiento"
            value={treatmentForm.treatment_type}
            onChange={(e) => setTreatmentForm({ ...treatmentForm, treatment_type: e.target.value as TreatmentType })}
          >
            {Object.entries(TREATMENT_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Nombre (medicamento, modalidad de psicoterapia, etc.)"
            value={treatmentForm.treatment_name}
            onChange={(e) => setTreatmentForm({ ...treatmentForm, treatment_name: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="¿Ensayo a dosis/duración adecuada?"
              value={treatmentForm.adequate_trial}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, adequate_trial: e.target.value as '' | 'true' | 'false' })}
            >
              <option value="">Desconocido</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </Select>
            <Select
              label="Respuesta"
              value={treatmentForm.response}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, response: e.target.value as '' | TreatmentResponse })}
            >
              <option value="">Sin especificar</option>
              {Object.entries(RESPONSE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Fecha de inicio"
              type="date"
              value={treatmentForm.start_date}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, start_date: e.target.value })}
            />
            <Input
              label="Fecha de fin"
              type="date"
              value={treatmentForm.end_date}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, end_date: e.target.value })}
            />
          </div>
          <Textarea label="Notas" value={treatmentForm.notes} onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
