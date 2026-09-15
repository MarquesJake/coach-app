import { safeDecisionBrief, type DecisionBrief } from '../../mandates/decision-brief.ts'
import evidenceFile from './ranking-evidence.json' with { type: 'json' }
import { DIMENSION_GROUP, PRIORITY_FIELD, profileFor, WEIGHTING_PROFILES, type DimensionKey, type ProfileKey, type WeightingProfile } from './weighting-profiles.ts'

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
  board_risk_appetite?: string | null
  succession_timeline?: string | null
  decision_brief?: unknown
}
/** What kind of evidence sits behind a dimension, so the board can read each line for what it is. */
export type EvidenceKind = 'verified' | 'calculated' | 'researched' | 'unavailable'
export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  verified: 'Verified — dated official source or checked reference',
  calculated: 'Calculated — API-Football league matches with the coach on the team sheet',
  researched: 'Researched — dated tactical research on a named period',
  unavailable: 'Not scored — evidence required; the weight is left out and the coverage line says so',
}
export type FitDimension = {
  key: string; label: string; required: string; recorded: string
  /** Share of the scored weight (0–100). Not-scored lines carry 0 here and keep their intended weight for display. */
  weight: number
  /** null = not scored: the evidence does not exist yet, so nothing is invented. */
  score: number | null
  contribution: number; explanation: string
  /** Where the requirement came from: the saved brief, and who wrote it. */
  requirementSource: string
  evidenceKind: EvidenceKind
  /** Period covered and sample size behind the recorded evidence. */
  period: string
  /** Weight before scaling, after priorities and modifiers — a not-scored line still shows what it would carry. */
  intendedWeight: number
}
export type ResearchFit = {
  score: number | null; dimensions: FitDimension[]; manualChecks: string[]
  /** Which published weighting profile produced the score. */
  model: ProfileKey
  /** Share of the intended weight backed by evidence; the lines still waiting for some; how far the score can be trusted. */
  coverage: { evidencedWeight: number; unavailable: string[]; unscored: string[]; reliability: 'strong' | 'moderate' | 'weak' }
  /** Brief answers that changed the weights (change to the model, board risk appetite), in plain words. */
  modifiers: string[]
}
export type MatchEvidence = {
  apiId: number
  latestSeason: { club: string; season: number; matches: number; pointsPerMatch: number | null } | null
  style: { club: string; season: number; matches: number; possession: number; xgFor: number; xgAgainst: number } | null
  recentMatches: number
}
/**
 * Checked, non-illustrative evidence recorded against a coach on this mandate: verified reference
 * and interview answers. Only these can score the people lines; a desk view never does.
 */
export type CodedEvidence = {
  leadership: { answers: number; references: number; hireYes: number; hireNo: number; hireMixed: number; sources: string[] }
  development: { answers: number; sources: string[] }
}

const EVIDENCE = new Map((evidenceFile.coaches as MatchEvidence[]).map(row => [row.apiId, row]))
export const RANKING_EVIDENCE_RETRIEVED_AT = evidenceFile.retrievedAt
/** Verified API-Football summary for a coach, or null when the provider supplied nothing usable. */
export function matchEvidenceFor(apiId: number): MatchEvidence | null {
  return EVIDENCE.get(apiId) ?? null
}
const seasonLabel = (season: number) => `${season}/${String((season + 1) % 100).padStart(2, '0')}`

