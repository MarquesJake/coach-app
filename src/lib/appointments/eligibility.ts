import { appointmentFeasibility, APPOINTMENT_DECISIONS, type AppointmentContext, type AppointmentDecision } from './feasibility.ts'
import { currentEmploymentForApiId, type CurrentEmployment } from '../scoring/research/current-employment.ts'
import { matchEvidenceFor, type MatchEvidence, type ResearchProfile } from '../scoring/research/brief-fit.ts'

export type EligibilityStatus = 'incumbent' | 'not-pursuing' | 'research-gap' | 'eligible'
export type Eligibility = {
  status: EligibilityStatus
  /** True only when nothing on record stops us researching an approach. Never means available. */
  recommendable: boolean
  headline: string
  reason: string
  employment: CurrentEmployment | null
  source: { title: string; url: string; checkedAt: string } | null
  decidedBy: 'rule' | 'analyst' | 'user'
  /** The brief's appointment timeline set against his known situation. Never invents contract terms. */
  timelineNote: string | null
}

/** A short timeline plus a coach in a job means a release would be needed inside the window; nothing more is inferred. */
export function timelineNoteFor(timeline: string | null | undefined, employment: CurrentEmployment | null): string | null {
  const window = /immediate|30 days/i.test(timeline ?? '') ? 'within 30 days' : /60 days/i.test(timeline ?? '') ? 'within 60 days' : /90 days/i.test(timeline ?? '') ? 'within 90 days' : null
  if (!window) return null
  if (employment?.status === 'employed') return `The brief wants an appointment ${window}: he is in a job, so a release would be needed inside that window — route, cost and his own view unknown. Diligence action, not a mark against his football.`
  if (employment?.status === 'unattached') return `The brief wants an appointment ${window}: no club to release him from on the cited source. Interest and terms still unknown.`
  return `The brief wants an appointment ${window}: his current situation is unconfirmed, so the timetable cannot be judged yet.`
}

/**
 * Appointment policy applied before any recommendation. These are Gaffa's working rules for
 * this demonstration, not facts about the coaches: they decide who we would realistically
 * pursue. Each rule reads the reviewed employment record (sourced, checked 15 September 2026),
 * never a name list, so a change of job changes the outcome. The Premier League list is the
 * 2026/27 division: Coventry, Hull and Ipswich came up; West Ham, Burnley and Wolves went down.
 */
export const APPOINTMENT_POLICY = {
  author: 'Gaffa analyst (demonstration policy)',
  checkedAt: '2026-09-15',
  premierLeagueClubs: ['arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea', 'coventry', 'crystal palace', 'everton', 'fulham', 'hull', 'ipswich', 'leeds', 'liverpool', 'manchester city', 'manchester united', 'newcastle', 'nottingham forest', 'sunderland', 'tottenham'],
  europeanEliteClubs: ['paris saint-germain', 'real madrid', 'barcelona', 'bayern', 'borussia dortmund', 'inter', 'ac milan', 'juventus', 'napoli', 'atletico madrid', 'atlético madrid'],
  latestUsableSeason: 2023,
} as const

