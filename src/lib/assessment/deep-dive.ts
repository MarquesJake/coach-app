// Assessment depth for shortlisted coaches, following the nine-area Head Coach
// Assessment Methodology (profile → cultural fit) and its final evaluation page.
// Figures come from Gaffa's indicative data model until a licensed provider feed
// (xG, physical, market value) is connected.

import { DEEP_DIVES, FINAL_EVALUATIONS } from './deep-dive-data'
import { DEEP_DIVE_EXTRAS } from './deep-dive-extras'
import { TOTTENHAM_DEEP_DIVES, TOTTENHAM_FINAL_EVALUATIONS, MANDATE_FIT_OVERRIDES } from './deep-dive-tottenham'
import { MEETING_FINAL_EVALUATIONS } from './deep-dive-meeting'

export type SeasonRow = { season: string; club: string; league: string; played: number; w: number; d: number; l: number; gf: number; ga: number; xgf: number; xga: number; finish: string }
export type XgSplit = { transition: number; buildUp: number; restart: number; corners: number; directFk: number; indirectFk: number; throwIns: number }
export type Level = 'Low' | 'Medium' | 'High'

export type FinalEvaluation = {
  mandateId?: string
  currentManagerBenchmark?: boolean
  executiveSummary: string
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] }
  organisationalFit: string
  budget: { item: string; value: string }[]
  budgetNote: string
  risks: { risk: string; likelihood: Level; impact: Level; mitigation: string }[]
  /** Legacy demo fixture only. Never display as probability or computed fit. */
  probabilityOfSuccess: number
  probabilityRationale: string
}

export type Aspect = { aspect: string; note: string }
export type Fit = 'Strong' | 'Partial' | 'Weak'

// Items the methodology lists under each area, beyond the headline data.
export type DeepDiveExtras = {
  fitClub: string
  xgSeason: string
  career: { period: string; club: string; role: string }[]
  tacticalFit: Aspect[]
  matchBehaviour: Aspect[]
  matchStats: { label: string; value: string }[]
  trainingAspects: Aspect[]
  developmentAspects: Aspect[]
  mediaChannels: Aspect[]
  traits: { trait: string; rating: number }[]
  clubAlignment: { aspect: string; fit: Fit; note: string }[]
}

export type DeepDiveBase = {
  profile: { playingCareer: string; keyAchievements: string[]; keyStaff: string; familyRelocation: string; salaryBand: string; representation: string }
  performance: {
    seasons: SeasonRow[]
    xgFor: XgSplit
    xgAgainst: XgSplit
    physical: { metric: string; value: string; vsLeague: number }[]
    impact: { window: string; ppg: number; note: string }[]
    resources: { wageRank: string; squadValueRank: string; finish: string; verdict: string }
    elo: { start: number; peak: number; end: number; note: string }
    injuries: string
    strengths: string[]
    concerns: string[]
  }
  tactical: {
    formations: { shape: string; share: number }[]
    style: { metric: string; value: string; note: string }[]
    principles: { phase: string; detail: string }[]
    clips: { title: string; match: string; minute: string; shows: string }[]
  }
  matchManagement: { stats: { label: string; value: string }[]; notes: string }
  training: { week: { day: string; focus: string }[]; split: string; notes: string }
  development: { stats: { label: string; value: string }[]; players: { name: string; change: string; note: string }[]; notes: string }
  media: { sentiment: { positive: number; neutral: number; negative: number }; themes: string[]; notes: string }
  personality: { heading: string; text: string }[]
  culturalFit: { bestFit: { dimension: string; fit: string }[]; frictionPoints: string[]; successFactors: string[] }
}

export type DeepDive = DeepDiveBase & DeepDiveExtras

export type MandateFitOverride = Pick<DeepDiveExtras, 'fitClub' | 'tacticalFit' | 'clubAlignment'>

// Coach-level depth, with the club-specific fit sections swapped for the
// mandate being viewed when a coach sits on more than one shortlist.
export function deepDiveFor(coachId: string, mandateId?: string): DeepDive | null {
  const base = DEEP_DIVES[coachId]
  const extras = DEEP_DIVE_EXTRAS[coachId]
  const full = TOTTENHAM_DEEP_DIVES[coachId] ?? (base && extras ? { ...base, ...extras } : null)
  if (!full) return null
  const override = mandateId ? MANDATE_FIT_OVERRIDES[`${mandateId}:${coachId}`] : undefined
  return override ? { ...full, ...override } : full
}

export function finalEvaluationFor(mandateId: string, coachId: string): FinalEvaluation | null {
  const key = `${mandateId}:${coachId}`
  const evaluation = FINAL_EVALUATIONS[key] ?? TOTTENHAM_FINAL_EVALUATIONS[key] ?? MEETING_FINAL_EVALUATIONS[key]
  return evaluation ? { ...evaluation, mandateId, currentManagerBenchmark: isCurrentManagerBenchmark(mandateId, coachId) } : null
}

// This role belongs to this succession study only; other mandates are unchanged.
export function isCurrentManagerBenchmark(mandateId: string | undefined, coachId: string): boolean {
  return mandateId === '09420a64-b4d2-4245-8088-af0dc88266eb' && coachId === '78552079-813c-4239-8654-e05769d221d8'
}
