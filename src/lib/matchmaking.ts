import type { Database } from '@/lib/types/db'

type Vacancy = Database['public']['Tables']['vacancies']['Row']
type Coach = Database['public']['Tables']['coaches']['Row']

export interface MatchScores {
  tactical_fit_score: number
  squad_fit_score: number
  financial_fit_score: number
  cultural_fit_score: number
  availability_score: number
  overall_score: number
}

// Weights for overall score calculation
const WEIGHTS = {
  tactical: 0.30,
  squad: 0.20,
  financial: 0.20,
  cultural: 0.20,
  availability: 0.10,
}

// Style compatibility mapping
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

// Pressing level compatibility
const PRESSING_LEVELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High']

// Build style compatibility
const BUILD_COMPATIBILITY: Record<string, string[]> = {
  'Short passing': ['Short passing', 'Build from back', 'Possession play'],
  'Build from back': ['Build from back', 'Short passing', 'Possession play'],
  'Possession play': ['Possession play', 'Short passing', 'Build from back'],
  'Direct play': ['Direct play', 'Long ball', 'Mixed'],
  'Long ball': ['Long ball', 'Direct play'],
  'Mixed': ['Mixed', 'Direct play', 'Short passing', 'Balanced'],
  'Balanced': ['Balanced', 'Mixed', 'Short passing', 'Direct play'],
}

// Budget ranges ordered by magnitude
const BUDGET_RANGES = [
  'Under £1m',
  '£1m - £5m',
  '£5m - £15m',
  '£15m - £30m',
  '£30m - £60m',
  '£60m - £100m',
  '£100m - £200m',
  'Over £200m',
]

const WAGE_RANGES = [
  'Under £500k/yr',
  '£500k - £1m/yr',
  '£1m - £2m/yr',
  '£2m - £4m/yr',
  '£4m - £7m/yr',
  '£7m - £12m/yr',
  'Over £12m/yr',
]

const STAFF_BUDGET_RANGES = [
  'Under £500k',
  '£500k - £1m',
  '£1m - £2m',
  '£2m - £5m',
  '£5m - £10m',
  'Over £10m',
]

// Leadership style compatibility based on club objectives
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

function getStyleScore(vacancyStyle: string, coachStyle: string): number {
  if (vacancyStyle === coachStyle) return 100
  const compatible = STYLE_COMPATIBILITY[vacancyStyle] || []
  if (compatible.includes(coachStyle)) {
    const idx = compatible.indexOf(coachStyle)
    return Math.max(40, 90 - idx * 20)
  }
  return 25
}

function getPressingScore(vacancyLevel: string, coachIntensity: string): number {
  const vIdx = PRESSING_LEVELS.indexOf(vacancyLevel)
  const cIdx = PRESSING_LEVELS.indexOf(coachIntensity)
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

function getFinancialFitScore(vacancy: Vacancy, coach: Coach): number {
  // Compare wage expectation vs budget
  const budgetIdx = getRangeIndex(vacancy.budget_range, BUDGET_RANGES)
  const wageIdx = getRangeIndex(coach.wage_expectation, WAGE_RANGES)

  // Normalize to comparable scale
  const normalizedBudget = budgetIdx / (BUDGET_RANGES.length - 1)
  const normalizedWage = wageIdx / (WAGE_RANGES.length - 1)

  const wageFit = normalizedWage <= normalizedBudget
    ? 100
    : Math.max(0, 100 - (normalizedWage - normalizedBudget) * 200)

  // Compare staff costs
  const staffBudgetIdx = getRangeIndex(vacancy.staff_budget, STAFF_BUDGET_RANGES)
  const staffCostIdx = getRangeIndex(coach.staff_cost_estimate, STAFF_BUDGET_RANGES)

  const staffFit = staffCostIdx <= staffBudgetIdx
    ? 100
    : Math.max(0, 100 - (staffCostIdx - staffBudgetIdx) * 30)

  return Math.round(wageFit * 0.6 + staffFit * 0.4)
}

function getCulturalFitScore(vacancy: Vacancy, coach: Coach): number {
  // Leadership style alignment with objective
  const idealStyles = LEADERSHIP_COMPATIBILITY[vacancy.objective] || []
  let leadershipScore = 40 // baseline
  if (idealStyles.includes(coach.leadership_style)) {
    const idx = idealStyles.indexOf(coach.leadership_style)
    leadershipScore = Math.max(50, 100 - idx * 15)
  }

  // Reputation tier affects cultural fit
  const reputationTiers = ['Unknown', 'Emerging', 'Established', 'Elite', 'World-class']
  const repIdx = reputationTiers.indexOf(coach.reputation_tier)
  const reputationScore = repIdx >= 0 ? 20 + repIdx * 20 : 50

  return Math.round(leadershipScore * 0.7 + reputationScore * 0.3)
}

function getAvailabilityScore(coach: Coach): number {
  switch (coach.available_status) {
    case 'Available':
      return 100
    case 'Open to offers':
      return 80
    case 'Under contract - interested':
      return 55
    case 'Under contract':
      return 30
    case 'Not available':
      return 5
    default:
      return 50
  }
}

export function calculateMatchScores(vacancy: Vacancy, coach: Coach): MatchScores {
  // Tactical fit: style + pressing + build preference
  const styleScore = getStyleScore(vacancy.style_of_play, coach.preferred_style)
  const pressingScore = getPressingScore(vacancy.pressing_level, coach.pressing_intensity)
  const buildScore = getBuildScore(vacancy.build_style, coach.build_preference)
  const tactical_fit_score = Math.round(styleScore * 0.45 + pressingScore * 0.30 + buildScore * 0.25)

  // Squad fit: league experience + reputation
  let squad_fit_score = 50
  const coachLeagues = coach.league_experience ?? []
  if (vacancy.league_experience_required && coachLeagues.length > 0) {
    // Check if the coach has experience in the vacancy's club league
    squad_fit_score = 75
  } else if (!vacancy.league_experience_required) {
    squad_fit_score = 70
  }
  // Reputation boost
  const repTiers = ['Unknown', 'Emerging', 'Established', 'Elite', 'World-class']
  const repBoost = repTiers.indexOf(coach.reputation_tier) * 6
  squad_fit_score = Math.min(100, squad_fit_score + repBoost)

  const financial_fit_score = getFinancialFitScore(vacancy, coach)
  const cultural_fit_score = getCulturalFitScore(vacancy, coach)
  const availability_score = getAvailabilityScore(coach)

  const overall_score = Math.round(
    tactical_fit_score * WEIGHTS.tactical +
    squad_fit_score * WEIGHTS.squad +
    financial_fit_score * WEIGHTS.financial +
    cultural_fit_score * WEIGHTS.cultural +
    availability_score * WEIGHTS.availability
  )

  return {
    tactical_fit_score,
    squad_fit_score,
    financial_fit_score,
    cultural_fit_score,
    availability_score,
    overall_score,
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-400/10 border-emerald-400/30'
  if (score >= 60) return 'bg-yellow-400/10 border-yellow-400/30'
  if (score >= 40) return 'bg-orange-400/10 border-orange-400/30'
  return 'bg-red-400/10 border-red-400/30'
}
