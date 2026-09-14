import { calculateResearchFit, matchEvidenceFor, normalizeCoachName, type MatchEvidence, type RankingBrief, type ResearchFit, type ResearchProfile } from './brief-fit.ts'
import { RESEARCH_PROFILES } from './profiles.ts'
import { eligibilityFor, type Eligibility } from '../../appointments/eligibility.ts'
import type { AppointmentContext, AppointmentDecision } from '../../appointments/feasibility.ts'

export type CoachRecord = { id: string; name: string }
export type RankedCoach = {
  profile: ResearchProfile
  record: CoachRecord | null
  fit: ResearchFit & { score: number }
  eligibility: Eligibility
  evidence: MatchEvidence | null
  /** Position among coaches we would recommend; shared when level on score. */
  position: number | null
  joint: boolean
  /** Plain-English reason this coach sits above the next one down. */
  aheadOfNext: string | null
}
export type Ranking = {
  shortlist: RankedCoach[]
  notPursuing: RankedCoach[]
  researchGaps: RankedCoach[]
  incumbent: RankedCoach | null
  coverage: { researched: number; scored: number; unmatched: number }
}

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
export const positionLabel = (coach: Pick<RankedCoach, 'position' | 'joint'>) => coach.position === null ? '—' : `${coach.joint ? 'Joint ' : ''}${ordinal(coach.position)}`

/** Canonical record first, then any alias row: aliases are the same person, never extra candidates. */
function recordFor(profile: ResearchProfile, records: readonly CoachRecord[] | null): CoachRecord | null | undefined {
  if (!records) return undefined
  const names = new Set([profile.name, ...profile.aliases].map(normalizeCoachName))
  const rows = records.filter(row => names.has(normalizeCoachName(row.name)))
  return rows.find(row => normalizeCoachName(row.name) === normalizeCoachName(profile.name)) ?? [...rows].sort((a, b) => a.id.localeCompare(b.id))[0] ?? null
}

function explainGap(upper: RankedCoach, lower: RankedCoach): string {
  if (upper.fit.score === lower.fit.score) {
    const a = upper.evidence?.recentMatches ?? 0, b = lower.evidence?.recentMatches ?? 0
    return a !== b
      ? `Level with ${lower.profile.name} on ${upper.fit.score}. Listed first on weight of evidence: ${a} verified league matches in his last three seasons against ${b}.`
      : `Level with ${lower.profile.name} on ${upper.fit.score} and on weight of evidence. Nothing in the data separates them yet.`
  }
  const lowerRows = new Map(lower.fit.dimensions.map(row => [row.key, row]))
  const diffs = upper.fit.dimensions
    .map(row => ({ row, other: lowerRows.get(row.key), delta: row.contribution - (lowerRows.get(row.key)?.contribution ?? 0) }))
    .filter(item => Math.abs(item.delta) >= 0.05)
    .sort((a, b) => b.delta - a.delta)
  const gains = diffs.filter(item => item.delta > 0).slice(0, 2)
    .map(item => `${item.row.label.toLowerCase()} (${item.row.recorded} against ${item.other?.recorded ?? 'not assessed'}, +${item.delta.toFixed(1)})`)
  const loss = diffs.filter(item => item.delta < 0).at(-1)
  const gap = (upper.fit.score - lower.fit.score).toFixed(1)
  return `${gap} points ahead of ${lower.profile.name}: stronger on ${gains.join(' and ') || 'the brief overall'}.${loss ? ` ${lower.profile.name} is better on ${loss.row.label.toLowerCase()} (${loss.delta.toFixed(1)}).` : ''}`
}

/**
 * The single calculation behind Candidates, Succession, Assessment, Club Fits, Coach Submissions
 * and board output. Football fit and eligibility stay separate: eligibility decides who can be
 * recommended, never the score.
 */
export function rankResearchProfiles(input: {
  brief: RankingBrief
  context: AppointmentContext
  records?: readonly CoachRecord[] | null
  decisions?: readonly AppointmentDecision[]
  profiles?: readonly ResearchProfile[]
}): Ranking {
  const profiles = input.profiles ?? RESEARCH_PROFILES
  let unmatched = 0
  const scored: RankedCoach[] = []
  for (const profile of profiles) {
    const record = recordFor(profile, input.records ?? null)
    if (record === null) { unmatched++; continue }
    const evidence = matchEvidenceFor(profile.apiId)
    const fit = calculateResearchFit(input.brief, profile, evidence)
    if (fit.score === null) continue
    const eligibility = eligibilityFor(profile, input.context, { decisions: input.decisions, evidence })
    scored.push({ profile, record: record ?? null, fit: fit as RankedCoach['fit'], eligibility, evidence, position: null, joint: false, aheadOfNext: null })
  }
  const order = (a: RankedCoach, b: RankedCoach) => b.fit.score - a.fit.score
    || (b.evidence?.recentMatches ?? 0) - (a.evidence?.recentMatches ?? 0)
    || (b.evidence?.latestSeason?.season ?? 0) - (a.evidence?.latestSeason?.season ?? 0)
    || a.profile.name.localeCompare(b.profile.name)
  scored.sort(order)
  const shortlist = scored.filter(row => row.eligibility.recommendable)
  shortlist.forEach((row, index) => {
    const firstLevel = shortlist.findIndex(other => other.fit.score === row.fit.score)
    row.position = firstLevel + 1
    row.joint = shortlist.filter(other => other.fit.score === row.fit.score).length > 1
    const next = shortlist[index + 1]
    row.aheadOfNext = next ? explainGap(row, next) : null
  })
  return {
    shortlist,
    notPursuing: scored.filter(row => row.eligibility.status === 'not-pursuing'),
    researchGaps: scored.filter(row => row.eligibility.status === 'research-gap'),
    incumbent: scored.find(row => row.eligibility.status === 'incumbent') ?? null,
    coverage: { researched: profiles.length, scored: scored.length, unmatched },
  }
}