export function normalizeCoachName(value: string): string {
  return value.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase().replace(/[^a-z0-9]/g, '')
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
  'Build through pressure': 'Short', 'Progress quickly': 'Mixed',
}
const priorityMultiplier = { Essential: 1.5, Preferred: 1, Flexible: 0.5 }
const ENGLISH_CLUBS = ['arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'burnley', 'chelsea', 'crystal palace', 'everton', 'fulham', 'ipswich', 'leeds', 'leicester', 'liverpool', 'manchester city', 'manchester united', 'newcastle', 'nottingham forest', 'southampton', 'sunderland', 'tottenham', 'west ham', 'wolverhampton', 'wolves', 'coventry', 'hull', 'luton', 'watford', 'west brom', 'middlesbrough', 'sheffield', 'norwich', 'stoke', 'swansea', 'cardiff', 'derby', 'preston', 'blackburn', 'bristol city', 'millwall', 'queens park rangers', 'qpr', 'plymouth', 'portsmouth', 'oxford', 'huddersfield', 'reading', 'wigan', 'birmingham', 'bolton', 'barnsley', 'charlton', 'peterborough', 'milton keynes', 'mk dons', 'forest green', 'bury', 'telford', 'rotherham', 'blackpool', 'wrexham', 'lincoln', 'exeter', 'stockport', 'leyton orient', 'wycombe', 'cambridge', 'shrewsbury', 'burton', 'fleetwood', 'morecambe', 'walsall', 'crewe', 'doncaster', 'notts county', 'bradford', 'grimsby', 'chesterfield', 'salford', 'gillingham', 'colchester', 'tranmere', 'swindon', 'newport', 'crawley', 'mansfield', 'accrington', 'carlisle', 'cheltenham', 'port vale', 'stevenage', 'northampton', 'wimbledon', 'sutton', 'barrow', 'bromley']
const clean = (value: string) => value.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
const isYouthOrReserve = (club: string) => /\bU\d{2}\b|\bII\b|\bB\b|youth|academy|reserves?/i.test(club)

/** Senior English clubs on the provider career record. A provider snapshot, not verified employment. */
export function englishCareerClubs(coach: Pick<ResearchProfile, 'apiRecord'>): string[] {
  const seen = new Set<string>()
  for (const spell of coach.apiRecord?.career ?? []) {
    if (isYouthOrReserve(spell.club)) continue
    if (ENGLISH_CLUBS.some(name => clean(spell.club).includes(name))) seen.add(spell.club)
  }
  return [...seen]
}

/**
 * Two brief answers change how much the football-match lines and the proven-record lines weigh.
 * "Preserve current model" makes the football lines count 1.5×; "Substantial rebuild" makes them
 * 0.75× and proven lines 1.25×. A conservative board makes proven lines 1.5×; an aggressive one 0.75×.
 * Published rules, shown on every card; a Gradual evolution / Moderate brief changes nothing.
 */
export function briefModifiers(brief: RankingBrief): { football: number; proven: number; notes: string[] } {
  const detail = safeDecisionBrief(brief.decision_brief)
  let football = 1, proven = 1
  const notes: string[] = []
  const adaptation = detail.adaptation?.value
  if (adaptation === 'Preserve current model') { football *= 1.5; notes.push('Brief says preserve the current model — the football-match lines (identity, build-up, block, transitions) count 1.5×.') }
  if (adaptation === 'Substantial rebuild') { football *= 0.75; proven *= 1.25; notes.push('Brief says substantial rebuild — football-match lines count 0.75×, proven-record lines 1.25×.') }
  const appetite = (brief.board_risk_appetite ?? '').toLowerCase()
  if (appetite === 'conservative') { proven *= 1.5; notes.push('Conservative board — proven-record lines (achievement, top-flight record, recent seasons, evidence depth) count 1.5×.') }
  if (appetite === 'aggressive') { proven *= 0.75; notes.push('Aggressive board — proven-record lines count 0.75×; an unproven coach is not held back as much.') }
  return { football, proven, notes }
}
export const FOOTBALL_KEYS = (Object.keys(DIMENSION_GROUP) as DimensionKey[]).filter(key => DIMENSION_GROUP[key] === 'football')
export const PROVEN_KEYS = (Object.keys(DIMENSION_GROUP) as DimensionKey[]).filter(key => DIMENSION_GROUP[key] === 'proven')

/** The weighting profile a brief selects, so the board can see which rules produced the list. */
export function modelFor(brief: RankingBrief): WeightingProfile {
  return profileFor(brief.strategic_objective)
}
export { WEIGHTING_PROFILES, profileFor }
/** Where the evidence behind every line comes from — the same sentence on every screen. */
export const EVIDENCE_NOTE = 'Track record, playing identity, build-up and pressing band come from dated tactical research. Defensive and attacking figures, recency and evidence depth come from API-Football league matches where the coach is on the team sheet, in the latest club season with full coverage; league strength is not adjusted. English experience is read from the provider career record. Leadership and player development count only from checked, non-illustrative references or interviews; until then they are not scored and the evidence line says so.'
export const TROPHIES_MODEL = WEIGHTING_PROFILES.trophies
export const SURVIVAL_MODEL = WEIGHTING_PROFILES.survival
export const isSurvivalObjective = (objective: string | null | undefined) => profileFor(objective).key === 'survival'

type Line = Omit<FitDimension, 'weight' | 'contribution' | 'intendedWeight'>
type Ctx = { brief: RankingBrief; detail: DecisionBrief; profile: WeightingProfile; coach: ResearchProfile; evidence: MatchEvidence | null; coded: CodedEvidence | null; research: string; source: string; manualChecks: string[] }

const recordBands = (objective: string, coach: ResearchProfile): { required: string; score: number; explanation: string } | null => {
  const has = (item: TrackRecord) => coach.trackRecord.includes(item)
  if (/promotion|promoted|play.?offs/.test(objective)) return { required: 'Promotion', score: has('Promotion') ? 100 : 40, explanation: 'Documented promotion: 100; other senior achievements: 40. Not a forecast of promotion.' }
  if (/top.?four|top.?4|champions league|win trophies|title|elite|contention/.test(objective)) return { required: 'Winning trophies at the top level', score: has('European trophy') ? 100 : has('Top-four finish') ? 90 : has('Domestic title') ? 75 : has('Top-flight experience') ? 60 : 40, explanation: 'European trophy: 100; major-league top four: 90; other domestic title: 75; top-flight experience: 60; promotion only: 40. Highest evidenced category applies.' }
  if (/youth|academy|develop|rebuild|new identity|stabili|mid.?table|maintain|consolidat/.test(objective)) return { required: 'A senior record at a comparable level', score: has('European trophy') || has('Domestic title') || has('Top-four finish') ? 100 : has('Top-flight experience') ? 80 : has('Promotion') ? 70 : 40, explanation: 'Honours at the top level: 100; top-flight experience: 80; promotion: 70; nothing documented: 40. The objective does not turn on trophies, so this line is light.' }
  return null
}

/** Every line the engine can score. Each returns null when the brief does not ask for it. */
const DIMENSIONS: Record<DimensionKey, (ctx: Ctx) => Line | null> = {
  style: ({ brief, coach, profile, source, research }) => {
    const style = styles[brief.tactical_model_required ?? '']
    if (!style) return null
    const compatible = (style === 'Pressing' && coach.pressing === 'High') || (style === 'Possession' && coach.style === 'Pressing' && coach.build === 'Short')
    const score = style === coach.style && style !== 'Adaptable' ? 100 : style === 'Adaptable' || coach.style === 'Adaptable' ? 65 : compatible ? 75 : 25
    const survivalLike = profile.key === 'survival' || profile.key === 'stabilisation'
    return { key: 'style', label: survivalLike ? 'Longer-term identity' : 'Playing identity', required: survivalLike ? `${style} football if the club stays up or goes down` : style, recorded: coach.style, score, requirementSource: source, evidenceKind: 'researched', period: research,
      explanation: 'Same identity: 100. Pressing side for a possession brief (high press, short build): 75. Either side only "adaptable": 65 — a loose label earns no bonus. Different identity: 25.' }
  },
  build: ({ brief, detail, coach, source, research }) => {
    const possession = detail.in_possession
    const build = builds[possession?.value ?? ''] ?? builds[brief.build_preference_required ?? '']
    if (!build) return null
    return { key: 'build', label: 'Build-up', required: build === 'Direct' ? 'Direct — long ball or quick forward play' : build === 'Short' ? 'Short build from the back' : 'Mixed — short or direct as the picture allows', recorded: `${coach.build} build`,
      score: build === coach.build ? 100 : build === 'Mixed' || coach.build === 'Mixed' ? 65 : 25, requirementSource: source, evidenceKind: 'researched', period: research,
      explanation: 'Matching approach: 100; mixed approach on either side: 65; contrasting approach: 25. "Adaptable" in possession says nothing about the build, so the build-up field decides.' }
  },
  pressing: ({ brief, detail, coach, source, research }) => {
    const defensive = detail.out_of_possession
    const blockLevels: Record<string, number> = { 'High press': 2, 'Mid-block': 1, 'Low block': 0 }
    const pressLevels: Record<string, number> = { 'Very High': 2, High: 2, Medium: 1, Low: 0, 'Very Low': 0 }
    const requested = defensive?.value === 'Opponent-dependent' ? undefined : blockLevels[defensive?.value ?? ''] ?? pressLevels[brief.pressing_intensity_required ?? '']
    if (requested === undefined) return null
    return { key: 'pressing', label: 'Defensive block', required: ['Low block', 'Mid-block', 'High press'][requested], recorded: `${coach.pressing} press`, score: 100 - Math.abs(requested - pressLevels[coach.pressing]) * 35,
      requirementSource: source, evidenceKind: 'researched', period: research, explanation: 'Matching block: 100; one band apart: 65; two bands apart: 30. The coach’s band is his coded pressing intensity in the cited period.' }
  },
  transitions: ({ detail, coach, source, research }) => {
    const value = detail.transition_style?.value
    if (!value) return null
    const score = value === 'Counter-press immediately' ? { High: 100, Medium: 65, Low: 30 }[coach.pressing]
      : value === 'Recover shape first' ? { High: 50, Medium: 100, Low: 100 }[coach.pressing]
      : value === 'Break quickly' ? (coach.style === 'Counter-attacking' || coach.style === 'Direct' ? 100 : coach.style === 'Adaptable' ? 65 : 40)
      : value === 'Keep the ball' ? (coach.style === 'Possession' ? 100 : coach.style === 'Adaptable' ? 65 : 40) : undefined
    if (score === undefined) return null
    return { key: 'transitions', label: 'Transitions', required: value, recorded: `${coach.style} · ${coach.pressing.toLowerCase()} press`, score, requirementSource: source, evidenceKind: 'researched', period: research,
      explanation: 'Counter-press immediately: high press 100, medium 65, low 30. Recover shape first: medium or low 100, high 50. Break quickly: counter-attacking or direct 100, adaptable 65, else 40. Keep the ball: possession 100, adaptable 65, else 40.' }
  },
  pragmatism: ({ detail, coach, source, research }) => ({
    key: 'pragmatism', label: 'Pragmatism without the ball', required: `${detail.in_possession?.value ?? 'Adaptable'} in possession; can set up to defend and counter`, recorded: `${coach.style} · ${coach.pressing.toLowerCase()} press · ${coach.build.toLowerCase()} build`,
    score: coach.style === 'Counter-attacking' || coach.style === 'Direct' ? 100 : coach.style === 'Adaptable' ? 80 : coach.pressing !== 'High' ? 60 : 40, requirementSource: source, evidenceKind: 'researched', period: research,
    explanation: 'Identity coded as counter-attacking or direct: 100; adaptable: 80; possession or pressing side with a medium or low press: 60; possession or pressing side that always presses high: 40. Possession itself earns nothing here.' }),
  record: ({ brief, coach, source, research, manualChecks }) => {
    const bands = recordBands((brief.strategic_objective ?? '').toLowerCase(), coach)
    if (!bands) { if (brief.strategic_objective) manualChecks.push('Assess the strategic objective against specific achievements and player-development evidence'); return null }
    return { key: 'record', label: 'Relevant achievement', required: bands.required, recorded: coach.trackRecord.join(', ') || 'No senior achievement category on the research profile', score: bands.score, requirementSource: source, evidenceKind: 'researched', period: research, explanation: bands.explanation }
  },
  survival: ({ coach, source, research }) => {
    const topFlight = coach.trackRecord.includes('Top-flight experience'), promotion = coach.trackRecord.includes('Promotion')
    return { key: 'survival', label: 'Keeping a side in the top flight', required: 'Has coached in the top flight, ideally after taking a club up', recorded: coach.trackRecord.join(', ') || 'No senior achievement category on the research profile',
      score: topFlight && promotion ? 100 : topFlight ? 70 : promotion ? 50 : 30, requirementSource: source, evidenceKind: 'researched', period: research,
      explanation: 'Top-flight experience after a promotion: 100; top-flight experience only: 70; promotion only: 50; neither: 30. Whether the side stayed up is checked in the nine areas, not assumed here.' }
  },
  underdog: ({ coach, source, research }) => {
    const topFlight = coach.trackRecord.includes('Top-flight experience'), promotion = coach.trackRecord.includes('Promotion')
    const elite = coach.trackRecord.some(item => ['European trophy', 'Domestic title', 'Top-four finish'].includes(item))
    return { key: 'underdog', label: 'Lifting an underdog, promoted or constrained squad', required: 'Has improved a side without elite resources', recorded: coach.trackRecord.join(', ') || 'No senior achievement category on the research profile',
      score: promotion ? 100 : topFlight && !elite ? 70 : elite ? 40 : 30, requirementSource: source, evidenceKind: 'researched', period: research,
      explanation: 'A documented promotion: 100; top-flight work without elite honours: 70; a career built on elite honours: 40; nothing documented: 30. Resources are not measured — this is the shape of the career, not a wage-bill comparison.' }
  },
  english: ({ coach, source }) => {
    const english = englishCareerClubs(coach)
    return { key: 'english', label: 'English football or comparable league experience', required: 'Knows the Premier League or the Championship', recorded: english.length ? `English clubs on the provider career record: ${english.join(', ')}` : 'No senior English club on the provider career record',
      score: english.length ? 100 : 50, requirementSource: source, evidenceKind: 'researched', period: coach.apiRecord ? `API-Football career snapshot, retrieved ${coach.apiRecord.retrievedAt}` : 'No provider career record',
      explanation: 'A senior English club on the provider career record: 100; none: 50 — comparability of other leagues is judged in the nine areas, not assumed. Youth and reserve spells do not count.' }
  },
  'front-foot': ({ brief, evidence, source }) => {
    const style = styles[brief.tactical_model_required ?? '']
    if (style !== 'Possession' && style !== 'Pressing') return null
    const data = evidence?.style
    if (!data) return { key: 'front-foot', label: 'Front-foot football in the match data', required: 'Controls the ball and the chances', recorded: 'Not scored — match data required', score: null, requirementSource: source, evidenceKind: 'unavailable', period: 'No club season with full possession and xG coverage', explanation: 'No club season with full possession and xG coverage. Nothing is invented: the line is left out and coverage drops.' }
    const share = data.xgFor / Math.max(0.01, data.xgFor + data.xgAgainst)
    const possessionScore = data.possession >= 55 ? 100 : data.possession >= 50 ? 75 : 40
    const shareScore = share >= 0.6 ? 100 : share >= 0.5 ? 75 : 40
    return { key: 'front-foot', label: 'Front-foot football in the match data', required: 'Controls the ball and the chances', recorded: `${data.club} ${seasonLabel(data.season)}: ${data.possession.toFixed(0)}% possession, ${Math.round(share * 100)}% of the match xG (${data.matches} matches)`,
      score: Math.round((possessionScore + shareScore) / 2), requirementSource: source, evidenceKind: 'calculated', period: `${data.club} ${seasonLabel(data.season)} · ${data.matches} league matches with full coverage`,
      explanation: 'Average of two bands from the latest club season with full coverage. Possession: 55%+ = 100, 50–55% = 75, under 50% = 40. Share of total xG: 60%+ = 100, 50–60% = 75, under 50% = 40. League strength is not adjusted.' }
  },
  defence: ({ detail, evidence, source }) => {
    const data = evidence?.style
    const required = `${detail.out_of_possession?.value ?? 'A compact, organised shape'} — conceding few chances`
    if (!data) return { key: 'defence', label: 'Defensive organisation', required, recorded: 'Not scored — match data required', score: null, requirementSource: source, evidenceKind: 'unavailable', period: 'No club season with full xG coverage', explanation: 'No club season with full xG coverage. Nothing is invented: the line is left out and coverage drops.' }
    const xga = data.xgAgainst
    return { key: 'defence', label: 'Defensive organisation', required, recorded: `${data.club} ${seasonLabel(data.season)}: ${xga.toFixed(2)} xG against per match (${data.matches} matches)`,
      score: xga <= 1.0 ? 100 : xga <= 1.25 ? 85 : xga <= 1.5 ? 65 : xga <= 1.75 ? 45 : 30, requirementSource: source, evidenceKind: 'calculated', period: `${data.club} ${seasonLabel(data.season)} · ${data.matches} league matches with full coverage`,
      explanation: 'xG against per match in the latest club season with full coverage: 1.00 or under = 100, 1.25 = 85, 1.50 = 65, 1.75 = 45, worse = 30. League strength is not adjusted.' }
  },
  attack: ({ evidence, source }) => {
    const data = evidence?.style
    if (!data) return { key: 'attack', label: 'Chance creation and attacking output', required: 'Creates enough chances to score at this level', recorded: 'Not scored — match data required', score: null, requirementSource: source, evidenceKind: 'unavailable', period: 'No club season with full xG coverage', explanation: 'No club season with full xG coverage. Nothing is invented: the line is left out and coverage drops.' }
    const xgf = data.xgFor
    return { key: 'attack', label: 'Chance creation and attacking output', required: 'Creates enough chances to score at this level', recorded: `${data.club} ${seasonLabel(data.season)}: ${xgf.toFixed(2)} xG for per match (${data.matches} matches)`,
      score: xgf >= 1.8 ? 100 : xgf >= 1.5 ? 85 : xgf >= 1.25 ? 65 : xgf >= 1.0 ? 50 : 35, requirementSource: source, evidenceKind: 'calculated', period: `${data.club} ${seasonLabel(data.season)} · ${data.matches} league matches with full coverage`,
      explanation: 'xG for per match in the same season: 1.80+ = 100, 1.50 = 85, 1.25 = 65, 1.00 = 50, under = 35. League strength is not adjusted.' }
  },
  recent: ({ evidence, source }) => {
    const latest = evidence?.latestSeason
    return { key: 'recent', label: 'Recent head-coach evidence', required: 'A recent full season in charge', recorded: latest ? `${latest.club} ${seasonLabel(latest.season)} · ${latest.matches} verified league matches` : 'No verified club season from the current source',
      score: !latest ? 30 : latest.season >= 2025 ? 100 : latest.season === 2024 ? 80 : latest.season === 2023 ? 60 : 30, requirementSource: source, evidenceKind: latest ? 'calculated' : 'unavailable', period: latest ? `${latest.club} ${seasonLabel(latest.season)}` : 'No verified season',
      explanation: 'Latest club season with 10+ verified league matches: 2025/26 or later = 100, 2024/25 = 80, 2023/24 = 60, older or none = 30. No season is scored 30, not left out: a coach with no recent job is a known gap, not an unknown.' }
  },
  sample: ({ evidence, source }) => {
    const matches = evidence?.recentMatches ?? 0
    return { key: 'sample', label: 'Evidence depth', required: 'Enough verified matches to judge him on', recorded: `${matches} verified league matches in his last three seasons`,
      score: matches >= 76 ? 100 : matches >= 38 ? 75 : matches >= 20 ? 50 : 30, requirementSource: source, evidenceKind: matches ? 'calculated' : 'unavailable', period: 'API-Football, last three seasons with the coach on the team sheet',
      explanation: 'Two seasons or more (76+ matches): 100; one season (38+): 75; half a season (20+): 50; less: 30. A conservative board weights this line more.' }
  },
  development: ({ detail, coded, source }) => {
    const focus = detail.development_focus?.value
    const wanted = focus || detail.development?.value
    if (!wanted) return null
    const required = focus ? `${focus}${detail.development?.value ? ' — ' + detail.development.value.slice(0, 100) : ''}` : detail.development!.value.slice(0, 120)
    if (!coded || coded.development.answers === 0) return { key: 'development', label: 'Player development', required, recorded: 'Not scored — development evidence required', score: null, requirementSource: source, evidenceKind: 'unavailable', period: 'Checked references, interview and data on player progression; none recorded yet',
      explanation: 'Counts only where checked, non-illustrative evidence on player development exists for this coach on this mandate. Nothing is invented: the line is left out and coverage drops.' }
    return { key: 'development', label: 'Player development', required, recorded: `${coded.development.answers} checked answer${coded.development.answers === 1 ? '' : 's'} on player development (${coded.development.sources.join('; ')})`, score: 100, requirementSource: source, evidenceKind: 'verified', period: 'Checked reference and interview answers on this mandate',
      explanation: 'Checked evidence on development exists: 100 while the answers stand. The nine-area assessment carries the detail.' }
  },
  leadership: ({ detail, coded, source }) => {
    const wanted = detail.leadership_behaviours?.value
    if (!wanted) return null
    const required = wanted.slice(0, 120)
    if (!coded || coded.leadership.answers === 0) return { key: 'leadership', label: 'Leadership', required, recorded: 'Not scored — checked reference or interview evidence required', score: null, requirementSource: source, evidenceKind: 'unavailable', period: 'References and interview only; none checked yet',
      explanation: 'Leadership is never scored from the desk. Counts only where checked, non-illustrative reference or interview answers exist for this coach on this mandate.' }
    const { hireYes, hireNo, hireMixed, references, answers, sources } = coded.leadership
    const score = hireNo && !hireYes ? 25 : hireNo || hireMixed ? 60 : hireYes ? 100 : 75
    return { key: 'leadership', label: 'Leadership', required, recorded: `${answers} checked answer${answers === 1 ? '' : 's'} from ${references} reference${references === 1 ? '' : 's'} (${sources.join('; ')}) · would hire again: ${hireYes} yes, ${hireMixed} mixed, ${hireNo} no`, score, requirementSource: source, evidenceKind: 'verified', period: 'Checked reference and interview answers on this mandate',
      explanation: 'From checked references: would hire again yes = 100; mixed or split = 60; no = 25; answers without a hire-again view = 75. One voice is shown as one voice.' }
  },
  budget: ({ source }) => ({ key: 'budget', label: 'Working to a controlled budget', required: 'Can work within a constrained wage and transfer budget', recorded: 'Not scored — wage-bill and spend evidence required', score: null, requirementSource: source, evidenceKind: 'unavailable', period: 'Wage-bill and net-spend context not held',
    explanation: 'No wage-bill or spend data in the current source. Nothing is invented: the line is left out and coverage drops; checked by hand with the club before any approach.' }),
}

/**
 * A published decision rule, not a model trained to predict appointment outcomes. The objective
 * picks the profile; the brief's structured answers set priorities and modifiers; each line names
 * its requirement, evidence, period and sample; lines without evidence are not scored.
 */
export function calculateResearchFit(brief: RankingBrief, coach: ResearchProfile, evidence: MatchEvidence | null = matchEvidenceFor(coach.apiId), coded: CodedEvidence | null = null): ResearchFit {
  const detail = safeDecisionBrief(brief.decision_brief)
  const profile = profileFor(brief.strategic_objective)
  const source = `Saved brief — ${profile.label.toLowerCase()}, analyst demonstration; not supplied by the club.`
  const research = coach.sources[0] ? `${coach.sources[0].title} · ${coach.sources[0].period}` : 'Tactical research profile'
  const manualChecks = ['Salary and staff budget for this club', 'Verified release clause or negotiated compensation against this club’s budget; currency, conditions and source date', 'Willingness to join this club and timing; being under contract is not an automatic exclusion', 'Squad suitability', 'Leadership, references and working relationships', 'Licence, language and work permit', 'Current form and performance relative to resources']
  const ctx: Ctx = { brief, detail, profile, coach, evidence, coded, research, source, manualChecks }
  const modifiers = briefModifiers(brief)
  const rows: FitDimension[] = []
  for (const [key, raw] of Object.entries(profile.weights) as [DimensionKey, number][]) {
    const line = DIMENSIONS[key](ctx)
    if (!line) continue
    const priorityField = PRIORITY_FIELD[key]
    const priority = priorityField ? detail[priorityField]?.priority : undefined
    let weight = raw * (priority ? priorityMultiplier[priority] : 1)
    const group = DIMENSION_GROUP[key]
    if (group === 'football') weight *= modifiers.football
    if (group === 'proven') weight *= modifiers.proven
    rows.push({ ...line, intendedWeight: weight, weight, contribution: 0 })
  }
  if (!styles[brief.tactical_model_required ?? '']) manualChecks.push('Agree a recognised playing identity')
  if (!rows.some(row => row.key === 'build') && profile.weights.build) manualChecks.push('Agree a recognised build-up approach')
  const scoredKeys = ['transition_style', 'development_focus', 'in_possession', 'out_of_possession', 'development', 'leadership_behaviours', 'adaptation']
  for (const [key, value] of Object.entries(detail)) {
    if (value.value && !scoredKeys.includes(key)) manualChecks.push(`${key.replaceAll('_', ' ')} (${value.priority.toLowerCase()}): ${value.value}`)
  }

  const scored = rows.filter(row => row.score !== null)
  const scoredTotal = scored.reduce((sum, row) => sum + row.intendedWeight, 0)
  const intendedTotal = rows.reduce((sum, row) => sum + row.intendedWeight, 0)
  for (const row of rows) {
    row.weight = row.score === null || scoredTotal === 0 ? 0 : row.intendedWeight / scoredTotal * 100
    row.contribution = row.score === null ? 0 : row.score * row.weight / 100
  }
  const briefDimensions = rows.filter(row => ['style', 'build', 'pressing', 'record', 'transitions'].includes(row.key)).length
  const raw = rows.reduce((sum, row) => sum + row.contribution, 0)
  const evidenced = scored.filter(row => row.evidenceKind !== 'unavailable').reduce((sum, row) => sum + row.intendedWeight, 0)
  const evidencedWeight = intendedTotal ? Math.round(evidenced / intendedTotal * 100) : 0
  return {
    score: briefDimensions < 2 ? null : Math.round(raw * 10) / 10, dimensions: rows, manualChecks, model: profile.key,
    coverage: {
      evidencedWeight,
      unavailable: rows.filter(row => row.evidenceKind === 'unavailable').map(row => row.label),
      unscored: rows.filter(row => row.score === null).map(row => row.label),
      reliability: evidencedWeight >= 80 ? 'strong' : evidencedWeight >= 60 ? 'moderate' : 'weak',
    },
    modifiers: modifiers.notes,
  }
}
