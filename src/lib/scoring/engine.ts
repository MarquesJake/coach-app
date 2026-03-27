/**
 * Modular matchmaking scoring engine.
 * All score math lives here; no inline score calculation in pages or matchmaking.
 */

import type { Database } from '@/lib/types/db'
import type { MandateContext, UrgencyLevel, LeadershipArchetype } from './mandate-adapter'
import { WEIGHTS } from './mandate-adapter'
import { getDimLabel, computeSubScores } from './explanation'
import type { DimScore, MandateDimScores, ExclusionReason } from './explanation'

type Vacancy = Database['public']['Tables']['vacancies']['Row']
type Coach = Database['public']['Tables']['coaches']['Row']

// —— Weights for overall_score (must sum to 1.0 with risk as subtractive)
const OVERALL_WEIGHTS = {
  tactical_fit: 0.3,
  cultural_fit: 0.2,
  availability_score: 0.1,
  board_compatibility_score: 0.2,
  risk_score: 0.2, // subtracted
} as const

// —— Tactical compatibility maps
const STYLE_COMPATIBILITY: Record<string, string[]> = {
  'Possession-based': ['Possession-based', 'Tiki-taka', 'Build from back'],
  'Tiki-taka': ['Tiki-taka', 'Possession-based', 'Build from back'],
  'Counter-attacking': ['Counter-attacking', 'Direct', 'Defensive'],
  'High press': ['High press', 'Gegenpressing', 'Possession-based'],
  'Gegenpressing': ['Gegenpressing', 'High press', 'Possession-based'],
  'Direct': ['Direct', 'Counter-attacking', 'Long ball'],
  'Long ball': ['Long ball', 'Direct', 'Counter-attacking'],
  'Defensive': ['Defensive', 'Counter-attacking', 'Low block'],
  'Low block': ['Low block', 'Defensive', 'Counter-attacking'],
  'Build from back': ['Build from back', 'Possession-based', 'Tiki-taka'],
  'Balanced': ['Balanced', 'Possession-based', 'Counter-attacking', 'Direct'],
}

const PRESSING_LEVELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High']

const BUILD_COMPATIBILITY: Record<string, string[]> = {
  'Short passing': ['Short passing', 'Build from back', 'Possession play'],
  'Build from back': ['Build from back', 'Short passing', 'Possession play'],
  'Possession play': ['Possession play', 'Short passing', 'Build from back'],
  'Direct play': ['Direct play', 'Long ball', 'Mixed'],
  'Long ball': ['Long ball', 'Direct play'],
  'Mixed': ['Mixed', 'Direct play', 'Short passing', 'Balanced'],
  'Balanced': ['Balanced', 'Mixed', 'Short passing', 'Direct play'],
}

const LEADERSHIP_COMPATIBILITY: Record<string, string[]> = {
  'Win trophies': ['Authoritarian', 'Demanding', 'Strategic', 'Motivator'],
  'Qualify for Europe': ['Strategic', 'Motivator', 'Collaborative', 'Demanding'],
  'Avoid relegation': ['Motivator', 'Pragmatic', 'Collaborative', 'Defensive-minded'],
  'Develop youth': ['Developer', 'Collaborative', 'Patient', 'Educator'],
  'Rebuild squad': ['Developer', 'Strategic', 'Patient', 'Visionary'],
  'Maintain position': ['Pragmatic', 'Strategic', 'Balanced', 'Collaborative'],
  'Promotion': ['Motivator', 'Demanding', 'Strategic', 'Authoritarian'],
  'Build identity': ['Visionary', 'Developer', 'Strategic', 'Educator'],
}

// —— Budget / wage ranges for financial and board context
const BUDGET_RANGES = [
  'Under £1m', '£1m - £5m', '£5m - £15m', '£15m - £30m',
  '£30m - £60m', '£60m - £100m', '£100m - £200m', 'Over £200m',
]
const WAGE_RANGES = [
  'Under £500k/yr', '£500k - £1m/yr', '£1m - £2m/yr', '£2m - £4m/yr',
  '£4m - £7m/yr', '£7m - £12m/yr', 'Over £12m/yr',
]
const STAFF_BUDGET_RANGES = [
  'Under £500k', '£500k - £1m', '£1m - £2m', '£2m - £5m', '£5m - £10m', 'Over £10m',
]

function getStyleScore(vacancyStyle: string, coachStyle: string): number {
  if (vacancyStyle === coachStyle) return 100
  const compatible = STYLE_COMPATIBILITY[vacancyStyle] || []
  if (compatible.includes(coachStyle)) {
    const idx = compatible.indexOf(coachStyle)
    return Math.max(40, 90 - idx * 20)
  }
  return 25
}

