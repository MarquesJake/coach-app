import { researchProfileForName } from '../scoring/research/catalogue.ts'
import { findCoachDuplicateGroups, type DuplicateReviewCoach } from './duplicate-review.ts'

type IdentityReview = { coach_a_id: string; coach_b_id: string; decision: string; canonical_coach_id: string | null }

export function isRecordedAvailable(coach: { available_status?: string | null }): boolean {
  return coach.available_status === 'Available'
}

/** Research depth is not verification. Unresolved identities and source records stay out of working choices. */
export function researchedCoachChoices<T extends DuplicateReviewCoach>(coaches: T[], counts: Record<string, { researchCount: number }>, reviews: IdentityReview[]): T[] {
  const blocked = new Set<string>()
  const key = (a: string, b: string) => [a, b].sort().join(':')
  const decisions = new Map(reviews.map(review => [key(review.coach_a_id, review.coach_b_id), review]))
  for (const review of reviews) {
    if (review.decision === 'canonical_selected') {
      for (const id of [review.coach_a_id, review.coach_b_id]) if (id !== review.canonical_coach_id) blocked.add(id)
    }
  }
  for (const group of findCoachDuplicateGroups(coaches)) {
    for (let i = 0; i < group.coaches.length; i++) for (let j = i + 1; j < group.coaches.length; j++) {
      const a = group.coaches[i].id, b = group.coaches[j].id
      if (!decisions.has(key(a, b))) { blocked.add(a); blocked.add(b) }
    }
  }
  return coaches.filter(coach => ((counts[coach.id]?.researchCount ?? 0) > 0 || Boolean(researchProfileForName(coach.name))) && !blocked.has(coach.id))
}

export function selectedComparisonIds(requested: string | undefined, candidates: string[], allowed: string[], max = 4) {
  const ids = requested === undefined ? candidates : requested.split(/[\s,]+/)
  const eligible = new Set(allowed)
  return [...new Set(ids)].filter(id => eligible.has(id)).slice(0, max)
}
