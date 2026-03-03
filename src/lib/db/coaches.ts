import { db } from './client'
import type { Database } from '@/lib/types/db'

// TODO: Future: migrate filtering from user_id to org_id for multi-tenant support.

type CoachRow = Database['public']['Tables']['coaches']['Row']
type CoachInsert = Database['public']['Tables']['coaches']['Insert']
type CoachUpdate = Database['public']['Tables']['coaches']['Update']

export type { CoachRow, CoachInsert, CoachUpdate }

export async function getCoachesForUser(userId: string) {
  const supabase = db()
  return supabase
    .from('coaches')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
}

export async function getCoachById(userId: string, coachId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', coachId)
    .eq('user_id', userId)
    .single()
  return { data: data as CoachRow | null, error }
}

export async function getCoachesByIds(userId: string, ids: string[]) {
  if (ids.length === 0) return { data: [] as CoachRow[], error: null }
  const supabase = db()
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .eq('user_id', userId)
    .in('id', ids)
  const ordered = (data ?? []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
  return { data: ordered as CoachRow[], error }
}

function str(v: unknown): string | null {
  if (v == null || typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x).trim()).filter(Boolean)
}

function scoreNum(v: unknown): number | null {
  if (v === '' || v == null) return null
  const n = Number(v)
  if (Number.isNaN(n)) return null
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** Full create: sanitize payload (trim, empty->null, arrays clean, scores 0–100). No placeholders. */
export async function createCoachFull(
  userId: string,
  payload: Record<string, unknown>
): Promise<{ data: { id: string } | null; error: Error | null }> {
  const supabase = db()
  const now = new Date().toISOString()
  const name = str(payload.name)
  if (!name) return { data: null, error: new Error('Name is required') }

  const row: CoachInsert = {
    name,
    last_updated: now,
    role_current: str(payload.role_current) ?? '',
    club_current: str(payload.club_current) ?? null,
    preferred_style: str(payload.preferred_style) ?? '',
    pressing_intensity: str(payload.pressing_intensity) ?? '',
    build_preference: str(payload.build_preference) ?? '',
    leadership_style: str(payload.leadership_style) ?? '',
    wage_expectation: str(payload.wage_expectation) ?? '',
    staff_cost_estimate: str(payload.staff_cost_estimate) ?? '',
    available_status: str(payload.availability_status) ?? str(payload.available_status) ?? 'Available',
    reputation_tier: str(payload.reputation_tier) ?? 'Established',
    legal_risk_flag: payload.legal_risk_flag === true || payload.legal_risk_flag === 'on',
    integrity_risk_flag: payload.integrity_risk_flag === true || payload.integrity_risk_flag === 'on',
    safeguarding_risk_flag: payload.safeguarding_risk_flag === true || payload.safeguarding_risk_flag === 'on',
    preferred_name: str(payload.preferred_name) ?? null,
    nationality: str(payload.nationality) ?? null,
    date_of_birth: str(payload.date_of_birth) ?? null,
    languages: strArray(payload.languages).length ? strArray(payload.languages) : [],
    base_location: str(payload.base_location) ?? null,
    relocation_flexibility: str(payload.relocation_flexibility) ?? null,
    family_context: str(payload.family_context) ?? null,
    agent_name: str(payload.agent_name) ?? null,
    agent_contact: str(payload.agent_contact) ?? null,
    compensation_expectation: str(payload.compensation_expectation) ?? null,
    availability_status: str(payload.availability_status) ?? null,
    market_status: str(payload.market_status) ?? null,
    tactical_identity: str(payload.tactical_identity) ?? null,
    preferred_systems: strArray(payload.preferred_systems).length ? strArray(payload.preferred_systems) : [],
    transition_model: str(payload.transition_model) ?? null,
    rest_defence_model: str(payload.rest_defence_model) ?? null,
    set_piece_approach: str(payload.set_piece_approach) ?? null,
    training_methodology: str(payload.training_methodology) ?? null,
    recruitment_collaboration: str(payload.recruitment_collaboration) ?? null,
    staff_management_style: str(payload.staff_management_style) ?? null,
    player_development_model: str(payload.player_development_model) ?? null,
    academy_integration: str(payload.academy_integration) ?? null,
    comms_profile: str(payload.comms_profile) ?? null,
    media_style: str(payload.media_style) ?? null,
    conflict_history: str(payload.conflict_history) ?? null,
    due_diligence_summary: str(payload.due_diligence_summary) ?? null,
    compliance_notes: str(payload.compliance_notes) ?? null,
    tactical_fit_score: scoreNum(payload.tactical_fit_score),
    leadership_score: scoreNum(payload.leadership_score),
    recruitment_fit_score: scoreNum(payload.recruitment_fit_score),
    media_risk_score: scoreNum(payload.media_risk_score),
    overall_manual_score: scoreNum(payload.overall_manual_score),
    intelligence_confidence: scoreNum(payload.intelligence_confidence),
  } as CoachInsert
  const { data, error } = await supabase.from('coaches').insert({ ...row, user_id: userId }).select('id').single()
  return { data: data as { id: string } | null, error: error ? new Error(error.message) : null }
}

export async function createCoach(userId: string, input: Partial<CoachInsert> & { name: string }) {
  const supabase = db()
  const now = new Date().toISOString()
  const row: CoachInsert = {
    ...input,
    name: input.name.trim(),
    role_current: input.role_current?.trim() || 'Unemployed',
    club_current: input.club_current?.trim() || null,
    preferred_style: input.preferred_style?.trim() || '',
    pressing_intensity: input.pressing_intensity?.trim() || '',
    build_preference: input.build_preference?.trim() || '',
    leadership_style: input.leadership_style?.trim() || '',
    wage_expectation: input.wage_expectation?.trim() || '',
    staff_cost_estimate: input.staff_cost_estimate?.trim() || '',
    available_status: input.available_status?.trim() || 'Available',
    reputation_tier: input.reputation_tier?.trim() || 'Established',
    last_updated: now,
    legal_risk_flag: input.legal_risk_flag ?? false,
    integrity_risk_flag: input.integrity_risk_flag ?? false,
    safeguarding_risk_flag: input.safeguarding_risk_flag ?? false,
    languages: Array.isArray(input.languages) ? input.languages : [],
    preferred_systems: Array.isArray(input.preferred_systems) ? input.preferred_systems : [],
  } as CoachInsert
  return supabase.from('coaches').insert({ ...row, user_id: userId }).select('id').single()
}

export async function updateCoach(userId: string, coachId: string, input: CoachUpdate) {
  const supabase = db()
  return supabase.from('coaches').update(input).eq('id', coachId).eq('user_id', userId).select().single()
}
