export const APPOINTMENT_OUTCOME_STATUSES = [
  'pending',
  'appointed',
  'not_appointed',
  'ended',
] as const

export type AppointmentOutcomeStatus = (typeof APPOINTMENT_OUTCOME_STATUSES)[number]

export const APPOINTMENT_OUTCOME_STATUS_LABELS: Record<AppointmentOutcomeStatus, string> = {
  pending: 'Club decision pending',
  appointed: 'Appointment made',
  not_appointed: 'Search closed without appointment',
  ended: 'Appointment ended',
}

export type RecommendationRecord = {
  coach_id: string
  verdict: string | null
  confidence: number | null
}

export type AppointmentOutcomeInput = {
  status: string
  appointedCoachId: string | null
  appointmentDate: string | null
  nextReviewDate: string | null
  decisionNote: string
  shortlistedCoachIds: string[]
}

function isIsoDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

export function isAppointmentOutcomeStatus(value: string): value is AppointmentOutcomeStatus {
  return APPOINTMENT_OUTCOME_STATUSES.includes(value as AppointmentOutcomeStatus)
}

export function selectLeadRecommendation<T extends RecommendationRecord>(
  recommendations: T[]
): T | null {
  const verdictRank: Record<string, number> = {
    Proceed: 0,
    Target: 1,
    Shortlist: 2,
    Monitor: 3,
    Dismiss: 4,
  }
  const ranked = [...recommendations].sort((a, b) => {
    const verdictDelta = (verdictRank[a.verdict ?? ''] ?? 5) - (verdictRank[b.verdict ?? ''] ?? 5)
    return verdictDelta || (b.confidence ?? 0) - (a.confidence ?? 0)
  })

  return ranked.find((recommendation) => recommendation.verdict !== 'Dismiss') ?? ranked[0] ?? null
}

export function validateAppointmentOutcomeInput(input: AppointmentOutcomeInput): string | null {
  if (!isAppointmentOutcomeStatus(input.status)) return 'Choose a valid decision status.'
  if (input.decisionNote.trim().length < 10) return 'Add a concise board decision note.'
  if (!isIsoDate(input.nextReviewDate)) {
    return 'Schedule the next outcome review.'
  }

  const appointmentRecorded = input.status === 'appointed' || input.status === 'ended'
  if (appointmentRecorded && !input.appointedCoachId) return 'Choose the coach who was appointed.'
  if (appointmentRecorded && !isIsoDate(input.appointmentDate)) {
    return 'Record the appointment date.'
  }
  if (!appointmentRecorded && (input.appointedCoachId || input.appointmentDate)) {
    return 'Only record an appointed coach and date when an appointment was made.'
  }
  if (input.appointedCoachId && !input.shortlistedCoachIds.includes(input.appointedCoachId)) {
    return 'The appointed coach must belong to this mandate decision set.'
  }
  if (input.appointmentDate && input.nextReviewDate < input.appointmentDate) {
    return 'The outcome review cannot be before the appointment date.'
  }

  return null
}

export function outcomeDecisionNote(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null
  const note = (snapshot as Record<string, unknown>).decision_note
  return typeof note === 'string' && note.trim() ? note.trim() : null
}
