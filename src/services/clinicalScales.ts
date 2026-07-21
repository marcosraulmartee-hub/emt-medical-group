import { supabase } from '../lib/supabase'

export interface ClinicalScale {
  id: string
  code: string
  label: string
  description: string | null
  pdf_url: string | null
  pdf_url_es: string | null
  created_at: string
  updated_at: string
}

const SELECT = `id, code, label, description, pdf_url, pdf_url_es, created_at, updated_at`

export async function listClinicalScales() {
  const { data, error } = await supabase.from('clinical_scales').select(SELECT).order('label')
  if (error) throw error
  return data as ClinicalScale[]
}

export async function createClinicalScale(payload: {
  code: string
  label: string
  description: string
  pdf_url: string
  pdf_url_es: string
}) {
  const { data, error } = await supabase
    .from('clinical_scales')
    .insert({
      code: payload.code,
      label: payload.label,
      description: payload.description || null,
      pdf_url: payload.pdf_url || null,
      pdf_url_es: payload.pdf_url_es || null,
    })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as ClinicalScale
}

export async function uploadScalePdf(code: string, file: File) {
  const path = `${code}-${Date.now()}.pdf`
  const { error } = await supabase.storage.from('clinical-scale-pdfs').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('clinical-scale-pdfs').getPublicUrl(path)
  return data.publicUrl
}

export async function updateClinicalScale(
  id: string,
  patch: { label: string; description: string; pdf_url: string; pdf_url_es: string },
) {
  const { data, error } = await supabase
    .from('clinical_scales')
    .update({
      label: patch.label,
      description: patch.description || null,
      pdf_url: patch.pdf_url || null,
      pdf_url_es: patch.pdf_url_es || null,
    })
    .eq('id', id)
    .select(SELECT)
    .single()
  if (error) throw error
  return data as ClinicalScale
}
