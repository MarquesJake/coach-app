export const FEASIBILITY_REVIEW_STATUSES = [
  'draft',
  'submitted',
  'in_review',
  'verified',
  'needs_update',
] as const

export const CIRCUMSTANCES_VISIBILITIES = [
  'coach_first_only',
  'clubs_on_request',
  'shareable',
] as const

export const STAFF_ESSENTIALITY = ['essential', 'preferred', 'optional'] as const
export const STAFF_FOLLOW_STATUSES = ['yes', 'no', 'unknown'] as const
export const STAFF_REVIEW_STATUSES = ['unreviewed', 'verified', 'disputed'] as const

export type FeasibilityReviewStatus = (typeof FEASIBILITY_REVIEW_STATUSES)[number]
export type CircumstancesVisibility = (typeof CIRCUMSTANCES_VISIBILITIES)[number]
export type StaffEssentiality = (typeof STAFF_ESSENTIALITY)[number]
export type StaffFollowStatus = (typeof STAFF_FOLLOW_STATUSES)[number]
export type StaffReviewStatus = (typeof STAFF_REVIEW_STATUSES)[number]

type AppointmentProfile = {
  current_salary?: string | null
  salary_expectation?: string | null
  contract_expiry?: string | null
  release_compensation?: string | null
  availability_timeline?: string | null
  family_situation?: string | null
  relocation_requirements?: string | null
  staff_cost_expectation?: string | null
  appointment_conditions?: string | null
}

type AppointmentStaff = {
  full_name?: string | null
  role_title?: string | null
  essentiality?: string | null
  likely_to_follow?: string | null
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export function calculateCareerCircumstancesReadiness(
  profile: AppointmentProfile | null,
  staff: AppointmentStaff[]
) {
  const checks = [
    { key: 'salary', complete: hasText(profile?.current_salary) && hasText(profile?.salary_expectation) },
    { key: 'contract', complete: hasText(profile?.contract_expiry) || hasText(profile?.release_compensation) },
    { key: 'availability', complete: hasText(profile?.availability_timeline) },
    { key: 'family', complete: hasText(profile?.family_situation) && hasText(profile?.relocation_requirements) },
    { key: 'conditions', complete: hasText(profile?.appointment_conditions) },
    {
      key: 'staff',
      complete: staff.length > 0 && staff.every((member) => hasText(member.full_name) && hasText(member.role_title)),
    },
  ]
  const completed = checks.filter((check) => check.complete).length
  return {
    percent: Math.round((completed / checks.length) * 100),
    completed,
    total: checks.length,
    missing: checks.filter((check) => !check.complete).map((check) => check.key),
  }
}

export function buildVerifiedCoachUpdate(profile: AppointmentProfile) {
  return {
    current_salary: profile.current_salary ?? null,
    wage_expectation: profile.salary_expectation ?? null,
    contract_expiry: profile.contract_expiry ?? null,
    compensation_expectation: profile.release_compensation ?? null,
    availability_timeline: profile.availability_timeline ?? null,
    family_context: profile.family_situation ?? null,
    relocation_flexibility: profile.relocation_requirements ?? null,
    staff_cost_estimate: profile.staff_cost_expectation ?? '',
    appointment_conditions: profile.appointment_conditions ?? null,
  }
}

export function canStaffMemberAppearInPack(input: {
  review_status: string
  confidentiality_status: string
}) {
  return input.review_status === 'verified'
    && ['clubs_on_request', 'shareable'].includes(input.confidentiality_status)
}
