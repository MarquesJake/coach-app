'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById, getCoachesForUser, updateCoach } from '@/lib/db/coaches'
import { computeSimilarity } from '@/lib/similarity'
import { logActivity } from '@/lib/db/activity'
import { createAlert } from '@/lib/db/alerts'
import { parseSourceConfidenceFromFormData } from '@/lib/source-confidence'
import { getMandateFitFields } from '@/lib/db/mandate'
import type { Database } from '@/lib/types/db'

type CoachUpdate = Database['public']['Tables']['coaches']['Update']

const COACH_UPDATE_WHITELIST: Set<string> = new Set([
  'preferred_name', 'date_of_birth', 'languages', 'base_location', 'relocation_flexibility', 'family_context',
  'agent_name', 'agent_contact', 'compensation_expectation', 'availability_status', 'market_status',
  'tactical_identity', 'preferred_systems', 'transition_model', 'rest_defence_model', 'set_piece_approach', 'training_methodology',
  'pressing_intensity', 'build_preference', 'recruitment_collaboration', 'staff_management_style', 'player_development_model',
  'academy_integration', 'comms_profile', 'media_style', 'conflict_history', 'leadership_style',
  'due_diligence_summary', 'legal_risk_flag', 'integrity_risk_flag', 'safeguarding_risk_flag', 'compliance_notes',
  'tactical_fit_score', 'leadership_score', 'development_score', 'recruitment_fit_score', 'media_risk_score',
  'cultural_alignment_score', 'adaptability_score', 'overall_manual_score', 'intelligence_confidence',
  'board_compatibility', 'ownership_fit', 'cultural_risk', 'agent_relationship', 'financial_feasibility',
  'age', 'name', 'nationality', 'club_current', 'role_current', 'available_status', 'reputation_tier',
  'preferred_style', 'wage_expectation', 'staff_cost_estimate', 'tactical_fit', 'media_risk', 'overall_fit', 'placement_score',
  'league_experience', 'last_updated',
])

const SCORE_KEYS_0_100: Set<string> = new Set([
  'tactical_fit_score', 'leadership_score', 'development_score', 'recruitment_fit_score', 'media_risk_score',
  'cultural_alignment_score', 'adaptability_score', 'overall_manual_score', 'intelligence_confidence',
  'board_compatibility', 'ownership_fit', 'cultural_risk', 'agent_relationship', 'financial_feasibility',
  'tactical_fit', 'media_risk', 'overall_fit', 'placement_score',
])

type CoachStintInsert = Database['public']['Tables']['coach_stints']['Insert']
type CoachStintUpdate = Database['public']['Tables']['coach_stints']['Update']
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoachDataProfileInsert = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoachDataProfileUpdate = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoachRecruitmentInsert = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoachRecruitmentUpdate = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoachMediaInsert = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoachMediaUpdate = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoachDueDiligenceInsert = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoachDueDiligenceUpdate = any
type CoachStaffHistoryInsert = Database['public']['Tables']['coach_staff_history']['Insert']
type CoachStaffHistoryUpdate = Database['public']['Tables']['coach_staff_history']['Update']

async function assertCoachOwnership(coachId: string): Promise<string> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: coach } = await getCoachById(user.id, coachId)
  if (!coach) redirect('/coaches')
  return user.id
}

/** Fetch mandate fit fields for the current user (for mandate-fit page). */
export async function getMandateFitAction(mandateId: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data, error } = await getMandateFitFields(user.id, mandateId)
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

function toNum(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function toDateStr(v: unknown): string | null {
  const s = toStr(v)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function toBool(v: unknown): boolean {
  if (v === true || v === 'true' || v === 'on' || v === '1') return true
  return false
}

function toStrArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  const s = v != null ? String(v).trim() : ''
  if (!s) return []
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}

function sanitizeCoachPayload(payload: Record<string, unknown>): CoachUpdate {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(payload)) {
    if (!COACH_UPDATE_WHITELIST.has(key)) continue
    const raw = payload[key]
    if (raw === undefined) continue
    if (key === 'last_updated') {
      out[key] = new Date().toISOString()
      continue
    }
    if (key === 'languages' || key === 'preferred_systems' || key === 'league_experience') {
      out[key] = toStrArray(raw)
      continue
    }
    if (key === 'legal_risk_flag' || key === 'integrity_risk_flag' || key === 'safeguarding_risk_flag') {
      out[key] = toBool(raw)
      continue
    }
    if (SCORE_KEYS_0_100.has(key)) {
      const n = toNum(raw)
      out[key] = n == null ? null : Math.min(100, Math.max(0, n))
      continue
    }
    if (key === 'age') {
      const n = toNum(raw)
      out[key] = n
      continue
    }
    if (typeof raw === 'string') {
      const t = raw.trim()
      out[key] = t === '' ? null : t
    } else if (typeof raw === 'number' && !Number.isNaN(raw)) {
      out[key] = raw
    } else if (typeof raw === 'boolean') {
      out[key] = raw
    } else if (raw === null) {
      out[key] = null
    }
  }
  out.last_updated = new Date().toISOString()
  return out as CoachUpdate
}

