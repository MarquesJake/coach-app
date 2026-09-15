import { calculateResearchFit, matchEvidenceFor, normalizeCoachName, type CodedEvidence, type MatchEvidence, type RankingBrief, type ResearchFit, type ResearchProfile } from './brief-fit.ts'
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

const RECORD_ORDER = ['European trophy', 'Top-four finish', 'Domestic title', 'Top-flight experience', 'Promotion']
function best(recorded: string) {
  const found = RECORD_ORDER.find(item => recorded.includes(item))
  return found ? found.replace(/^European/, 'a European').replace(/^Domestic title/, 'a domestic title').replace(/^Top-four finish/, 'a top-four finish').replace(/^Top-flight experience/, 'top-flight experience').replace(/^Promotion/, 'a promotion') : 'no major honour'
}
function frontFoot(recorded: string) {
  const match = recorded.match(/(\d+)% possession, (\d+)% of the match xG/)
  return match ? { possession: match[1], xg: match[2] } : null
}
const season = (recorded: string) => recorded.match(/\d{4}\/\d{2}/)?.[0] ?? 'no recent season'
const perMatch = (recorded: string) => recorded.match(/(\d+\.\d+) xG/)?.[1] ?? null
const careerShape = (recorded: string) => {
  const promotion = /Promotion/.test(recorded), topFlight = /Top-flight/.test(recorded), elite = /European trophy|Domestic title|Top-four finish/.test(recorded)
  return promotion && topFlight ? 'a promotion and top-flight football' : promotion ? 'a promotion, no top-flight season' : topFlight && !elite ? 'top-flight work without elite honours' : elite ? 'a career built on elite honours' : 'neither a promotion nor a top-flight season'
}
const identityWithPress = (recorded: string) => recorded.split(' · ').slice(0, 2).join(', ').toLowerCase()

/** One plain reason per dimension, phrased the way an analyst would say it. */
function phrase(key: string, upper: string, lower: string): string {
  switch (key) {
    case 'record': return `a stronger record — ${best(upper)} against ${best(lower)}`
    case 'front-foot': {
      const a = frontFoot(upper), b = frontFoot(lower)
      return a && b ? `more control of games — ${a.possession}% possession and ${a.xg}% of the xG, against ${b.possession}% and ${b.xg}%` : 'more evidence of front-foot football in the match data'
    }
    case 'recent': return `more recent time in charge — ${season(upper)} against ${season(lower)}`
    case 'style': return `a playing identity closer to the brief — ${upper.toLowerCase()} against ${lower.toLowerCase()}`
    case 'build': return `a build-up closer to the brief — ${upper.toLowerCase()} against ${lower.toLowerCase()}`
    case 'pressing': return `pressing closer to the brief — ${upper.toLowerCase()} against ${lower.toLowerCase()}`
    case 'survival': return `more of the right experience — ${careerShape(upper)} against ${careerShape(lower)}`
    case 'underdog': return `a career shaped by lifting smaller sides — ${careerShape(upper)} against ${careerShape(lower)}`
    case 'defence': { const a = perMatch(upper), b = perMatch(lower); return a && b ? `a tighter defence in the match data — ${a} xG against per match, against ${b}` : 'more evidence of defensive organisation in the match data' }
    case 'attack': { const a = perMatch(upper), b = perMatch(lower); return a && b ? `more chances created — ${a} xG for per match, against ${b}` : 'more evidence of chance creation in the match data' }
    case 'pragmatism': return `a more pragmatic identity — ${identityWithPress(upper)} against ${identityWithPress(lower)}`
    case 'english': return /English clubs/.test(upper) && !/English clubs/.test(lower) ? 'English football on his record, which the other man lacks' : 'more English football on his record'
    case 'transitions': return `transitions closer to the brief — ${upper.toLowerCase()} against ${lower.toLowerCase()}`
    case 'sample': return `more verified matches behind him — ${upper.split(' ')[0]} against ${lower.split(' ')[0]}`
    case 'leadership': return 'checked references on leadership that the other man does not have yet'
    case 'development': return 'checked evidence on player development that the other man does not have yet'
    default: return 'a closer match to the brief'
  }
}

