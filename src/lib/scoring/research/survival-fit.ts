import { safeDecisionBrief } from '../../mandates/decision-brief.ts'
import { applyModifiers, type FitDimension, type MatchEvidence, type RankingBrief, type ResearchFit, type ResearchProfile } from './brief-fit.ts'

/**
 * The survival weighting model. Chosen when a brief's objective is staying in the division, so a
 * promoted or struggling club is not ranked on a trophy-winner's requirements. Every weight is a
 * published analyst rule; possession and high pressing earn nothing on their own here.
 */
export const SURVIVAL_MODEL = {
  key: 'survival',
  label: 'Survival brief',
  summary: 'Starting weights: keeping a side in the top flight 20, defensive organisation 15, lifting an underdog or promoted squad 15, chance creation 10, build-up 10, defensive block 10, pragmatism without the ball 10, English or comparable league experience 10, player development 5, working to a controlled budget 5, leadership in a relegation fight 5, longer-term identity 5, recent head-coach evidence 5. Essential requirements count 1.5 times, Flexible half. Weights are then scaled to 100.',
  evidence: 'Track record, playing identity, build-up and pressing band come from dated tactical research. Defensive and attacking figures come from API-Football league matches where the coach is on the team sheet, in the latest club season with full coverage; league strength is not adjusted. English experience is read from the provider career record. Development, budget and leadership have no evidence in the current source and take half credit until references and interview fill them.',
} as const

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

const seasonLabel = (season: number) => `${season}/${String((season + 1) % 100).padStart(2, '0')}`
const priorityMultiplier = { Essential: 1.5, Preferred: 1, Flexible: 0.5 }
const styles: Record<string, ResearchProfile['style']> = {
  'Possession / build-out': 'Possession', 'Possession-based': 'Possession', 'Tiki-taka': 'Possession', 'Build from back': 'Possession',
  'High press / dominant': 'Pressing', 'High press': 'Pressing', 'Gegenpressing': 'Pressing',
  'Counter-attack / compact': 'Counter-attacking', 'Counter-attacking': 'Counter-attacking', 'Direct': 'Direct', 'Long ball': 'Direct',
  'Hybrid / flexible': 'Adaptable', 'Balanced': 'Adaptable',
}

export function isSurvivalObjective(objective: string | null | undefined): boolean {
  return /relegation|survival|stay up|stabili|maintain/i.test(objective ?? '')
}

