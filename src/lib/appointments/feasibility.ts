import { normalizeCoachName } from '../scoring/research/brief-fit.ts'

export type AppointmentContext = { clubId?: string | null; mandateId?: string | null; incumbentName?: string | null }
export type AppointmentDecision = {
  coachApiId: number
  scope: { clubId: string } | { mandateId: string }
  status: 'not-pursuing' | 'route-to-verify'
  decidedBy: 'user' | 'analyst'
  reason: string
  checkedAt: string
  source: { title: string; url: string }
}
export type AppointmentFeasibility = {
  status: 'unknown' | 'incumbent' | AppointmentDecision['status']
  excluded: boolean
  reason: string
  decision?: AppointmentDecision
}
export const TOTTENHAM_CLUB_ID = '4b296c0a-60e9-4f32-956f-ad3bd742ff0f'
export const TOTTENHAM_MANDATE_ID = '09420a64-b4d2-4245-8088-af0dc88266eb'
const marescaDecision = {
  coachApiId: 12629, status: 'not-pursuing', decidedBy: 'user', checkedAt: '2026-09-14',
  reason: 'Not pursuing for Tottenham: user-directed appointment decision following Manchester City’s confirmation of Maresca’s 29 June appointment on a three-year contract. This is not a claim that a transfer is impossible; a verified route would require a new review.',
  source: { title: 'Manchester City: Maresca coaching team confirmed', url: 'https://www.mancity.com/news/mens/coaching-team-enzo-maresca-confirmed-63919119/' },
} as const
export const APPOINTMENT_DECISIONS: readonly AppointmentDecision[] = [
  { ...marescaDecision, scope: { clubId: TOTTENHAM_CLUB_ID } },
  { ...marescaDecision, scope: { mandateId: TOTTENHAM_MANDATE_ID } },
]

/** No employment, budget or availability inference. Explicit mandate reviews override club policy.
 * A route is evidence for further diligence, never confirmation of attainability.
 */
export function appointmentFeasibility(
  coach: { apiId: number; name: string; aliases: readonly string[] },
  context: AppointmentContext,
  decisions: readonly AppointmentDecision[] = APPOINTMENT_DECISIONS,
): AppointmentFeasibility {
  const recordedIncumbent = context.incumbentName && [coach.name, ...coach.aliases].some(name => normalizeCoachName(name) === normalizeCoachName(context.incumbentName!))
  const studyIncumbent = coach.apiId === 2424 && (context.mandateId === TOTTENHAM_MANDATE_ID || context.clubId === TOTTENHAM_CLUB_ID)
  if (recordedIncumbent || studyIncumbent) return { status: 'incumbent', excluded: true, reason: 'Recorded manager / commissioned-study incumbent benchmark; excluded from successor matches.' }
  const applicable = decisions.filter(d => d.coachApiId === coach.apiId && (
    'mandateId' in d.scope ? d.scope.mandateId === context.mandateId : d.scope.clubId === context.clubId
  ) && d.reason.trim() && /^\d{4}-\d{2}-\d{2}$/.test(d.checkedAt) && /^https?:\/\//.test(d.source.url) && d.source.title.trim())
  const mandateDecisions = applicable.filter(d => 'mandateId' in d.scope)
  const scoped = mandateDecisions.length ? mandateDecisions : applicable
  // Conflicting reviews never silently reopen an explicitly excluded candidate.
  const decision = scoped.find(d => d.status === 'not-pursuing') ?? scoped[0]
  if (decision) return { status: decision.status, excluded: decision.status === 'not-pursuing', reason: decision.reason, decision }
  return { status: 'unknown', excluded: false, reason: 'Appointment feasibility unknown: willingness, terms and any release route still need verification.' }
}
