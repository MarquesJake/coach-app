import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canPresentBoardProfile, recordedBoardReasons, summariseRecordedFit } from './recorded-fit.ts'

test('saving Unknown fit fields does not create a moderate rating', () => {
  assert.equal(summariseRecordedFit(['Unknown', null, undefined, 'Unknown']), 'unknown')
  assert.equal(summariseRecordedFit(['Strong', 'Unknown']), 'strong')
  assert.equal(summariseRecordedFit(['Strong', 'Moderate']), 'moderate')
  assert.equal(summariseRecordedFit(['Strong', 'Weak']), 'weak')
})

test('a pipeline position alone is not a board evidence profile', () => {
  assert.equal(canPresentBoardProfile({ sourceCoverage: 0, hasHumanRecommendation: false }), false)
  assert.equal(canPresentBoardProfile({ sourceCoverage: 25, hasHumanRecommendation: false }), true)
  assert.equal(canPresentBoardProfile({ sourceCoverage: 0, hasHumanRecommendation: true }), true)
})

test('recorded reasons are not rewritten into unsupported football claims', () => {
  assert.deepEqual(recordedBoardReasons(['Availability unknown']), ['Availability unknown'])
  assert.match(recordedBoardReasons([])[0], /No supporting reasons recorded/)
  assert.equal(recordedBoardReasons(['a', 'b', 'c', 'd']).length, 3)
})
