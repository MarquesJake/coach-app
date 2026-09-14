/** Pure historical match derivation. No fetching, persistence, scouting judgements or forecasts. */
export type MatchFixture = {
  fixture: { id: number; date: string; status: { short: string } }
  teams: { home: { id: number }; away: { id: number } }
  goals: { home: number | null; away: number | null }
  score?: { halftime?: Score; fulltime?: Score }
}
type Score = { home: number | null; away: number | null }
export type MatchStatistics = {
  team: { id: number }
  statistics: readonly { type: string; value: number | string | null }[]
}
export type MatchLineup = {
  team: { id: number }
  coach?: { id: number | null } | null
  formation?: string | null
  startXI?: readonly { player: { id: number | null } }[]
  substitutes?: readonly { player: { id: number | null } }[]
}
export type MatchEvent = {
  time: { elapsed: number | null; extra?: number | null }
  team: { id: number | null }
  player?: { id: number | null } | null
  assist?: { id: number | null } | null
  type: string
  detail?: string | null
  comments?: string | null
  /** Only for own goals: caller must independently verify the beneficiary. Never infer it from event.team. */
  creditedTeamId?: number
}
export type MatchFeed<T> = {
  fixtureId: number
  data: readonly T[]
  /** True only for a successful, fully retrieved endpoint response, not an absent/error/partial feed. */
  complete: boolean
  errors?: readonly unknown[] | Record<string, unknown>
}
export type CoachMatchInput = {
  fixture: MatchFixture
  statistics?: MatchFeed<MatchStatistics>
  events?: MatchFeed<MatchEvent>
  lineups?: MatchFeed<MatchLineup>
}
export type ExplicitCoachTenure = {
  teamId: number
  coachId: number
  /** Inclusive UTC calendar dates, YYYY-MM-DD; neither boundary may be open-ended. */
  start: string
  end: string
  label: string
}
export type MetricCoverage = {
  eligibleMatches: number
  coveredMatches: number
  missingMatches: number
  /** Average divisor, or qualifying-match population for a total/count distribution. */
  denominator: number
  denominatorLabel: string
}
export type MatchMetric<T> = { value: T | null; coverage: MetricCoverage }
export type MatchResults = {
  wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number
}
export type CoachMatchMetricSummary = {
  selection: {
    suppliedMatches: number
    includedMatches: number
    verifiedLineupMatches: number
    tenureFallbackMatches: number
    included: { fixtureId: number; attribution: 'lineup-coach' | 'explicit-tenure'; label: string }[]
    excluded: { fixtureId: number; reason: string }[]
  }
  results: MatchMetric<MatchResults>
  pointsPerMatch: MatchMetric<number>
  possession: MatchMetric<number>
  xgFor: MatchMetric<number>
  xgAgainst: MatchMetric<number>
  formations: MatchMetric<Record<string, number>>
  pointsFromLosingPositions: MatchMetric<number>
  pointsAfterConcedingFirst: MatchMetric<number>
  goalsBySubstitutes: MatchMetric<number>
  averageFirstSubstitutionMinute: MatchMetric<number> & { matchesWithoutSubstitutions: number }
  diagnostics: { fixtureId: number; scope: string; reason: string }[]
  limitations: readonly string[]
}
export type CoachMatchMetricsInput = {
  teamId: number; coachId: number; matches: readonly CoachMatchInput[]; tenureFallback?: ExplicitCoachTenure
}
export type CoachMatchWindow = {
  key: '1-5' | '6-20' | '21+'
  firstOrdinal: number
  lastOrdinal: number | null
  dateRange: { first: string; last: string } | null
  metrics: CoachMatchMetricSummary
}
export type CoachMatchMetrics = CoachMatchMetricSummary & {
  windows: CoachMatchWindow[]
  windowBasis: string
}

