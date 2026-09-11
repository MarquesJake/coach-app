const illustrativeMarker = /\b(?:illustrative|synthetic|fictional|invented|demo\s+(?:data|assessment|composite|fixture|profile|scenario)|not\s+(?:a\s+)?real\s+(?:quote|interview|reference|coach\s+file))\b/i

/** Inspect content/provenance, never names alone or arbitrary object metadata. */
export function isIllustrativeEvidence(record: object): boolean {
  const values = record as Record<string, unknown>
  return [
    'title', 'detail', 'source', 'source_label', 'description', 'summary',
    'answer', 'reference_role', 'evidence_summary', 'claimed_value',
    'due_diligence_summary', 'compliance_notes', 'preview_summary', 'source_name', 'source_notes',
    'football_identity', 'personal_statement', 'short_bio',
    'key_strengths', 'key_risks', 'mitigation', 'release_notes', 'sensitive_notes',
    'presentation_summary', 'video_summary', 'training_week', 'session_design_principles',
  ].some((key) => typeof values[key] === 'string' && illustrativeMarker.test(values[key] as string))
}

export function isVerifiedEvidence(record: { verification_status?: string | null }): boolean {
  return record.verification_status === 'verified' && !isIllustrativeEvidence(record)
}

export function canPublishRecommendation(
  coach: object | null | undefined,
  recommendation: { verdict?: string | null; summary?: string | null } | null | undefined,
): boolean {
  return Boolean(coach && recommendation?.verdict?.trim() && recommendation.summary?.trim()
    && !isIllustrativeEvidence(coach) && !isIllustrativeEvidence(recommendation))
}
