import { calculateResearchFit, normalizeCoachName, type RankingBrief, type ResearchFit, type ResearchProfile } from '../scoring/research/brief-fit.ts'
import { RESEARCH_PROFILES } from '../scoring/research/profiles.ts'
import { isActiveAppointment } from '../coaches/route-audit.ts'
import { safeDecisionBrief, BRIEF_FIELDS } from '../mandates/decision-brief.ts'
import type { SuccessionClub, SuccessionCoach, SuccessionMandateSignal } from './radar.ts'

type ClubField = 'tactical_model' | 'pressing_model' | 'build_model' | 'strategic_priority'
export type ClubResearchRequirements = {
  brief: RankingBrief
  ready: boolean
  dimensionCount: number
  source: { kind: 'club' | 'mandate' | 'needs-choice'; mandateId: string | null; message: string; choices: { id: string; createdAt: string; objective: string | null }[] }
  rows: { field: string; label: string; savedValue: string | null; mappedValue: string | null; status: 'saved-club' | 'saved-mandate' | 'needs-interpretation' | 'missing'; priority?: string }[]
}
export type ReviewedSuccessionCoach = SuccessionCoach & {
  fitScore: number
  research: ResearchProfile
  fit: ResearchFit
}

const mappings: Record<ClubField, Record<string, string>> = {
  tactical_model: {
    possession: 'Possession / build-out', 'possession-based': 'Possession / build-out', 'possession / build-out': 'Possession / build-out', 'tiki-taka': 'Tiki-taka', 'build from back': 'Build from back',
    pressing: 'High press / dominant', 'high press': 'High press / dominant', 'high press / dominant': 'High press / dominant', gegenpressing: 'Gegenpressing',
    'counter-attacking': 'Counter-attack / compact', 'counter-attack / compact': 'Counter-attack / compact', direct: 'Direct', 'long ball': 'Long ball',
    adaptable: 'Hybrid / flexible', hybrid: 'Hybrid / flexible', 'hybrid / flexible': 'Hybrid / flexible', balanced: 'Balanced',
  },
  pressing_model: {
    high: 'High', 'high press': 'High', 'very high': 'Very High', medium: 'Medium', 'mid-block': 'Medium', 'mid block': 'Medium',
    low: 'Low', 'low press': 'Low', 'low block': 'Low', 'very low': 'Very Low',
  },
  build_model: {
    short: 'Short build', 'short build': 'Short build', 'short passing': 'Short build', 'from the back': 'Short build', 'build from back': 'Short build',
    direct: 'Long ball / direct', 'direct play': 'Long ball / direct', 'long ball': 'Long ball / direct', 'long ball / direct': 'Long ball / direct',
    mixed: 'Mixed', hybrid: 'Mixed',
  },
  strategic_priority: {
    'champions league contention': 'Champions League contention', 'top four': 'Top four', 'top-four finish': 'Top four',
    promotion: 'Achieve promotion', 'achieve promotion': 'Achieve promotion', 'win trophies': 'Win trophies',
    'relegation survival': 'Avoid relegation / stabilise', survival: 'Avoid relegation / stabilise', 'avoid relegation / stabilise': 'Avoid relegation / stabilise',
    'mid-table stability': 'Mid-table stability',
    // "Top four / promotion" is ambiguous; other saved objectives remain manual checks, not invented matches.
  },
}
const fields = [
  ['tactical_model', 'Playing identity', 'tactical_model_required'],
  ['pressing_model', 'Defensive approach', 'pressing_intensity_required'],
  ['build_model', 'Build-up', 'build_preference_required'],
  ['strategic_priority', 'Strategic objective', 'strategic_objective'],
] as const

/** Exact, field-specific translations only. Saved does not mean board-approved or independently verified. */
export function clubResearchRequirements(club: SuccessionClub): ClubResearchRequirements {
  const brief: RankingBrief = {}
  const rows = fields.map(([field, label, target]) => {
    const savedValue = club[field]?.trim() || null
    const key = savedValue?.toLowerCase()
    const mappedValue = key && Object.hasOwn(mappings[field], key) ? mappings[field][key] : null
    if (mappedValue) brief[target] = mappedValue
    return { field, label, savedValue, mappedValue, status: (mappedValue ? 'saved-club' : savedValue ? 'needs-interpretation' : 'missing') as ClubResearchRequirements['rows'][number]['status'] }
  })
  const dimensionCount = rows.filter(row => row.mappedValue !== null).length
  return { brief, rows, dimensionCount, ready: dimensionCount >= 2, source: { kind: 'club', mandateId: null, message: 'No active mandate brief linked to this club. Using exact translations of saved club fields only.', choices: [] } }
}

