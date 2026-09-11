export const PROFILE_READINESS_FIELDS = [
  'short_bio',
  'personal_statement',
  'football_identity',
  'in_possession_model',
  'out_of_possession_model',
  'training_week',
  'session_design_principles',
  'player_development_proof',
  'staff_network',
  'reference_permissions',
] as const

// Measures profile depth only; sensitive circumstances and approval are separate.
export function calculateProfileReadiness(
  profile: Partial<Record<typeof PROFILE_READINESS_FIELDS[number], unknown>> | null,
  materialCount: number,
) {
  const completed = PROFILE_READINESS_FIELDS.filter((field) => {
    const value = profile?.[field]
    return typeof value === 'string' && value.trim().length > 0
  }).length
  const materialDepth = Number.isFinite(materialCount)
    ? Math.min(2, Math.max(0, Math.floor(materialCount)))
    : 0
  return Math.round(((completed + materialDepth) / (PROFILE_READINESS_FIELDS.length + 2)) * 100)
}