const LIMITATIONS = [
  'Only FT (regulation-time completed) fixtures are included; extra-time, shootout, abandoned and live matches are excluded.',
  'Points use the nominal 3/1/0 match-result convention, including cup fixtures if supplied; not league-table points or deductions.',
  'Points from losing positions count final points once per match in which the team trailed; conceding first is a separate subset.',
  'Possession and xG are unweighted per-match provider averages over their individual coverage, not reconstructed or opponent-adjusted values.',
  'Event metrics require an explicitly complete feed and reconciled final goals (and halftime goals when available). This cannot prove provider completeness.',
  'Own goals need an independently verified creditedTeamId. Unresolved goal cancellations, shootouts and ambiguous goal ordering exclude event aggregates.',
  'Substitution metrics require a complete starting XI, bench and coherent incoming/outgoing events; substitute scorers must be on the pitch before scoring.',
  'First-substitution averages exclude confirmed no-substitution matches. Minutes include added time (90+2 = 92); they are clock labels, not measured playing duration.',
  'Formation is the reported starting formation, not an inference about in-game systems. Tenure fallback is separately labelled and cannot override a different lineup coach.',
  'These historical measures do not establish current form, leadership, appointment suitability, causation or a probability of success.',
] as const

function id(value: unknown): value is number { return Number.isInteger(value) && (value as number) > 0 }
function nonnegative(value: unknown): value is number { return Number.isInteger(value) && (value as number) >= 0 }
function validScore(score: Score | undefined): score is { home: number; away: number } {
  return !!score && nonnegative(score.home) && nonnegative(score.away)
}
function feedProblem<T>(feed: MatchFeed<T> | undefined, fixtureId: number): string | null {
  if (!feed) return 'missing-feed'
  if (feed.fixtureId !== fixtureId) return 'wrong-fixture-feed'
  if (!feed.complete) return 'incomplete-feed'
  if (feed.errors && Object.keys(feed.errors).length) return 'provider-error'
  return null
}
function utcDay(value: string): number {
  const parsed = Date.parse(value + 'T00:00:00Z')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== value) {
    throw new RangeError('Tenure boundaries must be valid YYYY-MM-DD dates')
  }
  return parsed
}
type Clock = { elapsed: number; extra: number }
function clock(event: MatchEvent): Clock | null {
  const { elapsed, extra } = event.time
  if (!nonnegative(elapsed) || elapsed > 90 || !nonnegative(extra ?? 0) || (extra ?? 0) > 99) return null
  // Added time belongs to the end of a half. Sorting by elapsed+extra would put 45+8 after minute 46.
  if ((extra ?? 0) > 0 && elapsed !== 45 && elapsed !== 90) return null
  return { elapsed, extra: extra ?? 0 }
}
function compare(a: Clock, b: Clock): number { return a.elapsed - b.elapsed || a.extra - b.extra }
type Goal = { at: Clock; teamId: number; playerId: number | null; ownGoal: boolean }
type GoalReview = { goals: Goal[]; behind: boolean; concededFirst: boolean } | { error: string }

