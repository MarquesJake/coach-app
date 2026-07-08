import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  MandateWorkspaceClient,
  type Mandate,
  type Candidate,
  type SeasonResult,
  type CoachingRecord,
  type SuggestedLonglistCandidate,
} from './_components/mandate-workspace-client'
import { MandateTabNav } from '../_components/mandate-tab-nav'
import { computeCoachingStability } from '@/lib/analysis/coaching-stability'
import { getMandateSuggestionsForUser } from '../../actions-suggestions'

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export default async function MandateWorkspacePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch mandate + full club intelligence
  const { data: mandate, error: mandateError } = await supabase
    .from('mandates')
    .select(`
      id, strategic_objective, board_risk_appetite, budget_band, succession_timeline,
      custom_club_name, status, priority,
      clubs (
        id, name, league, country, tier, ownership_model,
        tactical_model, pressing_model, build_model,
        board_risk_tolerance, strategic_priority,
        market_reputation, media_pressure, development_vs_win_now,
        environment_assessment, instability_risk,
        stadium, founded_year, current_manager, website, badge_url,
        notes, last_synced_at
      )
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (mandateError || !mandate) notFound()

  const clubId = (mandate.clubs as { id?: string } | null)?.id ?? null

  // Fetch shortlist with fit fields
  const { data: shortlist } = await supabase
    .from('mandate_shortlist')
    .select(`
      id, coach_id, candidate_stage, placement_probability, risk_rating, status, notes,
      network_source, network_recommender, network_relationship,
      fit_tactical, fit_cultural, fit_level, fit_communication, fit_network, fit_notes,
      coaches ( name, club_current, nationality )
    `)
    .eq('mandate_id', params.id)
    .order('created_at', { ascending: true })

  const shortlistRows = shortlist ?? []
  const shortlistCoachIds = shortlistRows.map((row) => row.coach_id)

  const [recommendationsRes, assessmentsRes, evidenceRes] = shortlistCoachIds.length
    ? await Promise.all([
        supabase
          .from('candidate_recommendations')
          .select('coach_id, verdict, confidence, summary, key_strengths, key_risks, mitigation')
          .eq('mandate_id', params.id)
          .in('coach_id', shortlistCoachIds),
        supabase
          .from('candidate_assessments')
          .select('coach_id, criterion, status')
          .eq('mandate_id', params.id)
          .in('coach_id', shortlistCoachIds),
        supabase
          .from('assessment_evidence')
          .select('coach_id, criterion')
          .eq('mandate_id', params.id)
          .in('coach_id', shortlistCoachIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const recommendationMap = new Map((recommendationsRes.data ?? []).map((row) => [row.coach_id, row]))
  const completeCountMap = new Map<string, number>()
  const coverageMap = new Map<string, Set<string>>()
  for (const row of assessmentsRes.data ?? []) {
    if (row.status === 'complete') {
      completeCountMap.set(row.coach_id, (completeCountMap.get(row.coach_id) ?? 0) + 1)
    }
  }
  for (const row of evidenceRes.data ?? []) {
    const set = coverageMap.get(row.coach_id) ?? new Set<string>()
    set.add(row.criterion)
    coverageMap.set(row.coach_id, set)
  }
  const enrichedShortlist = shortlistRows.map((row) => {
    const recommendation = recommendationMap.get(row.coach_id)
    return {
      ...row,
      recommendation_verdict: recommendation?.verdict ?? null,
      recommendation_confidence: recommendation?.confidence ?? null,
      recommendation_summary: recommendation?.summary ?? null,
      recommendation_key_strengths: recommendation?.key_strengths ?? null,
      recommendation_key_risks: recommendation?.key_risks ?? null,
      recommendation_mitigation: recommendation?.mitigation ?? null,
      assessment_complete_count: completeCountMap.get(row.coach_id) ?? 0,
      evidence_coverage_count: coverageMap.get(row.coach_id)?.size ?? 0,
    }
  })

  // Fetch club season results — up to 8 seasons, sorted oldest first for trajectory reading
  const { data: seasonResults } = clubId
    ? await supabase
        .from('club_season_results')
        .select('season, league_position, points, goals_for, goals_against')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .order('season', { ascending: true })
        .limit(8)
    : { data: [] }

  // Fetch club coaching history — up to 10, sorted oldest first
  const { data: coachingHistory } = clubId
    ? await supabase
        .from('club_coaching_history')
        .select('coach_name, start_date, end_date, reason_for_exit, style_tags, data_source')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .order('start_date', { ascending: true })
        .limit(10)
    : { data: [] }

  // Compute stability metrics server-side from the already-fetched coaching history
  const stabilityMetrics = computeCoachingStability(coachingHistory ?? [])

  // Fetch pre-computed longlist entries (scoring engine output)
  const { data: longlistRaw } = await supabase
    .from('mandate_longlist')
    .select('id, coach_id, ranking_score, fit_explanation')
    .eq('mandate_id', params.id)
    .gt('ranking_score', 0)
    .order('ranking_score', { ascending: false })
    .limit(30)

  // Enrich with coach display fields (name, status, club)
  const longlistEntries: import('@/app/(dashboard)/mandates/actions-longlist').LonglistEntryData[] = []
  if (longlistRaw?.length) {
    const coachIds = longlistRaw.map((e) => e.coach_id)
    const { data: coachMeta } = await supabase
      .from('coaches')
      .select('id, name, available_status, club_current')
      .in('id', coachIds)
      .eq('user_id', user.id)

    const coachMap = new Map((coachMeta ?? []).map((c) => [c.id, c]))
    for (const entry of longlistRaw) {
      const c = coachMap.get(entry.coach_id)
      longlistEntries.push({
        id: entry.id,
        coach_id: entry.coach_id,
        ranking_score: entry.ranking_score ?? 0,
        fit_explanation: entry.fit_explanation,
        coach_name: c?.name ?? null,
        coach_available_status: c?.available_status ?? null,
        coach_club: c?.club_current ?? null,
      })
    }
  }

  const suggestionsRaw = await getMandateSuggestionsForUser(params.id)
  const suggestions: SuggestedLonglistCandidate[] = suggestionsRaw.map((suggestion) => ({
    id: suggestion.id,
    coach_id: suggestion.coach_id,
    status: suggestion.status,
    score: suggestion.score,
    confidence: suggestion.confidence,
    source_coverage: suggestion.source_coverage,
    reason_tags: suggestion.reason_tags,
    evidence_snippets: toStringArray(suggestion.evidence_snippets),
    risk_notes: suggestion.risk_notes,
    generated_at: suggestion.generated_at,
    coaches: suggestion.coaches,
  }))

  return (
    <div>
      <MandateTabNav mandateId={params.id} />
      <MandateWorkspaceClient
        mandate={mandate as Mandate}
        shortlist={enrichedShortlist as Candidate[]}
        seasonResults={(seasonResults ?? []) as SeasonResult[]}
        coachingHistory={(coachingHistory ?? []) as CoachingRecord[]}
        stabilityMetrics={stabilityMetrics}
        longlistEntries={longlistEntries}
        suggestions={suggestions}
      />
    </div>
  )
}
