'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createCoach, createCoachFull } from '@/lib/db/coaches'
import { logActivity } from '@/lib/db/activity'
import { getInternalOrganizationId } from '@/lib/organizations/context'

function toText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function formPayload(formData: FormData): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  Array.from(formData.entries()).forEach(([k, v]) => {
    if (v === null || v === undefined) return
    if (typeof v === 'string') {
      const trimmed = v.trim()
      o[k] = trimmed === '' ? null : trimmed
    } else if (v instanceof File) {
      if (v.size) o[k] = v.name
      else o[k] = null
    } else {
      o[k] = v
    }
  })
  // Multi-value: comma-separated strings -> arrays
  const lang = formData.get('languages')
  if (lang !== null && lang !== undefined) {
    const s = typeof lang === 'string' ? lang : String(lang)
    o.languages = s.split(',').map((x) => x.trim()).filter(Boolean)
  }
  const systems = formData.get('preferred_systems')
  if (systems !== null && systems !== undefined) {
    const s = typeof systems === 'string' ? systems : String(systems)
    o.preferred_systems = s.split(',').map((x) => x.trim()).filter(Boolean)
  }
  return o
}

export type CreateCoachResult = { data: { id: string } } | { error: string }

/** Quick add: name only. Returns id for client to redirect to /coaches/[id]. */
export async function createCoachQuickAction(formData: FormData): Promise<CreateCoachResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = toText(formData.get('name'))
  if (!name) return { error: 'Name is required' }

  const { data, error } = await createCoach(user.id, { name })
  if (error) return { error: error.message ?? 'Could not create coach' }
  if (!data?.id) return { error: 'No coach id returned' }
  await logActivity({
    entityType: 'coach',
    entityId: data.id,
    actionType: 'coach_created',
    description: 'Coach created',
  })
  return { data: { id: data.id } }
}

/** Full create: all optional fields from form. Returns id for client to redirect to /coaches/[id]. */
export async function createCoachFullAction(formData: FormData): Promise<CreateCoachResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const payload = formPayload(formData)
  const { data, error } = await createCoachFull(user.id, payload)
  if (error) return { error: error.message }
  if (!data?.id) return { error: 'No coach id returned' }
  await logActivity({
    entityType: 'coach',
    entityId: data.id,
    actionType: 'coach_created',
    description: 'Coach created',
  })
  return { data: { id: data.id } }
}

export async function createCoachAction(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = toText(formData.get('name'))
  const returnTo = toText(formData.get('returnTo')) || '/coaches'
  if (!name) {
    redirect(`/coaches/new?error=Name+required${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`)
  }

  const { data, error } = await createCoach(user.id, { name })
  if (error) {
    redirect(`/coaches/new?error=Could+not+create+coach${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`)
  }
  if (data?.id) {
    await logActivity({
      entityType: 'coach',
      entityId: data.id,
      actionType: 'coach_created',
      description: 'Coach created',
    })
  }

  redirect(`${returnTo}?coach_created=${data?.id ?? ''}`)
}

/** Stint and intelligence counts per coach for completeness. */
export async function getCoachStintAndIntelCountsAction(): Promise<
  Record<string, { stintCount: number; intelligenceCount: number; researchCount: number }>
> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}
  const { data: coaches } = await supabase.from('coaches').select('id')
  const ids = (coaches ?? []).map((c) => c.id)
  if (ids.length === 0) return {}
  const out: Record<string, { stintCount: number; intelligenceCount: number; researchCount: number }> = {}
  ids.forEach((id) => { out[id] = { stintCount: 0, intelligenceCount: 0, researchCount: 0 } })
  const [stintsRes, intelRes, assessmentsRes, findingsRes, materialsRes] = await Promise.all([
    supabase.from('coach_stints').select('coach_id').in('coach_id', ids),
    supabase.from('intelligence_items').select('entity_id').eq('entity_type', 'coach').in('entity_id', ids),
    supabase.from('candidate_assessments').select('coach_id').in('coach_id', ids),
    supabase.from('profile_claims').select('coach_id').in('coach_id', ids).in('review_status', ['accepted', 'applied']),
    supabase.from('coach_private_materials').select('coach_id').in('coach_id', ids),
  ])
  ;(stintsRes.data ?? []).forEach((r: { coach_id: string }) => {
    if (out[r.coach_id]) out[r.coach_id].stintCount++
  })
  ;(intelRes.data ?? []).forEach((r: { entity_id: string }) => {
    if (out[r.entity_id]) out[r.entity_id].intelligenceCount++
  })
  ;(assessmentsRes.data ?? []).forEach((r: { coach_id: string }) => {
    if (out[r.coach_id]) out[r.coach_id].researchCount++
  })
  ;(findingsRes.data ?? []).forEach((r: { coach_id: string | null }) => {
    if (r.coach_id && out[r.coach_id]) out[r.coach_id].researchCount++
  })
  ;(materialsRes.data ?? []).forEach((r: { coach_id: string }) => {
    if (out[r.coach_id]) out[r.coach_id].researchCount++
  })
  return out
}

export type CoachDuplicateReviewDecision = {
  id: string
  coach_a_id: string
  coach_b_id: string
  decision: 'keep_separate' | 'canonical_selected'
  canonical_coach_id: string | null
  reason: string
  review_note: string | null
  reviewed_at: string
}

export async function getCoachDuplicateReviewsAction(): Promise<CoachDuplicateReviewDecision[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return []

  const { data, error } = await supabase
    .from('coach_duplicate_reviews')
    .select('id, coach_a_id, coach_b_id, decision, canonical_coach_id, reason, review_note, reviewed_at')
    .eq('org_id', organizationId)
    .order('reviewed_at', { ascending: false })
  if (error) return []
  return (data ?? []) as CoachDuplicateReviewDecision[]
}

export async function saveCoachDuplicateReviewAction(input: {
  coachAId: string
  coachBId: string
  decision: 'keep_separate' | 'canonical_selected'
  canonicalCoachId?: string | null
  reason: string
  reviewNote?: string | null
}): Promise<{ ok: true; review: CoachDuplicateReviewDecision } | { ok: false; error: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return { ok: false, error: 'Internal organisation access is required' }

  const pair = [input.coachAId, input.coachBId].sort()
  if (!pair[0] || !pair[1] || pair[0] === pair[1]) {
    return { ok: false, error: 'Choose two different coach records' }
  }
  if (!['keep_separate', 'canonical_selected'].includes(input.decision)) {
    return { ok: false, error: 'Unknown duplicate-review decision' }
  }
  const canonicalCoachId = input.decision === 'canonical_selected'
    ? input.canonicalCoachId ?? null
    : null
  if (input.decision === 'canonical_selected' && !pair.includes(canonicalCoachId ?? '')) {
    return { ok: false, error: 'The canonical record must be one of the reviewed coaches' }
  }

  const { data: ownedCoaches } = await supabase
    .from('coaches')
    .select('id')
    .in('id', pair)
  if ((ownedCoaches ?? []).length !== 2) {
    return { ok: false, error: 'Both coach records must belong to your workspace' }
  }

  const reviewedAt = new Date().toISOString()
  const { data, error } = await supabase
    .from('coach_duplicate_reviews')
    .upsert({
      org_id: organizationId,
      created_by: user.id,
      coach_a_id: pair[0],
      coach_b_id: pair[1],
      decision: input.decision,
      canonical_coach_id: canonicalCoachId,
      reason: input.reason.trim() || 'Potential duplicate records',
      review_note: input.reviewNote?.trim() || null,
      reviewed_by: user.id,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    }, { onConflict: 'org_id,coach_a_id,coach_b_id' })
    .select('id, coach_a_id, coach_b_id, decision, canonical_coach_id, reason, review_note, reviewed_at')
    .single()
  if (error || !data) return { ok: false, error: 'Could not save the duplicate review' }
  return { ok: true, review: data as CoachDuplicateReviewDecision }
}