function reviewGoals(fixture: MatchFixture, events: readonly MatchEvent[], teamId: number): GoalReview {
  const homeId = fixture.teams.home.id, awayId = fixture.teams.away.id
  const goals: Goal[] = []
  for (const event of events) {
    const type = event.type.toLowerCase().trim()
    const detail = (event.detail ?? '').toLowerCase().trim()
    const annotation = `${detail} ${event.comments ?? ''}`.toLowerCase()
    if ((type === 'goal' || type === 'subst') && event.team.id !== homeId && event.team.id !== awayId) return { error: 'unknown-event-team' }
    if (/shoot[ -]?out/.test(annotation)) return { error: 'shootout-events' }
    if ((type === 'var' && /goal|penalty/.test(annotation) && detail !== 'goal confirmed') || /disallow|cancel|overturn/.test(annotation)) {
      return { error: 'unresolved-goal-review' }
    }
    if (type !== 'goal') continue
    if (detail === 'missed penalty') continue
    if (!['normal goal', 'penalty', 'own goal'].includes(detail)) return { error: 'unknown-goal-type' }
    const at = clock(event)
    if (!at) return { error: 'invalid-goal-time' }
    const ownGoal = detail === 'own goal'
    const credited = ownGoal ? event.creditedTeamId : event.team.id
    if (ownGoal && !id(credited)) return { error: 'unverified-own-goal-credit' }
    if (credited !== homeId && credited !== awayId) return { error: 'unknown-goal-team' }
    if (!ownGoal && event.creditedTeamId !== undefined && event.creditedTeamId !== credited) return { error: 'conflicting-goal-credit' }
    goals.push({ at, teamId: credited, ownGoal, playerId: event.player?.id ?? null })
  }
  goals.sort((a, b) => compare(a.at, b.at))
  let home = 0, away = 0, behind = false
  for (let i = 0; i < goals.length; i++) {
    const goal = goals[i]
    if (goals.some((other, j) => j < i && compare(goal.at, other.at) === 0 && goal.teamId === other.teamId && goal.playerId === other.playerId)) return { error: 'duplicate-or-ambiguous-goal' }
    if (i && compare(goal.at, goals[i - 1].at) === 0 && goal.teamId !== goals[i - 1].teamId) return { error: 'ambiguous-goal-order' }
    if (goal.teamId === homeId) home++; else away++
    if (teamId === homeId ? home < away : away < home) behind = true
  }
  if (home !== fixture.goals.home || away !== fixture.goals.away) return { error: 'goal-score-mismatch' }
  if (validScore(fixture.score?.halftime)) {
    const firstHalf = goals.filter(g => g.at.elapsed <= 45)
    if (firstHalf.filter(g => g.teamId === homeId).length !== fixture.score.halftime.home || firstHalf.filter(g => g.teamId === awayId).length !== fixture.score.halftime.away) {
      return { error: 'halftime-goal-mismatch' }
    }
  }
  return { goals, behind, concededFirst: goals.length > 0 && goals[0].teamId !== teamId }
}

type Appearance = { entered: Clock | null; exited: Clock | null; substitute: boolean }
type SubReview = { appearances: Map<number, Appearance>; firstMinute: number | null } | { error: string }
function reviewSubstitutions(events: readonly MatchEvent[], lineup: MatchLineup | undefined, teamId: number): SubReview {
  const starters = lineup?.startXI?.map(p => p.player.id), bench = lineup?.substitutes?.map(p => p.player.id)
  if (!starters || starters.length !== 11 || !bench || !starters.every(id) || !bench.every(id)) return { error: 'incomplete-player-lineup' }
  if (new Set([...starters, ...bench]).size !== starters.length + bench.length) return { error: 'duplicate-lineup-player' }
  const appearances = new Map<number, Appearance>(starters.map(p => [p, { entered: null, exited: null, substitute: false }]))
  const active = new Set(starters)
  const changes: { at: Clock; out: number; incoming: number }[] = []
  for (const e of events.filter(e => e.type.trim().toLowerCase() === 'subst')) {
    if (!id(e.team.id)) return { error: 'unknown-substitution-team' }
    if (e.team.id !== teamId) continue
    const at = clock(e), out = e.player?.id, incoming = e.assist?.id
    if (!at || !id(out) || !id(incoming) || out === incoming) return { error: 'invalid-substitution' }
    changes.push({ at, out, incoming })
  }
  changes.sort((a, b) => compare(a.at, b.at))
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]
    // Simultaneous independent changes are allowed; same-minute substitute-on/off chains are ambiguous.
    if (changes.some((other, j) => j !== i && compare(other.at, change.at) === 0 && (other.out === change.incoming || other.incoming === change.out))) return { error: 'ambiguous-substitution-order' }
    if (!active.has(change.out) || !bench.includes(change.incoming) || appearances.has(change.incoming)) return { error: 'unreconciled-substitution-players' }
    active.delete(change.out)
    active.add(change.incoming)
    appearances.get(change.out)!.exited = change.at
    appearances.set(change.incoming, { entered: change.at, exited: null, substitute: true })
  }
  return { appearances, firstMinute: changes.length ? changes[0].at.elapsed + changes[0].at.extra : null }
}
function substituteGoals(goals: readonly Goal[], appearances: Map<number, Appearance>, teamId: number): number | null {
  let total = 0
  for (const goal of goals.filter(g => g.teamId === teamId && !g.ownGoal)) {
    if (!id(goal.playerId)) return null
    const appearance = appearances.get(goal.playerId)
    if (!appearance || (appearance.entered && compare(appearance.entered, goal.at) >= 0) || (appearance.exited && compare(appearance.exited, goal.at) <= 0)) return null
    if (appearance.substitute) total++
  }
  return total
}
function stat(rows: readonly MatchStatistics[], teamId: number, name: string, percent = false): number | null {
  const teams = rows.filter(r => r.team.id === teamId)
  if (teams.length !== 1) return null
  const values = teams[0].statistics.filter(s => s.type.trim().toLowerCase() === name)
  if (values.length !== 1) return null
  const raw = values[0].value
  if (raw === null || (typeof raw !== 'number' && typeof raw !== 'string')) return null
  if (typeof raw === 'string' && !(percent ? /^\d+(?:\.\d+)?%?$/ : /^\d+(?:\.\d+)?$/).test(raw.trim())) return null
  const value = typeof raw === 'number' ? raw : Number(raw.trim().replace(/%$/, ''))
  return Number.isFinite(value) && value >= 0 && (!percent || value <= 100) ? value : null
}
function formation(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  if (!normalized || !/^\d(?:-\d){1,5}$/.test(normalized)) return null
  const parts = normalized.split('-').map(Number)
  return parts.every(n => n > 0) && parts.reduce((a, b) => a + b, 0) === 10 ? normalized : null
}

