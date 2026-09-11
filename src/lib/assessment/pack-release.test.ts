import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canPrintCircumstances, referencesForPack } from './pack-release.ts'

test('printable circumstances require current approval and explicit sharing, not on-request consent', () => {
  const approved = { portal_status: 'approved', visibility_status: 'shareable', circumstances_visibility: 'shareable', feasibility_review_status: 'verified', feasibility_reviewed_at: '2026-09-06' }
  assert.equal(canPrintCircumstances(approved), true)
  for (const profile of [null, { ...approved, circumstances_visibility: 'coach_first_only' },
    { ...approved, circumstances_visibility: 'clubs_on_request' }, { ...approved, visibility_status: 'private' },
    { ...approved, feasibility_review_status: 'draft' }, { ...approved, feasibility_reviewed_at: null }]) {
    assert.equal(canPrintCircumstances(profile), false)
  }
})
test('withdrawn, disputed and deleted reference evidence cannot survive through stale answer flags', () => {
  const references = [{ evidence_id: 'ref', verification_status: 'verified', answer: 'Private testimony' }]
  for (const evidence of [[], [{ id: 'ref', verification_status: 'verified', used_in_recommendation: false }],
    [{ id: 'ref', verification_status: 'disputed', used_in_recommendation: true }]]) {
    assert.deepEqual(referencesForPack(references, evidence), [])
  }
  assert.equal(referencesForPack([{ ...references[0], verification_status: 'unverified' }],
    [{ id: 'ref', verification_status: 'verified', used_in_recommendation: true }])[0].verification_status, 'verified')
})
