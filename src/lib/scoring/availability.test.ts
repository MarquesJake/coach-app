import assert from 'node:assert/strict'
import { test } from 'node:test'
import { availabilityVerificationGate, getAvailabilityTier } from './availability.ts'

test('absent, unknown and unrecognised availability never imply an existing contract', () => {
  for (const value of [null, undefined, '', '  ', 'Unknown', 'unknown', 'Not confirmed', 'Awaiting representative']) {
    assert.equal(getAvailabilityTier(value), 'UNKNOWN')
    for (const urgency of ['URGENT', 'MEDIUM']) {
      const gate = availabilityVerificationGate(value, urgency)
      assert.equal(gate?.code, 'AVAILABILITY_UNVERIFIED')
      assert.equal(gate?.label, 'Availability needs verification')
      assert.doesNotMatch(`${gate?.label} ${gate?.detail}`, /under contract|not available/i)
    }
  }
})

test('non-urgent unknown availability remains unknown without the urgent verification gate', () => {
  for (const urgency of ['STANDARD', 'LOW']) {
    assert.equal(availabilityVerificationGate('Unknown', urgency), null)
    assert.equal(getAvailabilityTier('Unknown'), 'UNKNOWN')
  }
})

test('recorded availability retains its meaning despite case or whitespace', () => {
  const cases = [
    [' Available ', 'READY_NOW'], ['OPEN TO OFFERS', 'ACCESSIBLE'],
    ['under contract - interested', 'ACCESSIBLE'], [' Under Contract ', 'STRETCH'],
    ['NOT AVAILABLE', 'NOT_VIABLE'],
  ] as const
  for (const [value, tier] of cases) {
    assert.equal(getAvailabilityTier(value), tier)
    assert.equal(availabilityVerificationGate(value, 'URGENT'), null)
  }
})
