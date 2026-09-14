import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deriveCoachMatchMetrics, type CoachMatchInput, type MatchEvent, type MatchFeed, type MatchFixture, type MatchLineup, type MatchStatistics } from './coach-match-metrics.ts'

// Synthetic fixtures below are edge-case test data, never scouting evidence.
const teamId = 47, coachId = 548, opponent = 46
const feed = <T>(fixtureId: number, data: readonly T[]): MatchFeed<T> => ({ fixtureId, data, complete: true })
function lineup(): MatchLineup {
  return { team: { id: teamId }, coach: { id: coachId }, formation: '4-3-3', startXI: Array.from({ length: 11 }, (_, i) => ({ player: { id: i + 1 } })), substitutes: Array.from({ length: 9 }, (_, i) => ({ player: { id: i + 12 } })) }
}
function match(fixtureId = 1, gf = 0, ga = 0): CoachMatchInput {
  return {
    fixture: { fixture: { id: fixtureId, date: new Date(Date.UTC(2024, 0, fixtureId)).toISOString(), status: { short: 'FT' } }, teams: { home: { id: teamId }, away: { id: opponent } }, goals: { home: gf, away: ga } },
    lineups: feed(fixtureId, [lineup()]), events: feed(fixtureId, []),
  }
}
const derive = (matches: readonly CoachMatchInput[]) => deriveCoachMatchMetrics({ teamId, coachId, matches })
function goal(minute: number, side = teamId, player = side === teamId ? 1 : 101, extra: number | null = null): MatchEvent {
  return { time: { elapsed: minute, extra }, team: { id: side }, player: { id: player }, type: 'Goal', detail: 'Normal Goal' }
}
function sub(minute: number, outgoing = 1, incoming = 12, extra: number | null = null): MatchEvent {
  return { time: { elapsed: minute, extra }, team: { id: teamId }, player: { id: outgoing }, assist: { id: incoming }, type: 'subst' }
}
function stats(fixtureId: number, possession: string | number | null, xg: string | number | null): MatchFeed<MatchStatistics> {
  return feed(fixtureId, [{ team: { id: teamId }, statistics: [{ type: 'Ball Possession', value: possession }, { type: 'expected_goals', value: xg }] }])
}

const sampleDir = process.env.COACH_METRICS_SAMPLE_DIR ?? '/Users/jake/Desktop/Coach App/tmp/coach-ranking-research'
const sampleFiles = ['spurs-2024-fixtures.json', 'spurs-xg-sample.json', 'spurs-events-sample.json', 'spurs-lineups-sample.json']
test('saved 2024 Spurs sample attributes only the one coach-verified match, not all 38 fixtures', { skip: !sampleFiles.every(f => existsSync(join(sampleDir, f))) }, () => {
  const load = (file: string) => JSON.parse(readFileSync(join(sampleDir, file), 'utf8'))
  const fixtureRows = load(sampleFiles[0]).response as MatchFixture[]
  const statistics = load(sampleFiles[1]), events = load(sampleFiles[2]), lineups = load(sampleFiles[3])
  const sampleId = Number(statistics.parameters.fixture)
  const matches = fixtureRows.map(f => ({ fixture: f, ...(f.fixture.id === sampleId ? {
    statistics: { ...feed(sampleId, statistics.response), errors: statistics.errors } as MatchFeed<MatchStatistics>,
    events: { ...feed(sampleId, events.response), errors: events.errors } as MatchFeed<MatchEvent>,
    lineups: { ...feed(sampleId, lineups.response), errors: lineups.errors } as MatchFeed<MatchLineup>,
  } : {}) }))
  const result = derive(matches)
  assert.equal(result.selection.suppliedMatches, 38)
  assert.equal(result.selection.verifiedLineupMatches, 1)
  assert.equal(result.selection.excluded.length, 37)
  assert.deepEqual(result.results.value, { wins: 0, draws: 1, losses: 0, points: 1, goalsFor: 1, goalsAgainst: 1 })
  assert.equal(result.possession.value, 70)
  assert.equal(result.xgFor.value, 1.18)
  assert.equal(result.xgAgainst.value, 1.05)
  assert.equal(result.averageFirstSubstitutionMinute.value, 78)
  assert.equal(result.goalsBySubstitutes.value, 0)
  assert.equal(result.pointsFromLosingPositions.value, 0)
  assert.equal(result.pointsAfterConcedingFirst.coverage.denominator, 0)
  assert.deepEqual(result.formations.value, { '4-3-3': 1 })
  assert.equal(result.windows[0].metrics.results.coverage.coveredMatches, 1)
  assert.equal(result.windows[1].metrics.results.value, null)
  assert.equal(deriveCoachMatchMetrics({ teamId, coachId: 98, matches }).selection.includedMatches, 0)
})