const RISK_FLAG_KEYS = ['legal_risk_flag', 'integrity_risk_flag', 'safeguarding_risk_flag'] as const

/** Update coach core fields (ownership checked). Only whitelisted columns; values sanitized. */
export async function updateCoachCoreAction(coachId: string, payload: Record<string, unknown>): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await assertCoachOwnership(coachId)
    const { data: beforeCoach } = await getCoachById(userId, coachId)
    const update = sanitizeCoachPayload(payload)
    const { error } = await updateCoach(userId, coachId, update)
    if (error) return { ok: false, error: error.message }

    const beforeData = beforeCoach ? (Object.keys(update) as string[]).reduce<Record<string, unknown>>((acc, k) => {
      if (beforeCoach[k as keyof typeof beforeCoach] !== undefined) acc[k] = beforeCoach[k as keyof typeof beforeCoach]
      return acc
    }, {}) : undefined
    await logActivity({
      entityType: 'coach',
      entityId: coachId,
      actionType: 'coach_updated',
      description: 'Coach updated',
      beforeData: beforeData ?? undefined,
      afterData: update as Record<string, unknown>,
    })

    const riskChanged = RISK_FLAG_KEYS.some((key) => key in update && (beforeCoach as Record<string, unknown>)?.[key] !== update[key])
    if (riskChanged) {
      await logActivity({
        entityType: 'coach',
        entityId: coachId,
        actionType: 'risk_flag_changed',
        description: 'Risk flag changed',
        beforeData: beforeCoach ? RISK_FLAG_KEYS.reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = (beforeCoach as Record<string, unknown>)[k]
          return acc
        }, {}) : undefined,
        afterData: RISK_FLAG_KEYS.reduce<Record<string, unknown>>((acc, k) => {
          if (k in update) acc[k] = update[k]
          return acc
        }, {}),
      })
    }

    const marketKeys = ['market_status', 'availability_status'] as const
    const marketChanged = marketKeys.some((key) => key in update && (beforeCoach as Record<string, unknown>)?.[key] !== update[key])

    const supabase = createServerSupabaseClient()
    // @ts-ignore - watchlist_coaches table not yet in DB schema
    const { data: onWatchlist } = await supabase.from('watchlist_coaches').select('coach_id').eq('user_id', userId).eq('coach_id', coachId).maybeSingle()

    if (onWatchlist) {
      if (riskChanged) {
        const parts = RISK_FLAG_KEYS.filter((k) => k in update).map((k) => `${k}: ${(update[k] as boolean) ? 'Yes' : 'No'}`)
        await createAlert({
          userId,
          entityType: 'coach',
          entityId: coachId,
          alertType: 'risk_changed',
          title: 'Risk flag updated',
          detail: parts.length ? parts.join('; ') : 'Risk flags changed',
        })
      }
      if (marketChanged) {
        const before = beforeCoach as Record<string, unknown>
        const parts: string[] = []
        if ('market_status' in update) parts.push(`Market: ${String(before?.market_status ?? '—')} → ${String(update.market_status ?? '—')}`)
        if ('availability_status' in update) parts.push(`Availability: ${String(before?.availability_status ?? '—')} → ${String(update.availability_status ?? '—')}`)
        await createAlert({
          userId,
          entityType: 'coach',
          entityId: coachId,
          alertType: 'market_changed',
          title: 'Market status updated',
          detail: parts.join('. ') || 'Availability or market status changed',
        })
      }
    }

    revalidatePath(`/coaches/${coachId}`)
    revalidatePath('/coaches')
    revalidatePath(`/coaches/${coachId}/tactical`)
    revalidatePath(`/coaches/${coachId}/leadership`)
    revalidatePath(`/coaches/${coachId}/risk`)
    revalidatePath(`/coaches/${coachId}/scoring`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return { ok: false, error: message }
  }
}

