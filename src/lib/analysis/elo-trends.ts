export type ClubSeasonPerformanceInput = {
  id?: string
  season: string
  league_position: number | null
  points: number | null
  goals_for: number | null
  goals_against: number | null
  league_label?: string | null
}

export type EloTrendPoint = {
  id: string
  season: string
  rating: number
  movement: number
  performanceScore: number
  goalDifference: number | null
  leaguePosition: number | null
}

export type EloTrendSummary = {
  points: EloTrendPoint[]
  currentRating: number | null
  oneSeasonMovement: number | null
  threeSeasonMovement: number | null
  signal: 'rising' | 'stable' | 'declining' | 'insufficient-data'
  interpretation: string
  methodology: string
}

const BASE_RATING = 1500

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function scoreSeason(row: ClubSeasonPerformanceInput): number | null {
  const scores: Array<{ value: number; weight: number }> = []

  if (row.league_position != null) {
    scores.push({
      value: clamp(92 - (row.league_position - 1) * 5, 15, 95),
      weight: 0.45,
    })
  }

  if (row.points != null) {
    scores.push({
      value: clamp(50 + (row.points - 55) * 0.9, 10, 95),
      weight: 0.35,
    })
  }

  if (row.goals_for != null && row.goals_against != null) {
    scores.push({
      value: clamp(50 + (row.goals_for - row.goals_against) * 1.1, 5, 95),
      weight: 0.2,
    })
  }

  if (scores.length === 0) return null
  const totalWeight = scores.reduce((total, score) => total + score.weight, 0)
  return scores.reduce((total, score) => total + score.value * score.weight, 0) / totalWeight
}

export function computeClubEloTrend(rows: ClubSeasonPerformanceInput[]): EloTrendSummary {
  const sorted = [...rows]
    .filter((row) => row.season.trim().length > 0)
    .sort((a, b) => a.season.localeCompare(b.season))

  let priorRating = BASE_RATING
  const points: EloTrendPoint[] = []

  for (const row of sorted) {
    const performanceScore = scoreSeason(row)
    if (performanceScore === null) continue

    const targetRating = BASE_RATING + (performanceScore - 50) * 5.2
    const rating = Math.round(priorRating * 0.45 + targetRating * 0.55)
    const movement = points.length === 0 ? 0 : rating - priorRating
    const goalDifference = row.goals_for != null && row.goals_against != null ? row.goals_for - row.goals_against : null

    points.push({
      id: row.id ?? row.season,
      season: row.season,
      rating,
      movement,
      performanceScore: Math.round(performanceScore),
      goalDifference,
      leaguePosition: row.league_position,
    })
    priorRating = rating
  }

  const currentRating = points.at(-1)?.rating ?? null
  const oneSeasonMovement = points.length >= 2 ? points.at(-1)!.rating - points.at(-2)!.rating : null
  const threeSeasonMovement = points.length >= 4 ? points.at(-1)!.rating - points.at(-4)!.rating : null
  const trendMovement = threeSeasonMovement ?? oneSeasonMovement

  const signal =
    points.length < 2
      ? 'insufficient-data'
      : trendMovement != null && trendMovement >= 25
        ? 'rising'
        : trendMovement != null && trendMovement <= -25
          ? 'declining'
          : 'stable'

  const interpretation =
    signal === 'insufficient-data'
      ? 'Add at least two seasons with position, points or goal difference to show a club power trend.'
      : signal === 'rising'
        ? 'Club strength is trending upward on recent league finish, points and goal-difference signals.'
        : signal === 'declining'
          ? 'Club strength is trending downward, creating a higher-pressure appointment environment.'
          : 'Club strength is broadly stable, so appointment fit should focus on mandate style and execution risk.'

  return {
    points,
    currentRating,
    oneSeasonMovement,
    threeSeasonMovement,
    signal,
    interpretation,
    methodology: 'Transparent proxy: league position, points and goal difference are normalised into a season strength score, then smoothed around a 1500 baseline. Replaceable with ClubElo or match-by-match provider data.',
  }
}
