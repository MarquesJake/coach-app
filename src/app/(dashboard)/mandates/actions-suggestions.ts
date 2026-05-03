'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/db'
import {
  isPlayerDevelopmentMandate,
  scorePlayerDevelopmentSuggestion,
  type PlayerDevelopmentEvidence,
} from '@/lib/suggestions/player-development'

type CoachRow = Pick<
  Database['public']['Tables']['coaches']['Row'],
  | 'id'
  | 'name'
  | 'club_current'
  | 'player_development_model'
  | 'academy_integration'
  | 'development_score'
  | 'intelligence_confidence'
>

type CoachDataProfileRow = Pick<
  Database['public']['Tables']['coach_data_profiles']['Row'],
  'coach_id' | 'minutes_u21' | 'minutes_21_24' | 'avg_squad_age' | 'recruitment_avg_age' | 'confidence_score'
>

type CoachDerivedMetricsRow = Pick<
  Database['public']['Tables']['coach_derived_metrics']['Row'],
  'coach_id' | 'pct_minutes_u23' | 'avg_squad_age'
>

type CoachRecruitmentHistoryRow = Pick<
  Database['public']['Tables']['coach_recruitment_history']['Row'],
  'coach_id' | 'player_age_at_signing'
>

type CoachStintRow = Pick<
  Database['public']['Tables']['coach_stints']['Row'],
  'coach_id' | 'notable_outcomes' | 'club_name' | 'started_on' | 'ended_on'
>

type SuggestionRow = Database['public']['Tables']['mandate_candidate_suggestions']['Row']

type SuggestionWithCoach = SuggestionRow & {
  coaches: { name: string | null; club_current: string | null } | null
}

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

function groupByCoach<T extends { coach_id: string }>(rows: T[] | null) {
  const map = new Map<string, T[]>()
  for (const row of rows ?? []) {
    const existing = map.get(row.coach_id) ?? []
    existing.push(row)
    map.set(row.coach_id, existing)
  }
  return map
}

function isMissingOptionalTable(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist|could not find.*table|schema cache/i.test(error.message ?? '')
  )
}

function optionalSourceRiskNotes(missingSources: string[]) {
  if (missingSources.length === 0) return []
  return [
    'Player level transfer and career progression evidence is not yet connected, so this should be treated as an early signal rather than a final judgement.',
  ]
}

export async function getMandateSuggestionsForUser(mandateId: string): Promise<SuggestionWithCoach[]> {
  const { supabase, user } = await requireUser()

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()

  if (!mandate) return []

  const { data } = await supabase
    .from('mandate_candidate_suggestions')
    .select(`
      id, user_id, mandate_id, coach_id, suggestion_type, status, score, confidence,
      source_coverage, reason_tags, evidence_snippets, risk_notes, scoring_version,
      generated_at, dismissed_at, added_at,
      coaches ( name, club_current )
    `)
    .eq('mandate_id', mandateId)
    .eq('user_id', user.id)
    .eq('suggestion_type', 'player_development')
    .neq('status', 'dismissed')
    .order('score', { ascending: false })
    .limit(20)

  return (data ?? []) as SuggestionWithCoach[]
}

