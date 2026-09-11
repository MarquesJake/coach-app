// Assessment depth for shortlisted coaches, following the nine-area Head Coach
// Assessment Methodology (profile → cultural fit) and its final evaluation page.
// Figures come from Gaffa's indicative data model until a licensed provider feed
// (xG, physical, market value) is connected.

import { DEEP_DIVES, FINAL_EVALUATIONS } from './deep-dive-data'

export type SeasonRow = { season: string; club: string; league: string; played: number; w: number; d: number; l: number; gf: number; ga: number; xgf: number; xga: number; finish: string }
export type XgSplit = { transition: number; buildUp: number; restart: number; corners: number; directFk: number; indirectFk: number; throwIns: number }
export type Level = 'Low' | 'Medium' | 'High'

export type FinalEvaluation = {
  executiveSummary: string
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] }
  organisationalFit: string
  budget: { item: string; value: string }[]
  budgetNote: string
  risks: { risk: string; likelihood: Level; impact: Level; mitigation: string }[]
  probabilityOfSuccess: number
  probabilityRationale: string
}

export type DeepDive = {
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

export function deepDiveFor(coachId: string): DeepDive | null {
  return DEEP_DIVES[coachId] ?? null
}

export function finalEvaluationFor(mandateId: string, coachId: string): FinalEvaluation | null {
  return FINAL_EVALUATIONS[`${mandateId}:${coachId}`] ?? null
}
