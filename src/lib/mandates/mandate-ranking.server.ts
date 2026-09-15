import 'server-only'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rankResearchProfiles, positionLabel, type Ranking, type RankedCoach } from '@/lib/scoring/research/ranking'

export type MandateRanking = Ranking & {
  byCoachId: Map<string, RankedCoach>
  mandate: { id: string; club_id: string | null; strategic_objective: string | null; engagement_owner: string | null }
}

/** Loads the saved brief and coach records and runs the one shared ranking for a mandate. */
export async function loadMandateRanking(mandateId: string): Promise<MandateRanking | null> {
  const supabase = await createServerSupabaseClient()
  const [mandateRes, coachesRes] = await Promise.all([
    supabase.from('mandates')
      .select('id, club_id, strategic_objective, board_risk_appetite, engagement_owner, tactical_model_required, pressing_intensity_required, build_preference_required, decision_brief, clubs(id, current_manager)')
      .eq('id', mandateId).maybeSingle(),
    supabase.from('coaches').select('id,name').order('name').limit(1000),
  ])
  if (mandateRes.error || coachesRes.error || !mandateRes.data) return null
  const mandate = mandateRes.data as typeof mandateRes.data & { clubs?: { id?: string; current_manager?: string | null } | null }
  const ranking = rankResearchProfiles({
    brief: mandate,
    context: { mandateId: mandate.id, clubId: mandate.club_id ?? mandate.clubs?.id, incumbentName: mandate.clubs?.current_manager },
    records: coachesRes.data ?? [],
  })
  const byCoachId = new Map<string, RankedCoach>()
  for (const row of [...ranking.shortlist, ...ranking.notPursuing, ...ranking.researchGaps, ...(ranking.incumbent ? [ranking.incumbent] : [])]) {
    if (row.record) byCoachId.set(row.record.id, row)
  }
  return { ...ranking, byCoachId, mandate: { id: mandate.id, club_id: mandate.club_id, strategic_objective: mandate.strategic_objective, engagement_owner: mandate.engagement_owner } }
}

/** How a coach's calculated standing reads in one line, for tables and report headers. */
export function standingLabel(row: RankedCoach | undefined): string {
  if (!row) return 'Not in the researched pool — not ranked'
  if (row.eligibility.status === 'incumbent') return 'Current manager — benchmark only'
  if (!row.eligibility.recommendable) return `${row.eligibility.headline} · fit ${row.fit.score}`
  return `${positionLabel(row)} on the list · fit ${row.fit.score}`
}

const VERDICT_ORDER: Record<string, number> = { Proceed: 0, Target: 1, Shortlist: 2, Monitor: 3, Dismiss: 4 }
/**
 * An analyst verdict overrides the calculation when it backs a coach the ranking does not put in
 * the top three, or plays down one it does. Never shown as the algorithm's choice.
 */
export function isAnalystOverride(row: RankedCoach | undefined, verdict: string | null | undefined): boolean {
  if (!verdict) return false
  const backs = (VERDICT_ORDER[verdict] ?? 9) <= 1
  const topThree = !!row?.eligibility.recommendable && (row.position ?? 99) <= 3
  return backs !== topThree
}
