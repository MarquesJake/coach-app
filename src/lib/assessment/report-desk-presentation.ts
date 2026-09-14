import { candidateProgressLabels } from './candidate-progress.ts'

type Progress = Parameters<typeof candidateProgressLabels>[0] & {
  recommendationLabel: string
  confidence: number | null
}

/** Saved demo text is historical content, never a live recommendation or release signal. */
export function reportDeskPresentation(progress: Progress, demo: boolean, benchmark: boolean, recorded: boolean) {
  const legacy = demo || benchmark
  return {
    ...candidateProgressLabels(progress, legacy),
    legacy,
    canPresentRecommendation: recorded && !legacy,
    badge: benchmark ? 'Current-manager benchmark · not a successor candidate' : demo ? 'DEMO DATA · legacy assessment' : recorded ? 'Human recommendation recorded' : 'Draft evidence',
    verdictLabel: legacy ? 'Legacy saved example · not a current recommendation' : progress.recommendationLabel,
    summaryLabel: legacy ? 'Legacy saved text · not current advice' : 'Recommendation summary',
  }
}