/** Compute similarity for a coach against all other user coaches and write to coach_similarity. */
export async function refreshSimilarityForCoachAction(coachId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const userId = await assertCoachOwnership(coachId)
    const { data: mainCoach, error: mainErr } = await getCoachById(userId, coachId)
    if (mainErr || !mainCoach) return { ok: false, error: 'Coach not found' }

    const { data: allCoaches } = await getCoachesForUser(userId)
    const others = (allCoaches ?? []).filter((c) => c.id !== coachId)
    if (others.length === 0) {
      revalidatePath(`/coaches/${coachId}/similar`)
      revalidatePath('/coaches/compare')
      return { ok: true }
    }

    const supabase = createServerSupabaseClient()
    const main = mainCoach as Record<string, unknown>
    for (const other of others) {
      const { score, breakdown } = computeSimilarity(main, other as Record<string, unknown>)
      const a = coachId < other.id ? coachId : other.id
      const b = coachId < other.id ? other.id : coachId
      // @ts-ignore - coach_similarity table not yet in DB schema
      await supabase.from('coach_similarity').upsert({ coach_a_id: a, coach_b_id: b, similarity_score: score, breakdown: breakdown as unknown, computed_at: new Date().toISOString() }, { onConflict: 'coach_a_id,coach_b_id' })
    }
    revalidatePath(`/coaches/${coachId}/similar`)
    revalidatePath('/coaches/compare')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to compute similarity' }
  }
}

/** Upsert a coach stint (create or update). */
export async function upsertStintAction(coachId: string, formData: FormData) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const id = toStr(formData.get('id'))
  const clubName = toStr(formData.get('club_name')) ?? ''
  const roleTitle = toStr(formData.get('role_title')) ?? ''
  const startedOn = toDateStr(formData.get('started_on'))
  const endedOn = toDateStr(formData.get('ended_on'))
  const appointmentContext = toStr(formData.get('appointment_context'))
  const exitContext = toStr(formData.get('exit_context'))
  const pointsPerGame = toNum(formData.get('points_per_game'))
  const winRate = toNum(formData.get('win_rate'))
  const notableOutcomes = toStr(formData.get('notable_outcomes'))
  const sc = parseSourceConfidenceFromFormData(formData)

  if (id) {
    const update: CoachStintUpdate = {
      club_name: clubName,
      role_title: roleTitle,
      started_on: startedOn,
      ended_on: endedOn,
      appointment_context: appointmentContext,
      exit_context: exitContext,
      points_per_game: pointsPerGame,
      win_rate: winRate,
      notable_outcomes: notableOutcomes,
    }
    const { error } = await supabase.from('coach_stints').update(update).eq('id', id).eq('coach_id', coachId)
    if (error) return { error: error.message }
  } else {
    const insert: CoachStintInsert = {
      coach_id: coachId,
      club_name: clubName,
      role_title: roleTitle,
      started_on: startedOn,
      ended_on: endedOn,
      appointment_context: appointmentContext,
      exit_context: exitContext,
      points_per_game: pointsPerGame,
      win_rate: winRate,
      notable_outcomes: notableOutcomes,
    }
    const { error } = await supabase.from('coach_stints').insert(insert)
    if (error) return { error: error.message }
  }
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/career`)
  return { error: null }
}

/** Delete a coach stint. */
export async function deleteStintAction(coachId: string, stintId: string) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from('coach_stints').delete().eq('id', stintId).eq('coach_id', coachId)
  if (error) return { error: error.message }
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/career`)
  return { error: null }
}