/** A sourced non-coaching post (advisor, head of, director, executive) without a coaching title. */
export const isExecutiveRole = (role: string | null | undefined) => !!role && /non-coaching|advis|head of|director|executive|chief/i.test(role) && !/head coach|first.?team coach|manager\b/i.test(role)
const clean = (value: string | null | undefined) => (value ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
const matchesClub = (club: string, list: readonly string[]) => list.some(name => clean(club).includes(clean(name)))

export function eligibilityFor(
  coach: Pick<ResearchProfile, 'apiId' | 'name' | 'aliases'>,
  context: AppointmentContext,
  options: { decisions?: readonly AppointmentDecision[]; employment?: CurrentEmployment | null; evidence?: MatchEvidence | null; identityResolved?: boolean; timeline?: string | null } = {},
): Eligibility {
  const employment = options.employment === undefined ? currentEmploymentForApiId(coach.apiId) ?? null : options.employment
  const evidence = options.evidence === undefined ? matchEvidenceFor(coach.apiId) : options.evidence
  const employmentSource = employment?.sourceUrl ? { title: employment.sourceTitle || 'Employment source', url: employment.sourceUrl, checkedAt: employment.checkedAt } : null
  const base = { employment, source: employmentSource, timelineNote: timelineNoteFor(options.timeline, employment) }

  const explicit = appointmentFeasibility(coach, context, options.decisions ?? APPOINTMENT_DECISIONS)
  if (explicit.status === 'incumbent') return { ...base, status: 'incumbent', recommendable: false, decidedBy: 'rule', headline: 'Current manager — the benchmark', reason: 'He is the man in the job, so he is the yardstick for the others, not a successor.' }
  if (explicit.status === 'not-pursuing' && explicit.decision) return {
    ...base, status: 'not-pursuing', recommendable: false, decidedBy: explicit.decision.decidedBy, headline: 'Not pursuing',
    reason: explicit.decision.reason, source: { title: explicit.decision.source.title, url: explicit.decision.source.url, checkedAt: explicit.decision.checkedAt },
  }
  if (options.identityResolved === false) return { ...base, status: 'research-gap', recommendable: false, decidedBy: 'rule', headline: 'Identity to confirm', reason: 'More than one record could be this coach. We do not recommend anyone until we know exactly who the evidence belongs to.' }

  if (employment?.status === 'employed') {
    const where = [employment.role, employment.club].filter(Boolean).join(', ')
    if (isExecutiveRole(employment.role)) return { ...base, status: 'not-pursuing', recommendable: false, decidedBy: 'rule', headline: 'Not pursuing — executive role', reason: `${where}. He has moved into a non-coaching post; not a head-coach candidate while that stands.` }
    if (/national/i.test(`${employment.club} ${employment.role}`)) return { ...base, status: 'not-pursuing', recommendable: false, decidedBy: 'rule', headline: 'Not pursuing — international job', reason: `${where}. A national-team contract rules out a club move for this search.` }
    if (employment.club && matchesClub(employment.club, APPOINTMENT_POLICY.premierLeagueClubs)) return { ...base, status: 'not-pursuing', recommendable: false, decidedBy: 'rule', headline: 'Not pursuing — Premier League rival', reason: `${where}. We do not target a coach currently managing a Premier League club.` }
    if (employment.club && matchesClub(employment.club, APPOINTMENT_POLICY.europeanEliteClubs)) return { ...base, status: 'not-pursuing', recommendable: false, decidedBy: 'rule', headline: 'Not pursuing — elite club', reason: `${where}. Clubs at that level do not release their head coach mid-season.` }
  }

  const latest = evidence?.latestSeason
  if (!latest || latest.season < APPOINTMENT_POLICY.latestUsableSeason) return { ...base, status: 'research-gap', recommendable: false, decidedBy: 'rule', headline: 'Needs more recent evidence', reason: latest ? `Last verified club season is ${latest.season}/${String((latest.season + 1) % 100).padStart(2, '0')}. Too old to recommend on.` : 'No verified club season in the match data yet.' }

  if (employment?.status === 'employed') return { ...base, status: 'eligible', recommendable: true, decidedBy: 'rule', headline: 'In a job — release route unknown', reason: `${[employment.role, employment.club].filter(Boolean).join(', ')}. Fair to assess; we would need to find out what it takes to get him out before approaching.` }
  if (employment?.status === 'unattached') return { ...base, status: 'eligible', recommendable: true, decidedBy: 'rule', headline: 'No club on record', reason: 'No current appointment in the cited source. Interest and terms still unknown.' }
  return { ...base, status: 'eligible', recommendable: true, decidedBy: 'rule', headline: 'Current situation unconfirmed', reason: employment?.note ? `Last confirmed move: ${employment.note.split('. ')[0]}. Whether he is free, interested or affordable is unknown.` : 'No reviewed employment record. Whether he is free, interested or affordable is unknown.' }
}