export async function generatePlayerDevelopmentSuggestions(mandateId: string): Promise<{ error: string | null; count: number }> {
  const { supabase, user } = await requireUser()

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, strategic_objective')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()

  if (!mandate) return { error: 'Mandate not found', count: 0 }
  if (!isPlayerDevelopmentMandate(mandate.strategic_objective)) {
    return { error: 'This mandate is not marked as a player development brief.', count: 0 }
  }

  const [{ data: longlistRows }, { data: shortlistRows }, { data: existingSuggestions }, { data: coaches }] = await Promise.all([
    supabase.from('mandate_longlist').select('coach_id').eq('mandate_id', mandateId),
    supabase.from('mandate_shortlist').select('coach_id').eq('mandate_id', mandateId),
    supabase
      .from('mandate_candidate_suggestions')
      .select('coach_id, status')
      .eq('mandate_id', mandateId)
      .eq('user_id', user.id)
      .eq('suggestion_type', 'player_development'),
    supabase
      .from('coaches')
      .select('id, name, club_current, player_development_model, academy_integration, development_score, intelligence_confidence')
      .eq('user_id', user.id),
  ])

  const blockedCoachIds = new Set<string>([
    ...(longlistRows ?? []).map((row) => row.coach_id),
    ...(shortlistRows ?? []).map((row) => row.coach_id),
  ])
  const dismissedCoachIds = new Set(
    (existingSuggestions ?? [])
      .filter((row) => row.status === 'dismissed' || row.status === 'added_to_longlist')
      .map((row) => row.coach_id)
  )
  const eligibleCoaches = ((coaches ?? []) as CoachRow[]).filter(
    (coach) => !blockedCoachIds.has(coach.id) && !dismissedCoachIds.has(coach.id)
  )

  if (eligibleCoaches.length === 0) {
    revalidatePath(`/mandates/${mandateId}/workspace`)
    return { error: null, count: 0 }
  }

  const coachIds = eligibleCoaches.map((coach) => coach.id)
  const [profilesResult, derivedMetricsResult, recruitmentHistoryResult, stintsResult] = await Promise.all([
    supabase
      .from('coach_data_profiles')
      .select('coach_id, minutes_u21, minutes_21_24, avg_squad_age, recruitment_avg_age, confidence_score')
      .in('coach_id', coachIds),
    supabase
      .from('coach_derived_metrics')
      .select('coach_id, pct_minutes_u23, avg_squad_age')
      .in('coach_id', coachIds),
    supabase
      .from('coach_recruitment_history')
      .select('coach_id, player_age_at_signing')
      .in('coach_id', coachIds),
    supabase
      .from('coach_stints')
      .select('coach_id, notable_outcomes, club_name, started_on, ended_on')
      .in('coach_id', coachIds),
  ])

  if (profilesResult.error) return { error: profilesResult.error.message, count: 0 }
  if (stintsResult.error) return { error: stintsResult.error.message, count: 0 }

  const missingOptionalSources: string[] = []
  if (isMissingOptionalTable(derivedMetricsResult.error)) {
    missingOptionalSources.push('coach_derived_metrics')
  } else if (derivedMetricsResult.error) {
    return { error: derivedMetricsResult.error.message, count: 0 }
  }

  if (isMissingOptionalTable(recruitmentHistoryResult.error)) {
    missingOptionalSources.push('coach_recruitment_history')
  } else if (recruitmentHistoryResult.error) {
    return { error: recruitmentHistoryResult.error.message, count: 0 }
  }

  const profiles = profilesResult.data ?? []
  const derivedMetrics = derivedMetricsResult.error ? [] : derivedMetricsResult.data ?? []
  const recruitmentHistory = recruitmentHistoryResult.error ? [] : recruitmentHistoryResult.data ?? []
  const stints = stintsResult.data ?? []
  const sourceLimitations = optionalSourceRiskNotes(missingOptionalSources)

  const profileByCoach = new Map((profiles ?? []).map((profile) => [profile.coach_id, profile as CoachDataProfileRow]))
  const derivedByCoach = new Map((derivedMetrics ?? []).map((metric) => [metric.coach_id, metric as CoachDerivedMetricsRow]))
  const recruitmentByCoach = groupByCoach((recruitmentHistory ?? []) as CoachRecruitmentHistoryRow[])
  const stintsByCoach = groupByCoach((stints ?? []) as CoachStintRow[])

  const scored = eligibleCoaches
    .map((coach) => {
      const evidence: PlayerDevelopmentEvidence = {
        coach,
        dataProfile: profileByCoach.get(coach.id) ?? null,
        derivedMetrics: derivedByCoach.get(coach.id) ?? null,
        recruitmentHistory: recruitmentByCoach.get(coach.id) ?? [],
        stints: stintsByCoach.get(coach.id) ?? [],
      }
      return scorePlayerDevelopmentSuggestion(evidence)
    })
    .filter((suggestion): suggestion is NonNullable<typeof suggestion> => Boolean(suggestion))
    .filter((suggestion) => suggestion.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  const now = new Date().toISOString()

  await supabase
    .from('coach_development_signals')
    .delete()
    .eq('user_id', user.id)
    .eq('source_name', 'player_development_mvp')
    .in('coach_id', coachIds)

  const signalRows = scored.flatMap((suggestion) =>
    suggestion.signals.map((signal) => ({
      user_id: user.id,
      coach_id: signal.coachId,
      signal_type: signal.signalType,
      signal_label: signal.signalLabel,
      evidence_summary: signal.evidenceSummary,
      club_name: signal.clubName,
      raw_value: signal.rawValue,
      normalized_score: signal.normalizedScore,
      confidence: signal.confidence,
      source_table: signal.sourceTable,
      source_name: 'player_development_mvp',
      source_payload: signal.sourcePayload,
      generated_at: now,
    }))
  )

  if (signalRows.length > 0) {
    await supabase.from('coach_development_signals').insert(signalRows)
  }

  if (scored.length > 0) {
    const { error } = await supabase.from('mandate_candidate_suggestions').upsert(
      scored.map((suggestion) => ({
        user_id: user.id,
        mandate_id: mandateId,
        coach_id: suggestion.coachId,
        suggestion_type: 'player_development',
        status: 'suggested',
        score: suggestion.score,
        confidence: suggestion.confidence,
        source_coverage: suggestion.sourceCoverage,
        reason_tags: suggestion.reasonTags,
        evidence_snippets: suggestion.evidenceSnippets,
        risk_notes: [...sourceLimitations, ...suggestion.riskNotes].slice(0, 4),
        scoring_version: 'player_development_v1',
        generated_at: now,
        dismissed_at: null,
        added_at: null,
      })),
      { onConflict: 'mandate_id,coach_id,suggestion_type', ignoreDuplicates: false }
    )

    if (error) return { error: error.message, count: 0 }
  }

  revalidatePath(`/mandates/${mandateId}/workspace`)
  return { error: null, count: scored.length }
}

export async function addSuggestionToLonglist(suggestionId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()

  const { data: suggestion } = await supabase
    .from('mandate_candidate_suggestions')
    .select('id, mandate_id, coach_id, score, confidence, source_coverage, reason_tags, evidence_snippets, risk_notes, status')
    .eq('id', suggestionId)
    .eq('user_id', user.id)
    .single()

  if (!suggestion) return { error: 'Suggestion not found' }
  if (suggestion.status === 'dismissed') return { error: 'Suggestion was dismissed' }

  const [{ data: mandate }, { data: coach }, { data: existingLonglist }, { data: existingShortlist }] = await Promise.all([
    supabase.from('mandates').select('id').eq('id', suggestion.mandate_id).eq('user_id', user.id).single(),
    supabase.from('coaches').select('id').eq('id', suggestion.coach_id).eq('user_id', user.id).single(),
    supabase.from('mandate_longlist').select('id').eq('mandate_id', suggestion.mandate_id).eq('coach_id', suggestion.coach_id).maybeSingle(),
    supabase.from('mandate_shortlist').select('id').eq('mandate_id', suggestion.mandate_id).eq('coach_id', suggestion.coach_id).maybeSingle(),
  ])

  if (!mandate || !coach) return { error: 'Mandate or coach not found' }
  if (!existingLonglist && !existingShortlist) {
    const fitExplanation = {
      combined: suggestion.score,
      fitLabel: 'Development suggestion',
      summary: 'Evidence-backed player development suggestion generated from existing profile, pathway and career data.',
      strengths: suggestion.reason_tags,
      concerns: suggestion.risk_notes,
      evidenceSnippets: suggestion.evidence_snippets,
      sourceCoverage: suggestion.source_coverage,
      confidence: suggestion.confidence,
      suggestionType: 'player_development',
    }

    const { error } = await supabase.from('mandate_longlist').insert({
      mandate_id: suggestion.mandate_id,
      coach_id: suggestion.coach_id,
      ranking_score: suggestion.score,
      fit_explanation: JSON.stringify(fitExplanation),
    })

    if (error) {
      if (error.code !== '23505') return { error: error.message }
    }
  }

  await supabase
    .from('mandate_candidate_suggestions')
    .update({ status: 'added_to_longlist', added_at: new Date().toISOString() })
    .eq('id', suggestionId)
    .eq('user_id', user.id)

  revalidatePath(`/mandates/${suggestion.mandate_id}`)
  revalidatePath(`/mandates/${suggestion.mandate_id}/workspace`)
  revalidatePath(`/mandates/${suggestion.mandate_id}/longlist`)
  return { error: null }
}

export async function dismissSuggestion(suggestionId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()

  const { data: suggestion } = await supabase
    .from('mandate_candidate_suggestions')
    .select('id, mandate_id')
    .eq('id', suggestionId)
    .eq('user_id', user.id)
    .single()

  if (!suggestion) return { error: 'Suggestion not found' }

  const { error } = await supabase
    .from('mandate_candidate_suggestions')
    .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
    .eq('id', suggestionId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/mandates/${suggestion.mandate_id}/workspace`)
  return { error: null }
}
