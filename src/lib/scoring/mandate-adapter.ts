/**
 * mandate-adapter.ts
 * Maps a mandate row + optional club context → MandateContext shape consumed by computeMandateFit().
 * Pure function — no database calls.
 */

export type LeadershipArchetype =
  | 'REBUILD'
  | 'ELITE_PRESSURE'
  | 'DEVELOPMENT'
  | 'STABILISATION'
  | 'PROMOTION'

export type UrgencyLevel = 'URGENT' | 'MEDIUM' | 'STANDARD' | 'LOW'

export type WeightSet = 'base' | 'urgent' | 'development' | 'elite_win'

export interface MandateContext {
  styleRequired: string | null
  pressingRequired: string | null
  buildRequired: string | null
  primaryArchetype: LeadershipArchetype
  secondaryArchetype: LeadershipArchetype | null
  archetypeBlend: { primary: number; secondary: number } // weights summing to 1
  leadershipOverride: string | null // leadership_profile_required
  budgetBand: string | null
  staffBudget: string | null
  urgency: UrgencyLevel
  boardRisk: string | null
  relocationRequired: boolean
  languagesRequired: string[]
  weightSet: WeightSet
  // Raw mandate fields for explanation generation
  strategicObjective: string | null
  successionTimeline: string | null
}

// ——————————————————————————————————————————————————
// Budget → staff budget lookup
// ——————————————————————————————————————————————————
const BUDGET_TO_STAFF: Record<string, string> = {
  'Under £1m': 'Under £500k',
  '£1m - £5m': '£500k - £1m',
  '£5m - £15m': '£1m - £2m',
  '£15m - £30m': '£1m - £2m',
  '£30m - £60m': '£2m - £5m',
  '£60m - £100m': '£5m - £10m',
  '£100m - £200m': 'Over £10m',
  'Over £200m': 'Over £10m',
}

function deriveStaffBudget(budgetBand: string | null): string | null {
  if (!budgetBand) return null
  return BUDGET_TO_STAFF[budgetBand] ?? null
}

// ——————————————————————————————————————————————————
// Urgency classifier
// ——————————————————————————————————————————————————
export function parseUrgency(successionTimeline: string | null | undefined): UrgencyLevel {
  if (!successionTimeline) return 'STANDARD'
  const t = successionTimeline.toLowerCase()
  if (/immediate|asap|< ?30|within 30/.test(t)) return 'URGENT'
  if (/60 days|2 months|within 60/.test(t)) return 'MEDIUM'
  if (/90 days|3 months|quarter/.test(t)) return 'STANDARD'
  if (/6 months|end of season|no rush/.test(t)) return 'LOW'
  return 'STANDARD'
}

// ——————————————————————————————————————————————————
// Archetype resolver — scoring-based (not brittle keyword match)
// ——————————————————————————————————————————————————
interface ArchetypeSignals {
  REBUILD: { terms: string[]; weight: number }[]
  ELITE_PRESSURE: { terms: string[]; weight: number }[]
  DEVELOPMENT: { terms: string[]; weight: number }[]
  STABILISATION: { terms: string[]; weight: number }[]
  PROMOTION: { terms: string[]; weight: number }[]
}

const ARCHETYPE_SIGNALS: ArchetypeSignals = {
  REBUILD: [
    { terms: ['rebuild squad', 'rebuild the squad'], weight: 35 },
    { terms: ['rebuild'], weight: 40 },
    { terms: ['reset'], weight: 30 },
    { terms: ['new identity'], weight: 25 },
    { terms: ['transition'], weight: 20 },
    { terms: ['overhaul'], weight: 25 },
    { terms: ['fresh start'], weight: 25 },
    { terms: ['long-term'], weight: 20 },
  ],
  ELITE_PRESSURE: [
    { terms: ['win trophies'], weight: 45 },
    { terms: ['champions league', 'ucl'], weight: 40 },
    { terms: ['champion'], weight: 35 },
    { terms: ['title'], weight: 30 },
    { terms: ['trophy', 'trophies'], weight: 35 },
    { terms: ['top four', 'top 4'], weight: 25 },
    { terms: ['qualify for'], weight: 20 },
    { terms: ['elite'], weight: 20 },
  ],
  DEVELOPMENT: [
    { terms: ['player development'], weight: 40 },
    { terms: ['young players'], weight: 35 },
    { terms: ['develop'], weight: 35 },
    { terms: ['youth'], weight: 30 },
    { terms: ['academy'], weight: 30 },
    { terms: ['next generation'], weight: 30 },
    { terms: ['nurture'], weight: 25 },
    { terms: ['long-term project'], weight: 25 },
  ],
  STABILISATION: [
    { terms: ['avoid relegation'], weight: 45 },
    { terms: ['stability', 'stabilise', 'stabilize'], weight: 40 },
    { terms: ['survival', 'survive'], weight: 40 },
    { terms: ['consolidate'], weight: 30 },
    { terms: ['maintain position', 'maintain'], weight: 25 },
    { terms: ['foundation'], weight: 25 },
    { terms: ['steady'], weight: 25 },
    { terms: ['short-term'], weight: 20 },
  ],
  PROMOTION: [
    { terms: ['promotion', 'promoted'], weight: 50 },
    { terms: ['go up'], weight: 35 },
    { terms: ['top flight'], weight: 30 },
    { terms: ['win the league'], weight: 25 },
    { terms: ['first division'], weight: 25 },
    { terms: ['championship win'], weight: 25 },
    { terms: ['play-offs', 'playoffs'], weight: 30 },
  ],
}

