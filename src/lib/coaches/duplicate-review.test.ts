import assert from 'node:assert/strict'
import test from 'node:test'
import { findCoachDuplicateGroups } from './duplicate-review.ts'

test('groups exact names after punctuation and accent normalisation', () => {
  const groups = findCoachDuplicateGroups([
    { id: '1', name: 'José Mourinho', club_current: 'Fenerbahce' },
    { id: '2', name: 'Jose Mourinho', club_current: 'Free agent' },
    { id: '3', name: 'Josep Guardiola', club_current: 'Manchester City' },
  ])

  assert.equal(groups.length, 1)
  assert.deepEqual(groups[0].coaches.map((coach) => coach.id), ['2', '1'])
  assert.equal(groups[0].reason, 'Same normalised name')
})

test('groups abbreviated names only when the current club also matches', () => {
  const groups = findCoachDuplicateGroups([
    { id: '1', name: 'A. Example', club_current: 'Club A' },
    { id: '2', name: 'Alex Example', club_current: 'Club A' },
    { id: '3', name: 'Andrew Example', club_current: 'Club B' },
  ])

  assert.equal(groups.length, 1)
  assert.deepEqual(groups[0].coaches.map((coach) => coach.id), ['1', '2'])
  assert.equal(groups[0].reason, 'Matching initial, surname and current club')
})

test('reviewed research aliases flag duplicate candidates despite conflicting employer fields', () => {
  const groups = findCoachDuplicateGroups([
    { id: '1', name: 'W. Still', club_current: 'Southampton' },
    { id: '2', name: 'Will Still', club_current: 'Recently Southampton' },
  ])
  assert.equal(groups.length, 1)
  assert.equal(groups[0].reason, 'Names match the same reviewed research identity')
})

test('does not flag common surnames without a strong matching signal', () => {
  const groups = findCoachDuplicateGroups([
    { id: '1', name: 'Alex Smith', club_current: 'Club A' },
    { id: '2', name: 'Andrew Smith', club_current: 'Club B' },
  ])

  assert.equal(groups.length, 0)
})
