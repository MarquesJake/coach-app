import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { CoachTabNav } from './_components/coach-tab-nav'
import { CoachCommandBar } from './_components/coach-command-bar'
import { ExecutiveSnapshotCard } from './_components/executive-snapshot-card'
import { ExecutiveSummaryCard } from './_components/executive-summary-card'
import { CoachDossierRail } from './_components/coach-dossier-rail'
import { computeCompleteness, computeCoachCompleteness } from './_lib/coach-completeness'
import { getCoachCoverageAction } from './actions'
import { getEvidenceCountForCoach } from '@/lib/db/fit'
import { computeIntelligenceConfidence } from '@/lib/intelligence-confidence'
import { computeCoachIntelSignals, type CoachIntelSignals } from '@/lib/intelligence/coach-intel-signals'
import { getActivityForEntity } from '@/lib/db/activity'
import { Timeline } from '@/components/ui/timeline'
import { listCoachAgentsForCoach } from '@/lib/db/agentLinks'
import { getAgentsForUser } from '@/lib/db/agents'
import { CoachAgentsSection } from './_components/coach-agents-section'
import { CoachAgentInteractions } from './_components/coach-agent-interactions'

export default async function CoachDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  const coachRecord = coach as Record<string, unknown>
  const [coverage, evidenceCount, stintCountRes, intelligenceConfidence, watchlistRes, activityResult, derivedRow, lastIntelRes] = await Promise.all([
    getCoachCoverageAction(params.id),
    getEvidenceCountForCoach(user.id, params.id),
    supabase.from('coach_stints').select('id', { count: 'exact', head: true }).eq('coach_id', params.id),
    computeIntelligenceConfidence(user.id, params.id),
    (async () => {
      const { data } = await supabase.from('watchlist_coaches').select('coach_id').eq('coach_id', params.id).eq('user_id', user.id).maybeSingle()
      return { onWatchlist: !!data }
    })(),
    getActivityForEntity('coach', params.id),
    supabase.from('coach_derived_metrics').select('repeat_signings_count, repeat_agents_count, loan_reliance_score, network_density_score').eq('coach_id', params.id).maybeSingle(),
    supabase.from('intelligence_items').select('occurred_at').eq('user_id', user.id).eq('entity_type', 'coach').eq('entity_id', params.id).order('occurred_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  const lastIntelligenceAt = (lastIntelRes?.data as { occurred_at?: string | null } | null)?.occurred_at ?? null
  const [{ data: intelSourceRows }, { data: intelSignalRows }] = await Promise.all([
    supabase.from('intelligence_items').select('source_name').eq('user_id', user.id).eq('entity_type', 'coach').eq('entity_id', params.id),
    supabase.from('intelligence_items').select('id, direction, confidence, source_tier, category, title, sensitivity, occurred_at, created_at').eq('user_id', user.id).eq('entity_type', 'coach').eq('entity_id', params.id).eq('is_deleted', false),
  ])
  const sourcesCount = new Set((intelSourceRows ?? []).map((r) => r.source_name).filter(Boolean)).size
  const intelSignals: CoachIntelSignals = computeCoachIntelSignals(
    (intelSignalRows ?? []).map((r) => ({
      id: r.id,
      direction: r.direction,
      confidence: r.confidence,
      source_tier: r.source_tier,
      category: r.category,
      title: r.title,
      sensitivity: r.sensitivity ?? 'Standard',
      occurred_at: r.occurred_at,
      created_at: r.created_at,
    }))
  )
  const dm = derivedRow?.data as { repeat_signings_count?: number | null; repeat_agents_count?: number | null; loan_reliance_score?: number | null; network_density_score?: number | null } | null
  const hasRecruitmentDensity = Boolean(
    dm &&
    (dm.repeat_signings_count != null || dm.repeat_agents_count != null || dm.loan_reliance_score != null || dm.network_density_score != null)
  )
  const { count: stintCount } = stintCountRes
  const onWatchlist = watchlistRes?.onWatchlist ?? false
  const coachCompleteness = computeCoachCompleteness(coachRecord, { stintCount: stintCount ?? 0, intelligenceCount: evidenceCount })
  const completeness = computeCompleteness(coachRecord)

  const coachActivity = (activityResult.data ?? []).map((row) => ({
    id: row.id,
    action_type: row.action_type,
    description: row.description,
    created_at: row.created_at,
  }))

  const { count: staffNetworkCount } = await supabase
    .from('coach_staff_history')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', params.id)

  let coachAgentsLinks: Array<{ id: string; agent_id: string; relationship_type: string; relationship_strength: number | null; confidence: number | null; notes: string | null; agents?: { id: string; full_name: string | null; agency_name: string | null } | null }> = []
  let agentsOptions: Array<{ id: string; full_name: string | null; agency_name: string | null }> = []
  let recentAgentInteractions: Array<{ id: string; occurred_at: string | null; summary: string | null; interaction_type: string | null; agents?: { full_name: string | null; agency_name: string | null } | null }> = []
  try {
    const [linksRes, agentsRes, interactionsRes] = await Promise.all([
      listCoachAgentsForCoach(user.id, params.id),
      getAgentsForUser(user.id),
      supabase
        .from('agent_interactions')
        .select('id, occurred_at, summary, interaction_type, agents(full_name, agency_name)')
        .eq('coach_id', params.id)
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .limit(5),
    ])
    coachAgentsLinks = ((linksRes.data ?? []) as unknown) as typeof coachAgentsLinks
    agentsOptions = ((agentsRes.data ?? []) as Array<{ id: string; full_name: string | null; agency_name: string | null }>).map((a) => ({ id: a.id, full_name: a.full_name ?? null, agency_name: a.agency_name ?? null }))
    recentAgentInteractions = ((interactionsRes.data ?? []) as unknown) as typeof recentAgentInteractions
  } catch {
    // coach_agents table may not exist before migration
  }

  const hasTactical = Boolean(
    (coachRecord.preferred_style as string)?.trim() ||
    (coachRecord.build_preference as string)?.trim() ||
    (coachRecord.pressing_intensity as string)?.trim()
  )
  const hasRisk = (coachRecord.media_risk as number | null) != null || (coachRecord.cultural_risk as number | null) != null
  const hasNetwork = (staffNetworkCount ?? 0) > 0
  const auditStatus =
    completeness >= 85 && hasTactical && hasRisk && hasNetwork
      ? 'complete'
      : !hasTactical
        ? 'missing_tactical'
        : !hasRisk
          ? 'missing_risk'
          : !hasNetwork
            ? 'missing_network'
            : 'complete'

  return (
    <div className="animate-fade-in">
      <CoachCommandBar coachId={params.id} coach={coachRecord} completenessPercent={coachCompleteness} evidenceCoverage={coverage.evidenceCoverage} verifiedCoverage={coverage.verifiedCoverage} profileAuditStatus={auditStatus} intelligenceWeightedConfidence={intelligenceConfidence.weightedConfidence} onWatchlist={onWatchlist} stintCount={stintCount ?? 0} intelligenceCount={evidenceCount} staffNetworkCount={staffNetworkCount ?? 0} lastIntelligenceAt={lastIntelligenceAt} intelligenceItemCount={intelligenceConfidence.itemCount} dataCoverage={{ signalsCount: coverage.evidenceCoverage, sourcesCount, lastUpdate: lastIntelligenceAt }} />
      <div className="flex gap-6 mt-4">
        <CoachDossierRail coach={coachRecord} />
        <div className="flex-1 min-w-0">
          <ExecutiveSnapshotCard
            coach={coachRecord}
            completenessPercent={coachCompleteness}
            intelligenceWeightedConfidence={intelligenceConfidence.weightedConfidence}
            intelSignals={intelSignals}
          />
          <CoachTabNav coachId={params.id} />
          <ExecutiveSummaryCard
            coach={coachRecord}
            completenessPercent={coachCompleteness}
            evidenceCount={evidenceCount}
            mandateFitScore={null}
            intelligenceWeightedConfidence={intelligenceConfidence.weightedConfidence}
            intelligenceItemCount={intelligenceConfidence.itemCount}
            hasRecruitmentDensity={hasRecruitmentDensity}
          />
          <CoachAgentsSection coachId={params.id} links={coachAgentsLinks} agentsOptions={agentsOptions} />
          <CoachAgentInteractions interactions={recentAgentInteractions} />
          {children}
          <section className="mt-6 rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-medium text-foreground mb-3">Activity Timeline</h2>
            <Timeline items={coachActivity} emptyMessage="No data available." />
          </section>
        </div>
      </div>
    </div>
  )
}