/** Upsert coach data profile (one per coach). */
export async function upsertDataProfileAction(coachId: string, formData: FormData) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const clamp = (n: number | null, lo: number, hi: number) =>
    n == null ? null : Math.min(hi, Math.max(lo, n))

  const profileId = toStr(formData.get('profile_id'))
  const avgSquadAge = toNum(formData.get('avg_squad_age'))
  const avgStartingXiAge = toNum(formData.get('avg_starting_xi_age'))
  const minutesU21 = toNum(formData.get('minutes_u21'))
  const minutes21_24 = toNum(formData.get('minutes_21_24'))
  const minutes25_28 = toNum(formData.get('minutes_25_28'))
  const minutes29Plus = toNum(formData.get('minutes_29_plus'))
  const recruitmentAvgAge = toNum(formData.get('recruitment_avg_age'))
  const recruitmentRepeatPlayerCount = toNum(formData.get('recruitment_repeat_player_count'))
  const recruitmentRepeatAgentCount = toNum(formData.get('recruitment_repeat_agent_count'))
  const mediaPressureScore = clamp(toNum(formData.get('media_pressure_score')), 0, 100)
  const mediaAccountabilityScore = clamp(toNum(formData.get('media_accountability_score')), 0, 100)
  const mediaConfrontationScore = clamp(toNum(formData.get('media_confrontation_score')), 0, 100)
  const socialPresenceLevel = toStr(formData.get('social_presence_level'))
  const narrativeRiskSummary = toStr(formData.get('narrative_risk_summary'))
  const confidenceScore = clamp(toNum(formData.get('confidence_score')), 0, 100)

  if (profileId) {
    const update: CoachDataProfileUpdate = {
      avg_squad_age: avgSquadAge,
      avg_starting_xi_age: avgStartingXiAge,
      minutes_u21: minutesU21,
      minutes_21_24: minutes21_24,
      minutes_25_28: minutes25_28,
      minutes_29_plus: minutes29Plus,
      recruitment_avg_age: recruitmentAvgAge,
      recruitment_repeat_player_count: recruitmentRepeatPlayerCount,
      recruitment_repeat_agent_count: recruitmentRepeatAgentCount,
      media_pressure_score: mediaPressureScore,
      media_accountability_score: mediaAccountabilityScore,
      media_confrontation_score: mediaConfrontationScore,
      social_presence_level: socialPresenceLevel,
      narrative_risk_summary: narrativeRiskSummary,
      confidence_score: confidenceScore,
    }
    // @ts-ignore - coach_data_profiles table not yet in DB schema
    const { error } = await supabase.from('coach_data_profiles').update(update).eq('id', profileId).eq('coach_id', coachId)
    if (error) return { error: error.message }
  } else {
    const insert: CoachDataProfileInsert = {
      coach_id: coachId,
      avg_squad_age: avgSquadAge,
      avg_starting_xi_age: avgStartingXiAge,
      minutes_u21: minutesU21,
      minutes_21_24: minutes21_24,
      minutes_25_28: minutes25_28,
      minutes_29_plus: minutes29Plus,
      recruitment_avg_age: recruitmentAvgAge,
      recruitment_repeat_player_count: recruitmentRepeatPlayerCount,
      recruitment_repeat_agent_count: recruitmentRepeatAgentCount,
      media_pressure_score: mediaPressureScore,
      media_accountability_score: mediaAccountabilityScore,
      media_confrontation_score: mediaConfrontationScore,
      social_presence_level: socialPresenceLevel,
      narrative_risk_summary: narrativeRiskSummary,
      confidence_score: confidenceScore,
    }
    // @ts-ignore - coach_data_profiles table not yet in DB schema
    const { error } = await supabase.from('coach_data_profiles').insert(insert)
    if (error) return { error: error.message }
  }
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/data`)
  return { error: null }
}

/** Create or update a recruitment history row. */
export async function upsertRecruitmentAction(coachId: string, formData: FormData) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const id = toStr(formData.get('id'))
  const playerName = toStr(formData.get('player_name'))
  const clubName = toStr(formData.get('club_name'))
  const transferWindow = toStr(formData.get('transfer_window'))
  const transferFeeBand = toStr(formData.get('transfer_fee_band'))
  const playerAgeAtSigning = toNum(formData.get('player_age_at_signing'))
  const repeatedSigning = formData.get('repeated_signing') === 'true' || formData.get('repeated_signing') === 'on'
  const agentName = toStr(formData.get('agent_name'))
  const impactSummary = toStr(formData.get('impact_summary'))
  const sc = parseSourceConfidenceFromFormData(formData)

  if (id) {
    const update: CoachRecruitmentUpdate = {
      player_name: playerName,
      club_name: clubName,
      transfer_window: transferWindow,
      transfer_fee_band: transferFeeBand,
      player_age_at_signing: playerAgeAtSigning,
      repeated_signing: repeatedSigning,
      agent_name: agentName,
      impact_summary: impactSummary,
      source_type: sc.source_type,
      source_name: sc.source_name,
      source_link: sc.source_link,
      source_notes: sc.source_notes,
      confidence: sc.confidence,
      verified: sc.verified,
      verified_at: sc.verified_at,
      verified_by: sc.verified_by,
    }
    // @ts-ignore - coach_recruitment_history table not yet in DB schema
    const { error } = await supabase.from('coach_recruitment_history').update(update).eq('id', id).eq('coach_id', coachId)
    if (error) return { error: error.message }
  } else {
    const insert: CoachRecruitmentInsert = {
      coach_id: coachId,
      player_name: playerName,
      club_name: clubName,
      transfer_window: transferWindow,
      transfer_fee_band: transferFeeBand,
      player_age_at_signing: playerAgeAtSigning,
      repeated_signing: repeatedSigning,
      agent_name: agentName,
      impact_summary: impactSummary,
      source_type: sc.source_type,
      source_name: sc.source_name,
      source_link: sc.source_link,
      source_notes: sc.source_notes,
      confidence: sc.confidence,
      verified: sc.verified,
      verified_at: sc.verified_at,
      verified_by: sc.verified_by,
    }
    // @ts-ignore - coach_recruitment_history table not yet in DB schema
    const { error } = await supabase.from('coach_recruitment_history').insert(insert)
    if (error) return { error: error.message }
  }
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/data`)
  return { error: null }
}

