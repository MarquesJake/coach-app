import { safeDecisionBrief } from '../../mandates/decision-brief.ts'

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
export type FitDimension = {
  key: string; label: string; required: string; recorded: string
  weight: number; score: number; contribution: number; explanation: string
}
export type ResearchFit = { score: number | null; dimensions: FitDimension[]; manualChecks: string[] }

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
export function calculateResearchFit(brief: RankingBrief, coach: ResearchProfile): ResearchFit {
  const detail = safeDecisionBrief(brief.decision_brief)
  const rows: FitDimension[] = []
  const manualChecks = ['Salary and staff budget for this club', 'Verified release clause or negotiated compensation against this club’s budget; currency, conditions and source date', 'Willingness to join this club and timing; being under contract is not an automatic exclusion', 'Squad suitability', 'Leadership, references and working relationships', 'Licence, language and work permit', 'Current form and performance relative to resources']
  const add = (key: string, label: string, required: string, recorded: string, weight: number, score: number, explanation: string) => {
    rows.push({ key, label, required, recorded, weight, score, contribution: 0, explanation })
  }
  const style = styles[brief.tactical_model_required ?? '']
  if (style) {
    const compatible = (style === 'Pressing' && coach.pressing === 'High') || (style === 'Possession' && coach.style === 'Pressing' && coach.build === 'Short')
    const score = style === coach.style ? 100 : style === 'Adaptable' || coach.style === 'Adaptable' ? 65 : compatible ? 75 : 25
    add('style', 'Playing identity', style, coach.style, 30, score, 'Exact identity: 100; high-press or short-build compatibility: 75; adaptable profile: 65; different identity: 25.')
  } else manualChecks.push('Agree a recognised playing identity')

  const possession = detail.in_possession
  const structuredBuild: Record<string, Build> = { 'Build through pressure': 'Short', 'Progress quickly': 'Mixed', 'Direct play': 'Direct', Adaptable: 'Mixed' }
  const build = structuredBuild[possession?.value] ?? builds[brief.build_preference_required ?? '']
  if (build) {
    const weight = 20 * (possession?.value ? priorityMultiplier[possession.priority] : 1)
    const score = build === coach.build ? 100 : build === 'Mixed' || coach.build === 'Mixed' ? 65 : 25
    add('build', 'Build-up', build, coach.build, weight, score, 'Matching approach: 100; mixed approach on either side: 65; contrasting approach: 25.')
  } else manualChecks.push('Agree a recognised build-up approach')

  const defensive = detail.out_of_possession
  const defensiveLevels: Record<string, number> = { 'High press': 2, 'Mid-block': 1, 'Low block': 0 }
  const pressingLevels: Record<string, number> = { 'Very High': 2, High: 2, Medium: 1, Low: 0, 'Very Low': 0 }
  const requestedPress = defensive?.value === 'Opponent-dependent' ? undefined : defensiveLevels[defensive?.value] ?? pressingLevels[brief.pressing_intensity_required ?? '']
  if (requestedPress !== undefined) {
    const score = 100 - Math.abs(requestedPress - pressingLevels[coach.pressing]) * 35
    add('pressing', 'Defensive approach', ['Low block', 'Mid-block', 'High press'][requestedPress], coach.pressing, 20 * (defensive?.value ? priorityMultiplier[defensive.priority] : 1), score, 'Matching intensity: 100; one band apart: 65; two bands apart: 30. This is an assessment of the cited period.')
  }

  const objective = brief.strategic_objective?.toLowerCase() ?? ''
  if (/promotion|promoted|play.?offs/.test(objective)) {
    add('record', 'Relevant achievement', 'Promotion', coach.trackRecord.join(', '), 30, coach.trackRecord.includes('Promotion') ? 100 : 40, 'Documented promotion: 100; other senior achievements: 40. Not a forecast of promotion.')
  } else if (/top.?four|top.?4|champions league|win trophies|title|elite/.test(objective)) {
    const score = coach.trackRecord.includes('European trophy') ? 100 : coach.trackRecord.includes('Top-four finish') ? 90 : coach.trackRecord.includes('Domestic title') ? 75 : coach.trackRecord.includes('Top-flight experience') ? 60 : 40
    add('record', 'Relevant achievement', 'Competing at the top', coach.trackRecord.join(', '), 30, score, 'European trophy: 100; major-league top four: 90; other domestic title: 75; top-flight experience: 60; promotion only: 40. Highest evidenced category applies.')
  } else if (/relegation|survival|stabili|maintain/.test(objective)) {
    add('record', 'Relevant experience', 'Top-flight experience', coach.trackRecord.join(', '), 30, coach.trackRecord.includes('Top-flight experience') ? 100 : 50, 'Documented top-flight coaching: 100; other senior experience: 50. Survival impact still needs contextual analysis.')
  } else if (objective) {
    manualChecks.push('Assess the strategic objective against specific achievements and player-development evidence')
  }

  for (const [key, value] of Object.entries(detail)) {
    if (value.value && !['in_possession', 'out_of_possession'].includes(key)) manualChecks.push(`${key.replaceAll('_', ' ')} (${value.priority.toLowerCase()}): ${value.value}`)
  }
  const total = rows.reduce((sum, row) => sum + row.weight, 0)
  for (const row of rows) {
    row.weight = row.weight / total * 100
    row.contribution = row.score * row.weight / 100
  }
  return { score: rows.length < 2 ? null : Math.round(rows.reduce((sum, row) => sum + row.contribution, 0)), dimensions: rows, manualChecks }
}
