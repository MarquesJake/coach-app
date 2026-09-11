import { test } from 'node:test'
import assert from 'node:assert/strict'
import { investorAccessIsActive, validateInvestorDraft } from './workspace.ts'

test('investor access fails closed for absent, expired, invalid and revoked grants', () => {
  const now = Date.parse('2026-09-06T12:00:00Z')
  assert.equal(investorAccessIsActive(null, now), false)
  assert.equal(investorAccessIsActive({ expires_at: 'invalid', revoked_at: null }, now), false)
  assert.equal(investorAccessIsActive({ expires_at: new Date(now).toISOString(), revoked_at: null }, now), false)
  assert.equal(investorAccessIsActive({ expires_at: '2027-01-01', revoked_at: '2026-09-05' }, now), false)
  assert.equal(investorAccessIsActive({ expires_at: '2027-01-01', revoked_at: null }, now), true)
})
test('practice drafts only accept bounded text and the curated public candidates', () => {
  const valid = { brief: ' Practice ', shortlist: ['a'], notes: 'Questions' }
  assert.deepEqual(validateInvestorDraft(valid, ['a']), { ...valid, brief: 'Practice' })
  for (const bad of [null, {}, { ...valid, shortlist: ['private'] }, { ...valid, shortlist: ['a', 'a'] },
    { ...valid, notes: 'x'.repeat(10001) }, { ...valid, brief: 1 }]) {
    assert.equal(validateInvestorDraft(bad, ['a']), null)
  }
})
