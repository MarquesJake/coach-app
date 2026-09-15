import 'server-only'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rankResearchProfiles, positionLabel, type Ranking, type RankedCoach } from '@/lib/scoring/research/ranking'
import type { CodedEvidence } from '@/lib/scoring/research/brief-fit'
import { isIllustrativeEvidence } from '@/lib/assessment/evidence-integrity'

export type MandateRanking = Ranking & {
  byCoachId: Map<string, RankedCoach>
  mandate: { id: string; club_id: string | null; strategic_objective: string | null; engagement_owner: string | null }
}

/** Loads the saved brief and coach records and runs the one shared ranking for a mandate. */
export async function loadMandateRanking(mandateId: string): Promise<MandateRanking | null> {
  const supabase = await createServerSupabaseClient()
  const [mandateRes, coachesRes, referencesRes, interviewsRes] = await Promise.all([
    supabase.from('mandates')
      .select('id, club_id, strategic_objective, board_risk_appetite, succession_timeline, engagement_owner, tactical_model_required, pressing_intensity_required, build_preference_required, decision_brief, clubs(id, current_manager)')
      .eq('id', mandateId).maybeSingle(),
    supabase.from('coaches').select('id,name').order('name').limit(1000),
    supabase.from('candidate_reference_answers').select('coach_id, criterion, reference_name, reference_role, answer, would_hire_again, verification_status, used_in_recommendation').eq('mandate_id', mandateId).eq('verification_status', 'verified'),
    supabase.from('candidate_interview_answers').select('coach_id, criterion, interviewer, answer, verification_status, used_in_recommendation').eq('mandate_id', mandateId).eq('verification_status', 'verified'),
  ])
  if (mandateRes.error || coachesRes.error || !mandateRes.data) return null
  const codedEvidence = codeEvidence(referencesRes.data ?? [], interviewsRes.data ?? [])
  const mandate = mandateRes.data as typeof mandateRes.data & { clubs?: { id?: string; current_manager?: string | null } | null }
  const ranking = rankResearchProfiles({
    brief: mandate,
    context: { mandateId: mandate.id, clubId: mandate.club_id ?? mandate.clubs?.id, incumbentName: mandate.clubs?.current_manager },
    records: coachesRes.data ?? [],
    codedEvidence,
  })
  const byCoachId = new Map<string, RankedCoach>()
  for (const row of [...ranking.shortlist, ...ranking.notPursuing, ...ranking.researchGaps, ...(ranking.incumbent ? [ranking.incumbent] : [])]) {
    if (row.record) byCoachId.set(row.record.id, row)
  }
  return { ...ranking, byCoachId, mandate: { id: mandate.id, club_id: mandate.club_id, strategic_objective: mandate.strategic_objective, engagement_owner: mandate.engagement_owner } }
}

const LEADERSHIP_AREAS = ['personality_profile', 'cultural_org_fit', 'media_comms', 'match_management']
const DEVELOPMENT_AREAS = ['players_development', 'training_management']
type Answer = { coach_id: string; criterion: string | null; answer: string | null; verification_status: string | null; used_in_recommendation: boolean | null; reference_name?: string | null; reference_role?: string | null; interviewer?: string | null; would_hire_again?: string | null }

/**
 * Checked, non-illustrative answers only. A fictional or illustrative reference never reaches the
 * score, however it is marked in the database.
 */
export function codeEvidence(references: readonly Answer[], interviews: readonly Answer[]): Map<string, CodedEvidence> {
  const map = new Map<string, CodedEvidence>()
  const get = (coachId: string) => map.get(coachId) ?? (map.set(coachId, { leadership: { answers: 0, references: 0, hireYes: 0, hireNo: 0, hireMixed: 0, sources: [] }, development: { answers: 0, sources: [] } }), map.get(coachId)!)
  const usable = (row: Answer) => row.verification_status === 'verified' && row.used_in_recommendation !== false && !isIllustrativeEvidence(row)
  const seenRefs = new Map<string, Set<string>>()
  for (const row of references) {
    if (!usable(row)) continue
    const entry = get(row.coach_id)
    const name = row.reference_name ?? 'reference'
    if (LEADERSHIP_AREAS.includes(row.criterion ?? '')) {
      entry.leadership.answers += 1
      const refs = seenRefs.get(row.coach_id) ?? new Set<string>()
      if (!refs.has(name)) { refs.add(name); entry.leadership.references += 1; entry.leadership.sources.push(`${name}${row.reference_role ? ` (${row.reference_role})` : ''}`) }
      seenRefs.set(row.coach_id, refs)
      if (row.would_hire_again === 'yes') entry.leadership.hireYes += 1
      if (row.would_hire_again === 'no') entry.leadership.hireNo += 1
      if (row.would_hire_again === 'mixed') entry.leadership.hireMixed += 1
    }
    if (DEVELOPMENT_AREAS.includes(row.criterion ?? '')) { entry.development.answers += 1; if (!entry.development.sources.includes(name)) entry.development.sources.push(name) }
  }
  for (const row of interviews) {
    if (!usable(row)) continue
    const entry = get(row.coach_id)
    const name = `interview${row.interviewer ? ` (${row.interviewer})` : ''}`
    if (LEADERSHIP_AREAS.includes(row.criterion ?? '')) { entry.leadership.answers += 1; if (!entry.leadership.sources.includes(name)) entry.leadership.sources.push(name) }
    if (DEVELOPMENT_AREAS.includes(row.criterion ?? '')) { entry.development.answers += 1; if (!entry.development.sources.includes(name)) entry.development.sources.push(name) }
  }
  return map
}

/** How a coach's calculated standing reads in one line, for tables and report headers. */
export function standingLabel(row: RankedCoach | undefined): string {
  if (!row) return 'Not in the researched pool — not ranked'
  if (row.eligibility.status === 'incumbent') return 'Current manager — benchmark only'
  if (!row.eligibility.recommendable) return `${row.eligibility.headline} · fit ${row.fit.score} · evidence ${row.fit.coverage.reliability}`
  return `${positionLabel(row)} on the list · fit ${row.fit.score} · evidence ${row.fit.coverage.reliability} (${row.fit.coverage.evidencedWeight}%)`
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