/**
 * Pass fixture-scoped, successful endpoint data in MatchFeed wrappers. Missing feeds stay undefined.
 * Attribution requires this team's lineup coach ID, or an explicit bounded tenure when that ID is absent.
 * A conflicting ID, failed lineup response or duplicate fixture can never be overridden by a tenure.
 * Covered means usable for that particular metric; never display a total without its coverage.
 */
function deriveSummary(input: CoachMatchMetricsInput): CoachMatchMetricSummary {
  const { teamId, coachId, matches, tenureFallback } = input
  if (!id(teamId) || !id(coachId)) throw new RangeError('Positive integer teamId and coachId are required')
  let tenureStart = 0, tenureEnd = 0
  if (tenureFallback) {
    if (tenureFallback.teamId !== teamId || tenureFallback.coachId !== coachId || !tenureFallback.label.trim()) throw new RangeError('Tenure must match team/coach and include a label')
    tenureStart = utcDay(tenureFallback.start); tenureEnd = utcDay(tenureFallback.end) + 86_400_000
    if (tenureStart >= tenureEnd) throw new RangeError('Tenure start must not follow end')
  }
  const selection: CoachMatchMetricSummary['selection'] = { suppliedMatches: matches.length, includedMatches: 0, verifiedLineupMatches: 0, tenureFallbackMatches: 0, included: [], excluded: [] }
  const diagnostics: CoachMatchMetricSummary['diagnostics'] = []
  const counts = new Map<number, number>()
  for (const m of matches) counts.set(m.fixture.fixture.id, (counts.get(m.fixture.fixture.id) ?? 0) + 1)
  const results: MatchResults = { wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 }
  const possession: number[] = [], xgFor: number[] = [], xgAgainst: number[] = [], firstSubs: number[] = []
  const formations: Record<string, number> = {}
  let formationMatches = 0, eventMatches = 0, trailingMatches = 0, concededFirstMatches = 0, trailingPoints = 0, concededFirstPoints = 0
  let subsCovered = 0, noSubs = 0, subGoalsCovered = 0, subGoalsTotal = 0
  for (const match of matches) {
    const f = match.fixture, fixtureId = f.fixture.id
    const exclude = (reason: string) => selection.excluded.push({ fixtureId, reason })
    const note = (scope: string, reason: string) => diagnostics.push({ fixtureId, scope, reason })
    if (!id(fixtureId) || !id(f.teams.home.id) || !id(f.teams.away.id) || f.teams.home.id === f.teams.away.id) { exclude('invalid-fixture-identity'); continue }
    if (counts.get(fixtureId)! > 1) { exclude('duplicate-fixture'); continue }
    if (![f.teams.home.id, f.teams.away.id].includes(teamId)) { exclude('different-team'); continue }
    if (!Number.isFinite(Date.parse(f.fixture.date))) { exclude('invalid-fixture-date'); continue }
    if (f.fixture.status.short !== 'FT') { exclude('not-regulation-time-final'); continue }
    if (!validScore(f.goals) || (validScore(f.score?.fulltime) && (f.goals.home !== f.score.fulltime.home || f.goals.away !== f.score.fulltime.away))) { exclude('invalid-final-score'); continue }
    const lineupProblem = feedProblem(match.lineups, fixtureId)
    const teamLineups = lineupProblem ? [] : match.lineups!.data.filter(l => l.team.id === teamId)
    if (match.lineups && lineupProblem) { exclude('unusable-lineup-feed:' + lineupProblem); continue }
    if (teamLineups.length > 1) { exclude('duplicate-team-lineup'); continue }
    const lineup = teamLineups[0]
    const recordedCoach = lineup?.coach?.id
    let attribution: 'lineup-coach' | 'explicit-tenure'
    if (recordedCoach === coachId) { attribution = 'lineup-coach'; selection.verifiedLineupMatches++ }
    else {
      if (recordedCoach !== undefined && recordedCoach !== null) { exclude('different-or-invalid-lineup-coach'); continue }
      const date = Date.parse(f.fixture.date)
      if (!tenureFallback || !Number.isFinite(date) || date < tenureStart || date >= tenureEnd) { exclude('coach-not-verified'); continue }
      attribution = 'explicit-tenure'; selection.tenureFallbackMatches++
    }
    selection.included.push({ fixtureId, attribution, label: attribution === 'lineup-coach' ? 'Verified lineup coach ID' : tenureFallback!.label.trim() })
    selection.includedMatches++
    const home = f.teams.home.id === teamId
    const gf = home ? f.goals.home : f.goals.away, ga = home ? f.goals.away : f.goals.home
    const points = gf > ga ? 3 : gf === ga ? 1 : 0
    results[gf > ga ? 'wins' : gf === ga ? 'draws' : 'losses']++
    results.points += points; results.goalsFor += gf; results.goalsAgainst += ga
    const shape = formation(lineup?.formation)
    if (shape) { formations[shape] = (formations[shape] ?? 0) + 1; formationMatches++ }
    else note('formations', 'missing-or-invalid-starting-formation')
    const statisticsProblem = feedProblem(match.statistics, fixtureId)
    const rows = statisticsProblem ? [] : match.statistics!.data
    const opponentId = home ? f.teams.away.id : f.teams.home.id
    for (const [scope, values, selectedTeam, field, percent] of [
      ['possession', possession, teamId, 'ball possession', true],
      ['xgFor', xgFor, teamId, 'expected_goals', false],
      ['xgAgainst', xgAgainst, opponentId, 'expected_goals', false],
    ] as const) {
      const value = stat(rows, selectedTeam, field, percent)
      if (value === null) note(scope, statisticsProblem ?? 'missing-invalid-or-duplicate-statistic')
      else values.push(value)
    }
    const eventsProblem = feedProblem(match.events, fixtureId)
    if (eventsProblem) { note('events', eventsProblem); continue }
    const review = reviewGoals(f, match.events!.data, teamId)
    if ('error' in review) { note('events', review.error); continue }
    eventMatches++
    if (review.behind) { trailingMatches++; trailingPoints += points }
    if (review.concededFirst) { concededFirstMatches++; concededFirstPoints += points }
    const substitutions = reviewSubstitutions(match.events!.data, lineup, teamId)
    if ('error' in substitutions) { note('substitutions', substitutions.error); continue }
    subsCovered++
    if (substitutions.firstMinute === null) noSubs++; else firstSubs.push(substitutions.firstMinute)
    const goals = substituteGoals(review.goals, substitutions.appearances, teamId)
    if (goals === null) note('goalsBySubstitutes', 'scorer-not-corroborated-on-pitch')
    else { subGoalsCovered++; subGoalsTotal += goals }
  }
  const eligible = selection.includedMatches
  const metric = <T>(value: T | null, covered: number, denominator = covered, denominatorLabel = 'covered matches'): MatchMetric<T> => ({
    value: covered ? value : null,
    coverage: { eligibleMatches: eligible, coveredMatches: covered, missingMatches: eligible - covered, denominator, denominatorLabel },
  })
  const mean = (values: number[]) => metric(values.length ? values.reduce((a, b) => a + b, 0) / values.length : null, values.length)
  return {
    selection, results: metric(results, eligible), pointsPerMatch: metric(eligible ? results.points / eligible : null, eligible),
    possession: mean(possession), xgFor: mean(xgFor), xgAgainst: mean(xgAgainst), formations: metric(formations, formationMatches),
    pointsFromLosingPositions: metric(trailingPoints, eventMatches, trailingMatches, 'covered matches in which the team trailed'),
    pointsAfterConcedingFirst: metric(concededFirstPoints, eventMatches, concededFirstMatches, 'covered matches in which the opponent scored first'),
    goalsBySubstitutes: metric(subGoalsTotal, subGoalsCovered),
    averageFirstSubstitutionMinute: { ...metric(firstSubs.length ? firstSubs.reduce((a, b) => a + b, 0) / firstSubs.length : null, subsCovered, firstSubs.length, 'covered matches with at least one substitution'), matchesWithoutSubstitutions: noSubs },
    diagnostics, limitations: LIMITATIONS,
  }
}

