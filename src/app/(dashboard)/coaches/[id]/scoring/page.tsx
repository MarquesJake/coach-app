import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { assertRouteQueries } from '@/lib/coaches/route-audit'
import { getLatestCoachScore } from '@/lib/db/scoring'
import { ScoringSection } from '../_components/scoring-section'
import { computeCompleteness } from '../_lib/coach-completeness'
import { getCoachCoverageAction } from '../actions'
import { computeIntelligenceConfidence } from '@/lib/intelligence-confidence'

export const metadata = { title: 'Scoring' }


export default async function CoachScoringPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(params.id)
  if (error) throw new Error('Coach profile could not be loaded. Reload before making changes.')
  if (!coach) notFound()

  const { count: evidenceCount, error: evidenceError } = await supabase
    .from('intelligence_items')
    .select('*', { count: 'exact', head: true })
    .eq('entity_type', 'coach')
    .eq('entity_id', params.id)

  const coachRecord = coach as Record<string, unknown>
  const completeness = computeCompleteness(coachRecord)
  const [coverage, intelligenceConfidence, latestScore] = await Promise.all([
    getCoachCoverageAction(params.id),
    computeIntelligenceConfidence(user.id, params.id),
    getLatestCoachScore(user.id, params.id),
  ])

  assertRouteQueries('Scoring records', { error: evidenceError }, latestScore)

  return (
    <ScoringSection
      coachId={params.id}
      coach={coachRecord}
      evidenceCount={evidenceCount ?? 0}
      completenessPercent={completeness}
      evidenceCoverage={coverage.evidenceCoverage}
      verifiedCoverage={coverage.verifiedCoverage}
      intelligenceWeightedConfidence={intelligenceConfidence.weightedConfidence}
      versionedScores={latestScore.data}
    />
  )
}
