import { BriefMatches } from '@/components/mandates/brief-matches'
import { MandateBriefNotice } from '@/components/clubs/mandate-brief-notice'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  MandateWorkspaceClient,
  type Mandate,
  type Candidate,
  type SeasonResult,
  type CoachingRecord,
  type SuggestedLonglistCandidate,
} from '../workspace/_components/mandate-workspace-client'
import { MandateTabNav } from '../_components/mandate-tab-nav'
import { computeCoachingStability } from '@/lib/analysis/coaching-stability'
import { getMandateSuggestionsForUser } from '../../actions-suggestions'
import { deriveAssessmentStatus } from '@/lib/assessment/status'
import { candidateProgressLabels } from '@/lib/assessment/candidate-progress'
import { deepDiveFor, isCurrentManagerBenchmark } from '@/lib/assessment/deep-dive'
import { loadMandateRanking } from '@/lib/mandates/mandate-ranking.server'
import { positionLabel } from '@/lib/scoring/research/ranking'

export const metadata = { title: 'Candidates' }


function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export default async function MandateCandidatesPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch mandate + full club intelligence
  const { data: mandate, error: mandateError } = await supabase
    .from('mandates')
    .select(`
      id, strategic_objective, board_risk_appetite, budget_band, succession_timeline,
      decision_brief, tactical_model_required, pressing_intensity_required, build_preference_required,
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
    .single()

  if (mandateError || !mandate) notFound()

  const clubId = (mandate.clubs as { id?: string } | null)?.id ?? null

  // Fetch shortlist with fit fields
  const { data: shortlist, error: shortlistError } = await supabase
    .from('mandate_shortlist')
    .select(`
      id, coach_id, candidate_stage, placement_probability, risk_rating, status, notes,
      network_source, network_recommender, network_relationship,
      fit_tactical, fit_cultural, fit_level, fit_communication, fit_network, fit_notes,
      coaches ( name, club_current, nationality, due_diligence_summary, compliance_notes )
    `)
    .eq('mandate_id', params.id)
    .order('created_at', { ascending: true })

  if (shortlistError) throw new Error('Candidates didn’t load. Refresh to try again — nothing has been changed.')
  const shortlistRows = (shortlist ?? []).filter(row => !isCurrentManagerBenchmark(params.id, row.coach_id))
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
          .select('coach_id, criterion, status, summary')
          .eq('mandate_id', params.id)
          .in('coach_id', shortlistCoachIds),
        supabase
          .from('assessment_evidence')
          .select('coach_id, criterion, title, detail, source, verification_status')
          .eq('mandate_id', params.id)
          .in('coach_id', shortlistCoachIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }]

  if (recommendationsRes.error || assessmentsRes.error || evidenceRes.error) {
    throw new Error('Candidate progress could not be loaded. Refresh to retry.')
  }

  const recommendationMap = new Map((recommendationsRes.data ?? []).map(row => [row.coach_id, row]))
  const enrichedShortlist = shortlistRows.map((row) => {
    const recordedRecommendation = recommendationMap.get(row.coach_id)
    const progress = deriveAssessmentStatus({
      coach: row.coaches,
      assessments: (assessmentsRes.data ?? []).filter(item => item.coach_id === row.coach_id),
      evidence: (evidenceRes.data ?? []).filter(item => item.coach_id === row.coach_id),
      recommendation: recordedRecommendation,
    })
    const recommendation = progress.recommendationRecorded ? recordedRecommendation : null
    const isIllustrative = progress.illustrativeProfile || !!deepDiveFor(row.coach_id, params.id)
    return {
      ...row,
      is_illustrative: isIllustrative,
      recommendation_verdict: recommendation?.verdict ?? null,
      recommendation_confidence: progress.confidence,
      recommendation_summary: recommendation?.summary ?? null,
      recommendation_key_strengths: recommendation?.key_strengths ?? null,
      recommendation_key_risks: recommendation?.key_risks ?? null,
      recommendation_mitigation: recommendation?.mitigation ?? null,
      assessment_complete_count: progress.recordedCount,
      evidence_coverage_count: progress.reviewedCount,
      ...candidateProgressLabels(progress, isIllustrative),
    }
  })

  // Fetch club season results — up to 8 seasons, sorted oldest first for trajectory reading
  const { data: seasonResults, error: seasonError } = clubId
    ? await supabase
        .from('club_season_results')
        .select('season, league_position, points, goals_for, goals_against')
        .eq('club_id', clubId)
        .order('season', { ascending: true })
        .limit(8)
    : { data: [], error: null }

  // Fetch club coaching history — up to 10, sorted oldest first
  const { data: coachingHistory, error: historyError } = clubId
    ? await supabase
        .from('club_coaching_history')
        .select('coach_name, start_date, end_date, reason_for_exit, style_tags, data_source')
        .eq('club_id', clubId)
        .order('start_date', { ascending: true })
        .limit(10)
    : { data: [], error: null }

  if (seasonError || historyError) throw new Error('Club background could not be loaded. Refresh before using the candidate workspace.')

  // Compute stability metrics server-side from the already-fetched coaching history
  const stabilityMetrics = computeCoachingStability(coachingHistory ?? [])

  // The market view is the same calculation as the ranking above — never a second scoring path.
  const ranking = await loadMandateRanking(params.id)
  if (!ranking) throw new Error('The ranking could not be loaded. Refresh to retry — nothing has been changed.')
  const longlistEntries: import('@/app/(dashboard)/mandates/actions-longlist').LonglistEntryData[] = (ranking?.shortlist ?? [])
    .filter(row => row.record && !isCurrentManagerBenchmark(params.id, row.record.id))
    .slice(0, 30)
    .map(row => ({
      id: `ranking-${row.record!.id}`,
      coach_id: row.record!.id,
      ranking_score: row.fit.score,
      fit_explanation: `${positionLabel(row)} on the brief · ${row.aheadOfNext ?? row.eligibility.headline}`,
      coach_name: row.profile.name,
      coach_available_status: row.eligibility.headline,
      coach_club: row.eligibility.employment?.club ?? null,
    }))

  const suggestionsRaw = await getMandateSuggestionsForUser(params.id)
  const suggestions: SuggestedLonglistCandidate[] = suggestionsRaw.filter(suggestion => !isCurrentManagerBenchmark(params.id, suggestion.coach_id)).map((suggestion) => ({
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
      <MandateBriefNotice mandateId={params.id} />
      <BriefMatches mandate={mandate} />
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