/** Delete a recruitment history row. */
export async function deleteRecruitmentAction(coachId: string, recruitmentId: string) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  // @ts-ignore - coach_recruitment_history table not yet in DB schema
  const { error } = await supabase.from('coach_recruitment_history').delete().eq('id', recruitmentId).eq('coach_id', coachId)
  if (error) return { error: error.message }
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/data`)
  return { error: null }
}

/** Create or update a media event. */
export async function upsertMediaEventAction(coachId: string, formData: FormData) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const clamp = (n: number | null, lo: number, hi: number) =>
    n == null ? null : Math.min(hi, Math.max(lo, n))
  const id = toStr(formData.get('id'))
  const category = toStr(formData.get('category'))
  const headline = toStr(formData.get('headline'))
  const summary = toStr(formData.get('summary'))
  const severityScore = clamp(toNum(formData.get('severity_score')), 0, 100)
  const occurredAt = toStr(formData.get('occurred_at'))
  const source = toStr(formData.get('source'))
  const confidence = clamp(toNum(formData.get('confidence')), 0, 100)
  const sc = parseSourceConfidenceFromFormData(formData)

  const occurredAtIso = occurredAt ? new Date(occurredAt).toISOString() : null
  if (occurredAt && Number.isNaN(new Date(occurredAt).getTime())) {
    return { error: 'Invalid date' }
  }

  if (id) {
    const update: CoachMediaUpdate = {
      category,
      headline,
      summary,
      severity_score: severityScore,
      occurred_at: occurredAtIso,
      source,
      confidence,
      source_type: sc.source_type,
      source_name: sc.source_name,
      source_link: sc.source_link,
      source_notes: sc.source_notes,
      verified: sc.verified,
      verified_at: sc.verified_at,
      verified_by: sc.verified_by,
    }
    // @ts-ignore - coach_media_events table not yet in DB schema
    const { error } = await supabase.from('coach_media_events').update(update).eq('id', id).eq('coach_id', coachId)
    if (error) return { error: error.message }
  } else {
    const insert: CoachMediaInsert = {
      coach_id: coachId,
      category,
      headline,
      summary,
      severity_score: severityScore,
      occurred_at: occurredAtIso,
      source,
      confidence,
      source_type: sc.source_type,
      source_name: sc.source_name,
      source_link: sc.source_link,
      source_notes: sc.source_notes,
      verified: sc.verified,
      verified_at: sc.verified_at,
      verified_by: sc.verified_by,
    }
    // @ts-ignore - coach_media_events table not yet in DB schema
    const { error } = await supabase.from('coach_media_events').insert(insert)
    if (error) return { error: error.message }
  }
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/data`)
  return { error: null }
}

/** Delete a media event. */
export async function deleteMediaEventAction(coachId: string, eventId: string) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  // @ts-ignore - coach_media_events table not yet in DB schema
  const { error } = await supabase.from('coach_media_events').delete().eq('id', eventId).eq('coach_id', coachId)
  if (error) return { error: error.message }
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/data`)
  return { error: null }
}

/** Create or update a due diligence item. */
export async function upsertDueDiligenceItemAction(coachId: string, formData: FormData) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const id = toStr(formData.get('id'))
  const title = toStr(formData.get('title')) ?? ''
  const detail = toStr(formData.get('detail'))
  const sc = parseSourceConfidenceFromFormData(formData)

  if (!title) return { error: 'Title is required' }

  if (id) {
    const update: CoachDueDiligenceUpdate = {
      title,
      detail,
      source_type: sc.source_type,
      source_name: sc.source_name,
      source_link: sc.source_link,
      source_notes: sc.source_notes,
      confidence: sc.confidence,
      verified: sc.verified,
      verified_at: sc.verified_at,
      verified_by: sc.verified_by,
    }
    // @ts-ignore - coach_due_diligence_items table not yet in DB schema
    const { error } = await supabase.from('coach_due_diligence_items').update(update).eq('id', id).eq('coach_id', coachId)
    if (error) return { error: error.message }
  } else {
    const insert: CoachDueDiligenceInsert = {
      coach_id: coachId,
      title,
      detail,
      source_type: sc.source_type,
      source_name: sc.source_name,
      source_link: sc.source_link,
      source_notes: sc.source_notes,
      confidence: sc.confidence,
      verified: sc.verified,
      verified_at: sc.verified_at,
      verified_by: sc.verified_by,
    }
    // @ts-ignore - coach_due_diligence_items table not yet in DB schema
    const { error } = await supabase.from('coach_due_diligence_items').insert(insert)
    if (error) return { error: error.message }
  }
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/risk`)
  return { error: null }
}

