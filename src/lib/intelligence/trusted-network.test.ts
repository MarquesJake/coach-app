import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BENCH_STAGES,
  buildPromotionSnapshot,
  calculateBenchEligibility,
  calculateCorpusPilotProgress,
  getSourceDiversity,
  isAllowedValue,
  isClaimPromotable,
  normalizeClaimSafety,
  validateClaimRelationship,
} from './trusted-network.ts'

test('status validation accepts only contracted bench stages', () => {
  assert.equal(isAllowedValue(BENCH_STAGES, 'vetted'), true)
  assert.equal(isAllowedValue(BENCH_STAGES, 'approved'), false)
})

test('promotion snapshots remain unchanged when the source claim changes later', () => {
  const source = { claimText: 'Original claim', evidenceSummary: 'Original evidence' }
  const snapshot = buildPromotionSnapshot({
    ...source,
    sourceRole: 'Former player',
    proximity: 'direct',
    firstHand: true,
    externalVisibility: 'anonymised_external',
    evidenceStrength: 'corroborated',
    statementType: 'opinion',
    reviewedAt: '2026-07-14T12:00:00Z',
    capturedAt: '2026-07-14T12:01:00Z',
  })
  source.claimText = 'Later edit'
  assert.equal(snapshot.claim_text, 'Original claim')
  assert.equal(Object.isFrozen(snapshot), true)
})

test('bench eligibility requires corroboration, coverage and current operational reviews', () => {
  const now = new Date('2026-07-14T12:00:00Z')
  const result = calculateBenchEligibility({
    acceptedClaims: 7,
    firstHandRecommendationCount: 1,
    independentSourceCount: 3,
    stakeholderGroups: 3,
    criteriaCovered: 6,
    unresolvedLegalItems: 0,
    lastReviewedAt: '2026-07-10T12:00:00Z',
    availabilityReviewedAt: '2026-07-10T12:00:00Z',
    contractReviewedAt: '2026-07-10T12:00:00Z',
    staffReviewedAt: '2026-07-10T12:00:00Z',
    workPermitReviewedAt: '2026-07-10T12:00:00Z',
  }, now)
  assert.equal(result.vetted, true)
  assert.equal(result.placementReady, true)
})

test('corpus pilot progress exposes operational gaps without exceeding 100 percent', () => {
  const result = calculateCorpusPilotProgress({
    conversations: 8,
    independentSources: 3,
    stakeholderGroups: 2,
    criteriaCovered: 4,
    corroboratedClaims: 2,
    unresolvedLegalItems: 0,
  })
  assert.equal(result.progressPercent, 85)
  assert.equal(result.pilotReady, false)
  assert.deepEqual(result.missing, ['1 stakeholder group', '2 methodology criteria'])
})

test('corpus pilot requires complete source coverage and no unresolved legal items', () => {
  const result = calculateCorpusPilotProgress({
    conversations: 5,
    independentSources: 2,
    stakeholderGroups: 3,
    criteriaCovered: 6,
    corroboratedClaims: 1,
    unresolvedLegalItems: 1,
  })
  assert.equal(result.progressPercent, 100)
  assert.equal(result.pilotReady, false)
  assert.deepEqual(result.missing, ['resolve legal-review items'])
})

test('source diversity deduplicates contacts and stakeholder groups', () => {
  assert.deepEqual(getSourceDiversity([
    { contactId: 'a', stakeholderGroup: 'players' },
    { contactId: 'a', stakeholderGroup: 'players' },
    { contactId: 'b', stakeholderGroup: 'coaching_staff' },
  ]), { contactCount: 2, stakeholderGroupCount: 2 })
})

test('claim relationships reject self-links and unknown relationship types', () => {
  assert.equal(validateClaimRelationship('a', 'a', 'corroborates'), 'A claim cannot relate to itself.')
  assert.equal(validateClaimRelationship('a', 'b', 'invented'), 'Invalid claim relationship.')
  assert.equal(validateClaimRelationship('a', 'b', 'contradicts'), null)
})

test('allegations are forced into legal review and excluded', () => {
  const safe = normalizeClaimSafety({
    statementType: 'allegation',
    factCheckStatus: 'unverified',
    externalVisibility: 'attributed_external',
    usedInRecommendation: true,
  })
  assert.equal(safe.factCheckStatus, 'requires_legal')
  assert.equal(safe.externalVisibility, 'internal_only')
  assert.equal(safe.usedInRecommendation, false)
  assert.equal(isClaimPromotable({
    reviewStatus: 'accepted',
    statementType: safe.statementType,
    factCheckStatus: safe.factCheckStatus,
    externalVisibility: safe.externalVisibility,
  }), false)
})