function normalizePressingLevel(s: string): string {
  // Normalise 'very high' → 'Very High' etc. so seed data case variants match PRESSING_LEVELS
  return s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

function getPressingScore(vacancyLevel: string, coachIntensity: string): number {
  const vIdx = PRESSING_LEVELS.indexOf(normalizePressingLevel(vacancyLevel))
  const cIdx = PRESSING_LEVELS.indexOf(normalizePressingLevel(coachIntensity))
  if (vIdx === -1 || cIdx === -1) return 50
  const diff = Math.abs(vIdx - cIdx)
  return Math.max(10, 100 - diff * 25)
}

function getBuildScore(vacancyBuild: string, coachBuild: string): number {
  if (vacancyBuild === coachBuild) return 100
  const compatible = BUILD_COMPATIBILITY[vacancyBuild] || []
  if (compatible.includes(coachBuild)) {
    const idx = compatible.indexOf(coachBuild)
    return Math.max(40, 85 - idx * 15)
  }
  return 20
}

function getRangeIndex(value: string, ranges: string[]): number {
  const idx = ranges.indexOf(value)
  return idx === -1 ? Math.floor(ranges.length / 2) : idx
}

/** Tactical fit 0–100: style + pressing + build */
function computeTacticalFit(vacancy: Vacancy, coach: Coach): number {
  const styleScore = getStyleScore(vacancy.style_of_play, coach.preferred_style)
  const pressingScore = getPressingScore(vacancy.pressing_level, coach.pressing_intensity)
  const buildScore = getBuildScore(vacancy.build_style, coach.build_preference)
  return Math.round(styleScore * 0.45 + pressingScore * 0.30 + buildScore * 0.25)
}

/** Cultural fit 0–100: leadership vs objective + reputation */
function computeCulturalFit(vacancy: Vacancy, coach: Coach): number {
  const idealStyles = LEADERSHIP_COMPATIBILITY[vacancy.objective] || []
  let leadershipScore = 40
  if (idealStyles.includes(coach.leadership_style)) {
    const idx = idealStyles.indexOf(coach.leadership_style)
    leadershipScore = Math.max(50, 100 - idx * 15)
  }
  const reputationTiers = ['Unknown', 'Emerging', 'Established', 'Elite', 'World-class']
  const repIdx = reputationTiers.indexOf(coach.reputation_tier)
  const reputationScore = repIdx >= 0 ? 20 + repIdx * 20 : 50
  return Math.round(leadershipScore * 0.7 + reputationScore * 0.3)
}

/** Availability score 0–100 */
function computeAvailabilityScore(coach: Coach): number {
  switch (coach.available_status) {
    case 'Available': return 100
    case 'Open to offers': return 80
    case 'Under contract - interested': return 55
    case 'Under contract': return 30
    case 'Not available': return 5
    default: return 50
  }
}

/** Board compatibility 0–100: use coach metric or derive from leadership/objective */
function computeBoardCompatibilityScore(vacancy: Vacancy, coach: Coach): number {
  if (typeof coach.board_compatibility === 'number' && coach.board_compatibility >= 0 && coach.board_compatibility <= 100) {
    return Math.round(coach.board_compatibility)
  }
  const cultural = computeCulturalFit(vacancy, coach)
  return Math.min(100, cultural + 10)
}

/** Risk score 0–100 (higher = more risk). Uses availability inverse + coach risk metrics. */
function computeRiskScore(coach: Coach): number {
  const availabilityScore = computeAvailabilityScore(coach)
  const availabilityRisk = 100 - availabilityScore
  const culturalRisk = typeof coach.cultural_risk === 'number' ? coach.cultural_risk : 50
  const mediaRisk = typeof coach.media_risk === 'number' ? coach.media_risk : 50
  const raw = (availabilityRisk * 0.4) + (culturalRisk * 0.3) + (mediaRisk * 0.3)
  return Math.round(Math.max(0, Math.min(100, raw)))
}

/** Financial fit 0–100 (for display only; not in new overall formula) */
function computeFinancialFitScore(vacancy: Vacancy, coach: Coach): number {
  const budgetIdx = getRangeIndex(vacancy.budget_range, BUDGET_RANGES)
  const wageIdx = getRangeIndex(coach.wage_expectation, WAGE_RANGES)
  const normalizedBudget = budgetIdx / (BUDGET_RANGES.length - 1)
  const normalizedWage = wageIdx / (WAGE_RANGES.length - 1)
  const wageFit = normalizedWage <= normalizedBudget ? 100 : Math.max(0, 100 - (normalizedWage - normalizedBudget) * 200)
  const staffBudgetIdx = getRangeIndex(vacancy.staff_budget, STAFF_BUDGET_RANGES)
  const staffCostIdx = getRangeIndex(coach.staff_cost_estimate, STAFF_BUDGET_RANGES)
  const staffFit = staffCostIdx <= staffBudgetIdx ? 100 : Math.max(0, 100 - (staffCostIdx - staffBudgetIdx) * 30)
  return Math.round(wageFit * 0.6 + staffFit * 0.4)
}

/** Profile completeness 0–100: share of key fields present */
const PROFILE_FIELDS: (keyof Coach)[] = [
  'name', 'preferred_style', 'pressing_intensity', 'build_preference', 'leadership_style',
  'wage_expectation', 'staff_cost_estimate', 'available_status', 'reputation_tier', 'league_experience',
]

function computeProfileCompleteness(coach: Coach): number {
  let filled = 0
  for (const key of PROFILE_FIELDS) {
    const v = coach[key]
    if (v != null && v !== '' && (Array.isArray(v) ? v.length > 0 : true)) filled++
  }
  return Math.round((filled / PROFILE_FIELDS.length) * 100)
}

/** Recency score 0–100: higher if last_updated is recent */
function computeRecencyScore(lastUpdated: string): number {
  const updated = new Date(lastUpdated).getTime()
  const now = Date.now()
  const daysAgo = (now - updated) / (24 * 60 * 60 * 1000)
  if (daysAgo <= 7) return 100
  if (daysAgo <= 30) return 80
  if (daysAgo <= 90) return 60
  if (daysAgo <= 180) return 40
  return Math.max(0, 20 - Math.floor(daysAgo / 365) * 5)
}

/** Updates count score 0–100: more updates = higher confidence (capped) */
function computeUpdatesScore(updateCount: number): number {
  if (updateCount >= 10) return 100
  if (updateCount >= 5) return 80
  if (updateCount >= 2) return 60
  if (updateCount >= 1) return 40
  return 20
}

/** Confidence 0–100: profile completeness, recency, number of updates */
function computeConfidenceScore(
  coach: Coach,
  options: { updateCount: number }
): number {
  const completeness = computeProfileCompleteness(coach)
  const recency = computeRecencyScore(coach.last_updated)
  const updates = computeUpdatesScore(options.updateCount)
  return Math.round(completeness * 0.5 + recency * 0.3 + updates * 0.2)
}

// —— Public API

export type RiskLevel = 'Low' | 'Medium' | 'High'
export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export interface MatchScoreResult {
  tactical_fit_score: number
  cultural_fit_score: number
  availability_score: number
  board_compatibility_score: number
  risk_score: number
  overall_score: number
  confidence_score: number
  financial_fit_score: number
  risk_level: RiskLevel
  confidence_level: ConfidenceLevel
}

export interface ConfidenceContext {
  updateCount: number
}

/**
 * Compute all match scores for a vacancy–coach pair.
 * Overall = (tactical*0.3 + cultural*0.2 + availability*0.1 + board*0.2) - (risk*0.2), clamped 0–100.
 */
export function computeMatchScores(
  vacancy: Vacancy,
  coach: Coach,
  context: ConfidenceContext
): MatchScoreResult {
  const tactical_fit_score = computeTacticalFit(vacancy, coach)
  const cultural_fit_score = computeCulturalFit(vacancy, coach)
  const availability_score = computeAvailabilityScore(coach)
  const board_compatibility_score = computeBoardCompatibilityScore(vacancy, coach)
  const risk_score = computeRiskScore(coach)
  const financial_fit_score = computeFinancialFitScore(vacancy, coach)

  const rawOverall =
    tactical_fit_score * OVERALL_WEIGHTS.tactical_fit +
    cultural_fit_score * OVERALL_WEIGHTS.cultural_fit +
    availability_score * OVERALL_WEIGHTS.availability_score +
    board_compatibility_score * OVERALL_WEIGHTS.board_compatibility_score -
    risk_score * OVERALL_WEIGHTS.risk_score
  const overall_score = Math.round(Math.max(0, Math.min(100, rawOverall)))

  const confidence_score = computeConfidenceScore(coach, context)
  const risk_level = getRiskLevel(risk_score)
  const confidence_level = getConfidenceLevel(confidence_score)

  return {
    tactical_fit_score,
    cultural_fit_score,
    availability_score,
    board_compatibility_score,
    risk_score,
    overall_score,
    confidence_score,
    financial_fit_score,
    risk_level,
    confidence_level,
  }
}

/** Map numeric risk_score (0–100) to Low / Medium / High */
export function getRiskLevel(riskScore: number | null | undefined): RiskLevel {
  if (riskScore == null) return 'Medium'
  if (riskScore <= 33) return 'Low'
  if (riskScore <= 66) return 'Medium'
  return 'High'
}

/** Map numeric confidence_score (0–100) to High / Medium / Low */
export function getConfidenceLevel(confidenceScore: number | null | undefined): ConfidenceLevel {
  if (confidenceScore == null) return 'Medium'
  if (confidenceScore >= 67) return 'High'
  if (confidenceScore >= 34) return 'Medium'
  return 'Low'
}

/** Tooltip copy for risk badge */
export function getRiskTooltipText(riskScore: number | null | undefined): string {
  const level = getRiskLevel(riskScore)
  return `Risk: ${level}. Based on availability, cultural fit risk, and media risk factors.`
}

/** Tooltip copy for confidence badge */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- API accepts optional score for future use
export function getConfidenceTooltipText(confidenceScore?: number | null): string {
  return 'Confidence is based on profile completeness, recency of last update, and number of intelligence updates.'
}

/** Score color class for numeric display (e.g. overall, financial) */
export function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

// =====================================================
// MANDATE-FIT ENGINE
// Mandate-driven coach ranking with 6 fit dimensions,
// IE handling, hard filters, and archetype scoring.
// Pure functions — no database calls.
// =====================================================

// ——————————————————————————————————————————————————
// Coach stint type (fetched alongside coach row)
// ——————————————————————————————————————————————————

export interface CoachStint {
  role_title: string | null
  club_name: string | null
  started_on: string | null
  ended_on: string | null
  league: string | null
  win_rate: number | null
  points_per_game: number | null
  country: string | null
}

// ——————————————————————————————————————————————————
// Result type
// ——————————————————————————————————————————————————

export interface MandateFitResult {
  combined: number
  footballFit: number
  appointability: number
  dims: MandateDimScores
  hardFilter: ExclusionReason | null
  /** Most recent qualifying stint data — for explanation templates */
  recentLeague: string | null
  recentWinRate: number | null
  recentPpg: number | null
}

// ——————————————————————————————————————————————————
// Tactical fit (mandate variant — missing fields renormalise weights)
// ——————————————————————————————————————————————————

const KNOWN_STYLES = new Set(Object.keys(STYLE_COMPATIBILITY))

function computeMandateTacticalFit(ctx: MandateContext, coach: Coach): number | null {
  // A style field that doesn't match any enum value (e.g. free-text sentence from mandate)
  // is treated as absent rather than penalised with a 25 incompatible score.
  const styleReqKnown = !!ctx.styleRequired && KNOWN_STYLES.has(ctx.styleRequired)
  const coachStyleKnown = !!coach.preferred_style && KNOWN_STYLES.has(coach.preferred_style)

  const sOk = styleReqKnown && coachStyleKnown
  const pOk = !!ctx.pressingRequired && !!coach.pressing_intensity
  const bOk = !!ctx.buildRequired && !!coach.build_preference

  const sScore = sOk ? getStyleScore(ctx.styleRequired!, coach.preferred_style!) : 0
  const pScore = pOk ? getPressingScore(ctx.pressingRequired!, coach.pressing_intensity!) : 0
  const bScore = bOk ? getBuildScore(ctx.buildRequired!, coach.build_preference!) : 0

  if (sOk && pOk && bOk) return Math.round(sScore * 0.45 + pScore * 0.30 + bScore * 0.25)
  if (!sOk && pOk && bOk) return Math.round(pScore * 0.55 + bScore * 0.45)
  if (sOk && !pOk && bOk) return Math.round(sScore * 0.64 + bScore * 0.36)
  if (sOk && pOk && !bOk) return Math.round(sScore * 0.60 + pScore * 0.40)
  if (sOk) return sScore
  if (pOk) return pScore
  if (bOk) return bScore

  // No mandate tactical requirements — fall back to stored score or IE
  const stored = (coach as Coach & { tactical_fit_score?: number | null }).tactical_fit_score
  return stored != null ? Math.round(stored) : null
}

// ——————————————————————————————————————————————————
// Level suitability (form-driven, reputation as anchor)
// ——————————————————————————————————————————————————

type TargetTier = 'Top' | 'Mid' | 'Lower' | 'Any'

function computeTargetTier(ctx: MandateContext): TargetTier {
  let objectiveTier: TargetTier
  switch (ctx.primaryArchetype) {
    case 'ELITE_PRESSURE': objectiveTier = 'Top'; break
    case 'DEVELOPMENT': objectiveTier = 'Any'; break
    default: objectiveTier = 'Mid'; break
  }

  let budgetTier: TargetTier = 'Mid'
  const bb = ctx.budgetBand
  if (bb) {
    if (['£60m - £100m', '£100m - £200m', 'Over £200m'].includes(bb)) budgetTier = 'Top'
    else if (['Under £1m', '£1m - £5m', '£5m - £15m'].includes(bb)) budgetTier = 'Lower'
    else budgetTier = 'Mid'
  }

  // Take the highest tier (Top > Mid > Lower > Any)
  const tierOrder: TargetTier[] = ['Top', 'Mid', 'Lower', 'Any']
  const oi = tierOrder.indexOf(objectiveTier)
  const bi = tierOrder.indexOf(budgetTier)
  return tierOrder[Math.min(oi, bi)]
}

function computeStintFormRating(stint: CoachStint): number {
  if (stint.win_rate == null && stint.points_per_game == null) return 25
  const wr = stint.win_rate ?? 0
  const ppg = stint.points_per_game ?? 0
  if (wr >= 0.55 && ppg >= 1.6) return 90
  if (wr >= 0.45 && ppg >= 1.3) return 70
  if (wr >= 0.40 && ppg >= 1.1) return 50
  return 25
}

const TOP_TIER_LEAGUE_TERMS = [
  'premier league', 'la liga', 'bundesliga', 'serie a', 'ligue 1',
  'primera division', '1. bundesliga', 'serie a tim', 'ligue 1 uber eats',
]

function isTopTierLeague(league: string | null): boolean {
  if (!league) return false
  const l = league.toLowerCase()
  return TOP_TIER_LEAGUE_TERMS.some((t) => l.includes(t))
}

function computeLeagueBonus(
  targetTier: TargetTier,
  ratedStints: Array<{ formRating: number; s: CoachStint }>
): number {
  const hasTopTier = ratedStints.some((r) => isTopTierLeague(r.s.league))

  if (!hasTopTier) {
    return targetTier === 'Top' ? -10 : 0
  }

  const topTierRatings = ratedStints.filter((r) => isTopTierLeague(r.s.league))
  const avgTopForm = topTierRatings.reduce((s, r) => s + r.formRating, 0) / topTierRatings.length

  if (targetTier === 'Top') return avgTopForm < 40 ? 4 : 8 // 50% if poor form in that league
  if (targetTier === 'Mid') return 4
  return 0
}

interface LevelResult {
  score: number
  ie: boolean
  recentLeague: string | null
  recentWinRate: number | null
  recentPpg: number | null
}

function computeLevelSuitability(ctx: MandateContext, coach: Coach, stints: CoachStint[]): LevelResult {
  const REPUTATION_ANCHORS: Record<string, number> = {
    'World-class': 75,
    'Elite': 62,
    'Established': 50,
    'Emerging': 32,
    'Unknown': 15,
  }

  const hasReputation = !!coach.reputation_tier
  const anchor = hasReputation ? (REPUTATION_ANCHORS[coach.reputation_tier!] ?? 50) : 50

  // Filter to qualifying stints: Head Coach / Manager / First Team, within 5 years
  const fiveYearsAgo = new Date()
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
  const qualifyingTerms = ['head coach', 'manager', 'first team']

  const qualifying = stints
    .filter((s) => {
      if (!s.role_title) return false
      const lower = s.role_title.toLowerCase()
      if (!qualifyingTerms.some((t) => lower.includes(t))) return false
      if (!s.ended_on) return true // current role counts
      return new Date(s.ended_on) >= fiveYearsAgo
    })
    .slice(0, 3) // at most 3 most recent

  if (qualifying.length === 0) {
    // No qualifying stints — score from reputation anchor only, flag IE
    return { score: anchor, ie: true, recentLeague: null, recentWinRate: null, recentPpg: null }
  }

  const now = new Date()
  const targetTier = computeTargetTier(ctx)

  const ratedStints = qualifying.map((s) => {
    const formRating = computeStintFormRating(s)
    const endDate = s.ended_on ? new Date(s.ended_on) : now
    const yearsAgo = (now.getTime() - endDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    const recencyWeight = yearsAgo <= 1 ? 1.0 : yearsAgo <= 2 ? 0.85 : yearsAgo <= 3 ? 0.70 : 0.55
    const isNT =
      (s.role_title?.toLowerCase() ?? '').includes('national') ||
      (s.club_name?.toLowerCase() ?? '').includes('national')
    const ntDiscount = isNT ? 0.8 : 1.0
    return { formRating, recencyWeight, ntDiscount, s }
  })

  const totalWeight = ratedStints.reduce((sum, r) => sum + r.recencyWeight, 0)
  const avgFormScore =
    ratedStints.reduce((sum, r) => sum + r.formRating * r.recencyWeight * r.ntDiscount, 0) / totalWeight

  const leagueBonus = computeLeagueBonus(targetTier, ratedStints)
  const formComponent = Math.max(0, Math.min(100, avgFormScore + leagueBonus))
  const raw = Math.round(formComponent * 0.65 + anchor * 0.35)
  const score = Math.min(100, Math.max(raw, anchor - 10)) // floor: anchor - 10

  const mostRecent = qualifying[0]
  return {
    score,
    ie: !hasReputation, // IE if no reputation anchor to calibrate against
    recentLeague: mostRecent.league,
    recentWinRate: mostRecent.win_rate,
    recentPpg: mostRecent.points_per_game,
  }
}

// ——————————————————————————————————————————————————
// Leadership match (archetype model)
// ——————————————————————————————————————————————————

function scoreForArchetype(archetype: LeadershipArchetype, coach: Coach): number {
  let score = 20 // base

  const ls = coach.leadership_style ?? ''
  const c = coach as Coach & {
    player_development_model?: string | null
    academy_integration?: string | null
    training_methodology?: string | null
  }
  const pdm = c.player_development_model ?? ''
  const ai = c.academy_integration ?? ''
  const tm = c.training_methodology ?? ''

  switch (archetype) {
    case 'REBUILD':
      if (['Developer', 'Visionary', 'Strategic'].includes(ls)) score += 45
      else if (['Patient', 'Collaborative'].includes(ls)) score += 25
      if (pdm.includes('Youth') || pdm.includes('Development')) score += 20
      if (['High', 'Strong'].includes(ai)) score += 20
      break

    case 'ELITE_PRESSURE':
      if (['Demanding', 'Authoritarian', 'Strategic'].includes(ls)) score += 45
      else if (['Motivator', 'Pragmatic'].includes(ls)) score += 25
      if (['Results-first', 'Performance'].includes(pdm)) score += 20
      if (['High-intensity', 'Tactical-detail'].includes(tm)) score += 15
      break

    case 'DEVELOPMENT':
      if (['Developer', 'Educator', 'Patient'].includes(ls)) score += 40
      else if (['Collaborative', 'Visionary'].includes(ls)) score += 20
      if (['High', 'Strong'].includes(ai)) score += 25
      if (pdm.includes('Youth') || pdm.includes('Development')) score += 15
      break

    case 'STABILISATION':
      if (['Motivator', 'Pragmatic', 'Collaborative'].includes(ls)) score += 45
      else if (['Strategic', 'Balanced'].includes(ls)) score += 25
      if (['Results-first', 'Team-first'].includes(pdm)) score += 20
      if (['Physical', 'Defensive', 'Organised'].includes(tm)) score += 15
      break

    case 'PROMOTION':
      if (['Motivator', 'Demanding', 'Strategic'].includes(ls)) score += 45
      else if (['Authoritarian', 'Pragmatic'].includes(ls)) score += 25
      if (['Results-first', 'Performance'].includes(pdm)) score += 15
      if (['High-intensity', 'Physical'].includes(tm)) score += 20
      break
  }

  return Math.min(100, score)
}

function computeLeadershipMatch(ctx: MandateContext, coach: Coach): number | null {
  if (!coach.leadership_style) return null // true IE — no signal

  // Hard override: mandate specifies an exact leadership style profile.
  // Only treat as a style-enum override if the string is short (≤25 chars) —
  // longer strings are descriptive mandate notes, not enum values, and should
  // fall through to archetype-based scoring to avoid returning 30 for everyone.
  if (ctx.leadershipOverride && ctx.leadershipOverride.length <= 25) {
    return ctx.leadershipOverride === coach.leadership_style ? 100 : 30
  }

  const primaryScore = scoreForArchetype(ctx.primaryArchetype, coach)
  if (!ctx.secondaryArchetype) return primaryScore

  const secondaryScore = scoreForArchetype(ctx.secondaryArchetype, coach)
  return Math.round(
    primaryScore * ctx.archetypeBlend.primary +
    secondaryScore * ctx.archetypeBlend.secondary
  )
}

// ——————————————————————————————————————————————————
// Budget feasibility
// ——————————————————————————————————————————————————

// Wage → approximate staff-budget index (WAGE_RANGES[7] → STAFF_BUDGET_RANGES[6])
const WAGE_TO_STAFF_IDX = [0, 1, 2, 3, 4, 4, 5] as const

function computeMandateBudgetFit(ctx: MandateContext, coach: Coach): number | null {
  if (!coach.wage_expectation) return null // true IE

  const wageIdx = WAGE_RANGES.indexOf(coach.wage_expectation)
  if (wageIdx === -1) return null

  // Prefer staffBudget comparison (derived from budget_band in adapter)
  const staffIdx = STAFF_BUDGET_RANGES.indexOf(ctx.staffBudget ?? '')
  if (staffIdx >= 0) {
    const approxStaffFromWage = WAGE_TO_STAFF_IDX[wageIdx] ?? 5
    const gap = approxStaffFromWage - staffIdx
    if (gap <= 0) return 100
    if (gap === 1) return 70
    if (gap === 2) return 45
    return 20
  }

  // Fallback: budget_band (normalised index) vs wage_expectation
  const budgetIdx = BUDGET_RANGES.indexOf(ctx.budgetBand ?? '')
  if (budgetIdx === -1) return null

  const normBudget = budgetIdx / (BUDGET_RANGES.length - 1)
  const normWage = wageIdx / (WAGE_RANGES.length - 1)
  const fit = normWage <= normBudget ? 100 : Math.max(0, 100 - (normWage - normBudget) * 200)
  return Math.round(fit)
}

// ——————————————————————————————————————————————————
// Availability (4-tier model with urgency interaction matrix)
// ——————————————————————————————————————————————————

type AvailabilityTier = 'READY_NOW' | 'ACCESSIBLE' | 'STRETCH' | 'NOT_VIABLE'

function getAvailabilityTier(status: string | null): AvailabilityTier {
  // Normalise case before matching — seed data may have 'Under Contract' vs 'Under contract'
  const s = status?.toLowerCase().trim() ?? ''
  if (s === 'available') return 'READY_NOW'
  if (s === 'open to offers' || s === 'under contract - interested') return 'ACCESSIBLE'
  if (s === 'under contract') return 'STRETCH'
  if (s === 'not available') return 'NOT_VIABLE'
  return 'STRETCH' // null or unknown treated as STRETCH
}

const AVAILABILITY_MATRIX: Record<AvailabilityTier, Record<UrgencyLevel, number>> = {
  READY_NOW:  { URGENT: 100, MEDIUM: 100, STANDARD: 100, LOW: 100 },
  ACCESSIBLE: { URGENT: 75,  MEDIUM: 70,  STANDARD: 65,  LOW: 60  },
  STRETCH:    { URGENT: 35,  MEDIUM: 25,  STANDARD: 35,  LOW: 50  },
  NOT_VIABLE: { URGENT: 0,   MEDIUM: 0,   STANDARD: 5,   LOW: 10  },
}

function computeMandateAvailabilityScore(
  ctx: MandateContext,
  coach: Coach
): { score: number; ie: boolean } {
  const ie = !coach.available_status
  const tier = getAvailabilityTier(coach.available_status)
  return { score: AVAILABILITY_MATRIX[tier][ctx.urgency], ie }
}

// ——————————————————————————————————————————————————
// Risk score (mandate variant — no availability double-counting)
// ——————————————————————————————————————————————————

function computeMandateRiskScore(coach: Coach): { score: number; ie: boolean } {
  const c = coach as Coach & {
    integrity_risk_flag?: boolean | null
    media_risk_score?: number | null
  }

  const hasSafeguarding = !!coach.safeguarding_risk_flag
  const hasLegal = !!coach.legal_risk_flag
  const hasIntegrity = !!c.integrity_risk_flag
  const mediaRisk = c.media_risk_score

  if (!hasSafeguarding && !hasLegal && !hasIntegrity && mediaRisk == null) {
    return { score: 25, ie: true } // unverified — default moderate, not zero
  }

  let riskScore = 0
  if (hasSafeguarding) riskScore += 80
  if (hasLegal) riskScore += 40
  if (hasIntegrity) riskScore += 35
  if (mediaRisk != null) {
    if (mediaRisk > 70) riskScore += 25
    else if (mediaRisk > 50) riskScore += 10
  }

  return { score: Math.min(100, riskScore), ie: false }
}

// ——————————————————————————————————————————————————
// Hard filters (flag-based — checked before scoring)
// ——————————————————————————————————————————————————

function checkFlagHardFilters(ctx: MandateContext, coach: Coach): ExclusionReason | null {
  const c = coach as Coach & {
    legal_risk_flag?: boolean | null
    relocation_flexibility?: string | null
  }

  if (coach.safeguarding_risk_flag) {
    return { code: 'SAFEGUARDING_FLAG', label: 'Safeguarding concern' }
  }

  if (
    coach.available_status === 'Not available' &&
    (ctx.urgency === 'URGENT' || ctx.urgency === 'MEDIUM')
  ) {
    return { code: 'NOT_AVAILABLE_URGENT', label: 'Not available — urgent mandate' }
  }

  const tier = getAvailabilityTier(coach.available_status)
  if (tier === 'STRETCH' && ctx.urgency === 'URGENT') {
    return {
      code: 'STRETCH_URGENT_FILTER',
      label: 'Under contract, urgent timeline',
      detail: 'Review manually if warranted.',
    }
  }

  if (c.legal_risk_flag && ctx.boardRisk === 'Conservative') {
    return { code: 'LEGAL_CONSERVATIVE_BOARD', label: 'Legal risk — conservative board' }
  }

  if (c.relocation_flexibility === 'No' && ctx.relocationRequired) {
    return { code: 'RELOCATION_MISMATCH', label: 'Relocation incompatible' }
  }

  return null
}

// ——————————————————————————————————————————————————
// Combined score — IE-aware weight renormalisation
// ——————————————————————————————————————————————————

function computeCombinedScore(dims: MandateDimScores, ctx: MandateContext): number {
  const w = WEIGHTS[ctx.weightSet]

  type AdditiveDim = 'tactical' | 'level' | 'leadership' | 'budget' | 'availability'
  const additiveDims: AdditiveDim[] = ['tactical', 'level', 'leadership', 'budget', 'availability']

  const baseWeights: Record<AdditiveDim, number> = {
    tactical: w.tactical,
    level: w.level,
    leadership: w.leadership,
    budget: w.budget,
    availability: w.availability,
  }

  // Additive dims with a real score (score !== null)
  const scoredDims = additiveDims.filter((d) => dims[d].score !== null)
  const totalScoredWeight = scoredDims.reduce((sum, d) => sum + baseWeights[d], 0)
  const riskWeight = w.risk

  // Renormalise: scored additive dims should fill (1 - riskWeight)
  const scaleFactor = totalScoredWeight > 0 ? (1 - riskWeight) / totalScoredWeight : 0

  let combined = 0
  for (const d of scoredDims) {
    combined += (dims[d].score ?? 0) * baseWeights[d] * scaleFactor
  }
  combined -= (dims.risk.score ?? 25) * riskWeight

  return Math.round(Math.max(0, Math.min(100, combined)))
}

// ——————————————————————————————————————————————————
// Main export: computeMandateFit
// ——————————————————————————————————————————————————

export function computeMandateFit(
  ctx: MandateContext,
  coach: Coach,
  stints: CoachStint[]
): MandateFitResult {
  // Phase 1: Flag-based hard filters — no scoring needed
  const flagFilter = checkFlagHardFilters(ctx, coach)
  if (flagFilter) {
    const blank: DimScore = { score: null, label: 'IE' }
    return {
      combined: 0,
      footballFit: 0,
      appointability: 0,
      dims: { tactical: blank, level: blank, leadership: blank, budget: blank, availability: blank, risk: blank },
      hardFilter: flagFilter,
      recentLeague: null,
      recentWinRate: null,
      recentPpg: null,
    }
  }

  // Phase 2: Score all 6 dimensions
  const tacticalRaw = computeMandateTacticalFit(ctx, coach)
  const levelResult = computeLevelSuitability(ctx, coach, stints)
  const leadershipRaw = computeLeadershipMatch(ctx, coach)
  const budgetRaw = computeMandateBudgetFit(ctx, coach)
  const availResult = computeMandateAvailabilityScore(ctx, coach)
  const riskResult = computeMandateRiskScore(coach)

  const dims: MandateDimScores = {
    tactical: {
      score: tacticalRaw,
      label: tacticalRaw === null ? 'IE' : getDimLabel('tactical', tacticalRaw),
    },
    level: {
      score: levelResult.score,
      label: levelResult.ie ? 'IE' : getDimLabel('level', levelResult.score),
    },
    leadership: {
      score: leadershipRaw,
      label: leadershipRaw === null ? 'IE' : getDimLabel('leadership', leadershipRaw),
    },
    budget: {
      score: budgetRaw,
      label: budgetRaw === null ? 'IE' : getDimLabel('budget', budgetRaw),
    },
    availability: {
      score: availResult.score,
      label: availResult.ie ? 'IE' : getDimLabel('availability', availResult.score),
    },
    risk: {
      score: riskResult.score,
      label: riskResult.ie ? 'IE' : getDimLabel('risk', riskResult.score),
    },
  }

  // Phase 3: INSUFFICIENT_PROFILE filter (3+ IE dimensions)
  const ieCount = Object.values(dims).filter((d) => d.label === 'IE').length
  if (ieCount >= 3) {
    return {
      combined: 0,
      footballFit: 0,
      appointability: 0,
      dims,
      hardFilter: { code: 'INSUFFICIENT_PROFILE', label: 'Insufficient profile data' },
      recentLeague: levelResult.recentLeague,
      recentWinRate: levelResult.recentWinRate,
      recentPpg: levelResult.recentPpg,
    }
  }

  // Phase 4: Combined score with soft penalties
  const c = coach as Coach & {
    integrity_risk_flag?: boolean | null
    intelligence_confidence?: number | null
  }
  let combined = computeCombinedScore(dims, ctx)
  if (c.integrity_risk_flag) combined = Math.max(0, combined - 8)
  if ((c.intelligence_confidence ?? 100) < 30) combined = Math.max(0, combined - 5)
  combined = Math.min(100, combined)

  // Football Fit & Appointability
  const { footballFit, appointability } = computeSubScores(dims)

  return {
    combined,
    footballFit,
    appointability,
    dims,
    hardFilter: null,
    recentLeague: levelResult.recentLeague,
    recentWinRate: levelResult.recentWinRate,
    recentPpg: levelResult.recentPpg,
  }
}
