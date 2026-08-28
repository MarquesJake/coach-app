export type DecisionCoverageCandidate = {
  evidenceCoverageCount?: number | null
  assessmentCompleteCount?: number | null
  recommendationVerdict?: string | null
}

export type DecisionCoverageSummary = {
  candidateCount: number
  evidenceReadyCount: number
  fullyAssessedCount: number
  verdictCount: number
  status: 'empty' | 'developing' | 'board_ready'
}

export function summarizeDecisionCoverage(
  candidates: DecisionCoverageCandidate[],
  criteriaCount = 9
): DecisionCoverageSummary {
  const candidateCount = candidates.length
  const evidenceReadyCount = candidates.filter(
    (candidate) => (candidate.evidenceCoverageCount ?? 0) >= criteriaCount
  ).length
  const fullyAssessedCount = candidates.filter(
    (candidate) => (candidate.assessmentCompleteCount ?? 0) >= criteriaCount
  ).length
  const verdictCount = candidates.filter(
    (candidate) => Boolean(candidate.recommendationVerdict?.trim())
  ).length

  const boardReady =
    candidateCount > 0 &&
    evidenceReadyCount === candidateCount &&
    fullyAssessedCount === candidateCount &&
    verdictCount === candidateCount

  return {
    candidateCount,
    evidenceReadyCount,
    fullyAssessedCount,
    verdictCount,
    status: candidateCount === 0 ? 'empty' : boardReady ? 'board_ready' : 'developing',
  }
}
