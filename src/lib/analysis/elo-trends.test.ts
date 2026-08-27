import assert from 'node:assert/strict'
import test from 'node:test'

import { computeClubEloTrend } from './elo-trends.ts'

test('computeClubEloTrend: identifies rising club strength from improving seasons', () => {
  const trend = computeClubEloTrend([
    { season: '2021/22', league_position: 14, points: 44, goals_for: 42, goals_against: 58 },
    { season: '2022/23', league_position: 9, points: 58, goals_for: 55, goals_against: 50 },
    { season: '2023/24', league_position: 4, points: 76, goals_for: 72, goals_against: 38 },
    { season: '2024/25', league_position: 2, points: 86, goals_for: 81, goals_against: 31 },
  ])

  assert.equal(trend.signal, 'rising')
  assert.equal(trend.points.length, 4)
  assert.ok(trend.currentRating && trend.currentRating > 1600)
  assert.ok(trend.threeSeasonMovement && trend.threeSeasonMovement > 25)
})

test('computeClubEloTrend: identifies declining club strength from worsening seasons', () => {
  const trend = computeClubEloTrend([
    { season: '2021/22', league_position: 3, points: 79, goals_for: 70, goals_against: 32 },
    { season: '2022/23', league_position: 8, points: 61, goals_for: 54, goals_against: 49 },
    { season: '2023/24', league_position: 15, points: 39, goals_for: 38, goals_against: 63 },
  ])

  assert.equal(trend.signal, 'declining')
  assert.ok(trend.oneSeasonMovement && trend.oneSeasonMovement < 0)
})

test('computeClubEloTrend: returns insufficient data when only one season is usable', () => {
  const trend = computeClubEloTrend([
    { season: '2024/25', league_position: 7, points: null, goals_for: null, goals_against: null },
  ])

  assert.equal(trend.signal, 'insufficient-data')
  assert.equal(trend.oneSeasonMovement, null)
  assert.equal(trend.threeSeasonMovement, null)
})
