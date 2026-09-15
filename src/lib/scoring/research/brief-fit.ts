import { safeDecisionBrief } from '../../mandates/decision-brief.ts'
import evidenceFile from './ranking-evidence.json' with { type: 'json' }
import { calculateSurvivalFit, isSurvivalObjective, SURVIVAL_MODEL } from './survival-fit.ts'

export type Style = 'Possession' | 'Pressing' | 'Counter-attacking' | 'Direct' | 'Adaptable'
export type Build = 'Short' | 'Direct' | 'Mixed'
export type TrackRecord = 'Top-four finish' | 'European trophy' | 'Top-flight experience' | 'Promotion' | 'Domestic title'
export type ResearchProfile = {
  name: string; apiId: number; aliases: string[]
  style: Style; pressing: 'High' | 'Medium' | 'Low'; build: Build
  trackRecord: TrackRecord[]
  summary: string; limitation: string
  sources: { title: string; url: string; period: string }[]
  apiRecord?: { retrievedAt: string; career: { club: string; start: string | null; end: string | null }[] }
}
export type RankingBrief = {
  tactical_model_required?: string | null
  pressing_intensity_required?: string | null
  build_preference_required?: string | null
  strategic_objective?: string | null
  decision_brief?: unknown
}
/** What kind of evidence sits behind a dimension, so the board can read each line for what it is. */
export type EvidenceKind = 'verified' | 'calculated' | 'researched' | 'unavailable'
export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  verified: 'Verified — dated official source',
  calculated: 'Calculated — API-Football league matches with the coach on the team sheet',
  researched: 'Researched — dated tactical research on a named period',
  unavailable: 'Not available from the current source — half credit, not zero',
}
export type FitDimension = {
  key: string; label: string; required: string; recorded: string
  weight: number; score: number; contribution: number; explanation: string
  /** Where the requirement came from: the saved brief, and who wrote it. */
  requirementSource: string
  evidenceKind: EvidenceKind
  /** Period covered and sample size behind the recorded evidence. */
  period: string
}
export type ResearchFit = {
  score: number | null; dimensions: FitDimension[]; manualChecks: string[]
  /** Which published weighting model produced the score. */
  model: 'trophies' | 'survival'
  /** Share of the weight backed by evidence, and the dimensions still waiting for some. */
  coverage: { evidencedWeight: number; unavailable: string[] }
}
export const TROPHIES_MODEL = {
  key: 'trophies',
  label: 'Standard brief',
  summary: 'Starting weights: playing identity 25, build-up 15, defending 15, relevant achievement 25, front-foot football in the match data 10, recent head-coach evidence 10. Essential build-up or defending counts 1.5 times, Flexible half. Weights are then scaled to 100.',
  evidence: 'Playing identity comes from dated tactical research on a named period. Match figures come from API-Football league matches where the coach is on the team sheet. Level scores are ordered by weight of recent verified matches; names are never used to split them.',
} as const
/** The weighting model a brief selects, so the board can see which rules produced the list. */
export function modelFor(brief: RankingBrief) {
  return isSurvivalObjective(brief.strategic_objective) ? SURVIVAL_MODEL : TROPHIES_MODEL
}
export type MatchEvidence = {
  apiId: number
  latestSeason: { club: string; season: number; matches: number; pointsPerMatch: number | null } | null
  style: { club: string; season: number; matches: number; possession: number; xgFor: number; xgAgainst: number } | null
  recentMatches: number
}

const EVIDENCE = new Map((evidenceFile.coaches as MatchEvidence[]).map(row => [row.apiId, row]))
export const RANKING_EVIDENCE_RETRIEVED_AT = evidenceFile.retrievedAt
/** Verified API-Football summary for a coach, or null when the provider supplied nothing usable. */
export function matchEvidenceFor(apiId: number): MatchEvidence | null {
  return EVIDENCE.get(apiId) ?? null
}
const seasonLabel = (season: number) => `${season}/${String((season + 1) % 100).padStart(2, '0')}`

export function normalizeCoachName(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').toLowerCase().replace(/[^a-z0-9]/g, '')
}

const styles: Record<string, Style> = {
  'Possession / build-out': 'Possession', 'Possession-based': 'Possession', 'Tiki-taka': 'Possession',
  'Build from back': 'Possession', 'High press / dominant': 'Pressing', 'High press': 'Pressing',
  'Gegenpressing': 'Pressing', 'Counter-attack / compact': 'Counter-attacking', 'Counter-attacking': 'Counter-attacking',
  'Direct': 'Direct', 'Long ball': 'Direct', 'Hybrid / flexible': 'Adaptable', 'Balanced': 'Adaptable',
}
const builds: Record<string, Build> = {
  'Short build': 'Short', 'Build from back': 'Short', 'Short passing': 'Short',
  'Long ball / direct': 'Direct', 'Long ball': 'Direct', 'Direct play': 'Direct', 'Mixed': 'Mixed',
}
const priorityMultiplier = { Essential: 1.5, Preferred: 1, Flexible: 0.5 }

