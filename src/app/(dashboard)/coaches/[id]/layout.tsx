import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
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
import { getActivityForEntity } from '@/lib/db/activity'
import { Timeline } from '@/components/ui/timeline'
import { listCoachAgentsForCoach } from '@/lib/db/agentLinks'
import { getAgentsForUser } from '@/lib/db/agents'
import { CoachAgentsSection } from './_components/coach-agents-section'
import { getStageLabel } from '@/lib/constants/mandateStages'

// ── Pipeline stage badge colour ───────────────────────────────────────────
function layoutStageBadgeClass(stage: string | null): string {
  switch (stage) {
    case 'identified': return 'bg-zinc-500/15 text-zinc-500'
    case 'board_approved': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
    case 'shortlisting': return 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
    case 'interviews': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
    case 'final_2': return 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
    case 'offer': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    case 'closed': return 'bg-muted text-muted-foreground'
    default: return 'bg-muted text-muted-foreground'
  }
}

type MandatePresenceEntry = {
  id: string
  candidate_stage: string
  mandates: {
    id: string
    custom_club_name: string | null
    pipeline_stage: string | null
    clubs: { name: string | null } | null
  } | null
}

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
      // @ts-ignore - watchlist_coaches table not yet in DB schema
      const { data } = await supabase.from('watchlist_coaches').select('coach_id').eq('coach_id', params.id).eq('user_id', user.id).maybeSingle()
      return { onWatchlist: !!data }
    })(),
    getActivityForEntity('coach', params.id),
    // @ts-ignore - coach_derived_metrics table not yet in DB schema
    supabase.from('coach_derived_metrics').select('repeat_signings_count, repeat_agents_count, loan_reliance_score, network_density_score').eq('coach_id', params.id).maybeSingle(),
    supabase.from('intelligence_items').select('occurred_at').eq('user_id', user.id).eq('entity_type', 'coach').eq('entity_id', params.id).order('occurred_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  const lastIntelligenceAt = (lastIntelRes?.data as { occurred_at?: string | null } | null)?.occurred_at ?? null
  const { data: intelSourceRows } = await supabase.from('intelligence_items').select('source_name').eq('user_id', user.id).eq('entity_type', 'coach').eq('entity_id', params.id)
  const sourcesCount = new Set((intelSourceRows ?? []).map((r) => r.source_name).filter(Boolean)).size
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

  const [staffNetworkRes, mandatePresenceRes] = await Promise.all([
    supabase.from('coach_staff_history').select('id', { count: 'exact', head: true }).eq('coach_id', params.id),
    supabase
      .from('mandate_shortlist')
      .select(`
        id, candidate_stage,
        mandates!inner(
          id, custom_club_name, pipeline_stage,
          clubs(name)
        )
      `)
      .eq('coach_id', params.id)
      .eq('mandates.user_id', user.id),
  ])
  const { count: staffNetworkCount } = staffNetworkRes
  const layoutMandatePresence = (mandatePresenceRes.data ?? []) as unknown as MandatePresenceEntry[]

  let coachAgentsLinks: Array<{ id: string; agent_id: string; relationship_type: string; relationship_strength: number | null; confidence: number | null; notes: string | null; agents?: { id: string; full_name: string | null; agency_name: string | null } | null }> = []
  let agentsOptions: Array<{ id: string; full_name: string | null; agency_name: string | null }> = []
  try {
    const [linksRes, agentsRes] = await Promise.all([
      listCoachAgentsForCoach(user.id, params.id),
      getAgentsForUser(user.id),
    ])
    coachAgentsLinks = ((linksRes.data ?? []) as unknown) as typeof coachAgentsLinks
    agentsOptions = ((agentsRes.data ?? []) as Array<{ id: string; full_name: string | null; agency_name: string | null }>).map((a) => ({ id: a.id, full_name: a.full_name ?? null, agency_name: a.agency_name ?? null }))
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
          {/* ── Mandate Presence compact card ──────────────────────────── */}
          <div className="mt-3 rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mandate presence</p>
              <Link href="/mandates" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                + Add →
              </Link>
            </div>
            {layoutMandatePresence.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Not in any mandate ·{' '}
                <Link href="/mandates" className="underline underline-offset-2 hover:text-foreground">
                  Add →
                </Link>
              </p>
            ) : (
              <div className="space-y-1.5">
                {layoutMandatePresence.slice(0, 3).map((entry) => {
                  const m = entry.mandates
                  if (!m) return null
                  const clubName = m.custom_club_name ?? m.clubs?.name ?? 'Unknown'
                  return (
                    <Link
                      key={entry.id}
                      href={`/mandates/${m.id}/workspace`}
                      className="flex items-center justify-between gap-2 text-xs hover:text-foreground group"
                    >
                      <span className="text-foreground group-hover:underline truncate">{clubName}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${layoutStageBadgeClass(m.pipeline_stage)}`}
                      >
                        {getStageLabel(m.pipeline_stage ?? '')}
                      </span>
                    </Link>
                  )
                })}
                {layoutMandatePresence.length > 3 && (
                  <Link href={`/coaches/${params.id}/career`} className="text-[11px] text-muted-foreground hover:text-foreground">
                    +{layoutMandatePresence.length - 3} more →
                  </Link>
                )}
              </div>
            )}
          </div>
          <CoachAgentsSection coachId={params.id} links={coachAgentsLinks} agentsOptions={agentsOptions} />
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
