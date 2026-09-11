import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateProfileReadiness, PROFILE_READINESS_FIELDS } from './coach-profile-readiness.ts'

test('coach and analyst use the same profile depth definition', () => {
  assert.equal(calculateProfileReadiness({ short_bio: 'Career declaration' }, 0), 8)
  assert.equal(calculateProfileReadiness(null, 0), 0)
  assert.equal(calculateProfileReadiness({ short_bio: '  ', football_identity: null }, 0), 0)
})

test('profile depth is bounded and materials cannot replace football detail', () => {
  const complete = Object.fromEntries(PROFILE_READINESS_FIELDS.map(field => [field, 'Recorded']))
  assert.equal(calculateProfileReadiness(complete, 2), 100)
  assert.equal(calculateProfileReadiness(null, 99), 17)
  assert.equal(calculateProfileReadiness(null, -1), 0)
  assert.equal(calculateProfileReadiness(null, NaN), 0)
})

test('private circumstances and approval do not increase readiness', () => {
  const profile = { short_bio: 'Career declaration', family_situation: 'Private', salary_expectation: 'Private', portal_status: 'approved' }
  assert.equal(calculateProfileReadiness(profile, 0), 8)
})
