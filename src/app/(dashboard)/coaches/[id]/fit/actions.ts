'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { getLatestCoachScore } from '@/lib/db/scoring'
import { getMandateFitFields } from '@/lib/db/mandate'
import { getEvidenceCountForCoach, upsertLonglistEntry, insertShortlistEntry } from '@/lib/db/fit'

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { user }
}

type FitResult = {
  overallScore: number
  componentScores: { tactical: number; leadership: number; recruitment: number; risk: number }
  whyFits: string[]
  concerns: string[]
  confidence: 'high' | 'medium' | 'low'
}

/** Compute fit result for coach vs mandate. */
export async function getFitResultAction(
  coachId: string,
  mandateId: string
): Promise<{ data: FitResult | null; error: string | null }> {
  const { user } = await requireUser()

  const { data: coach, error: coachErr } = await getCoachById(user.id, coachId)
  if (coachErr || !coach) return { data: null, error: 'Coach not found' }

  const { data: mandate, error: mandateErr } = await getMandateFitFields(user.id, mandateId)
  if (mandateErr || !mandate) return { data: null, error: 'Mandate not found' }

  const evidenceCount = await getEvidenceCountForCoach(user.id, coachId)
  const { data: versionedScore } = await getLatestCoachScore(user.id, coachId)

  const tactical = versionedScore?.tactical_score ?? coach.tactical_fit_score ?? 50
  const leadership = versionedScore?.leadership_score ?? coach.leadership_score ?? 50
  const recruitment = versionedScore?.recruitment_score ?? coach.recruitment_fit_score ?? 50
  const mediaRisk = versionedScore?.media_score ?? coach.media_risk_score ?? 50
  const riskScore = versionedScore?.risk_score ?? (mediaRisk <= 40 ? 80 : mediaRisk <= 70 ? 50 : 20)

  const whyFits: string[] = []
  const concerns: string[] = []

  if (mandate.tactical_model_required && coach.tactical_identity) {
    if (String(mandate.tactical_model_required).toLowerCase() === String(coach.tactical_identity).toLowerCase()) {
      whyFits.push('Tactical model aligns with mandate requirement')
    } else {
      concerns.push('Tactical model may not match mandate requirement')
    }
  }
  if (mandate.pressing_intensity_required && coach.pressing_intensity) {
    if (String(mandate.pressing_intensity_required).toLowerCase() === String(coach.pressing_intensity).toLowerCase()) {
      whyFits.push('Pressing intensity matches')
    } else {
      concerns.push('Pressing intensity differs from requirement')
    }
  }
  if (mandate.build_preference_required && coach.build_preference) {
    if (String(mandate.build_preference_required).toLowerCase() === String(coach.build_preference).toLowerCase()) {
      whyFits.push('Build preference matches')
    } else {
      concerns.push('Build preference differs from requirement')
    }
  }
  if (mandate.leadership_profile_required && coach.leadership_style) {
    whyFits.push('Leadership profile available')
  }
  const coachLangs = Array.isArray(coach.languages) ? coach.languages : []
  const reqLangs = Array.isArray(mandate.language_requirements) ? mandate.language_requirements : []
  if (reqLangs.length > 0) {
    const coachSet = new Set(coachLangs.map((l: string) => String(l).toLowerCase()))
    const missing = reqLangs.filter((l: string) => !coachSet.has(String(l).toLowerCase()))
    if (missing.length === 0) whyFits.push('Language requirements met')
    else concerns.push(`Languages may not cover: ${missing.join(', ')}`)
  }
  if (mandate.relocation_required) {
    const flex = String(coach.relocation_flexibility ?? '').toLowerCase()
    if (flex.includes('yes') || flex.includes('flexible') || flex.includes('open')) {
      whyFits.push('Relocation flexibility aligns')
    } else if (flex.includes('no')) {
      concerns.push('Relocation may be a barrier')
    }
  }

  const hasRisk = (coach.legal_risk_flag ?? false) || (coach.integrity_risk_flag ?? false) || (coach.safeguarding_risk_flag ?? false)
  if (hasRisk) concerns.push('Risk flags on profile')
  if (mandate.risk_tolerance && String(mandate.risk_tolerance).toLowerCase().includes('low') && hasRisk) {
    concerns.push('Mandate has low risk tolerance')
  }

  const overall = versionedScore?.overall_score ?? coach.overall_manual_score ?? Math.round((tactical + leadership + recruitment + riskScore) / 4)
  const overallScore = Math.max(0, Math.min(100, Number(overall)))

  let confidence: 'high' | 'medium' | 'low' = 'medium'
  const ic = versionedScore?.confidence_score ?? coach.intelligence_confidence ?? 0
  if (Number(ic) >= 70 && evidenceCount >= 3) confidence = 'high'
  else if (Number(ic) < 40 && evidenceCount < 2) confidence = 'low'

  return {
    data: {
      overallScore,
      componentScores: { tactical, leadership, recruitment, risk: riskScore },
      whyFits: whyFits.length ? whyFits : ['Profile matches key mandate dimensions'],
      concerns,
      confidence,
    },
    error: null,
  }
}

/** Add coach to mandate longlist. Returns { ok, error }. */
export async function addToLonglistAction(
  mandateId: string,
  coachId: string,
  rankingScore: number | null,
  fitExplanation: string | null
): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireUser()
  const { data: coach } = await getCoachById(user.id, coachId)
  if (!coach) return { ok: false, error: 'Coach not found' }

  const err = await upsertLonglistEntry(user.id, mandateId, coachId, rankingScore, fitExplanation)
  if (err) return { ok: false, error: err }

  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/longlist`)
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/fit`)
  return { ok: true }
}

/** Add coach to mandate shortlist. Returns { ok, error }. */
export async function addToShortlistAction(
  mandateId: string,
  coachId: string,
  notes: string | null
): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireUser()
  const { data: coach } = await getCoachById(user.id, coachId)
  if (!coach) return { ok: false, error: 'Coach not found' }

  const err = await insertShortlistEntry(user.id, mandateId, coachId, notes ?? null, 'Under Review')
  if (err) return { ok: false, error: err }

  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/shortlist`)
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/fit`)
  return { ok: true }
}
