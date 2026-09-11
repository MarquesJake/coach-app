type CircumstancesRelease = {
  portal_status: string; visibility_status: string; circumstances_visibility: string
  feasibility_review_status: string; feasibility_reviewed_at: string | null
}

/** A generic printable pack has no recipient-bound grant: on-request is not public release. */
export function canPrintCircumstances(profile: CircumstancesRelease | null | undefined) {
  return Boolean(profile && profile.portal_status === 'approved' && profile.visibility_status === 'shareable'
    && profile.circumstances_visibility === 'shareable' && profile.feasibility_review_status === 'verified'
    && profile.feasibility_reviewed_at)
}

type ReviewedEvidence = { id: string; verification_status: string; used_in_recommendation: boolean }
export function referencesForPack<T extends { evidence_id: string | null; verification_status: string }>(
  references: T[], evidence: ReviewedEvidence[],
): T[] {
  const byId = new Map(evidence.map(row => [row.id, row]))
  return references.flatMap(reference => {
    const review = reference.evidence_id ? byId.get(reference.evidence_id) : undefined
    return review?.used_in_recommendation && review.verification_status === 'verified'
      ? [{ ...reference, verification_status: review.verification_status }] : []
  })
}
