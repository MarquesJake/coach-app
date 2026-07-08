'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type ActionResult = { ok: true } | { ok: false; error: string }

const PORTAL_STATUSES = ['not_invited', 'invited', 'in_progress', 'submitted', 'in_review', 'approved', 'needs_update'] as const
const VISIBILITY_STATUSES = ['private', 'coach_first_only', 'clubs_on_request', 'shareable'] as const
const MATERIAL_TYPES = [
  'presentation',
  'training_video',
  'match_video',
  'methodology',
  'analysis',
  'media',
  'reference_pack',
  'other',
] as const
const MATERIAL_UPLOADED_BY = ['coach', 'analyst', 'agent', 'club', 'unknown'] as const
const MATERIAL_CONFIDENTIALITY_STATUSES = ['available', 'requested', 'missing', 'withheld'] as const

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function enumValue<T extends readonly string[]>(value: string | null, allowed: T, fallback: T[number]): T[number] {
  return allowed.includes(value as T[number]) ? (value as T[number]) : fallback
}

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

async function ownsCoach(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  coachId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('coaches')
    .select('id')
    .eq('id', coachId)
    .eq('user_id', userId)
    .maybeSingle()
  return Boolean(data)
}

export async function saveCoachPortalProfileAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const coachId = text(formData, 'coach_id') ?? ''
  if (!coachId) return { ok: false, error: 'Missing coach context' }
  if (!(await ownsCoach(supabase, user.id, coachId))) return { ok: false, error: 'Coach not found' }

  const portalStatus = enumValue(text(formData, 'portal_status'), PORTAL_STATUSES, 'in_progress')
  const visibilityStatus = enumValue(text(formData, 'visibility_status'), VISIBILITY_STATUSES, 'coach_first_only')
  const now = new Date().toISOString()
  const submittedAt = portalStatus === 'submitted' || portalStatus === 'in_review' || portalStatus === 'approved'
    ? now
    : null
  const reviewedAt = portalStatus === 'approved' || portalStatus === 'needs_update' ? now : null

  const { error } = await supabase.from('coach_portal_profiles').upsert(
    {
      user_id: user.id,
      coach_id: coachId,
      portal_status: portalStatus,
      visibility_status: visibilityStatus,
      coach_email: text(formData, 'coach_email'),
      coach_phone: text(formData, 'coach_phone'),
      representative_name: text(formData, 'representative_name'),
      representative_email: text(formData, 'representative_email'),
      base_location: text(formData, 'base_location'),
      preferred_contact_method: text(formData, 'preferred_contact_method'),
      short_bio: text(formData, 'short_bio'),
      personal_statement: text(formData, 'personal_statement'),
      football_identity: text(formData, 'football_identity'),
      in_possession_model: text(formData, 'in_possession_model'),
      out_of_possession_model: text(formData, 'out_of_possession_model'),
      transition_model: text(formData, 'transition_model'),
      set_piece_model: text(formData, 'set_piece_model'),
      training_week: text(formData, 'training_week'),
      session_design_principles: text(formData, 'session_design_principles'),
      player_development_proof: text(formData, 'player_development_proof'),
      academy_integration: text(formData, 'academy_integration'),
      recruitment_preferences: text(formData, 'recruitment_preferences'),
      staff_network: text(formData, 'staff_network'),
      key_staff_likely_to_follow: text(formData, 'key_staff_likely_to_follow'),
      presentation_summary: text(formData, 'presentation_summary'),
      video_summary: text(formData, 'video_summary'),
      media_and_communication: text(formData, 'media_and_communication'),
      reference_permissions: text(formData, 'reference_permissions'),
      sensitive_notes: text(formData, 'sensitive_notes'),
      release_notes: text(formData, 'release_notes'),
      submitted_at: submittedAt,
      reviewed_at: reviewedAt,
      updated_at: now,
    },
    { onConflict: 'coach_id' }
  )

  if (error) return { ok: false, error: 'Failed to save coach portal profile' }

  revalidatePath('/coach-portal')
  revalidatePath(`/coach-portal/${coachId}`)
  revalidatePath(`/coaches/${coachId}`)
  return { ok: true }
}

export async function saveCoachPortalProfileFormAction(formData: FormData): Promise<void> {
  await saveCoachPortalProfileAction(formData)
}

export async function addCoachPortalMaterialAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const coachId = text(formData, 'coach_id') ?? ''
  const title = text(formData, 'title')
  const description = text(formData, 'description')
  const externalUrl = text(formData, 'external_url')
  if (!coachId) return { ok: false, error: 'Missing coach context' }
  if (!title) return { ok: false, error: 'Material needs a title' }
  if (!description && !externalUrl) return { ok: false, error: 'Add a link or describe the material' }
  if (!(await ownsCoach(supabase, user.id, coachId))) return { ok: false, error: 'Coach not found' }

  const { error } = await supabase.from('coach_private_materials').insert({
    user_id: user.id,
    coach_id: coachId,
    title,
    material_type: enumValue(text(formData, 'material_type'), MATERIAL_TYPES, 'other'),
    description,
    external_url: externalUrl,
    source_label: text(formData, 'source_label'),
    uploaded_by: enumValue(text(formData, 'uploaded_by'), MATERIAL_UPLOADED_BY, 'coach'),
    confidentiality_status: enumValue(
      text(formData, 'confidentiality_status'),
      MATERIAL_CONFIDENTIALITY_STATUSES,
      'available'
    ),
  })

  if (error) return { ok: false, error: 'Failed to save coach material' }

  revalidatePath('/coach-portal')
  revalidatePath(`/coach-portal/${coachId}`)
  return { ok: true }
}

export async function addCoachPortalMaterialFormAction(formData: FormData): Promise<void> {
  await addCoachPortalMaterialAction(formData)
}