/** Delete a due diligence item. */
export async function deleteDueDiligenceItemAction(coachId: string, itemId: string) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  // @ts-ignore - coach_due_diligence_items table not yet in DB schema
  const { error } = await supabase.from('coach_due_diligence_items').delete().eq('id', itemId).eq('coach_id', coachId)
  if (error) return { error: error.message }
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/risk`)
  return { error: null }
}

/** Create or update a staff history row (staff network). */
export async function upsertStaffHistoryAction(coachId: string, formData: FormData) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const id = toStr(formData.get('id'))
  const staffId = toStr(formData.get('staff_id'))
  const clubName = toStr(formData.get('club_name')) ?? ''
  const roleTitle = toStr(formData.get('role_title')) ?? ''
  const startedOn = toDateStr(formData.get('started_on'))
  const endedOn = toDateStr(formData.get('ended_on'))
  const followedFromPrevious = formData.get('followed_from_previous') === 'on' || formData.get('followed_from_previous') === 'true'
  const timesWorkedTogether = toNum(formData.get('times_worked_together')) ?? 1
  const relationshipStrength = toNum(formData.get('relationship_strength'))
  const impactSummary = toStr(formData.get('impact_summary'))
  const beforeAfterObservation = toStr(formData.get('before_after_observation'))
  const sc = parseSourceConfidenceFromFormData(formData)

  if (!staffId) return { error: 'Staff is required' }

  if (id) {
    const update: CoachStaffHistoryUpdate = {
      staff_id: staffId,
      club_name: clubName,
      role_title: roleTitle,
      started_on: startedOn,
      ended_on: endedOn,
      followed_from_previous: followedFromPrevious,
      times_worked_together: Math.max(1, timesWorkedTogether),
      relationship_strength: relationshipStrength,
      impact_summary: impactSummary,
      before_after_observation: beforeAfterObservation,
      source_type: sc.source_type,
      source_name: sc.source_name,
      source_link: sc.source_link,
      source_notes: sc.source_notes,
      confidence: sc.confidence,
      verified: sc.verified,
      verified_at: sc.verified_at,
      verified_by: sc.verified_by,
    }
    const { error } = await supabase.from('coach_staff_history').update(update).eq('id', id).eq('coach_id', coachId)
    if (error) return { error: error.message }
  } else {
    const insert: CoachStaffHistoryInsert = {
      coach_id: coachId,
      staff_id: staffId,
      club_name: clubName,
      role_title: roleTitle,
      started_on: startedOn,
      ended_on: endedOn,
      followed_from_previous: followedFromPrevious,
      times_worked_together: Math.max(1, timesWorkedTogether),
      relationship_strength: relationshipStrength,
      impact_summary: impactSummary,
      before_after_observation: beforeAfterObservation,
      source_type: sc.source_type,
      source_name: sc.source_name,
      source_link: sc.source_link,
      source_notes: sc.source_notes,
      confidence: sc.confidence,
      verified: sc.verified,
      verified_at: sc.verified_at,
      verified_by: sc.verified_by,
    }
    const { error } = await supabase.from('coach_staff_history').insert(insert)
    if (error) return { error: error.message }
  }
  revalidatePath('/coaches')
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/staff-network`)
  return { error: null }
}

