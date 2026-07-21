import { supabase } from '../lib/supabase'

export interface PatientResearchProfile {
  id: string
  patient_id: string
  current_episode_onset_date: string | null
  lifetime_depressive_episodes: number | null
  family_psychiatric_history: string | null
  research_consent: boolean
  research_consent_date: string | null
  research_consent_notes: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

const SELECT = `id, patient_id, current_episode_onset_date, lifetime_depressive_episodes, family_psychiatric_history, research_consent, research_consent_date, research_consent_notes, updated_by, created_at, updated_at`

export async function getPatientResearchProfile(patientId: string) {
  const { data, error } = await supabase.from('patient_research_profile').select(SELECT).eq('patient_id', patientId).maybeSingle()
  if (error) throw error
  return data as PatientResearchProfile | null
}

export async function savePatientResearchProfile(
  patientId: string,
  payload: {
    current_episode_onset_date: string | null
    lifetime_depressive_episodes: number | null
    family_psychiatric_history: string
    research_consent: boolean
    research_consent_date: string | null
    research_consent_notes: string
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('patient_research_profile')
    .upsert(
      {
        patient_id: patientId,
        current_episode_onset_date: payload.current_episode_onset_date || null,
        lifetime_depressive_episodes: payload.lifetime_depressive_episodes,
        family_psychiatric_history: payload.family_psychiatric_history || null,
        research_consent: payload.research_consent,
        research_consent_date: payload.research_consent_date || null,
        research_consent_notes: payload.research_consent_notes || null,
        updated_by: user?.id,
      },
      { onConflict: 'patient_id' },
    )
    .select(SELECT)
    .single()
  if (error) throw error
  return data as PatientResearchProfile
}

export async function listConsentedResearchProfiles() {
  const { data, error } = await supabase.from('patient_research_profile').select(SELECT).eq('research_consent', true)
  if (error) throw error
  return data as PatientResearchProfile[]
}

export interface PatientResearchProfileWithPatient extends PatientResearchProfile {
  patient: { full_name: string } | null
}

export async function listConsentedResearchProfilesWithPatient() {
  const { data, error } = await supabase
    .from('patient_research_profile')
    .select(`${SELECT}, patient:patients(full_name)`)
    .eq('research_consent', true)
    .order('research_consent_date', { ascending: false })
  if (error) throw error
  return data as unknown as PatientResearchProfileWithPatient[]
}
