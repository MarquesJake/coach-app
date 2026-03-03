/** Key coach fields used to compute profile completeness (non-empty count / length * 100). */
export const COACH_COMPLETENESS_KEYS: string[] = [
  'name',
  'availability_status',
  'available_status',
  'market_status',
  'base_location',
  'overall_manual_score',
  'intelligence_confidence',
  'tactical_identity',
  'leadership_style',
  'preferred_systems',
  'staff_management_style',
  'preferred_name',
  'date_of_birth',
  'agent_name',
  'due_diligence_summary',
]

export function computeCompleteness(coach: Record<string, unknown>): number {
  let filled = 0
  for (const key of COACH_COMPLETENESS_KEYS) {
    const v = coach[key]
    if (v == null) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'number' && !Number.isNaN(v)) {
      filled++
      continue
    }
    filled++
  }
  return Math.round((filled / COACH_COMPLETENESS_KEYS.length) * 100)
}

/** Coach completeness system: 0–100 from tactical, leadership, risk, stint, intelligence, scoring. */
export function computeCoachCompleteness(
  coach: Record<string, unknown>,
  opts?: { stintCount?: number; intelligenceCount?: number }
): number {
  const tactical =
    Boolean((coach.preferred_style as string)?.trim()) ||
    Boolean((coach.build_preference as string)?.trim()) ||
    Boolean((coach.pressing_intensity as string)?.trim()) ||
    Boolean((coach.tactical_identity as string)?.trim())
  const leadership =
    Boolean((coach.leadership_style as string)?.trim()) ||
    Boolean((coach.staff_management_style as string)?.trim())
  const risk =
    (coach.media_risk as number | null) != null ||
    (coach.cultural_risk as number | null) != null ||
    Boolean((coach.due_diligence_summary as string)?.trim())
  const stint = (opts?.stintCount ?? 0) >= 1
  const intelligence = (opts?.intelligenceCount ?? 0) >= 1
  const scoring = (coach.overall_manual_score as number | null) != null
  const total = [tactical, leadership, risk, stint, intelligence, scoring].filter(Boolean).length
  return Math.round((total / 6) * 100)
}
