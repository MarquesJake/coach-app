export const CLAIM_REVIEW_STATUSES = ['pending', 'accepted', 'rejected', 'applied'] as const
export const STATEMENT_TYPES = ['fact', 'opinion', 'allegation', 'analyst_inference'] as const
export const EVIDENCE_STRENGTHS = ['single_source', 'corroborated', 'disputed'] as const
export const FACT_CHECK_STATUSES = ['not_applicable', 'unverified', 'verified_fact', 'requires_legal'] as const
export const EXTERNAL_VISIBILITIES = ['internal_only', 'anonymised_external', 'attributed_external'] as const
export const CLAIM_RELATIONSHIP_TYPES = ['corroborates', 'contradicts', 'qualifies', 'supersedes', 'duplicates'] as const
export const BENCH_STAGES = ['nominated', 'researching', 'vetted', 'coach_engaged', 'placement_ready', 'paused'] as const
export const CAMPAIGN_CONTACT_STAGES = ['planned', 'contacted', 'scheduled', 'completed', 'declined'] as const
export const STAKEHOLDER_GROUPS = [
  'owners_ceos',
  'sporting_leadership',
  'coaching_staff',
  'players',
  'industry_network',
  'journalists',
  'agents',
  'other',
] as const

export const METHODOLOGY_CRITERIA = [
  'coach_profile',
  'performance_impact',
  'tactical_proposal',
  'match_management',
  'training_management',
  'players_development',
  'media_comms',
  'personality_profile',
  'cultural_org_fit',
] as const

export type ClaimReviewStatus = typeof CLAIM_REVIEW_STATUSES[number]
export type StatementType = typeof STATEMENT_TYPES[number]
export type EvidenceStrength = typeof EVIDENCE_STRENGTHS[number]
export type FactCheckStatus = typeof FACT_CHECK_STATUSES[number]
export type ExternalVisibility = typeof EXTERNAL_VISIBILITIES[number]
export type ClaimRelationshipType = typeof CLAIM_RELATIONSHIP_TYPES[number]
export type BenchStage = typeof BENCH_STAGES[number]
export type StakeholderGroup = typeof STAKEHOLDER_GROUPS[number]
export type MethodologyCriterion = typeof METHODOLOGY_CRITERIA[number]

export function isAllowedValue<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === 'string' && values.includes(value)
}

export function isClaimPromotable(claim: {
  reviewStatus: string
  statementType: string
  factCheckStatus: string
  externalVisibility: string
  restrictionStatus?: string | null
}): boolean {
  return (
    ['accepted', 'applied'].includes(claim.reviewStatus) &&
    claim.statementType !== 'allegation' &&
    claim.factCheckStatus !== 'requires_legal' &&
    claim.externalVisibility !== 'internal_only' &&
    (claim.restrictionStatus ?? 'active') === 'active'
  )
}

export function getSourceDiversity(
  rows: Array<{ contactId: string | null; stakeholderGroup: string | null }>
) {
  const contacts = new Set(rows.map((row) => row.contactId).filter(Boolean))
  const stakeholderGroups = new Set(rows.map((row) => row.stakeholderGroup).filter(Boolean))
  return { contactCount: contacts.size, stakeholderGroupCount: stakeholderGroups.size }
}

export type BenchEligibilityInput = {
  acceptedClaims: number
  firstHandRecommendationCount: number
  independentSourceCount: number
  stakeholderGroups: number
  criteriaCovered: number
  unresolvedLegalItems: number
  lastReviewedAt: string | null
  availabilityReviewedAt: string | null
  contractReviewedAt: string | null
  staffReviewedAt: string | null
  workPermitReviewedAt: string | null
}

export const CORPUS_PILOT_TARGETS = {
  conversations: 5,
  independentSources: 2,
  stakeholderGroups: 3,
  criteriaCovered: 6,
  corroboratedClaims: 1,
} as const

export type CorpusPilotProgressInput = {
  conversations: number
  independentSources: number
  stakeholderGroups: number
  criteriaCovered: number
  corroboratedClaims: number
  unresolvedLegalItems: number
}