test('coach identity belongs to the selected team and cannot be borrowed from an opposing lineup', () => {
  const m = match()
  m.lineups = feed(1, [{ ...lineup(), coach: { id: 99 } }, { ...lineup(), team: { id: opponent } }])
  assert.equal(derive([m]).selection.includedMatches, 0)
  m.fixture.teams = { home: { id: 3 }, away: { id: 4 } }
  assert.equal(derive([m]).selection.excluded[0].reason, 'different-team')
})

test('explicit tenure is bounded and labelled, never overriding contradictory or unusable lineup evidence', () => {
  const missing = match(1), conflict = match(2), wrongFeed = match(3), outside = match(4), lastDay = match(5)
  delete missing.lineups; delete outside.lineups; delete lastDay.lineups
  lastDay.fixture.fixture.date = '2024-01-03T23:59:59Z'
  conflict.lineups = feed(2, [{ ...lineup(), coach: { id: 99 } }])
  wrongFeed.lineups!.fixtureId = 999
  const tenureFallback = { teamId, coachId, start: '2024-01-01', end: '2024-01-03', label: 'Club-confirmed historical tenure; lineup unavailable' }
  const result = deriveCoachMatchMetrics({ teamId, coachId, tenureFallback, matches: [missing, conflict, wrongFeed, outside, lastDay] })
  assert.equal(result.selection.tenureFallbackMatches, 2)
  assert.equal(result.selection.verifiedLineupMatches, 0)
  assert.ok(result.selection.included.every(m => m.attribution === 'explicit-tenure' && m.label === tenureFallback.label))
  assert.equal(result.formations.value, null)
  assert.equal(result.goalsBySubstitutes.value, null)
  assert.equal(derive([missing]).results.value, null)
  for (const change of [{ label: '' }, { start: '2024-02-30' }, { start: '2024-02-01' }, { teamId: 8 }, { end: '' }]) {
    assert.throws(() => deriveCoachMatchMetrics({ teamId, coachId, matches: [], tenureFallback: { ...tenureFallback, ...change } }), RangeError)
  }
})

test('empty and excluded populations are unknown, not zero performance', () => {
  const result = derive([])
  for (const metric of [result.results, result.possession, result.xgFor, result.xgAgainst, result.formations, result.pointsFromLosingPositions, result.goalsBySubstitutes, result.averageFirstSubstitutionMinute]) {
    assert.equal(metric.value, null)
    assert.equal(metric.coverage.coveredMatches, 0)
    assert.equal(metric.coverage.denominator, 0)
  }
  assert.ok(result.windows.every(w => w.dateRange === null && w.metrics.results.value === null))
  for (const badId of [0, -1, 1.5, NaN]) assert.throws(() => deriveCoachMatchMetrics({ teamId: badId, coachId, matches: [] }), RangeError)
})

test('each statistic has its own denominator; genuine zero survives while missing and invalid values do not', () => {
  const ms = Array.from({ length: 5 }, (_, i) => match(i + 1))
  ms[0].statistics = stats(1, '0%', '0.00')
  ms[1].statistics = stats(2, null, '1.40')
  ms[2].statistics = stats(3, '', 'NaN')
  ms[3].statistics = stats(4, '101%', -1)
  const result = derive(ms)
  assert.equal(result.possession.value, 0)
  assert.equal(result.possession.coverage.denominator, 1)
  assert.equal(result.possession.coverage.missingMatches, 4)
  assert.equal(result.xgFor.value, 0.7)
  assert.equal(result.xgFor.coverage.denominator, 2)
  assert.equal(result.xgAgainst.value, null)
  assert.equal(result.xgAgainst.coverage.missingMatches, 5)
})

