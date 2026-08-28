import assert from 'node:assert/strict'
import test from 'node:test'

import { computeManagerContextTrends } from './manager-context-trends.ts'

const stint = {
  id: 'stint-1',
  club_id: 'club-1',
  club_name: 'Example FC',
  started_on: '2022-07-01',
  ended_on: '2025-06-30',
}

test('manager context measures linked club movement across overlapping tenure seasons', () => {
  const summary = computeManagerContextTrends([stint], [
    { club_id: 'club-1', season: '2021/22', league_position: 15, points: 38, goals_for: 35, goals_against: 58 },
    { club_id: 'club-1', season: '2022/23', league_position: 12, points: 48, goals_for: 44, goals_against: 52 },
    { club_id: 'club-1', season: '2023/24', league_position: 7, points: 62, goals_for: 61, goals_against: 48 },
    { club_id: 'club-1', season: '2024/25', league_position: 2, points: 88, goals_for: 84, goals_against: 31 },
  ], new Date('2026-01-01T00:00:00Z'))

  assert.equal(summary.stints[0].seasonCount, 3)
  assert.deepEqual(summary.stints[0].seasons, ['2022/23', '2023/24', '2024/25'])
  assert.equal(summary.stints[0].signal, 'rising')
  assert.ok((summary.stints[0].movement ?? 0) >= 25)
  assert.equal(summary.coverage, 'complete')
})

test('manager context never uses results from another linked club', () => {
  const summary = computeManagerContextTrends([stint], [
    { club_id: 'club-2', season: '2022/23', league_position: 1, points: 95, goals_for: 90, goals_against: 20 },
    { club_id: 'club-2', season: '2023/24', league_position: 1, points: 98, goals_for: 96, goals_against: 18 },
  ])

  assert.equal(summary.stints[0].seasonCount, 0)
  assert.equal(summary.stints[0].movement, null)
  assert.equal(summary.coverage, 'insufficient')
})

test('manager context exposes partial coverage instead of inventing missing trends', () => {
  const summary = computeManagerContextTrends([
    stint,
    { ...stint, id: 'stint-2', club_id: null, club_name: 'Unlinked FC' },
  ], [
    { club_id: 'club-1', season: '2022/23', league_position: 9, points: 55, goals_for: 50, goals_against: 48 },
    { club_id: 'club-1', season: '2023/24', league_position: 8, points: 58, goals_for: 54, goals_against: 46 },
  ])

  assert.equal(summary.totalStints, 2)
  assert.equal(summary.linkedStintCount, 1)
  assert.equal(summary.trendReadyCount, 1)
  assert.equal(summary.coverage, 'partial')
})

test('manager context requires dated tenure and at least two usable seasons', () => {
  const summary = computeManagerContextTrends([
    { ...stint, started_on: null },
  ], [
    { club_id: 'club-1', season: '2023/24', league_position: 4, points: 74, goals_for: 70, goals_against: 38 },
    { club_id: 'club-1', season: '2024/25', league_position: 2, points: 84, goals_for: 79, goals_against: 30 },
  ])

  assert.equal(summary.trendReadyCount, 0)
  assert.equal(summary.stints[0].signal, 'insufficient-data')
})

test('invalid or reversed tenure dates never become active-tenure trends', () => {
  const seasons = [
    { club_id: 'club-1', season: '2023/24', league_position: 8, points: 58, goals_for: 54, goals_against: 46 },
    { club_id: 'club-1', season: '2024/25', league_position: 3, points: 77, goals_for: 72, goals_against: 34 },
  ]
  const invalidEnd = computeManagerContextTrends([{ ...stint, ended_on: 'not-a-date' }], seasons)
  const reversed = computeManagerContextTrends([
    { ...stint, started_on: '2025-07-01', ended_on: '2024-06-30' },
  ], seasons)

  assert.equal(invalidEnd.trendReadyCount, 0)
  assert.equal(reversed.trendReadyCount, 0)
})

test('calendar-year season labels overlap calendar-year tenures', () => {
  const summary = computeManagerContextTrends([
    { ...stint, started_on: '2023-01-01', ended_on: '2024-12-31' },
  ], [
    { club_id: 'club-1', season: '2023', league_position: 5, points: 63, goals_for: 58, goals_against: 41 },
    { club_id: 'club-1', season: '2024', league_position: 3, points: 72, goals_for: 68, goals_against: 35 },
  ])

  assert.equal(summary.stints[0].seasonCount, 2)
})

test('two-digit season labels remain valid across a century boundary', () => {
  const summary = computeManagerContextTrends([
    { ...stint, started_on: '1999-07-01', ended_on: '2001-06-30' },
  ], [
    { club_id: 'club-1', season: '1999/00', league_position: 8, points: 57, goals_for: 52, goals_against: 48 },
    { club_id: 'club-1', season: '2000/01', league_position: 5, points: 66, goals_for: 63, goals_against: 42 },
  ])

  assert.equal(summary.stints[0].seasonCount, 2)
})
