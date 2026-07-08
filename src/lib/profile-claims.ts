import type { Database } from '@/lib/types/db'

export const PROFILE_CLAIM_TYPES = [
  'availability',
  'contract',
  'compensation',
  'agent',
  'family_relocation',
  'staff',
  'football_model',
  'leadership',
  'media_reputation',
  'risk',
  'other',
] as const

export const PROFILE_CLAIM_LABELS: Record<(typeof PROFILE_CLAIM_TYPES)[number], string> = {
  availability: 'Availability',
  contract: 'Contract',
  compensation: 'Compensation',
  agent: 'Agent',
  family_relocation: 'Family / relocation',
  staff: 'Staff likely to follow',
  football_model: 'Football model',
  leadership: 'Leadership',
  media_reputation: 'Media / reputation',
  risk: 'Risk',
  other: 'Other',
}

export const CLAIM_PROFILE_FIELDS = [
  'availability_status',
  'market_status',
  'compensation_expectation',
  'wage_expectation',
  'contract_expiry',
  'release_clause',
  'contract_notes',
  'staff_cost_estimate',
  'agent_name',
  'agent_contact',
  'family_context',
  'relocation_flexibility',
  'tactical_identity',
  'training_methodology',
  'player_development_model',
  'staff_management_style',
  'comms_profile',
  'media_style',
  'due_diligence_summary',
  'compliance_notes',
] as const

export const CLAIM_PROFILE_FIELD_LABELS: Record<(typeof CLAIM_PROFILE_FIELDS)[number], string> = {
  availability_status: 'Availability status',
  market_status: 'Market status',
  compensation_expectation: 'Compensation expectation',
  wage_expectation: 'Wage expectation',
  contract_expiry: 'Contract expiry',
  release_clause: 'Release / compensation clause',
  contract_notes: 'Contract context notes',
  staff_cost_estimate: 'Staff cost estimate',
  agent_name: 'Agent name',
  agent_contact: 'Agent contact',
  family_context: 'Family context',
  relocation_flexibility: 'Relocation flexibility',
  tactical_identity: 'Tactical identity',
  training_methodology: 'Training methodology',
  player_development_model: 'Player development model',
  staff_management_style: 'Staff management style',
  comms_profile: 'Communication profile',
  media_style: 'Media style',
  due_diligence_summary: 'Due-diligence summary',
  compliance_notes: 'Compliance notes',
}

export const CLAIM_REVIEW_STATUSES = ['pending', 'accepted', 'rejected', 'applied'] as const
export const CLAIM_VERIFICATION_STATUSES = ['unverified', 'verified', 'disputed'] as const
export const CLAIM_SENSITIVITIES = ['low', 'standard', 'high', 'confidential'] as const

export type ProfileClaimRow = Database['public']['Tables']['profile_claims']['Row']
export type ClaimProfileField = (typeof CLAIM_PROFILE_FIELDS)[number]

export function isClaimProfileField(value: string | null | undefined): value is ClaimProfileField {
  return CLAIM_PROFILE_FIELDS.includes(value as ClaimProfileField)
}

export function claimTypeLabel(value: string | null | undefined) {
  if (!value) return 'Claim'
  return PROFILE_CLAIM_LABELS[value as (typeof PROFILE_CLAIM_TYPES)[number]] ?? value
}

export function claimFieldLabel(value: string | null | undefined) {
  if (!value) return 'Profile note'
  return CLAIM_PROFILE_FIELD_LABELS[value as ClaimProfileField] ?? value
}