test('partial, erroneous, duplicate and wrong-fixture statistics never leak into means', () => {
  const ms = Array.from({ length: 4 }, (_, i) => match(i + 1))
  for (const m of ms) m.statistics = stats(m.fixture.fixture.id, 70, 2)
  ms[0].statistics!.complete = false
  ms[1].statistics!.errors = { requests: 'quota exceeded' }
  ms[2].statistics!.fixtureId = 999
  ms[3].statistics!.data = [...ms[3].statistics!.data, ...ms[3].statistics!.data]
  const result = derive(ms)
  assert.equal(result.results.coverage.coveredMatches, 4)
  assert.equal(result.xgFor.value, null)
  assert.equal(result.possession.value, null)
})

test('points recovered count once per match, and conceding first is not the same as ever trailing', () => {
  const comeback = match(1, 3, 2)
  comeback.events = feed(1, [goal(80), goal(10), goal(20, opponent), goal(30, opponent), goal(70)])
  const draw = match(2, 1, 1)
  draw.events = feed(2, [goal(85), goal(5, opponent)])
  const loss = match(3, 0, 1)
  loss.events = feed(3, [goal(50, opponent)])
  const result = derive([comeback, draw, loss])
  assert.equal(result.pointsFromLosingPositions.value, 4)
  assert.equal(result.pointsFromLosingPositions.coverage.denominator, 3)
  assert.equal(result.pointsAfterConcedingFirst.value, 1)
  assert.equal(result.pointsAfterConcedingFirst.coverage.denominator, 2)
  assert.equal(result.results.value!.points, 4)
  assert.equal(result.results.value!.wins + result.results.value!.draws + result.results.value!.losses, 3)
})

test('unsorted added-time events preserve phase order and corroborate substitute scoring', () => {
  const m = match(1, 2, 1)
  m.events = feed(1, [goal(90, teamId, 12, 4), goal(90, opponent, 101, 1), goal(90, teamId, 12, 3), sub(90, 1, 12, 2)])
  const result = derive([m])
  assert.equal(result.pointsAfterConcedingFirst.value, 3)
  assert.equal(result.goalsBySubstitutes.value, 2)
  assert.equal(result.averageFirstSubstitutionMinute.value, 92)
  const half = match(2, 1, 1)
  half.fixture.score = { halftime: { home: 0, away: 1 } }
  half.events = feed(2, [goal(46), goal(45, opponent, 101, 8)])
  assert.equal(derive([half]).pointsAfterConcedingFirst.value, 1, '45+8 belongs before minute 46, not minute 53')
})

test('goal reconciliation rejects incomplete, duplicated, temporally invalid and ambiguous feeds while retaining fixture results', () => {
  const cases: CoachMatchInput[] = []
  const missingGoal = match(1, 1, 0); cases.push(missingGoal)
  const duplicate = match(2, 2, 0); duplicate.events = feed(2, [goal(10), goal(10)]); cases.push(duplicate)
  const ambiguous = match(3, 1, 1); ambiguous.events = feed(3, [goal(10), goal(10, opponent)]); cases.push(ambiguous)
  const wrongHalf = match(4, 1, 0); wrongHalf.fixture.score = { halftime: { home: 1, away: 0 } }; wrongHalf.events = feed(4, [goal(60)]); cases.push(wrongHalf)
  const badTime = match(5, 1, 0); badTime.events = feed(5, [goal(91)]); cases.push(badTime)
  const partial = match(6); partial.events!.complete = false; cases.push(partial)
  const wrongFeed = match(7); wrongFeed.events!.fixtureId = 999; cases.push(wrongFeed)
  const error = match(8); error.events!.errors = ['upstream failure']; cases.push(error)
  const result = derive(cases)
  assert.equal(result.results.coverage.coveredMatches, cases.length)
  for (const metric of [result.pointsFromLosingPositions, result.pointsAfterConcedingFirst, result.goalsBySubstitutes, result.averageFirstSubstitutionMinute]) {
    assert.equal(metric.value, null)
    assert.equal(metric.coverage.missingMatches, cases.length)
  }
})

