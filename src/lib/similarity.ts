/**
 * Compare two coach records and return a 0–100 similarity score plus breakdown.
 * Factors: pressing intensity, build preference, youth trust (placeholder), risk band,
 * league experience, wage band.
 */

type CoachRecord = Record<string, unknown>

function norm(s: string | null | undefined): string {
  return (s ?? '').toString().trim().toLowerCase()
}

function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : Math.max(0, Math.min(100, n))
}

/** Risk band from media_risk_score: low 0–33, medium 34–66, high 67–100 */
function riskBand(score: number | null): string {
  if (score == null) return 'unknown'
  if (score <= 33) return 'low'
  if (score <= 66) return 'medium'
  return 'high'
}

export type SimilarityBreakdown = {
  pressing_intensity: number
  build_preference: number
  youth_trust: number
  risk_band: number
  league_experience: number
  wage_band: number
}

export type SimilarityResult = {
  score: number
  breakdown: SimilarityBreakdown
}

export function computeSimilarity(coachA: CoachRecord, coachB: CoachRecord): SimilarityResult {
  const pressingA = norm(coachA.pressing_intensity as string)
  const pressingB = norm(coachB.pressing_intensity as string)
  const pressingMatch = pressingA && pressingB ? (pressingA === pressingB ? 100 : 50) : 0

  const buildA = norm(coachA.build_preference as string)
  const buildB = norm(coachB.build_preference as string)
  const buildMatch = buildA && buildB ? (buildA === buildB ? 100 : 50) : 0

  const youthA = num(coachA.overall_manual_score) ?? 50
  const youthB = num(coachB.overall_manual_score) ?? 50
  const youthDiff = Math.abs(youthA - youthB)
  const youthMatch = Math.max(0, 100 - youthDiff)

  const riskA = riskBand(num(coachA.media_risk_score as number))
  const riskB = riskBand(num(coachB.media_risk_score as number))
  const riskMatch = riskA === riskB ? 100 : riskA === 'unknown' || riskB === 'unknown' ? 50 : 0

  const leagueA = (coachA.league_experience as string[]) ?? []
  const leagueB = (coachB.league_experience as string[]) ?? []
  const leagueSetB = new Set(leagueB.map((l) => String(l).toLowerCase()))
  const overlap = leagueA.filter((l) => leagueSetB.has(String(l).toLowerCase())).length
  const leagueTotal = Math.max(1, leagueA.length + leagueB.length - overlap)
  const leagueMatch = leagueTotal ? Math.round((overlap / leagueTotal) * 100) : 0

  const wageA = norm(coachA.wage_expectation as string)
  const wageB = norm(coachB.wage_expectation as string)
  const wageMatch = wageA && wageB ? (wageA === wageB ? 100 : 50) : 0

  const breakdown: SimilarityBreakdown = {
    pressing_intensity: pressingMatch,
    build_preference: buildMatch,
    youth_trust: youthMatch,
    risk_band: riskMatch,
    league_experience: leagueMatch,
    wage_band: wageMatch,
  }
  const score = Math.round(
    (pressingMatch + buildMatch + youthMatch + riskMatch + leagueMatch + wageMatch) / 6
  )
  return { score: Math.max(0, Math.min(100, score)), breakdown }
}