/** Contribution from the brief's football lines only — identity, build-up, block, transitions, pragmatism. */
const FOOTBALL_LINES = ['style', 'build', 'pressing', 'transitions', 'pragmatism']
const footballMatch = (coach: RankedCoach) => Math.round(coach.fit.dimensions.filter(row => FOOTBALL_LINES.includes(row.key)).reduce((sum, row) => sum + row.contribution, 0) * 10)

function explainGap(upper: RankedCoach, lower: RankedCoach): string {
  if (upper.fit.score === lower.fit.score) {
    const fa = footballMatch(upper), fb = footballMatch(lower)
    if (fa !== fb) return `Level with ${lower.profile.name} on ${upper.fit.score}. Listed first because his football is the closer match to the brief — ${(fa / 10).toFixed(1)} points from the identity, build-up, block and transition lines against ${(fb / 10).toFixed(1)}.`
    const a = upper.evidence?.recentMatches ?? 0, b = lower.evidence?.recentMatches ?? 0
    return a !== b
      ? `Level with ${lower.profile.name} on ${upper.fit.score} and level on the football lines. Listed first because there is more evidence behind him: ${a} verified league matches in his last three seasons against ${b}.`
      : `Level with ${lower.profile.name} on ${upper.fit.score}, with as much evidence behind each. The data does not separate them yet.`
  }
  const lowerRows = new Map(lower.fit.dimensions.map(row => [row.key, row]))
  const diffs = upper.fit.dimensions
    .map(row => ({ row, other: lowerRows.get(row.key), delta: row.contribution - (lowerRows.get(row.key)?.contribution ?? 0) }))
    .filter(item => Math.abs(item.delta) >= 0.05)
    .sort((a, b) => b.delta - a.delta)
  const gains = diffs.filter(item => item.delta > 0).slice(0, 2).map(item => phrase(item.row.key, item.row.recorded, item.other?.recorded ?? ''))
  const loss = diffs.filter(item => item.delta < 0).at(-1)
  const gap = (upper.fit.score - lower.fit.score).toFixed(1)
  const lead = `${gap} ahead of ${lower.profile.name}: ${gains.join('; and ') || 'a closer match to the brief overall'}.`
  return loss ? `${lead} ${lower.profile.name} has ${phrase(loss.row.key, loss.other?.recorded ?? '', loss.row.recorded).replace(/^a stronger record/, 'the better record').replace(/^a /, 'the ')}.` : lead
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
  /** Checked reference and interview evidence per coach record id; only this can score the people lines. */
  codedEvidence?: ReadonlyMap<string, CodedEvidence>
}): Ranking {
  const profiles = input.profiles ?? RESEARCH_PROFILES
  let unmatched = 0
  const scored: RankedCoach[] = []
  for (const profile of profiles) {
    const record = recordFor(profile, input.records ?? null)
    if (record === null) { unmatched++; continue }
    const evidence = matchEvidenceFor(profile.apiId)
    const fit = calculateResearchFit(input.brief, profile, evidence, record ? input.codedEvidence?.get(record.id) ?? null : null)
    if (fit.score === null) continue
    const eligibility = eligibilityFor(profile, input.context, { decisions: input.decisions, evidence, timeline: input.brief.succession_timeline })
    scored.push({ profile, record: record ?? null, fit: fit as RankedCoach['fit'], eligibility, evidence, position: null, joint: false, aheadOfNext: null })
  }
  // Level on score: the closer football match to the brief goes first, then evidence depth, then recency. Names never decide.
  const order = (a: RankedCoach, b: RankedCoach) => b.fit.score - a.fit.score
    || footballMatch(b) - footballMatch(a)
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