test('own goals require explicit credited team; disallowed and shootout goals cannot be naively counted', () => {
  const own = match(1, 1, 0)
  const event = { ...goal(20, opponent), detail: 'Own Goal' }
  own.events = feed(1, [event])
  assert.equal(derive([own]).pointsFromLosingPositions.value, null)
  own.events = feed(1, [{ ...event, creditedTeamId: teamId }])
  const verified = derive([own])
  assert.equal(verified.pointsFromLosingPositions.value, 0)
  assert.equal(verified.goalsBySubstitutes.value, 0, 'own goals are never substitute-scored goals')
  for (const dubious of [
    { ...goal(20), comments: 'Penalty Shootout' },
    { ...goal(20), detail: 'Goal cancelled' },
    { ...goal(20), type: 'Var', detail: 'Goal cancelled' },
  ]) {
    own.events = feed(1, [dubious])
    assert.equal(derive([own]).goalsBySubstitutes.value, null)
  }
  // Even if the goals happen to reconcile, a cancellation row has no linkage to resolve safely.
  own.events = feed(1, [goal(20), { ...goal(30), type: 'Var', detail: 'Goal cancelled' }])
  assert.equal(derive([own]).pointsFromLosingPositions.value, null)
})

test('goals by substitutes require bench, entry time and presence on pitch, not merely a nonstarter scorer', () => {
  const valid = match(1, 2, 0)
  valid.events = feed(1, [goal(10), sub(60), goal(70, teamId, 12)])
  assert.equal(derive([valid]).goalsBySubstitutes.value, 1)
  for (const events of [
    [goal(70, teamId, 12)], // On the bench, never entered.
    [sub(60), goal(60, teamId, 12)], // Unknown ordering within this minute.
    [sub(60), goal(70)], // Starter has already left.
    [sub(60), goal(70, teamId, 999)], // Unknown player.
    [sub(60), sub(75, 12, 13), goal(80, teamId, 12)], // Substitute has left.
  ]) {
    const m = match(2, 1, 0); m.events = feed(2, events)
    const result = derive([m])
    assert.equal(result.goalsBySubstitutes.value, null)
    assert.equal(result.pointsFromLosingPositions.value, 0, 'a player-data gap need not erase reconciled score order')
  }
})

test('no-substitution matches are covered but excluded from the first-substitution average', () => {
  const ms = [match(1), match(2), match(3), match(4)]
  ms[0].events = feed(1, [sub(55)])
  ms[2].events = feed(3, [sub(75)])
  delete ms[3].events
  const metric = derive(ms).averageFirstSubstitutionMinute
  assert.equal(metric.value, 65)
  assert.equal(metric.matchesWithoutSubstitutions, 1)
  assert.equal(metric.coverage.coveredMatches, 3)
  assert.equal(metric.coverage.denominator, 2)
  assert.equal(metric.coverage.missingMatches, 1)
  const none = derive([match()]).averageFirstSubstitutionMinute
  assert.equal(none.value, null)
  assert.equal(none.coverage.coveredMatches, 1)
  assert.equal(none.matchesWithoutSubstitutions, 1)
})

test('incoherent substitutions and incomplete player lineups are not treated as confirmed no-substitution matches', () => {
  const impossible = match(1); impossible.events = feed(1, [sub(60, 20, 12)])
  const duplicate = match(2); duplicate.events = feed(2, [sub(60), sub(60)])
  const incomplete = match(3); incomplete.lineups = feed(3, [{ ...lineup(), startXI: [] }])
  const overlapping = match(4); overlapping.lineups = feed(4, [{ ...lineup(), substitutes: [{ player: { id: 1 } }] }])
  const result = derive([impossible, duplicate, incomplete, overlapping])
  assert.equal(result.averageFirstSubstitutionMinute.value, null)
  assert.equal(result.averageFirstSubstitutionMinute.matchesWithoutSubstitutions, 0)
  assert.equal(result.goalsBySubstitutes.value, null)
  assert.equal(result.pointsFromLosingPositions.coverage.coveredMatches, 4)
})