/** A published decision rule, not a model trained to predict appointment outcomes. */
export function calculateResearchFit(brief: RankingBrief, coach: ResearchProfile, evidence: MatchEvidence | null = matchEvidenceFor(coach.apiId)): ResearchFit {
  if (isSurvivalObjective(brief.strategic_objective)) return calculateSurvivalFit(brief, coach, evidence)
  const detail = safeDecisionBrief(brief.decision_brief)
  const briefSource = 'Saved brief — analyst demonstration, not supplied by the club.'
  const research = coach.sources[0] ? `${coach.sources[0].title} · ${coach.sources[0].period}` : 'Tactical research profile'
  const rows: FitDimension[] = []
  const manualChecks = ['Salary and staff budget for this club', 'Verified release clause or negotiated compensation against this club’s budget; currency, conditions and source date', 'Willingness to join this club and timing; being under contract is not an automatic exclusion', 'Squad suitability', 'Leadership, references and working relationships', 'Licence, language and work permit', 'Current form and performance relative to resources']
  const add = (key: string, label: string, required: string, recorded: string, weight: number, score: number, explanation: string, evidenceKind: EvidenceKind = 'researched', period: string = research) => {
    rows.push({ key, label, required, recorded, weight, score, contribution: 0, explanation, requirementSource: briefSource, evidenceKind, period })
  }
  const style = styles[brief.tactical_model_required ?? '']
  if (style) {
    const compatible = (style === 'Pressing' && coach.pressing === 'High') || (style === 'Possession' && coach.style === 'Pressing' && coach.build === 'Short')
    // A generic "adaptable" label is not evidence of adaptability, so it never earns more than partial credit.
    const score = style === coach.style && style !== 'Adaptable' ? 100 : style === 'Adaptable' || coach.style === 'Adaptable' ? 65 : compatible ? 75 : 25
    add('style', 'Playing identity', style, coach.style, 25, score, 'Same identity: 100. Pressing side for a possession brief (high press, short build): 75. Either side only "adaptable": 65 — a loose label earns no bonus. Different identity: 25.')
  } else manualChecks.push('Agree a recognised playing identity')

  const possession = detail.in_possession
  const structuredBuild: Record<string, Build> = { 'Build through pressure': 'Short', 'Progress quickly': 'Mixed', 'Direct play': 'Direct', Adaptable: 'Mixed' }
  const build = structuredBuild[possession?.value] ?? builds[brief.build_preference_required ?? '']
  if (build) {
    const weight = 15 * (possession?.value ? priorityMultiplier[possession.priority] : 1)
    const score = build === coach.build ? 100 : build === 'Mixed' || coach.build === 'Mixed' ? 65 : 25
    add('build', 'Build-up', build, coach.build, weight, score, 'Matching approach: 100; mixed approach on either side: 65; contrasting approach: 25.')
  } else manualChecks.push('Agree a recognised build-up approach')

  const defensive = detail.out_of_possession
  const defensiveLevels: Record<string, number> = { 'High press': 2, 'Mid-block': 1, 'Low block': 0 }
  const pressingLevels: Record<string, number> = { 'Very High': 2, High: 2, Medium: 1, Low: 0, 'Very Low': 0 }
  const requestedPress = defensive?.value === 'Opponent-dependent' ? undefined : defensiveLevels[defensive?.value] ?? pressingLevels[brief.pressing_intensity_required ?? '']
  if (requestedPress !== undefined) {
    const score = 100 - Math.abs(requestedPress - pressingLevels[coach.pressing]) * 35
    add('pressing', 'Defensive approach', ['Low block', 'Mid-block', 'High press'][requestedPress], coach.pressing, 15 * (defensive?.value ? priorityMultiplier[defensive.priority] : 1), score, 'Matching intensity: 100; one band apart: 65; two bands apart: 30. This is an assessment of the cited period.')
  }

  const objective = brief.strategic_objective?.toLowerCase() ?? ''
  if (/promotion|promoted|play.?offs/.test(objective)) {
    add('record', 'Relevant achievement', 'Promotion', coach.trackRecord.join(', '), 25, coach.trackRecord.includes('Promotion') ? 100 : 40, 'Documented promotion: 100; other senior achievements: 40. Not a forecast of promotion.')
  } else if (/top.?four|top.?4|champions league|win trophies|title|elite/.test(objective)) {
    const score = coach.trackRecord.includes('European trophy') ? 100 : coach.trackRecord.includes('Top-four finish') ? 90 : coach.trackRecord.includes('Domestic title') ? 75 : coach.trackRecord.includes('Top-flight experience') ? 60 : 40
    add('record', 'Relevant achievement', 'Winning trophies at the top level', coach.trackRecord.join(', '), 25, score, 'European trophy: 100; major-league top four: 90; other domestic title: 75; top-flight experience: 60; promotion only: 40. Highest evidenced category applies.')
  } else if (/relegation|survival|stabili|maintain/.test(objective)) {
    add('record', 'Relevant experience', 'Top-flight experience', coach.trackRecord.join(', '), 25, coach.trackRecord.includes('Top-flight experience') ? 100 : 50, 'Documented top-flight coaching: 100; other senior experience: 50. Survival impact still needs contextual analysis.')
  } else if (objective) {
    manualChecks.push('Assess the strategic objective against specific achievements and player-development evidence')
  }

  for (const [key, value] of Object.entries(detail)) {
    if (value.value && !['in_possession', 'out_of_possession'].includes(key)) manualChecks.push(`${key.replaceAll('_', ' ')} (${value.priority.toLowerCase()}): ${value.value}`)
  }
  // Verified match data backs up (or undercuts) the research label for front-foot briefs.
  if (style === 'Possession' || style === 'Pressing') {
    const data = evidence?.style
    if (data) {
      const share = data.xgFor / Math.max(0.01, data.xgFor + data.xgAgainst)
      const possessionScore = data.possession >= 55 ? 100 : data.possession >= 50 ? 75 : 40
      const shareScore = share >= 0.6 ? 100 : share >= 0.5 ? 75 : 40
      add('front-foot', 'Front-foot football in the match data', 'Controls the ball and the chances',
        `${data.club} ${seasonLabel(data.season)}: ${data.possession.toFixed(0)}% possession, ${Math.round(share * 100)}% of the match xG (${data.matches} matches)`,
        10, Math.round((possessionScore + shareScore) / 2),
        'Average of two bands from the latest club season with full coverage. Possession: 55%+ = 100, 50–55% = 75, under 50% = 40. Share of total xG: 60%+ = 100, 50–60% = 75, under 50% = 40. League strength is not adjusted.',
        'calculated', `${data.club} ${seasonLabel(data.season)} · ${data.matches} league matches with full coverage`)
    } else {
      add('front-foot', 'Front-foot football in the match data', 'Controls the ball and the chances', 'Not available from the current source', 10, 50,
        'No club season with full possession and xG coverage. Half credit: unproven, not assumed poor.', 'unavailable', 'No club season with full possession and xG coverage')
    }
  }

  const latest = evidence?.latestSeason
  const recentScore = !latest ? 30 : latest.season >= 2025 ? 100 : latest.season === 2024 ? 80 : latest.season === 2023 ? 60 : 30
  add('recent', 'Recent head-coach evidence', 'A recent full season in charge',
    latest ? `${latest.club} ${seasonLabel(latest.season)} · ${latest.matches} verified league matches` : 'No verified club season from the current source',
    10, recentScore, 'Latest club season with 10+ verified league matches: 2025/26 or later = 100, 2024/25 = 80, 2023/24 = 60, older or none = 30.',
    latest ? 'calculated' : 'unavailable', latest ? `${latest.club} ${seasonLabel(latest.season)} · ${latest.matches} verified league matches` : 'No verified club season')

  const total = rows.reduce((sum, row) => sum + row.weight, 0)
  for (const row of rows) {
    row.weight = row.weight / total * 100
    row.contribution = row.score * row.weight / 100
  }
  const briefDimensions = rows.filter(row => !['front-foot', 'recent'].includes(row.key)).length
  const raw = rows.reduce((sum, row) => sum + row.contribution, 0)
  const evidenced = rows.filter(row => row.evidenceKind !== 'unavailable').reduce((sum, row) => sum + row.weight, 0)
  return {
    score: briefDimensions < 2 ? null : Math.round(raw * 10) / 10, dimensions: rows, manualChecks, model: TROPHIES_MODEL.key,
    coverage: { evidencedWeight: Math.round(evidenced), unavailable: rows.filter(row => row.evidenceKind === 'unavailable').map(row => row.label) },
  }
}