export function calculateCorpusPilotProgress(input: CorpusPilotProgressInput) {
  const targets = CORPUS_PILOT_TARGETS
  const remaining = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`
  const weightedProgress = [
    Math.min(input.conversations / targets.conversations, 1) * 25,
    Math.min(input.independentSources / targets.independentSources, 1) * 20,
    Math.min(input.stakeholderGroups / targets.stakeholderGroups, 1) * 20,
    Math.min(input.criteriaCovered / targets.criteriaCovered, 1) * 25,
    Math.min(input.corroboratedClaims / targets.corroboratedClaims, 1) * 10,
  ]
  const missing: string[] = []
  if (input.conversations < targets.conversations) missing.push(remaining(targets.conversations - input.conversations, 'conversation'))
  if (input.independentSources < targets.independentSources) missing.push(remaining(targets.independentSources - input.independentSources, 'independent source'))
  if (input.stakeholderGroups < targets.stakeholderGroups) missing.push(remaining(targets.stakeholderGroups - input.stakeholderGroups, 'stakeholder group'))
  if (input.criteriaCovered < targets.criteriaCovered) missing.push(remaining(targets.criteriaCovered - input.criteriaCovered, 'methodology criterion', 'methodology criteria'))
  if (input.corroboratedClaims < targets.corroboratedClaims) missing.push('corroborated claim')
  if (input.unresolvedLegalItems > 0) missing.push('resolve legal-review items')

  const progressPercent = Math.round(weightedProgress.reduce((total, value) => total + value, 0))
  const pilotReady = missing.length === 0
  const phase = pilotReady
    ? 'evidence_ready'
    : input.conversations === 0 && input.criteriaCovered === 0
      ? 'not_started'
      : progressPercent >= 50
        ? 'building'
        : 'early'

  return { progressPercent, pilotReady, phase, missing }
}

function isWithinDays(value: string | null, days: number, now: Date) {
  if (!value) return false
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) && now.getTime() - timestamp <= days * 24 * 60 * 60 * 1000
}

export function calculateBenchEligibility(input: BenchEligibilityInput, now = new Date()) {
  const vettedMissing: string[] = []
  if (input.firstHandRecommendationCount < 1) vettedMissing.push('first-hand recommendation')
  if (input.independentSourceCount < 2) vettedMissing.push('independent corroboration')
  if (input.acceptedClaims < 2) vettedMissing.push('two accepted claims')

  const placementMissing = [...vettedMissing]
  if (input.stakeholderGroups < 3) placementMissing.push('three stakeholder groups')
  if (input.criteriaCovered < 6) placementMissing.push('six methodology criteria')
  if (input.unresolvedLegalItems > 0) placementMissing.push('resolve legal-review items')
  if (!isWithinDays(input.lastReviewedAt, 90, now)) placementMissing.push('review within 90 days')
  if (!input.availabilityReviewedAt) placementMissing.push('availability review')
  if (!input.contractReviewedAt) placementMissing.push('contract review')
  if (!input.staffReviewedAt) placementMissing.push('staff review')
  if (!input.workPermitReviewedAt) placementMissing.push('work-permit review')

  return {
    vetted: vettedMissing.length === 0,
    placementReady: placementMissing.length === 0,
    vettedMissing,
    placementMissing,
  }
}

export function validateClaimRelationship(sourceClaimId: string, targetClaimId: string, relationshipType: string) {
  if (sourceClaimId === targetClaimId) return 'A claim cannot relate to itself.'
  if (!isAllowedValue(CLAIM_RELATIONSHIP_TYPES, relationshipType)) return 'Invalid claim relationship.'
  return null
}

export function normalizeClaimSafety(input: {
  statementType: StatementType
  factCheckStatus: FactCheckStatus
  externalVisibility: ExternalVisibility
  usedInRecommendation: boolean
}) {
  if (input.statementType !== 'allegation') return input
  return {
    ...input,
    factCheckStatus: 'requires_legal' as const,
    externalVisibility: 'internal_only' as const,
    usedInRecommendation: false,
  }
}

export function buildPromotionSnapshot(input: {
  claimText: string
  evidenceSummary: string
  sourceRole: string
  proximity: string | null
  firstHand: boolean | null
  externalVisibility: string
  evidenceStrength: string
  statementType: string
  reviewedAt: string | null
  capturedAt: string
}) {
  return Object.freeze({
    claim_text: input.claimText,
    evidence_summary: input.evidenceSummary,
    source_role: input.sourceRole,
    proximity: input.proximity,
    first_hand: input.firstHand,
    external_visibility: input.externalVisibility,
    evidence_strength: input.evidenceStrength,
    statement_type: input.statementType,
    claim_reviewed_at: input.reviewedAt,
    captured_at: input.capturedAt,
  })
}