test('nonregulation fixtures, bad dates, conflicting scores and duplicate fixture IDs cannot double-count results', () => {
  const ms = ['PEN', 'AET', '1H', 'ABD'].map((status, i) => { const m = match(i + 1); m.fixture.fixture.status.short = status; return m })
  const badDate = match(5); badDate.fixture.fixture.date = 'not-a-date'; ms.push(badDate)
  const badScore = match(6, 1, 0); badScore.fixture.score = { fulltime: { home: 2, away: 0 } }; ms.push(badScore)
  const unknown = match(7); unknown.fixture.goals.home = null; ms.push(unknown)
  ms.push(match(8), match(8))
  const result = derive(ms)
  assert.equal(result.selection.excluded.length, ms.length)
  assert.equal(result.results.value, null)
})

test('windows 1–5, 6–20 and 21+ partition supplied attributable matches chronologically with independent coverage', () => {
  const ms = Array.from({ length: 25 }, (_, i) => match(i + 1))
  for (const m of ms) {
    const n = m.fixture.fixture.id
    if (n <= 3 || n === 8 || n === 23) m.statistics = stats(n, '60%', '1.2')
  }
  const unverified = match(99); unverified.fixture.fixture.date = '2023-12-01T00:00:00Z'; delete unverified.lineups
  const result = derive([...ms].reverse().concat(unverified))
  assert.deepEqual(result.windows.map(w => w.metrics.selection.includedMatches), [5, 15, 5])
  assert.deepEqual(result.windows.map(w => w.metrics.xgFor.coverage.coveredMatches), [3, 1, 1])
  assert.deepEqual(result.windows.map(w => w.metrics.xgFor.coverage.missingMatches), [2, 14, 4])
  const ids = result.windows.flatMap(w => w.metrics.selection.included.map(m => m.fixtureId))
  assert.deepEqual(ids, Array.from({ length: 25 }, (_, i) => i + 1))
  assert.equal(new Set(ids).size, 25)
  assert.deepEqual(result.windows.map(w => w.dateRange), [
    { first: ms[0].fixture.fixture.date, last: ms[4].fixture.fixture.date },
    { first: ms[5].fixture.fixture.date, last: ms[19].fixture.fixture.date },
    { first: ms[20].fixture.fixture.date, last: ms[24].fixture.fixture.date },
  ])
  assert.match(result.windowBasis, /not guaranteed/)
  assert.equal(result.selection.excluded[0].fixtureId, 99)
  assert.equal(result.windows.reduce((n, w) => n + w.metrics.results.value!.points, 0), result.results.value!.points)
})

test('derivation is input-order invariant, does not mutate inputs, and every coverage population balances', () => {
  const ms = [match(1), match(2, 1, 0), match(3)]
  ms[1].events = feed(2, [goal(80, teamId, 12), sub(60)])
  ms[0].statistics = stats(1, 55, '0')
  const before = JSON.stringify(ms)
  const result = derive(ms)
  assert.equal(JSON.stringify(ms), before)
  assert.deepEqual(derive([...ms].reverse()), result)
  for (const summary of [result, ...result.windows.map(w => w.metrics)]) {
    for (const metric of [summary.results, summary.pointsPerMatch, summary.formations, summary.possession, summary.xgFor, summary.xgAgainst, summary.pointsFromLosingPositions, summary.pointsAfterConcedingFirst, summary.goalsBySubstitutes, summary.averageFirstSubstitutionMinute]) {
      const c = metric.coverage
      assert.equal(c.coveredMatches + c.missingMatches, c.eligibleMatches)
      assert.ok(c.denominator <= c.coveredMatches)
    }
    assert.equal(Object.values(summary.formations.value ?? {}).reduce((a, b) => a + b, 0), summary.formations.coverage.coveredMatches)
  }
})