export function calculateSurvivalFit(brief: RankingBrief, coach: ResearchProfile, evidence: MatchEvidence | null): ResearchFit {
  const detail = safeDecisionBrief(brief.decision_brief)
  const briefSource = 'Analyst demonstration brief — survival objective. Not supplied by the club.'
  const rows: FitDimension[] = []
  const manualChecks = ['Salary and staff budget for this club', 'Verified release clause or negotiated compensation against this club’s budget; currency, conditions and source date', 'Willingness to join this club and timing; being under contract is not an automatic exclusion', 'Squad suitability', 'Leadership, references and working relationships', 'Licence, language and work permit', 'Current form and performance relative to resources']
  const add = (row: Omit<FitDimension, 'contribution'>) => rows.push({ ...row, contribution: 0 })
  const record = coach.trackRecord
  const recorded = record.length ? record.join(', ') : 'No senior achievement category on the research profile'
  const topFlight = record.includes('Top-flight experience'), promotion = record.includes('Promotion')
  const eliteHonour = record.some(item => ['European trophy', 'Domestic title', 'Top-four finish'].includes(item))
  const research = coach.sources[0] ? `${coach.sources[0].title} · ${coach.sources[0].period}` : 'Tactical research profile'

  add({ key: 'survival', label: 'Keeping a side in the top flight', required: 'Has coached in the top flight, ideally after taking a club up', recorded, weight: 20,
    score: topFlight && promotion ? 100 : topFlight ? 70 : promotion ? 50 : 30, requirementSource: briefSource, evidenceKind: 'researched', period: research,
    explanation: 'Top-flight experience after a promotion: 100; top-flight experience only: 70; promotion only: 50; neither: 30. Whether the side stayed up is checked in the nine areas, not assumed here.' })

  const defensive = detail.out_of_possession
  const data = evidence?.style
  const sample = data ? `${data.club} ${seasonLabel(data.season)} · ${data.matches} league matches with full coverage` : 'No club season with full possession and xG coverage'
  const xga = data ? data.xgAgainst : null
  add({ key: 'defence', label: 'Defensive organisation', required: `${defensive?.value ?? 'A compact, organised shape'} — conceding few chances`, recorded: data ? `${data.club} ${seasonLabel(data.season)}: ${data.xgAgainst.toFixed(2)} xG against per match (${data.matches} matches)` : 'Not available from the current source',
    weight: 15 * (defensive?.value ? priorityMultiplier[defensive.priority] : 1), score: xga === null ? 50 : xga <= 1.0 ? 100 : xga <= 1.25 ? 85 : xga <= 1.5 ? 65 : xga <= 1.75 ? 45 : 30,
    requirementSource: briefSource, evidenceKind: data ? 'calculated' : 'unavailable', period: sample,
    explanation: 'xG against per match in the latest club season with full coverage: 1.00 or under = 100, 1.25 = 85, 1.50 = 65, 1.75 = 45, worse = 30. No data: half credit — unproven, not assumed poor. League strength is not adjusted.' })

  const xgf = data ? data.xgFor : null
  add({ key: 'attack', label: 'Chance creation and attacking output', required: 'Creates enough chances to score at this level', recorded: data ? `${data.club} ${seasonLabel(data.season)}: ${data.xgFor.toFixed(2)} xG for per match (${data.matches} matches)` : 'Not available from the current source',
    weight: 10, score: xgf === null ? 50 : xgf >= 1.8 ? 100 : xgf >= 1.5 ? 85 : xgf >= 1.25 ? 65 : xgf >= 1.0 ? 50 : 35,
    requirementSource: briefSource, evidenceKind: data ? 'calculated' : 'unavailable', period: sample,
    explanation: 'xG for per match in the same season: 1.80+ = 100, 1.50 = 85, 1.25 = 65, 1.00 = 50, under = 35. No data: half credit. League strength is not adjusted.' })

  add({ key: 'underdog', label: 'Lifting an underdog, promoted or constrained squad', required: 'Has improved a side without elite resources', recorded, weight: 15,
    score: promotion ? 100 : topFlight && !eliteHonour ? 70 : eliteHonour ? 40 : 30, requirementSource: briefSource, evidenceKind: 'researched', period: research,
    explanation: 'A documented promotion: 100; top-flight work without elite honours: 70; a career built on elite honours: 40; nothing documented: 30. Resources are not measured — this is the shape of the career, not a wage-bill comparison.' })

  // Build-up and the defensive block are brief requirements too; score them the same way the standard model does.
  // "Adaptable" in possession says nothing about the build, so the broad build-up field decides.
  const builds: Record<string, ResearchProfile['build']> = { 'Short build': 'Short', 'Build from back': 'Short', 'Short passing': 'Short', 'Long ball / direct': 'Direct', 'Long ball': 'Direct', 'Direct play': 'Direct', 'Mixed': 'Mixed', 'Build through pressure': 'Short', 'Progress quickly': 'Mixed' }
  const possession = detail.in_possession
  const build = builds[possession?.value ?? ''] ?? builds[brief.build_preference_required ?? '']
  if (build) {
    add({ key: 'build', label: 'Build-up', required: build === 'Direct' ? 'Direct — long ball or quick forward play' : build === 'Short' ? 'Short build from the back' : 'Mixed — short or direct as the picture allows', recorded: `${coach.build} build`,
      weight: 10 * (possession?.value && builds[possession.value] ? priorityMultiplier[possession.priority] : 1), score: build === coach.build ? 100 : build === 'Mixed' || coach.build === 'Mixed' ? 65 : 25,
      requirementSource: briefSource, evidenceKind: 'researched', period: research,
      explanation: 'Matching approach: 100; mixed approach on either side: 65; contrasting approach: 25.' })
  } else manualChecks.push('Agree a recognised build-up approach')
  const blockLevels: Record<string, number> = { 'High press': 2, 'Mid-block': 1, 'Low block': 0 }
  const pressLevels: Record<string, number> = { High: 2, Medium: 1, Low: 0 }
  const requestedBlock = defensive?.value === 'Opponent-dependent' ? undefined : blockLevels[defensive?.value ?? ''] ?? pressLevels[brief.pressing_intensity_required ?? '']
  if (requestedBlock !== undefined) {
    add({ key: 'block', label: 'Defensive block', required: ['Low block', 'Mid-block', 'High press'][requestedBlock], recorded: `${coach.pressing} press`,
      weight: 10 * (defensive?.value ? priorityMultiplier[defensive.priority] : 1), score: 100 - Math.abs(requestedBlock - pressLevels[coach.pressing]) * 35,
      requirementSource: briefSource, evidenceKind: 'researched', period: research,
      explanation: 'Matching block: 100; one band apart: 65; two bands apart: 30. The coach’s band is his coded pressing intensity in the cited period.' })
  }
  const pragmatism = coach.style === 'Counter-attacking' || coach.style === 'Direct' ? 100 : coach.style === 'Adaptable' ? 80 : coach.pressing !== 'High' ? 60 : 40
  add({ key: 'pragmatism', label: 'Pragmatism without the ball', required: `${possession?.value ?? 'Adaptable'} in possession; can set up to defend and counter`, recorded: `${coach.style} · ${coach.pressing.toLowerCase()} press · ${coach.build.toLowerCase()} build`,
    weight: 10 * (possession?.value ? priorityMultiplier[possession.priority] : 1), score: pragmatism, requirementSource: briefSource, evidenceKind: 'researched', period: research,
    explanation: 'Identity coded as counter-attacking or direct: 100; adaptable: 80; possession or pressing side with a medium or low press: 60; possession or pressing side that always presses high: 40. Possession itself earns nothing here.' })

  const development = detail.development
  add({ key: 'development', label: 'Player development', required: development?.value ? development.value.slice(0, 120) : 'Improves the squad he has', recorded: 'Not available from the current source',
    weight: 5 * (development?.value ? priorityMultiplier[development.priority] : 1), score: 50, requirementSource: briefSource, evidenceKind: 'unavailable', period: 'Assessed through references, interview and the nine areas',
    explanation: 'No player-progression evidence in the current source. Half credit for everyone until references and data fill it — it does not separate coaches yet.' })

  add({ key: 'budget', label: 'Working to a controlled budget', required: 'Can work within a promoted club’s wage and transfer limits', recorded: 'Not available from the current source',
    weight: 5, score: 50, requirementSource: briefSource, evidenceKind: 'unavailable', period: 'Wage-bill and net-spend context not held',
    explanation: 'No wage-bill or spend data in the current source. Half credit for everyone; checked by hand with the club before any approach.' })

  const english = englishCareerClubs(coach)
  add({ key: 'english', label: 'English football or comparable league experience', required: 'Knows the Premier League or the Championship', recorded: english.length ? `English clubs on the provider career record: ${english.join(', ')}` : 'No senior English club on the provider career record',
    weight: 10, score: english.length ? 100 : 50, requirementSource: briefSource, evidenceKind: english.length ? 'researched' : 'unavailable', period: coach.apiRecord ? `API-Football career snapshot, retrieved ${coach.apiRecord.retrievedAt}` : 'No provider career record',
    explanation: 'A senior English club on the provider career record: 100; none: 50 — comparability of other leagues is judged in the nine areas, not assumed. Youth and reserve spells do not count.' })

  add({ key: 'leadership', label: 'Leadership in a relegation fight', required: detail.leadership_behaviours?.value ? detail.leadership_behaviours.value.slice(0, 120) : 'Calm, clear leadership under pressure', recorded: 'Not available from the current source',
    weight: 5, score: 50, requirementSource: briefSource, evidenceKind: 'unavailable', period: 'References and interview only',
    explanation: 'Leadership is never scored from the desk. Half credit for everyone until references and interview are recorded.' })

  const style = styles[brief.tactical_model_required ?? '']
  if (style) {
    const score = style === coach.style && style !== 'Adaptable' ? 100 : style === 'Adaptable' || coach.style === 'Adaptable' ? 65 : 25
    add({ key: 'identity', label: 'Longer-term identity', required: `${style} football if the club stays up or goes down`, recorded: coach.style, weight: 5, score,
      requirementSource: briefSource, evidenceKind: 'researched', period: research,
      explanation: 'Same identity as the club’s longer-term model: 100; either side only "adaptable": 65; different identity: 25. Kept light on purpose — survival comes first.' })
  } else manualChecks.push('Agree the longer-term playing identity')

  const latest = evidence?.latestSeason
  add({ key: 'recent', label: 'Recent head-coach evidence', required: 'A recent full season in charge', recorded: latest ? `${latest.club} ${seasonLabel(latest.season)} · ${latest.matches} verified league matches` : 'No verified club season from the current source',
    weight: 5, score: !latest ? 30 : latest.season >= 2025 ? 100 : latest.season === 2024 ? 80 : latest.season === 2023 ? 60 : 30,
    requirementSource: briefSource, evidenceKind: latest ? 'calculated' : 'unavailable', period: latest ? `${latest.club} ${seasonLabel(latest.season)}` : 'No verified season',
    explanation: 'Latest club season with 10+ verified league matches: 2025/26 or later = 100, 2024/25 = 80, 2023/24 = 60, older or none = 30.' })

  for (const [key, value] of Object.entries(detail)) {
    if (value.value && !['in_possession', 'out_of_possession', 'development', 'leadership_behaviours', 'adaptation'].includes(key)) manualChecks.push(`${key.replaceAll('_', ' ')} (${value.priority.toLowerCase()}): ${value.value}`)
  }
  const modifiers = applyModifiers(rows, brief)
  const total = rows.reduce((sum, row) => sum + row.weight, 0)
  for (const row of rows) {
    row.weight = row.weight / total * 100
    row.contribution = row.score * row.weight / 100
  }
  const raw = rows.reduce((sum, row) => sum + row.contribution, 0)
  const evidenced = rows.filter(row => row.evidenceKind !== 'unavailable').reduce((sum, row) => sum + row.weight, 0)
  return {
    score: Math.round(raw * 10) / 10, dimensions: rows, manualChecks, model: SURVIVAL_MODEL.key,
    coverage: { evidencedWeight: Math.round(evidenced), unavailable: rows.filter(row => row.evidenceKind === 'unavailable').map(row => row.label) },
    modifiers,
  }
}