/** See MatchFeed.complete and ExplicitCoachTenure before adapting provider envelopes. Never mark errors as complete. */
export function deriveCoachMatchMetrics(input: CoachMatchMetricsInput): CoachMatchMetrics {
  const ordered = [...input.matches].sort((a, b) =>
    (Date.parse(a.fixture.fixture.date) || 0) - (Date.parse(b.fixture.fixture.date) || 0) || a.fixture.fixture.id - b.fixture.fixture.id)
  const overall = deriveSummary({ ...input, matches: ordered })
  const includedIds = new Set(overall.selection.included.map(m => m.fixtureId))
  const included = ordered.filter(m => includedIds.has(m.fixture.fixture.id))
  const ranges = [
    { key: '1-5', firstOrdinal: 1, lastOrdinal: 5 },
    { key: '6-20', firstOrdinal: 6, lastOrdinal: 20 },
    { key: '21+', firstOrdinal: 21, lastOrdinal: null },
  ] as const
  return {
    ...overall,
    windowBasis: 'Nonoverlapping chronological windows of supplied, attributable FT matches with valid results; date then fixture ID breaks ties. Missing/unverified fixtures are excluded before numbering. These are not guaranteed to be the first matches of a complete tenure and are descriptive, not causal impact estimates. Coverage is calculated separately within each window; dates are fixture timestamps.',
    windows: ranges.map(range => {
      const matches = included.slice(range.firstOrdinal - 1, range.lastOrdinal ?? undefined)
      return { ...range, dateRange: matches.length ? { first: matches[0].fixture.fixture.date, last: matches[matches.length - 1].fixture.fixture.date } : null, metrics: deriveSummary({ ...input, matches }) }
    }),
  }
}