/** mandates.club_id → clubs.id is the source relationship. Explicit selection never changes saved data. */
export function successionResearchRequirements(club: SuccessionClub, mandates: SuccessionMandateSignal[], selectedMandateId?: string | null): ClubResearchRequirements {
  const active = mandates.filter(m => m.club_id === club.id && isActiveAppointment(m))
    .sort((a, b) => a.id.localeCompare(b.id))
  const choices = active.map(m => ({ id: m.id, createdAt: m.created_at, objective: m.strategic_objective }))
  const selected = selectedMandateId ? active.find(m => m.id === selectedMandateId) : active.length === 1 ? active[0] : undefined
  if ((selectedMandateId && !selected) || (!selected && active.length > 1)) return {
    brief: {}, rows: [], ready: false, dimensionCount: 0,
    source: { kind: 'needs-choice', mandateId: null, choices, message: selectedMandateId ? 'The selected brief is not an active mandate linked to this club. Choose a valid brief.' : 'Multiple active mandate briefs are linked to this club. Choose the brief to use; none is selected automatically.' },
  }
  if (!selected) return clubResearchRequirements(club)
  const brief: RankingBrief = {
    tactical_model_required: selected.tactical_model_required,
    pressing_intensity_required: selected.pressing_intensity_required,
    build_preference_required: selected.build_preference_required,
    strategic_objective: selected.strategic_objective,
    decision_brief: selected.decision_brief,
  }
  // Dimension presence depends on the brief, not on the coach's score. Use the shared rule to avoid drift.
  const dimensions = calculateResearchFit(brief, RESEARCH_PROFILES[0]).dimensions
  const rows: ClubResearchRequirements['rows'] = fields.map(([, label, target]) => ({
    field: target, label: `${label} (broad brief field)`, savedValue: brief[target]?.trim() || null,
    mappedValue: null, status: brief[target]?.trim() ? 'saved-mandate' : 'missing',
  }))
  const structured = safeDecisionBrief(selected.decision_brief)
  for (const field of BRIEF_FIELDS) {
    const row = structured[field.key]
    if (!row?.value) continue
    rows.push({ field: `decision_brief.${field.key}`, label: field.label, savedValue: row.value, mappedValue: null, status: 'saved-mandate', priority: row.priority })
  }
  return { brief, rows, dimensionCount: dimensions.length, ready: dimensions.length >= 2, source: {
    kind: 'mandate', mandateId: selected.id, choices,
    message: 'Using the saved active mandate brief linked to this club. Structured in-possession and out-of-possession answers and their priorities retain the same precedence and weights as the appointment brief. Club prose is not mixed into this score.',
  } }
}

function matchingResearch(coach: SuccessionCoach): ResearchProfile | null {
  const name = normalizeCoachName(coach.name)
  const profiles = RESEARCH_PROFILES.filter(profile => profile.sources.length > 0 && profile.sources.every(s => s.url && s.period) &&
    [profile.name, ...profile.aliases].some(alias => normalizeCoachName(alias) === name))
  return profiles.length === 1 ? profiles[0] : null
}

export function scoreCoachForClub(coach: SuccessionCoach, club: SuccessionClub) {
  const requirements = clubResearchRequirements(club)
  const research = matchingResearch(coach)
  if (!research) return { score: null, status: 'needs-research' as const, research: null, fit: null }
  if (!requirements.ready) return { score: null, status: 'needs-brief' as const, research, fit: null }
  const fit = calculateResearchFit(requirements.brief, research)
  return { score: fit.score, status: fit.score === null ? 'needs-brief' as const : 'scored' as const, research, fit }
}

export function rankReviewedCoaches(coaches: SuccessionCoach[], club: SuccessionClub, requirements = clubResearchRequirements(club)) {
  const groups = new Map<number, { research: ResearchProfile; records: SuccessionCoach[] }>()
  let unreviewed = 0, ambiguous = 0
  for (const coach of coaches) {
    const research = matchingResearch(coach)
    if (!research) { unreviewed++; continue }
    const group = groups.get(research.apiId) ?? { research, records: [] }
    group.records.push(coach)
    groups.set(research.apiId, group)
  }
  const matches: ReviewedSuccessionCoach[] = []
  let incumbent: ReviewedSuccessionCoach | null = null, reviewed = 0
  for (const { research, records } of groups.values()) {
    // Prefer the sole canonical-name row; otherwise do not choose an arbitrary duplicate record.
    const canonical = records.filter(row => normalizeCoachName(row.name) === normalizeCoachName(research.name))
    const record = canonical.length === 1 ? canonical[0] : records.length === 1 ? records[0] : null
    if (!record) { ambiguous += records.length; continue }
    reviewed++
    if (!requirements.ready) continue
    const fit = calculateResearchFit(requirements.brief, research)
    if (fit.score === null) continue
    const result = { ...record, fitScore: fit.score, research, fit }
    if (club.current_manager && [research.name, ...research.aliases].some(name => normalizeCoachName(name) === normalizeCoachName(club.current_manager!))) incumbent = result
    else matches.push(result)
  }
  matches.sort((a, b) => b.fitScore - a.fitScore || a.research.name.localeCompare(b.research.name))
  return { matches, incumbent, coverage: { reviewed, unreviewed, ambiguous } }
}
