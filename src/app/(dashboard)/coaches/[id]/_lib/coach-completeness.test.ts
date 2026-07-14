import assert from 'node:assert/strict'
import test from 'node:test'
import { computeCoachCompleteness } from './coach-completeness.ts'

const completeCoach = {
  preferred_style: 'Positional play',
  leadership_style: 'Collaborative',
  due_diligence_summary: 'Reviewed',
  overall_manual_score: 80,
}

test('includes staff-network coverage when the caller provides it', () => {
  assert.equal(
    computeCoachCompleteness(completeCoach, {
      stintCount: 1,
      intelligenceCount: 1,
      staffNetworkCount: 0,
    }),
    86
  )

  assert.equal(
    computeCoachCompleteness(completeCoach, {
      stintCount: 1,
      intelligenceCount: 1,
      staffNetworkCount: 1,
    }),
    100
  )
})

test('preserves the six-dimension calculation for callers without network data', () => {
  assert.equal(
    computeCoachCompleteness(completeCoach, {
      stintCount: 1,
      intelligenceCount: 1,
    }),
    100
  )
})
