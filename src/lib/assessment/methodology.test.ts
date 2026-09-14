import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ASSESSMENT_CRITERIA } from './criteria.ts'
import { DIMENSIONS, boardCall, dimensionFor, interviewStatus, methodCoverage, referencePatterns, INTERVIEW_PLAN, referenceQuestionsFor, STAKEHOLDER_GROUPS, PRIORITY_REFERENCE_KEYS } from './methodology.ts'

test('every one of the nine areas belongs to exactly one of the four dimensions', () => {
  for (const criterion of ASSESSMENT_CRITERIA) {
    assert.equal(DIMENSIONS.filter(dimension => (dimension.areas as readonly string[]).includes(criterion.key)).length, 1, criterion.key)
    assert.ok(dimensionFor(criterion.key))
  }
})

test('method coverage names what has contributed and what is still to do, without inventing coverage', () => {
  const coverage = methodCoverage('training_management', new Set(['references']))
  assert.deepEqual(coverage.contributed, ['References'])
  assert.deepEqual(coverage.outstanding, ['Training observation (live & video)', 'Candidate interview'])
  assert.deepEqual(methodCoverage('performance_impact', new Set()).contributed, [])
})

test('the board call collapses the five verdicts to Proceed, Hold or Pass', () => {
  assert.equal(boardCall('Proceed').call, 'Proceed')
  for (const verdict of ['Target', 'Shortlist', 'Monitor']) assert.equal(boardCall(verdict).call, 'Hold')
  assert.equal(boardCall('Dismiss').call, 'Pass')
  assert.equal(boardCall(null).call, 'Undecided')
})

test('interview status is derived from the recorded answers', () => {
  assert.equal(interviewStatus([]), 'prepared')
  assert.equal(interviewStatus([{ verification_status: 'unverified' }]), 'completed')
  assert.equal(interviewStatus([{ verification_status: 'verified' }, { verification_status: 'unverified' }]), 'follow_up')
  assert.equal(interviewStatus([{ verification_status: 'verified' }]), 'reviewed')
})

test('reference patterns count independent voices and surface conflict rather than averaging it away', () => {
  const patterns = referencePatterns([
    { question_key: 'rq_hire_again', reference_name: 'A', would_hire_again: 'yes', verification_status: 'verified', risk_flag: false },
    { question_key: 'rq_hire_again', reference_name: 'B', would_hire_again: 'no', verification_status: 'verified', risk_flag: true },
    { question_key: 'rq_biggest_risk', reference_name: 'C', would_hire_again: null, verification_status: 'unverified', risk_flag: true },
  ])
  assert.equal(patterns.independentReferences, 2)
  assert.match(patterns.hireAgain, /Conflicting/)
  assert.equal(patterns.unreviewedAnswers, 1)
  assert.equal(patterns.priorityAnswered, 1)
  assert.equal(patterns.priorityUnanswered.length, 4)
  assert.equal(patterns.risksFlagged, 1)
})

test('the interview plan and reference banks carry the full June 2026 packs', () => {
  assert.equal(INTERVIEW_PLAN.standard.length + INTERVIEW_PLAN.revealing.length, 15)
  assert.equal(INTERVIEW_PLAN.clubSpecific.length, 5)
  for (const group of STAKEHOLDER_GROUPS) assert.ok(referenceQuestionsFor(group).length >= 15, group)
  assert.equal(PRIORITY_REFERENCE_KEYS.length, 5)
})
