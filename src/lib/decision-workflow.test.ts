import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evidenceStatus, summariseEvidence, validateResearchQuestion } from './decision-workflow.ts'
const now = Date.parse('2026-09-08T12:00:00Z')
test('confidence and populated records do not imply verified evidence', () => {
  assert.equal(evidenceStatus({ confidence: 99 }, now), 'Source missing')
  assert.equal(evidenceStatus({ verified: true, source_name: 'Reference' }, now), 'Verification date missing')
  assert.equal(evidenceStatus({ verified: true, source_name: 'Illustrative demo profile', occurred_at: '2026-09-01' }, now), 'Illustrative')
})
test('dated verification remains distinct from disputes and stale evidence', () => {
  const row = { verified: true, source_name: 'Reference', occurred_at: '2026-09-01' }
  assert.equal(evidenceStatus(row, now), 'Verified record')
  assert.equal(evidenceStatus({ ...row, corroboration_status: 'disputed' }, now), 'Disputed')
  assert.equal(evidenceStatus({ ...row, occurred_at: '2026-01-01' }, now), 'Needs refresh')
  assert.equal(summariseEvidence([], now).label, 'Research required')
  assert.equal(summariseEvidence([{ ...row, source_name: 'Demo data' }], now).verified, 0)
})
test('research cannot be marked answered without a conclusion and linked finding', () => {
  const row = { question: 'How did the coach handle disagreement?', decision_impact: 'Senior-player management', status: 'answered', answer: '', evidence_claim_ids: [] }
  assert.ok(validateResearchQuestion(row))
  assert.ok(validateResearchQuestion({ ...row, answer: 'The account is still provisional.' }))
  assert.equal(validateResearchQuestion({ ...row, answer: 'A dated account supports the provisional conclusion.', evidence_claim_ids: ['claim-id'] }), null)
})
