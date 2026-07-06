// Head Coach Assessment methodology: 9 criteria x 8 evidence methods.
// Mirrors the club-leadership assessment framework (June 2026).

export const ASSESSMENT_CRITERIA = [
  { key: 'coach_profile', num: 1, label: 'Coach Profile', question: 'Who is he and what would it take to hire him?' },
  { key: 'performance_impact', num: 2, label: 'Performance & Impact', question: 'What has he achieved, and how much was driven by him?' },
  { key: 'tactical_proposal', num: 3, label: 'Tactical Proposal', question: 'What football will he bring, and does it fit our squad?' },
  { key: 'match_management', num: 4, label: 'Match Management', question: 'Can he read and change games from the touchline?' },
  { key: 'training_management', num: 5, label: 'Training Management', question: 'How does he prepare and improve the team?' },
  { key: 'players_development', num: 6, label: 'Players Development', question: 'Can he improve players and create long-term value?' },
  { key: 'media_comms', num: 7, label: 'Media & Comms', question: 'Can he communicate, build trust and represent the club?' },
  { key: 'personality_profile', num: 8, label: 'Personality Profile', question: 'Who is he behind the coach, and what risks come with him?' },
  { key: 'cultural_org_fit', num: 9, label: 'Cultural & Org Fit', question: 'Does he fit who we are, and how likely is he to succeed here?' },
] as const

export type CriterionKey = (typeof ASSESSMENT_CRITERIA)[number]['key']

export const EVIDENCE_METHODS = [
  { key: 'desktop_research', label: 'Desktop research', short: 'Desk' },
  { key: 'data_analysis', label: 'Data analysis', short: 'Data' },
  { key: 'ai_generated', label: 'AI-generated', short: 'AI' },
  { key: 'media_review', label: 'Media review', short: 'Media' },
  { key: 'match_analysis', label: 'Match analysis', short: 'Match' },
  { key: 'training_observation', label: 'Training observation', short: 'Training' },
  { key: 'candidate_interview', label: 'Candidate interview', short: 'Interview' },
  { key: 'references', label: 'References', short: 'Refs' },
] as const

export type EvidenceMethodKey = (typeof EVIDENCE_METHODS)[number]['key']

export const ASSESSMENT_STATUSES = ['not_started', 'in_progress', 'complete'] as const
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number]

export const VERIFICATION_STATUSES = ['unverified', 'verified', 'disputed'] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export const RECOMMENDATION_VERDICTS = ['Proceed', 'Shortlist', 'Target', 'Monitor', 'Dismiss'] as const
export type RecommendationVerdict = (typeof RECOMMENDATION_VERDICTS)[number]

export function criterionLabel(key: string): string {
  return ASSESSMENT_CRITERIA.find((c) => c.key === key)?.label ?? key
}

export function methodLabel(key: string): string {
  return EVIDENCE_METHODS.find((m) => m.key === key)?.label ?? key
}
