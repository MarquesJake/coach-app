export function summariseRecordedFit(signals: Array<string | null | undefined>): 'strong' | 'moderate' | 'weak' | 'unknown' {
  const scored = signals.filter((signal) => ['Strong', 'Moderate', 'Weak'].includes(signal ?? ''))
  if (!scored.length) return 'unknown'
  if (scored.includes('Weak')) return 'weak'
  if (scored.every((signal) => signal === 'Strong')) return 'strong'
  return 'moderate'
}

export function canPresentBoardProfile(profile: {
  sourceCoverage: number
  hasHumanRecommendation: boolean
}): boolean {
  return profile.hasHumanRecommendation || profile.sourceCoverage > 0
}

export function recordedBoardReasons(reasons: string[]): string[] {
  const recorded = reasons.map((reason) => reason.trim()).filter(Boolean)
  return recorded.length ? recorded.slice(0, 3) : ['No supporting reasons recorded. Complete the assessment before drawing a conclusion.']
}
