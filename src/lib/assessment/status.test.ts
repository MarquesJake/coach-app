import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ASSESSMENT_CRITERIA } from './criteria.ts'
import { deriveAssessmentStatus } from './status.ts'

const assessments = ASSESSMENT_CRITERIA.map(c => ({ criterion: c.key, status: 'complete', summary: 'Recorded finding' }))
const evidence = ASSESSMENT_CRITERIA.map(c => ({ criterion: c.key, verification_status: 'verified', source: 'Reviewed source' }))
const recommendation = { verdict: 'Proceed', summary: 'Human judgement with conditions', confidence: 83 }

test('audit regression: nine complete rows with one illustration means eight recorded assessments', () => {
  const rows = assessments.map((a, i) => i === 0 ? { ...a, summary: 'Illustrative assessment' } : a)
  const status = deriveAssessmentStatus({ coach: {}, assessments: rows, evidence: evidence.map(e => ({ ...e, source: 'Synthetic fixture' })), recommendation: { ...recommendation, summary: 'Illustrative recommendation' } })
  assert.equal(status.recordedCount, 8)
  assert.equal(status.illustrativeCount, 1)
  assert.equal(status.reviewedCount, 0)
  assert.equal(status.recommendationRecorded, false)
  assert.equal(status.confidence, null)
  assert.equal(status.recommendationLabel, 'Illustrative recommendation excluded')
  assert.match(status.nextAction, /Review evidence for/)
})

test('criterion counts deduplicate rows, ignore unknown criteria and never count disputed or unreviewed evidence', () => {
  const status = deriveAssessmentStatus({ coach: {},
    assessments: [...assessments, ...assessments, { criterion: 'legacy', status: 'complete' }],
    evidence: [evidence[0], evidence[0], { criterion: 'legacy', verification_status: 'verified' },
      { ...evidence[1], verification_status: 'disputed' }, { ...evidence[2], verification_status: 'unverified' }],
  })
  assert.equal(status.recordedCount, 9)
  assert.equal(status.reviewedCount, 1)
  assert.equal(status.totalCriteria, 9)
})

test('illustrative coach provenance excludes otherwise real-looking rows and recommendations', () => {
  const status = deriveAssessmentStatus({ coach: { compliance_notes: 'Illustrative profile' }, assessments, evidence, recommendation })
  assert.equal(status.recordedCount, 0)
  assert.equal(status.reviewedCount, 0)
  assert.equal(status.illustrativeCount, 9)
  assert.equal(status.recommendationRecorded, false)
  assert.equal(status.confidence, null)
})

test('unknown confidence is not zero; a recorded recommendation still requires separate release review', () => {
  const status = deriveAssessmentStatus({ coach: {}, assessments, evidence, recommendation: { ...recommendation, confidence: null } })
  assert.equal(status.recommendationRecorded, true)
  assert.equal(status.confidence, null)
  assert.match(status.nextAction, /recipient permissions/)
  assert.equal(status.coverLabel, 'Draft report - internal review only')
  assert.equal(deriveAssessmentStatus({ coach: {}, recommendation: { ...recommendation, confidence: 0 } }).confidence, 0)
})

test('illustrative risks, blank summaries and absent recommendations cannot present a real decision', () => {
  const withIllustrativeRisk = { ...recommendation, key_risks: 'Synthetic example' }
  for (const rec of [null, { ...recommendation, summary: ' ' }, withIllustrativeRisk]) {
    const status = deriveAssessmentStatus({ coach: {}, recommendation: rec })
    assert.equal(status.recommendationRecorded, false)
    assert.equal(status.confidence, null)
  }
})

test('scoped candidate inputs give stable counts regardless of row order or screen', () => {
  const index = deriveAssessmentStatus({ coach: {}, assessments, evidence, recommendation })
  const detail = deriveAssessmentStatus({ coach: {}, assessments: [...assessments].reverse(), evidence: [...evidence].reverse(), recommendation })
  assert.deepEqual(detail, index)
  const otherCandidate = deriveAssessmentStatus({ coach: {}, assessments: [], evidence: [], recommendation: null })
  assert.equal(otherCandidate.recordedCount, 0)
  assert.equal(otherCandidate.recommendationLabel, 'Not decided')
})