type ArchetypeScores = Record<LeadershipArchetype, number>

function resolveArchetypes(objective: string | null): {
  primary: LeadershipArchetype
  secondary: LeadershipArchetype | null
  blend: { primary: number; secondary: number }
} {
  const scores: ArchetypeScores = {
    REBUILD: 0,
    ELITE_PRESSURE: 0,
    DEVELOPMENT: 0,
    STABILISATION: 0,
    PROMOTION: 0,
  }

  if (!objective) {
    return { primary: 'STABILISATION', secondary: null, blend: { primary: 1, secondary: 0 } }
  }

  const lower = objective.toLowerCase()

  for (const archetype of Object.keys(ARCHETYPE_SIGNALS) as LeadershipArchetype[]) {
    let raw = 0
    for (const { terms, weight } of ARCHETYPE_SIGNALS[archetype]) {
      if (terms.some((t) => lower.includes(t))) {
        raw += weight
      }
    }
    scores[archetype] = Math.min(100, raw)
  }

  // Sort archetypes by score descending
  const sorted = (Object.keys(scores) as LeadershipArchetype[]).sort(
    (a, b) => scores[b] - scores[a]
  )

  const primary = sorted[0]
  const primaryScore = scores[primary]

  // Default if no signals matched
  if (primaryScore === 0) {
    return { primary: 'STABILISATION', secondary: null, blend: { primary: 1, secondary: 0 } }
  }

  const secondaryCandidate = sorted[1]
  const secondaryScore = scores[secondaryCandidate]

  // Secondary applies if: raw >= 35 AND raw >= 60% of primary
  const secondaryApplies =
    secondaryScore >= 35 && secondaryScore >= primaryScore * 0.6

  if (!secondaryApplies) {
    return { primary, secondary: null, blend: { primary: 1, secondary: 0 } }
  }

  const total = primaryScore + secondaryScore
  return {
    primary,
    secondary: secondaryCandidate,
    blend: {
      primary: Math.round((primaryScore / total) * 100) / 100,
      secondary: Math.round((secondaryScore / total) * 100) / 100,
    },
  }
}

// ——————————————————————————————————————————————————
// Weight set selection
// ——————————————————————————————————————————————————
function selectWeightSet(urgency: UrgencyLevel, archetype: LeadershipArchetype): WeightSet {
  if (urgency === 'URGENT') return 'urgent'
  if (archetype === 'DEVELOPMENT') return 'development'
  if (archetype === 'ELITE_PRESSURE' || archetype === 'PROMOTION') return 'elite_win'
  return 'base'
}

// ——————————————————————————————————————————————————
// Public export
// ——————————————————————————————————————————————————
export interface MandateInput {
  tactical_model_required?: string | null
  pressing_intensity_required?: string | null
  build_preference_required?: string | null
  leadership_profile_required?: string | null
  budget_band?: string | null
  strategic_objective?: string | null
  succession_timeline?: string | null
  board_risk_appetite?: string | null
  relocation_required?: boolean | null
  language_requirements?: string[] | null
}

export function mandateToContext(mandate: MandateInput): MandateContext {
  const urgency = parseUrgency(mandate.succession_timeline)
  const { primary, secondary, blend } = resolveArchetypes(mandate.strategic_objective ?? null)
  const weightSet = selectWeightSet(urgency, primary)

  return {
    styleRequired: mandate.tactical_model_required ?? null,
    pressingRequired: mandate.pressing_intensity_required ?? null,
    buildRequired: mandate.build_preference_required ?? null,
    primaryArchetype: primary,
    secondaryArchetype: secondary,
    archetypeBlend: blend,
    leadershipOverride: mandate.leadership_profile_required ?? null,
    budgetBand: mandate.budget_band ?? null,
    staffBudget: deriveStaffBudget(mandate.budget_band ?? null),
    urgency,
    boardRisk: mandate.board_risk_appetite ?? null,
    relocationRequired: mandate.relocation_required ?? false,
    languagesRequired: mandate.language_requirements ?? [],
    weightSet,
    strategicObjective: mandate.strategic_objective ?? null,
    successionTimeline: mandate.succession_timeline ?? null,
  }
}

export const WEIGHTS: Record<WeightSet, {
  tactical: number
  level: number
  leadership: number
  budget: number
  availability: number
  risk: number
}> = {
  base: { tactical: 0.30, level: 0.20, leadership: 0.20, budget: 0.10, availability: 0.10, risk: 0.10 },
  urgent: { tactical: 0.25, level: 0.15, leadership: 0.15, budget: 0.10, availability: 0.25, risk: 0.10 },
  development: { tactical: 0.20, level: 0.15, leadership: 0.35, budget: 0.10, availability: 0.10, risk: 0.10 },
  elite_win: { tactical: 0.30, level: 0.25, leadership: 0.20, budget: 0.10, availability: 0.05, risk: 0.10 },
}
