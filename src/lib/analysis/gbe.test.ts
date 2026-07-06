import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leagueBand, calculateGbe, type GbeStintInput } from './gbe.ts'

test('leagueBand: banded top leagues', () => {
  assert.equal(leagueBand('Premier League'), 1)
  assert.equal(leagueBand('English Premier League'), 1)
  assert.equal(leagueBand('Serie A'), 1)
  assert.equal(leagueBand('Italian Serie A'), 1)
  assert.equal(leagueBand('Bundesliga'), 1)
  assert.equal(leagueBand('LaLiga'), 1)
  assert.equal(leagueBand('Ligue 1'), 1)
  assert.equal(leagueBand('Championship'), 2)
  assert.equal(leagueBand('Belgian Pro League'), 2)
})

test('leagueBand: specific overrides beat generic top-flight names', () => {
  assert.equal(leagueBand('Austrian Bundesliga'), 3)
  assert.equal(leagueBand('2. Bundesliga'), 3)
  assert.equal(leagueBand('Serie B'), 3)
  assert.equal(leagueBand('Serie A Brazil'), 5)
  assert.equal(leagueBand('Brazilian Serie A'), 5)
  assert.equal(leagueBand('Campeonato Brasileiro Serie A'), 5)
})

test('leagueBand: developmental / women / cup competitions are disqualified', () => {
  assert.equal(leagueBand('Premier League 2'), null)
  assert.equal(leagueBand('Bundesliga Frauen'), null)
  assert.equal(leagueBand('Frauen-Bundesliga'), null)
  assert.equal(leagueBand('Serie A Femminile'), null)
  assert.equal(leagueBand('Primera Division Femenina'), null)
  assert.equal(leagueBand('Primavera 1'), null)
  assert.equal(leagueBand('Premier League U21'), null)
  assert.equal(leagueBand('Championship Play-Offs'), null)
  assert.equal(leagueBand('FA Cup'), null)
})

test('leagueBand: leagues outside GBE bands return null', () => {
  assert.equal(leagueBand('Saudi Pro League'), null)
  assert.equal(leagueBand('Indian Super League'), null)
  assert.equal(leagueBand(''), null)
  assert.equal(leagueBand(null), null)
})

function stint(partial: Partial<GbeStintInput>): GbeStintInput {
  return {
    club_name: 'Club',
    league: 'Premier League',
    role_title: 'Head Coach',
    started_on: '2023-01-01',
    ended_on: '2025-01-01',
    ...partial,
  }
}

// Fixed "today" so the 5-year window is deterministic.
const TODAY = new Date('2026-07-01T00:00:00Z')

test('calculateGbe: Pass requires an auto-pass route AND a Pro Licence', () => {
  const stints = [
    stint({ league: 'Premier League', started_on: '2024-01-01', ended_on: '2026-01-01' }), // 24m Band 1
  ]
  const result = calculateGbe(stints, 'UEFA Pro', TODAY)
  assert.equal(result.status, 'Pass')
  assert.ok(result.passRoute)
})

test('calculateGbe: qualifying record without a licence fails', () => {
  const stints = [stint({ league: 'Premier League', started_on: '2024-01-01', ended_on: '2026-01-01' })]
  assert.equal(calculateGbe(stints, 'No UEFA Pro Licence', TODAY).status, 'Fail')
})

test('calculateGbe: assistant / academy roles do not count as manager months', () => {
  const stints = [
    stint({ role_title: 'Assistant Coach', league: 'Premier League', started_on: '2024-01-01', ended_on: '2026-01-01' }),
    stint({ role_title: 'Elite Development Squad Head Coach', league: 'Premier League 2', started_on: '2024-01-01', ended_on: '2026-01-01' }),
  ]
  const result = calculateGbe(stints, 'UEFA Pro', TODAY)
  assert.equal(result.monthsBand1, 0)
  assert.notEqual(result.status, 'Pass')
})

test('calculateGbe: licence phrasing — true vs false', () => {
  const qualifying = [stint({ league: 'Premier League', started_on: '2024-01-01', ended_on: '2026-01-01' })]
  const pass = (licence: string | null) => calculateGbe(qualifying, licence, TODAY).hasProLicence

  assert.equal(pass('UEFA Pro Licence'), true)
  assert.equal(pass('UEFA Pro'), true)
  assert.equal(pass('UEFA Pro Licence - no restrictions'), true)
  assert.equal(pass('No UEFA Pro Licence'), false)
  assert.equal(pass('No Pro Licence'), false)
  assert.equal(pass('Working towards UEFA Pro Licence'), false)
  assert.equal(pass('Studying for the Pro Licence'), false)
  assert.equal(pass('UEFA A Licence'), false)
  assert.equal(pass(null), null)
})

test('calculateGbe: undated or empty records report Insufficient data, not Fail', () => {
  const undated = [stint({ started_on: null, ended_on: null })]
  assert.equal(calculateGbe(undated, null, TODAY).status, 'Insufficient data')
  assert.equal(calculateGbe([], 'UEFA Pro', TODAY).status, 'Insufficient data')
})
