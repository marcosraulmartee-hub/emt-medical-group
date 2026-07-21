import type { PatientScaleScore } from '../services/patientScaleScores'

/**
 * Umbrales estándar de la literatura para calcular respuesta/remisión por
 * escala. PHQ-9/GAD-7/MADRS/HAM-D/BDI-II usan el criterio clásico de
 * respuesta (≥50% de reducción vs. baseline); Y-BOCS usa 35% (convención
 * en investigación de TOC). MoCA/MMSE son tamizajes cognitivos, no
 * escalas de severidad sintomática — no aplican respuesta/remisión.
 */
const SCALE_CRITERIA: Record<string, { responseReductionPct: number; remissionThreshold: number }> = {
  phq9: { responseReductionPct: 50, remissionThreshold: 5 },
  gad7: { responseReductionPct: 50, remissionThreshold: 5 },
  madrs: { responseReductionPct: 50, remissionThreshold: 10 },
  hamd: { responseReductionPct: 50, remissionThreshold: 7 },
  bdi2: { responseReductionPct: 50, remissionThreshold: 13 },
  ybocs: { responseReductionPct: 35, remissionThreshold: 14 },
}

export interface ScaleOutcome {
  baselineScore: number
  reductionPct: number
  isResponse: boolean
  isRemission: boolean
}

export function supportsOutcomeCriteria(scaleCode: string): boolean {
  return scaleCode in SCALE_CRITERIA
}

/**
 * Calcula respuesta/remisión de un puntaje frente al baseline más antiguo
 * del mismo ciclo (o del paciente, si no hay ciclo) para esa escala.
 */
export function computeScaleOutcome(score: PatientScaleScore, allScores: PatientScaleScore[]): ScaleOutcome | null {
  const criteria = SCALE_CRITERIA[score.scale_code]
  if (!criteria) return null

  const sameGroup = allScores.filter(
    (s) => s.scale_code === score.scale_code && (score.cycle_id ? s.cycle_id === score.cycle_id : true),
  )
  const baseline =
    sameGroup.find((s) => s.assessment_point === 'baseline') ??
    [...sameGroup].sort((a, b) => a.administered_at.localeCompare(b.administered_at))[0]

  if (!baseline) return null

  const reductionPct = baseline.score === 0 ? 0 : ((baseline.score - score.score) / baseline.score) * 100

  return {
    baselineScore: baseline.score,
    reductionPct,
    isResponse: reductionPct >= criteria.responseReductionPct,
    isRemission: score.score <= criteria.remissionThreshold,
  }
}

export const ASSESSMENT_POINT_LABEL: Record<string, string> = {
  baseline: 'Basal (antes de iniciar)',
  intermedio: 'Intermedio (durante el ciclo)',
  fin_tratamiento: 'Fin de tratamiento',
  seguimiento_1m: 'Seguimiento 1 mes',
  seguimiento_3m: 'Seguimiento 3 meses',
  seguimiento_6m: 'Seguimiento 6 meses',
  otro: 'Otro',
}
