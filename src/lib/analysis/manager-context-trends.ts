import { computeClubEloTrend, type ClubSeasonPerformanceInput } from './elo-trends.ts'

export type ManagerContextStintInput = {
  id: string
  club_id: string | null
  club_name: string
  started_on: string | null
  ended_on: string | null
}

export type ManagerContextSeasonInput = ClubSeasonPerformanceInput & {
  club_id: string
}

export type ManagerContextStintTrend = {
  stintId: string
  clubName: string
  startedOn: string | null
  endedOn: string | null
  seasonCount: number
  movement: number | null
  signal: 'rising' | 'stable' | 'declining' | 'insufficient-data'
  seasons: string[]
}

export type ManagerContextSummary = {
  totalStints: number
  linkedStintCount: number
  trendReadyCount: number
  risingCount: number
  stableCount: number
  decliningCount: number
  coverage: 'complete' | 'partial' | 'insufficient'
  stints: ManagerContextStintTrend[]
}

type DateBounds = { start: Date; end: Date }

function seasonBounds(season: string): DateBounds | null {
  const match = season.trim().match(/^(\d{4})(?:\s*[/\-]\s*(\d{2}|\d{4}))?$/)
  if (!match) return null

  const startYear = Number(match[1])
  if (!Number.isInteger(startYear)) return null
  if (!match[2]) {
    return {
      start: new Date(Date.UTC(startYear, 0, 1)),
      end: new Date(Date.UTC(startYear, 11, 31, 23, 59, 59)),
    }
  }

  const abbreviatedEndYear = Math.floor(startYear / 100) * 100 + Number(match[2])
  const endYear = match[2].length === 2
    ? abbreviatedEndYear < startYear ? abbreviatedEndYear + 100 : abbreviatedEndYear
    : Number(match[2])
  if (endYear < startYear || endYear > startYear + 1) return null

  return {
    start: new Date(Date.UTC(startYear, 6, 1)),
    end: new Date(Date.UTC(endYear, 5, 30, 23, 59, 59)),
  }
}

function validDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isFinite(date.valueOf()) ? date : null
}

function overlapsTenure(
  season: string,
  startedOn: string | null,
  endedOn: string | null,
  now: Date
): boolean {
  const bounds = seasonBounds(season)
  const tenureStart = validDate(startedOn)
  if (!bounds || !tenureStart) return false
  const tenureEnd = endedOn ? validDate(endedOn) : now
  if (!tenureEnd || tenureEnd < tenureStart) return false
  return bounds.start <= tenureEnd && bounds.end >= tenureStart
}

export function computeManagerContextTrends(
  stints: ManagerContextStintInput[],
  seasons: ManagerContextSeasonInput[],
  now = new Date()
): ManagerContextSummary {
  const linkedStints = stints.filter((stint) => Boolean(stint.club_id))
  const trends = linkedStints.map((stint): ManagerContextStintTrend => {
    const overlappingSeasons = seasons
      .filter((season) => season.club_id === stint.club_id)
      .filter((season) => overlapsTenure(season.season, stint.started_on, stint.ended_on, now))
    const trend = computeClubEloTrend(overlappingSeasons)
    const movement = trend.points.length >= 2
      ? trend.points.at(-1)!.rating - trend.points[0].rating
      : null
    const signal = movement === null
      ? 'insufficient-data'
      : movement >= 25
        ? 'rising'
        : movement <= -25
          ? 'declining'
          : 'stable'

    return {
      stintId: stint.id,
      clubName: stint.club_name,
      startedOn: stint.started_on,
      endedOn: stint.ended_on,
      seasonCount: trend.points.length,
      movement,
      signal,
      seasons: trend.points.map((point) => point.season),
    }
  })

  const trendReadyCount = trends.filter((trend) => trend.movement !== null).length
  const coverage =
    stints.length > 0 && trendReadyCount === stints.length
      ? 'complete'
      : trendReadyCount > 0
        ? 'partial'
        : 'insufficient'

  return {
    totalStints: stints.length,
    linkedStintCount: linkedStints.length,
    trendReadyCount,
    risingCount: trends.filter((trend) => trend.signal === 'rising').length,
    stableCount: trends.filter((trend) => trend.signal === 'stable').length,
    decliningCount: trends.filter((trend) => trend.signal === 'declining').length,
    coverage,
    stints: trends,
  }
}
