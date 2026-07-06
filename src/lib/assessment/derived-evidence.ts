import type { CriterionKey, EvidenceMethodKey } from './criteria'

// Evidence derived automatically from data already in the platform.
// Shown alongside manually captured evidence in the coverage matrix,
// flagged as auto-derived rather than stored in assessment_evidence.

export type DerivedEvidence = {
  criterion: CriterionKey
  method: EvidenceMethodKey
  title: string
  detail: string | null
  href: string | null
}

type TacticalReportRow = { id: string; match_observed: string | null; formation_used: string | null; overall_tactical_score: number | null }
type BackgroundCheckRow = { id: string; media_reputation: string | null; overall_risk_rating: number | null; last_verified_at: string | null }
type ReferenceRow = { id: string; reference_name: string; reference_role: string | null; rating: number | null }
type StintRow = { club_name: string; points_per_game: number | null; league: string | null }
type CoachRow = { id: string; tactical_identity?: string | null; preferred_style?: string | null }

export function deriveEvidence(input: {
  coach: CoachRow
  tacticalReports: TacticalReportRow[]
  backgroundChecks: BackgroundCheckRow[]
  references: ReferenceRow[]
  stints: StintRow[]
}): DerivedEvidence[] {
  const derived: DerivedEvidence[] = []
  const coachHref = `/coaches/${input.coach.id}`

  for (const report of input.tacticalReports) {
    derived.push({
      criterion: 'tactical_proposal',
      method: 'match_analysis',
      title: report.match_observed
        ? `Tactical report — ${report.match_observed}`
        : 'Tactical report on file',
      detail: report.formation_used ? `Formation observed: ${report.formation_used}` : null,
      href: coachHref,
    })
    derived.push({
      criterion: 'match_management',
      method: 'match_analysis',
      title: report.match_observed
        ? `In-game observations — ${report.match_observed}`
        : 'In-game observations on file',
      detail: report.overall_tactical_score !== null ? `Overall tactical score: ${report.overall_tactical_score}` : null,
      href: coachHref,
    })
  }

  for (const check of input.backgroundChecks) {
    derived.push({
      criterion: 'media_comms',
      method: 'media_review',
      title: 'Background check — media & reputation',
      detail: check.media_reputation,
      href: coachHref,
    })
    derived.push({
      criterion: 'personality_profile',
      method: 'media_review',
      title: 'Background check — character & risk',
      detail: check.overall_risk_rating !== null ? `Overall risk rating: ${check.overall_risk_rating}` : null,
      href: coachHref,
    })
  }

  for (const ref of input.references) {
    derived.push({
      criterion: 'personality_profile',
      method: 'references',
      title: `Reference — ${ref.reference_name}${ref.reference_role ? ` (${ref.reference_role})` : ''}`,
      detail: ref.rating !== null ? `Rating: ${ref.rating}` : null,
      href: coachHref,
    })
  }

  const stintsWithPpg = input.stints.filter((s) => s.points_per_game !== null)
  if (stintsWithPpg.length > 0) {
    derived.push({
      criterion: 'performance_impact',
      method: 'data_analysis',
      title: `Career record — PPG across ${stintsWithPpg.length} stint${stintsWithPpg.length === 1 ? '' : 's'}`,
      detail: stintsWithPpg
        .map((s) => `${s.club_name}: ${s.points_per_game?.toFixed(2)}`)
        .join(' · '),
      href: coachHref,
    })
  }

  if (input.coach.tactical_identity || input.coach.preferred_style) {
    derived.push({
      criterion: 'tactical_proposal',
      method: 'desktop_research',
      title: 'Tactical identity on profile',
      detail: input.coach.tactical_identity ?? input.coach.preferred_style ?? null,
      href: coachHref,
    })
  }

  return derived
}
