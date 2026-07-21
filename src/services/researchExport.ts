import { listConsentedResearchProfilesWithPatient } from './patientResearchProfile'
import { getPatient } from './patients'
import { listPatientDiagnoses } from './patientDiagnoses'
import { countAdequateFailedTrials, listPatientTreatmentHistory } from './patientTreatmentHistory'
import { listPatientScaleScores } from './patientScaleScores'
import { listSessionsByPatient } from './sessions'
import { listPatientAdverseEvents } from './adverseEvents'
import { computeScaleOutcome, supportsOutcomeCriteria } from '../utils/scaleThresholds'

const RESEARCH_SCALES = ['phq9', 'gad7', 'madrs', 'ybocs', 'hamd', 'bdi2']

function calculateAge(birthDate: string | null): number | '' {
  if (!birthDate) return ''
  const b = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

function maxSeverity(events: { severity: string }[]): string {
  if (events.some((e) => e.severity === 'grave')) return 'grave'
  if (events.some((e) => e.severity === 'moderado')) return 'moderado'
  if (events.length > 0) return 'leve'
  return ''
}

/**
 * Dataset para investigación/publicaciones: solo pacientes que dieron
 * consentimiento explícito (patient_research_profile.research_consent).
 *
 * `anonymize: true` (por defecto, usado para exportar el Excel que puede
 * salir de la clínica) nunca incluye nombre, email, teléfono ni cédula —
 * solo un código y variables clínicas/sociodemográficas relevantes.
 * `anonymize: false` (usado para la vista en pantalla dentro de la app,
 * donde el equipo clínico ya tiene acceso a la identidad del paciente en
 * cualquier otra pantalla) muestra el nombre real en vez del código.
 */
export async function buildResearchDataset(options: { anonymize?: boolean } = {}): Promise<Record<string, string | number>[]> {
  const anonymize = options.anonymize ?? true
  const profiles = await listConsentedResearchProfilesWithPatient()
  const rows: Record<string, string | number>[] = []

  let counter = 1
  for (const profile of profiles) {
    const code = `PAC-${String(counter).padStart(4, '0')}`
    counter++

    const [patient, diagnoses, history, scores, sessions, adverseEvents] = await Promise.all([
      getPatient(profile.patient_id),
      listPatientDiagnoses(profile.patient_id),
      listPatientTreatmentHistory(profile.patient_id),
      listPatientScaleScores(profile.patient_id),
      listSessionsByPatient(profile.patient_id),
      listPatientAdverseEvents(profile.patient_id),
    ])

    const row: Record<string, string | number> = {
      ...(anonymize ? { Código: code } : { Paciente: profile.patient?.full_name ?? patient.full_name }),
      Edad: calculateAge(patient.birth_date),
      Género: patient.gender ?? '',
      'Nivel educativo': patient.education_level ?? '',
      'Estado civil': patient.marital_status ?? '',
      Ocupación: patient.occupation ?? '',
      'Diagnósticos activos': diagnoses
        .filter((d) => d.is_active)
        .map((d) => d.diagnosis)
        .join('; '),
      'Episodios depresivos previos': profile.lifetime_depressive_episodes ?? '',
      'Antidepresivos fallidos (ensayo adecuado)': countAdequateFailedTrials(history),
      'Inicio episodio actual': profile.current_episode_onset_date ?? '',
      'Historia familiar psiquiátrica': profile.family_psychiatric_history ?? '',
      'Sesiones TMS completadas': sessions.length,
      'Eventos adversos (total)': adverseEvents.length,
      'Eventos adversos (severidad máxima)': maxSeverity(adverseEvents),
    }

    for (const scaleCode of RESEARCH_SCALES) {
      const scaleScores = [...scores]
        .filter((s) => s.scale_code === scaleCode)
        .sort((a, b) => a.administered_at.localeCompare(b.administered_at))
      if (scaleScores.length === 0) continue

      const baseline = scaleScores.find((s) => s.assessment_point === 'baseline') ?? scaleScores[0]
      const latest = scaleScores[scaleScores.length - 1]
      const outcome = supportsOutcomeCriteria(scaleCode) ? computeScaleOutcome(latest, scores) : null
      const label = scaleCode.toUpperCase()

      row[`${label} basal`] = baseline.score
      row[`${label} último`] = latest.score
      if (outcome) {
        row[`${label} % reducción`] = Number(outcome.reductionPct.toFixed(1))
        row[`${label} respuesta (≥50%)`] = outcome.isResponse ? 'Sí' : 'No'
        row[`${label} remisión`] = outcome.isRemission ? 'Sí' : 'No'
      }
    }

    rows.push(row)
  }

  return rows
}
