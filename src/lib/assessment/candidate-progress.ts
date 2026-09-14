type CandidateProgress = {
  recordedCount: number
  reviewedCount: number
  totalCriteria: number
  recordedLabel: string
  reviewedLabel: string
  nextAction: string
}

/** Demo dossier counts describe examples, never reviewed evidence or board readiness. */
export function candidateProgressLabels(progress: CandidateProgress, isIllustrative: boolean) {
  return isIllustrative ? {
    progress_label: `DEMO DATA · ${progress.recordedCount}/${progress.totalCriteria} demo assessment entries · ${progress.reviewedCount}/${progress.totalCriteria} demo criteria examples`,
    next_action: 'Replace demo criteria with sourced assessments and reviewed evidence before a board recommendation.',
  } : {
    progress_label: `${progress.recordedLabel} · ${progress.reviewedLabel}`,
    next_action: progress.nextAction,
  }
}
