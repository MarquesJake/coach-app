import test from 'node:test'
import assert from 'node:assert/strict'
import { researchedCoachChoices, selectedComparisonIds, isRecordedAvailable } from './research-picker.ts'

const coaches = [
  { id: 'full', name: 'Alex Smith', club_current: 'Club A' },
  { id: 'import', name: 'A. Smith', club_current: 'Club A' },
  { id: 'distinct', name: 'Jamie Jones', club_current: null },
  { id: 'raw', name: 'Morgan Green', club_current: null },
]
const counts = { full: { researchCount: 2 }, import: { researchCount: 1 }, distinct: { researchCount: 1 }, raw: { researchCount: 0 } }

test('available-only requires a recorded status, never an absent employer', () => {
  for (const available_status of [null, undefined, '', 'Unknown', 'Under contract', 'Open to offers']) assert.equal(isRecordedAvailable({ available_status }), false)
  assert.equal(isRecordedAvailable({ available_status: 'Available' }), true)
})

test('working picker excludes raw imports and unresolved abbreviated identities', () => {
  assert.deepEqual(researchedCoachChoices(coaches, counts, []).map(row => row.id), ['distinct'])
})

test('canonical review permits canonical record but never substitutes selected source IDs', () => {
  const reviews = [{ coach_a_id: 'full', coach_b_id: 'import', decision: 'canonical_selected', canonical_coach_id: 'full' }]
  const allowed = researchedCoachChoices(coaches, counts, reviews).map(row => row.id)
  assert.deepEqual(allowed, ['full', 'distinct'])
  assert.deepEqual(selectedComparisonIds('import,distinct', [], allowed), ['distinct'])
})

test('reviewed distinct identities remain separate choices', () => {
  const reviews = [{ coach_a_id: 'full', coach_b_id: 'import', decision: 'keep_separate', canonical_coach_id: null }]
  assert.deepEqual(researchedCoachChoices(coaches, counts, reviews).map(row => row.id), ['full', 'import', 'distinct'])
})

test('parent comparison contract preserves order, removes repeats, caps selection and supports explicit clear', () => {
  const allowed = ['a', 'b', 'c', 'd', 'e']
  assert.deepEqual(selectedComparisonIds('c,a,c,b,d,e', [], allowed), ['c', 'a', 'b', 'd'])
  assert.deepEqual(selectedComparisonIds(undefined, ['b', 'a'], allowed), ['b', 'a'])
  assert.deepEqual(selectedComparisonIds('', ['b', 'a'], allowed), [])
})

test('a source-index record stays excluded even after its name stops matching the canonical profile', () => {
  const renamed = coaches.map(coach => coach.id === 'import' ? { ...coach, name: 'Legacy name' } : coach)
  const reviews = [{ coach_a_id: 'full', coach_b_id: 'import', decision: 'canonical_selected', canonical_coach_id: 'full' }]
  assert.deepEqual(researchedCoachChoices(renamed, counts, reviews).map(row => row.id), ['full', 'distinct'])
})
