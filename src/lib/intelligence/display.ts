import { ASSESSMENT_CRITERIA } from '@/lib/assessment/criteria'

const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Reviewed',
  rejected: 'Rejected',
  applied: 'Used in assessment',
}

const EVIDENCE_STRENGTH_LABELS: Record<string, string> = {
  single_source: 'Single source',
  corroborated: 'Corroborated',
  disputed: 'Disputed',
}

const FACT_CHECK_STATUS_LABELS: Record<string, string> = {
  not_applicable: 'Not applicable',
  unverified: 'Unverified fact',
  verified_fact: 'Verified fact',
  requires_legal: 'Legal review required',
}

const STATEMENT_TYPE_LABELS: Record<string, string> = {
  fact: 'Fact',
  opinion: 'Opinion',
  allegation: 'Allegation',
  analyst_inference: 'Analyst inference',
}

const EXTERNAL_VISIBILITY_LABELS: Record<string, string> = {
  internal_only: 'Internal only',
  anonymised_external: 'Anonymised external',
  attributed_external: 'Attribution approved',
}

const COACH_PORTAL_STATUS_LABELS: Record<string, string> = {
  not_invited: 'Not invited',
  invited: 'Invited',
  in_progress: 'In progress',
  submitted: 'Submitted for review',
  approved: 'Approved',
  changes_requested: 'Changes requested',
}

const COACH_PORTAL_VISIBILITY_LABELS: Record<string, string> = {
  private: 'Private',
  coach_first_only: 'Coach First only',
  clubs_on_request: 'Available to clubs on request',
  shareable: 'Approved for sharing',
}

const STAKEHOLDER_GROUP_LABELS: Record<string, string> = {
  owners_ceos: 'Owners / CEOs',
  sporting_leadership: 'Sporting leadership',
  coaching_staff: 'Coaching staff',
  players: 'Players',
  industry_network: 'Industry network',
  journalists: 'Journalists',
  agents: 'Agents',
  other: 'Other',
}

const CRITERION_LABELS = Object.fromEntries(
  ASSESSMENT_CRITERIA.map((criterion) => [criterion.key, criterion.label])
)

function fallbackLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatEnumLabel(value: string) {
  return fallbackLabel(value)
}

export function reviewStatusLabel(value: string) {
  return REVIEW_STATUS_LABELS[value] ?? fallbackLabel(value)
}

export function evidenceStrengthLabel(value: string) {
  return EVIDENCE_STRENGTH_LABELS[value] ?? fallbackLabel(value)
}

export function factCheckStatusLabel(value: string) {
  return FACT_CHECK_STATUS_LABELS[value] ?? fallbackLabel(value)
}

export function statementTypeLabel(value: string) {
  return STATEMENT_TYPE_LABELS[value] ?? fallbackLabel(value)
}

export function externalVisibilityLabel(value: string) {
  return EXTERNAL_VISIBILITY_LABELS[value] ?? fallbackLabel(value)
}

export function coachPortalStatusLabel(value: string) {
  return COACH_PORTAL_STATUS_LABELS[value] ?? fallbackLabel(value)
}

export function coachPortalVisibilityLabel(value: string) {
  return COACH_PORTAL_VISIBILITY_LABELS[value] ?? fallbackLabel(value)
}

export function stakeholderGroupLabel(value: string) {
  return STAKEHOLDER_GROUP_LABELS[value] ?? fallbackLabel(value)
}

export function criterionLabel(value: string) {
  return CRITERION_LABELS[value] ?? fallbackLabel(value)
}
