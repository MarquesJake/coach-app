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
    { id: '1', name: 'K. McKenna', club_current: 'Ipswich Town' },
    { id: '2', name: 'Kieran McKenna', club_current: 'Ipswich Town' },
    { id: '3', name: 'Kevin McKenna', club_current: 'FC Koln' },
  ])

  assert.equal(groups.length, 1)
  assert.deepEqual(groups[0].coaches.map((coach) => coach.id), ['1', '2'])
  assert.equal(groups[0].reason, 'Matching initial, surname and current club')
})

test('does not flag common surnames without a strong matching signal', () => {
  const groups = findCoachDuplicateGroups([
    { id: '1', name: 'Alex Smith', club_current: 'Club A' },
    { id: '2', name: 'Andrew Smith', club_current: 'Club B' },
  ])

  assert.equal(groups.length, 0)
})
