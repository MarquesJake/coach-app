'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mandateToContext } from '@/lib/scoring/mandate-adapter'
import { computeMandateFit } from '@/lib/scoring/engine'
import type { CoachStint } from '@/lib/scoring/engine'
import {
  generateExplanation,
  getComparisonResult,
} from '@/lib/scoring/explanation'
import type { ComparisonResult, MandateDimScores } from '@/lib/scoring/explanation'
import type { Database } from '@/lib/types/db'

type Coach = Database['public']['Tables']['coaches']['Row']

// ── Shared types exported for client components ─────────────────────────────

export type LonglistEntryData = {
  id: string
  coach_id: string
  ranking_score: number
  fit_explanation: string | null
  coach_name: string | null
  coach_available_status: string | null
  coach_club: string | null
}

export type ExcludedEntryData = {
  coachId: string
  name: string | null
  reason: { code: string; label: string }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

// Combined-score gap → comparison type for badge display
function combinedGapType(gap: number | null): 'TIED' | 'MARGINAL' | 'NEAR_TIE' | 'CLEAR' | null {
  if (gap === null) return null
  if (gap < 3) return 'TIED'
  if (gap < 9) return 'MARGINAL'
  if (gap < 15) return 'NEAR_TIE'
  return 'CLEAR'
}

// ── generateLonglistAction ──────────────────────────────────────────────────

export async function generateLonglistAction(mandateId: string): Promise<{
  data: { id: string; coach_id: string; ranking_score: number; fit_explanation: string | null }[] | null
  excluded: ExcludedEntryData[]
  error: string | null
}> {
  const { supabase, user } = await requireUser()

  // ── 1. Mandate fields ────────────────────────────────────────────────────
  const { data: mandateRow } = await supabase
    .from('mandates')
    .select(
      `id,
       tactical_model_required, pressing_intensity_required, build_preference_required,
       leadership_profile_required, budget_band, strategic_objective,
       board_risk_appetite, succession_timeline, language_requirements, relocation_required`
    )
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()

  if (!mandateRow) return { data: null, excluded: [], error: 'Mandate not found' }

  const ctx = mandateToContext(mandateRow)

  // ── 2. Coaches ────────────────────────────────────────────────────────────
  const { data: coaches } = await supabase
    .from('coaches')
    .select(
      `id, name,
       preferred_style, pressing_intensity, build_preference,
       reputation_tier, leadership_style, available_status,
       wage_expectation, staff_cost_estimate,
       safeguarding_risk_flag, legal_risk_flag, integrity_risk_flag, media_risk_score,
       relocation_flexibility, intelligence_confidence,
       player_development_model, training_methodology, academy_integration,
       tactical_fit_score`
    )
    .eq('user_id', user.id)

  if (!coaches?.length) return { data: [], excluded: [], error: null }

  // ── 3. Stints ─────────────────────────────────────────────────────────────
  const coachIds = coaches.map((c) => c.id)
  const { data: allStints } = await supabase
    .from('coach_stints')
    .select(
      'coach_id, role_title, club_name, started_on, ended_on, league, win_rate, points_per_game, country'
    )
    .in('coach_id', coachIds)

  const stintsByCoach = new Map<string, CoachStint[]>()
  for (const s of allStints ?? []) {
    const existing = stintsByCoach.get(s.coach_id) ?? []
    existing.push(s as CoachStint)
    stintsByCoach.set(s.coach_id, existing)
  }

  // ── 4. Score every coach ──────────────────────────────────────────────────
  type ScoredEntry = {
    coach: typeof coaches[number]
    combined: number
    dims: MandateDimScores
    hardFilter: { code: string; label: string } | null
    recentLeague: string | null
    recentWinRate: number | null
    recentPpg: number | null
  }

  const viable: ScoredEntry[] = []
  const excluded: ExcludedEntryData[] = []

  for (const coach of coaches) {
    const stints = stintsByCoach.get(coach.id) ?? []
    const result = computeMandateFit(ctx, coach as unknown as Coach, stints)

    if (result.hardFilter) {
      excluded.push({
        coachId: coach.id,
        name: coach.name,
        reason: { code: result.hardFilter.code, label: result.hardFilter.label },
      })
    } else {
      viable.push({
        coach,
        combined: result.combined,
        dims: result.dims,
        hardFilter: null,
        recentLeague: result.recentLeague,
        recentWinRate: result.recentWinRate,
        recentPpg: result.recentPpg,
      })
    }
  }

  // ── 5. Sort ───────────────────────────────────────────────────────────────
  viable.sort((a, b) => b.combined - a.combined)

  // ── 6. Explanations + serialise as JSON ──────────────────────────────────
  const rows: { coach_id: string; ranking_score: number; fit_explanation: string }[] = []

  for (let i = 0; i < viable.length; i++) {
    const entry = viable[i]
    const rank = i + 1
    const combinedGap = i === 0 ? null : viable[i - 1].combined - entry.combined

    let comparisonResult: ComparisonResult | undefined
    let nameAbove: string | undefined
    let combinedAbove: number | undefined
    let combinedThisForNote: number = entry.combined

    if (rank === 1 && viable.length > 1) {
      comparisonResult = getComparisonResult(entry.dims, viable[1].dims)
      combinedAbove = entry.combined
      combinedThisForNote = viable[1].combined
    } else if (rank >= 2 && rank <= 5) {
      const above = viable[i - 1]
      comparisonResult = getComparisonResult(above.dims, entry.dims)
      nameAbove = above.coach.name ?? undefined
      combinedAbove = above.combined
    }

    const coach = entry.coach
    const coachCtx = {
      preferred_style: coach.preferred_style,
      pressing_intensity: coach.pressing_intensity,
      build_preference: coach.build_preference,
      reputation_tier: coach.reputation_tier,
      leadership_style: coach.leadership_style,
      wage_expectation: coach.wage_expectation,
      available_status: coach.available_status,
      media_risk_score: (coach as { media_risk_score?: number | null }).media_risk_score,
      recentLeague: entry.recentLeague,
      recentWinRate: entry.recentWinRate,
      recentPpg: entry.recentPpg,
    }

    const flags = {
      legal: !!(coach as { legal_risk_flag?: boolean | null }).legal_risk_flag,
      integrity: !!(coach as { integrity_risk_flag?: boolean | null }).integrity_risk_flag,
      safeguarding: !!coach.safeguarding_risk_flag,
    }

    const explanation = generateExplanation(entry.dims, ctx, coachCtx, flags, {
      rank,
      comparisonResult,
      nameAbove,
      combinedThis: combinedThisForNote,
      combinedAbove,
    })

    // Store full data as JSON — client reads this for the fit-detail panel
    const fitData = {
      combined: entry.combined,
      footballFit: explanation.footballFit,
      appointability: explanation.appointability,
      summary: explanation.summary,
      strengths: explanation.strengths,
      concerns: explanation.concerns,
      comparisonNote: explanation.comparisonNote ?? null,
      fitLabel: explanation.fitLabel,
      ieFlags: explanation.ieFlags,
      combinedGap,
      gapType: combinedGapType(combinedGap),
      dims: entry.dims,
    }

    rows.push({
      coach_id: coach.id,
      ranking_score: entry.combined,
      fit_explanation: JSON.stringify(fitData),
    })
  }

  // ── 7. Upsert ─────────────────────────────────────────────────────────────
  const scoredAt = new Date().toISOString()
  if (rows.length > 0) {
    await supabase
      .from('mandate_longlist')
      .upsert(
        rows.map((r) => ({
          mandate_id: mandateId,
          coach_id: r.coach_id,
          ranking_score: r.ranking_score,
          fit_explanation: r.fit_explanation,
          created_at: scoredAt,
        })),
        { onConflict: 'mandate_id,coach_id', ignoreDuplicates: false }
      )
  }

  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/workspace`)
  revalidatePath(`/mandates/${mandateId}/longlist`)

  const { data: updated } = await supabase
    .from('mandate_longlist')
    .select('id, coach_id, ranking_score, fit_explanation')
    .eq('mandate_id', mandateId)
    .order('ranking_score', { ascending: false })

  const mappedData = (updated ?? []).map((r) => ({
    ...r,
    ranking_score: r.ranking_score ?? 0,
  }))
  return { data: mappedData, excluded, error: null }
}

// ── addCandidateFromLonglistAction — adds at Longlist stage ─────────────────

export async function addCandidateFromLonglistAction(mandateId: string, coachId: string) {
  const { supabase, user } = await requireUser()

  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('id', coachId)
    .eq('user_id', user.id)
    .single()

  if (!coach) return { error: 'Coach not found' }

  const { error } = await supabase.from('mandate_shortlist').insert({
    mandate_id: mandateId,
    coach_id: coachId,
    candidate_stage: 'Longlist',
    placement_probability: 50,
    risk_rating: 'Medium',
    status: 'Under Review',
  })

  if (error) {
    if (error.code === '23505') return { error: 'Already added' }
    return { error: error.message }
  }

  revalidatePath(`/mandates/${mandateId}/workspace`)
  revalidatePath(`/mandates/${mandateId}`)
  return { error: null }
}

// ── saveLonglistAction (unchanged) ──────────────────────────────────────────

export async function saveLonglistAction(
  mandateId: string,
  payload: { coach_id: string; ranking_score: number | null; fit_explanation: string | null }[]
) {
  const { supabase, user } = await requireUser()
  const { data: mandate } = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()
  if (!mandate) return { error: 'Mandate not found' }
  for (const row of payload) {
    await supabase.from('mandate_longlist').upsert(
      {
        mandate_id: mandateId,
        coach_id: row.coach_id,
        ranking_score: row.ranking_score,
        fit_explanation: row.fit_explanation,
      },
      { onConflict: 'mandate_id,coach_id' }
    )
  }
  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/longlist`)
  return { error: null }
}