/** Autofill for Add staff link: existing link for this coach+staff, or coach/staff defaults. */
export async function getStaffLinkAutofillAction(coachId: string, staffId: string): Promise<{
  existingLink: boolean
  club_name: string
  role_title: string
  started_on: string | null
  ended_on: string | null
  times_worked_together: number
  relationship_strength: number | null
  confidence: number | null
  impact_summary: string | null
  before_after_observation: string | null
} | null> {
  if (!staffId || !coachId) return null
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const existing = await supabase
    .from('coach_staff_history')
    .select('id, club_name, role_title, started_on, ended_on, times_worked_together, relationship_strength, confidence, impact_summary, before_after_observation')
    .eq('coach_id', coachId)
    .eq('staff_id', staffId)
    .order('ended_on', { ascending: false, nullsFirst: true })
    .limit(1)
    .maybeSingle()

  if (existing.data) {
    const r = existing.data as typeof existing.data
    return {
      existingLink: true,
      club_name: r.club_name ?? '',
      role_title: r.role_title ?? '',
      started_on: r.started_on ?? null,
      ended_on: r.ended_on ?? null,
      times_worked_together: r.times_worked_together ?? 1,
      relationship_strength: r.relationship_strength ?? null,
      confidence: r.confidence ?? null,
      impact_summary: r.impact_summary ?? null,
      before_after_observation: r.before_after_observation ?? null,
    }
  }

  const [coachRes, stintRes, staffRes] = await Promise.all([
    supabase.from('coaches').select('club_current').eq('id', coachId).single(),
    supabase.from('coach_stints').select('club_name, started_on').eq('coach_id', coachId).is('ended_on', null).order('started_on', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('staff').select('primary_role').eq('id', staffId).single(),
  ])
  const coach = coachRes.data as { club_current?: string | null } | null
  const stint = stintRes.data as { club_name?: string; started_on?: string | null } | null
  const staff = staffRes.data as { primary_role?: string | null } | null

  const role = (staff?.primary_role ?? '').trim() || 'Assistant Coach'
  const twelveMonthsAgo = (() => { const d = new Date(); d.setMonth(d.getMonth() - 12); return d.toISOString().slice(0, 10) })()
  const impactByRole: Record<string, string> = {
    'Assistant Coach': 'Trusted with tactical preparation and match-day support.',
    'First Team Coach': 'Session delivery and in-game support; clear communication.',
    'Analyst': 'Data and video input; set piece and opposition analysis.',
    'Goalkeeper Coach': 'Goalkeeper unit; distribution and shot-stopping focus.',
    'Set Piece Coach': 'Set piece design and execution; improved dead-ball outcomes.',
    'Head of Performance': 'Load management and periodisation; availability.',
    'Sporting Director': 'Recruitment alignment and squad building.',
    'President': 'Strategic and board-level relationship.',
  }
  const beforeAfterByRole: Record<string, string> = {
    'Assistant Coach': 'More consistent match prep and clearer in-game adjustments.',
    'First Team Coach': 'Training intensity and clarity improved.',
    'Analyst': 'Opposition and set piece prep more structured.',
    'Goalkeeper Coach': 'Clean sheet run and distribution improved.',
    'Set Piece Coach': 'Goals from dead balls increased.',
    'Head of Performance': 'Fewer soft-tissue issues; availability improved.',
    'Sporting Director': 'Recruitment and profile alignment stronger.',
    'President': 'Board and strategic alignment clear.',
  }

  return {
    existingLink: false,
    club_name: (stint?.club_name ?? coach?.club_current ?? '').trim() || 'Club',
    role_title: role,
    started_on: stint?.started_on ?? twelveMonthsAgo,
    ended_on: null,
    times_worked_together: 1,
    relationship_strength: 70,
    confidence: 75,
    impact_summary: impactByRole[role] ?? 'Key collaboration; impact positive.',
    before_after_observation: beforeAfterByRole[role] ?? 'Observable improvement in area of responsibility.',
  }
}

/** Delete a staff history row. */
export async function deleteStaffHistoryAction(coachId: string, historyId: string) {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from('coach_staff_history').delete().eq('id', historyId).eq('coach_id', coachId)
  if (error) return { error: error.message }
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/staff-network`)
  return { error: null }
}

/** Evidence coverage: count of linked records with confidence set. Verified coverage: count with verified = true. */
export async function getCoachCoverageAction(coachId: string): Promise<{ evidenceCoverage: number; verifiedCoverage: number }> {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  let evidenceCoverage = 0
  let verifiedCoverage = 0

  const stintsEv = await supabase.from('coach_stints').select('*', { count: 'exact', head: true }).eq('coach_id', coachId).not('confidence', 'is', null)
  const stintsVer = await supabase.from('coach_stints').select('*', { count: 'exact', head: true }).eq('coach_id', coachId).eq('verified', true)
  evidenceCoverage += stintsEv.count ?? 0
  verifiedCoverage += stintsVer.count ?? 0

  const staffEv = await supabase.from('coach_staff_history').select('*', { count: 'exact', head: true }).eq('coach_id', coachId).not('confidence', 'is', null)
  const staffVer = await supabase.from('coach_staff_history').select('*', { count: 'exact', head: true }).eq('coach_id', coachId).eq('verified', true)
  evidenceCoverage += staffEv.count ?? 0
  verifiedCoverage += staffVer.count ?? 0

  // @ts-ignore - coach_recruitment_history table not yet in DB schema
  const recEv = await supabase.from('coach_recruitment_history').select('*', { count: 'exact', head: true }).eq('coach_id', coachId).not('confidence', 'is', null)
  // @ts-ignore - coach_recruitment_history table not yet in DB schema
  const recVer = await supabase.from('coach_recruitment_history').select('*', { count: 'exact', head: true }).eq('coach_id', coachId).eq('verified', true)
  evidenceCoverage += recEv.count ?? 0
  verifiedCoverage += recVer.count ?? 0

  // @ts-ignore - coach_media_events table not yet in DB schema
  const mediaEv = await supabase.from('coach_media_events').select('*', { count: 'exact', head: true }).eq('coach_id', coachId).not('confidence', 'is', null)
  // @ts-ignore - coach_media_events table not yet in DB schema
  const mediaVer = await supabase.from('coach_media_events').select('*', { count: 'exact', head: true }).eq('coach_id', coachId).eq('verified', true)
  evidenceCoverage += mediaEv.count ?? 0
  verifiedCoverage += mediaVer.count ?? 0

  // @ts-ignore - coach_due_diligence_items table not yet in DB schema
  const ddEv = await supabase.from('coach_due_diligence_items').select('*', { count: 'exact', head: true }).eq('coach_id', coachId).not('confidence', 'is', null)
  // @ts-ignore - coach_due_diligence_items table not yet in DB schema
  const ddVer = await supabase.from('coach_due_diligence_items').select('*', { count: 'exact', head: true }).eq('coach_id', coachId).eq('verified', true)
  evidenceCoverage += ddEv.count ?? 0
  verifiedCoverage += ddVer.count ?? 0

  const intEv = await supabase.from('intelligence_items').select('*', { count: 'exact', head: true }).eq('entity_type', 'coach').eq('entity_id', coachId).not('confidence', 'is', null)
  const intVer = await supabase.from('intelligence_items').select('*', { count: 'exact', head: true }).eq('entity_type', 'coach').eq('entity_id', coachId).eq('verified', true)
  evidenceCoverage += intEv.count ?? 0
  verifiedCoverage += intVer.count ?? 0

  return { evidenceCoverage, verifiedCoverage }
}

/** Manual update of coach_derived_metrics. No data ingestion yet. */
export async function upsertCoachDerivedMetricsAction(
  coachId: string,
  payload: {
    avg_squad_age?: number | null
    pct_minutes_u23?: number | null
    pct_minutes_30plus?: number | null
    rotation_index?: number | null
    avg_signing_age?: number | null
    repeat_signings_count?: number | null
    repeat_agents_count?: number | null
    loan_reliance_score?: number | null
    network_density_score?: number | null
    raw?: Record<string, unknown>
  }
): Promise<{ error: string | null }> {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()
  const row = {
    coach_id: coachId,
    avg_squad_age: payload.avg_squad_age ?? null,
    pct_minutes_u23: payload.pct_minutes_u23 ?? null,
    pct_minutes_30plus: payload.pct_minutes_30plus ?? null,
    rotation_index: payload.rotation_index ?? null,
    avg_signing_age: payload.avg_signing_age ?? null,
    repeat_signings_count: payload.repeat_signings_count ?? null,
    repeat_agents_count: payload.repeat_agents_count ?? null,
    loan_reliance_score: payload.loan_reliance_score ?? null,
    network_density_score: payload.network_density_score ?? null,
    computed_at: now,
    raw: (payload.raw ?? {}) as Record<string, unknown>,
  }
  // @ts-ignore - coach_derived_metrics table not yet in DB schema
  const { error } = await supabase.from('coach_derived_metrics').upsert(row, { onConflict: 'coach_id' })
  if (!error) revalidatePath(`/coaches/${coachId}`)
  return { error: error?.message ?? null }
}

export async function getWatchlistStatusAction(coachId: string): Promise<{ onWatchlist: boolean }> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { onWatchlist: false }
  // @ts-ignore - watchlist_coaches table not yet in DB schema
  const { data } = await supabase.from('watchlist_coaches').select('coach_id').eq('coach_id', coachId).eq('user_id', user.id).maybeSingle()
  return { onWatchlist: !!data }
}

export async function addToWatchlistAction(coachId: string): Promise<{ error: string | null }> {
  await assertCoachOwnership(coachId)
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  // @ts-ignore - watchlist_coaches table not yet in DB schema
  const { error } = await supabase.from('watchlist_coaches').upsert({ coach_id: coachId, user_id: user.id }, { onConflict: 'coach_id,user_id' })
  if (!error) revalidatePath(`/coaches/${coachId}`)
  return { error: error?.message ?? null }
}

export async function removeFromWatchlistAction(coachId: string): Promise<{ error: string | null }> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  // @ts-ignore - watchlist_coaches table not yet in DB schema
  const { error } = await supabase.from('watchlist_coaches').delete().eq('coach_id', coachId).eq('user_id', user.id)
  if (!error) revalidatePath(`/coaches/${coachId}`)
  return { error: error?.message ?? null }
}
