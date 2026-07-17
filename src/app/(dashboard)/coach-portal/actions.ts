'use server'

import { createHash, randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  CIRCUMSTANCES_VISIBILITIES,
  FEASIBILITY_REVIEW_STATUSES,
  STAFF_ESSENTIALITY,
  STAFF_FOLLOW_STATUSES,
  STAFF_REVIEW_STATUSES,
} from '@/lib/coach-appointment'

type ActionResult = { ok: true } | { ok: false; error: string }
export type InviteCoachUserResult = {
  ok: boolean
  error?: string
  inviteLink?: string
}

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
const MATERIAL_VERIFICATION_STATUSES = ['unverified', 'verified', 'disputed'] as const
const ACCESS_REQUEST_STATUSES = ['draft', 'requested', 'approved', 'shared', 'declined', 'withdrawn'] as const

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function enumValue<T extends readonly string[]>(value: string | null, allowed: T, fallback: T[number]): T[number] {
  return allowed.includes(value as T[number]) ? (value as T[number]) : fallback
}

function dateValue(formData: FormData, key: string): string | null {
  const value = text(formData, key)
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
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

function revalidateCoachWorkspace(coachId: string) {
  revalidatePath('/coach-portal')
  revalidatePath(`/coach-portal/${coachId}`)
  revalidatePath(`/coach-portal/${coachId}/circumstances`)
  revalidatePath(`/coaches/${coachId}`)
}

function circumstancesRedirect(coachId: string, result: ActionResult, success: string): never {
  const params = result.ok
    ? `saved=${encodeURIComponent(success)}`
    : `error=${encodeURIComponent(result.error)}`
  redirect(`/coach-portal/${coachId}/circumstances?${params}`)
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

export async function saveCoachCareerCircumstancesAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const coachId = text(formData, 'coach_id') ?? ''
  if (!coachId) return { ok: false, error: 'Missing coach context' }
  if (!(await ownsCoach(supabase, user.id, coachId))) return { ok: false, error: 'Coach not found' }

  const reviewStatus = enumValue(
    text(formData, 'feasibility_review_status'),
    FEASIBILITY_REVIEW_STATUSES,
    'draft'
  )
  const visibility = enumValue(
    text(formData, 'circumstances_visibility'),
    CIRCUMSTANCES_VISIBILITIES,
    'coach_first_only'
  )
  const now = new Date().toISOString()

  const { error } = await supabase.from('coach_portal_profiles').upsert({
    user_id: user.id,
    coach_id: coachId,
    feasibility_review_status: reviewStatus === 'verified' ? 'in_review' : reviewStatus,
    circumstances_visibility: visibility,
    current_salary: text(formData, 'current_salary'),
    salary_expectation: text(formData, 'salary_expectation'),
    contract_expiry: dateValue(formData, 'contract_expiry'),
    release_compensation: text(formData, 'release_compensation'),
    availability_timeline: text(formData, 'availability_timeline'),
    family_situation: text(formData, 'family_situation'),
    relocation_requirements: text(formData, 'relocation_requirements'),
    staff_cost_expectation: text(formData, 'staff_cost_expectation'),
    appointment_conditions: text(formData, 'appointment_conditions'),
    updated_at: now,
  }, { onConflict: 'coach_id' })

  if (error) return { ok: false, error: 'Failed to save career circumstances' }
  revalidateCoachWorkspace(coachId)
  return { ok: true }
}

export async function saveCoachCareerCircumstancesFormAction(formData: FormData): Promise<void> {
  const coachId = text(formData, 'coach_id') ?? ''
  const result = await saveCoachCareerCircumstancesAction(formData)
  circumstancesRedirect(coachId, result, 'Career circumstances saved')
}

export async function saveCoachPortalStaffMemberAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const coachId = text(formData, 'coach_id') ?? ''
  const staffMemberId = text(formData, 'staff_member_id')
  const fullName = text(formData, 'full_name')
  const roleTitle = text(formData, 'role_title')
  if (!coachId) return { ok: false, error: 'Missing coach context' }
  if (!fullName || !roleTitle) return { ok: false, error: 'Staff name and role are required' }
  if (!(await ownsCoach(supabase, user.id, coachId))) return { ok: false, error: 'Coach not found' }

  const reviewStatus = enumValue(text(formData, 'review_status'), STAFF_REVIEW_STATUSES, 'unreviewed')
  const now = new Date().toISOString()
  const payload = {
    user_id: user.id,
    coach_id: coachId,
    full_name: fullName,
    role_title: roleTitle,
    current_club: text(formData, 'current_club'),
    relationship_context: text(formData, 'relationship_context'),
    essentiality: enumValue(text(formData, 'essentiality'), STAFF_ESSENTIALITY, 'preferred'),
    likely_to_follow: enumValue(text(formData, 'likely_to_follow'), STAFF_FOLLOW_STATUSES, 'unknown'),
    availability: text(formData, 'availability'),
    current_salary: text(formData, 'current_salary'),
    expected_salary: text(formData, 'expected_salary'),
    compensation_terms: text(formData, 'compensation_terms'),
    relocation_notes: text(formData, 'relocation_notes'),
    confidentiality_status: enumValue(
      text(formData, 'confidentiality_status'),
      CIRCUMSTANCES_VISIBILITIES,
      'coach_first_only'
    ),
    review_status: reviewStatus,
    reviewed_at: reviewStatus === 'verified' || reviewStatus === 'disputed' ? now : null,
    reviewed_by: reviewStatus === 'verified' || reviewStatus === 'disputed' ? user.id : null,
    updated_at: now,
  }

  const query = staffMemberId
    ? supabase
        .from('coach_portal_staff_members')
        .update(payload)
        .eq('id', staffMemberId)
        .eq('coach_id', coachId)
        .eq('user_id', user.id)
    : supabase.from('coach_portal_staff_members').insert(payload)
  const { error } = await query

  if (error) return { ok: false, error: 'Failed to save staff package member' }
  revalidateCoachWorkspace(coachId)
  return { ok: true }
}

export async function saveCoachPortalStaffMemberFormAction(formData: FormData): Promise<void> {
  const coachId = text(formData, 'coach_id') ?? ''
  const result = await saveCoachPortalStaffMemberAction(formData)
  circumstancesRedirect(coachId, result, 'Staff package updated')
}

export async function deleteCoachPortalStaffMemberAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const coachId = text(formData, 'coach_id') ?? ''
  const staffMemberId = text(formData, 'staff_member_id') ?? ''
  if (!coachId || !staffMemberId) return { ok: false, error: 'Missing staff context' }
  if (!(await ownsCoach(supabase, user.id, coachId))) return { ok: false, error: 'Coach not found' }

  const { error } = await supabase
    .from('coach_portal_staff_members')
    .delete()
    .eq('id', staffMemberId)
    .eq('coach_id', coachId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'Failed to remove staff package member' }
  revalidateCoachWorkspace(coachId)
  return { ok: true }
}

export async function deleteCoachPortalStaffMemberFormAction(formData: FormData): Promise<void> {
  const coachId = text(formData, 'coach_id') ?? ''
  const result = await deleteCoachPortalStaffMemberAction(formData)
  circumstancesRedirect(coachId, result, 'Staff package member removed')
}

export async function verifyCoachCareerCircumstancesAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const coachId = text(formData, 'coach_id') ?? ''
  if (!coachId) return { ok: false, error: 'Missing coach context' }
  if (!(await ownsCoach(supabase, user.id, coachId))) return { ok: false, error: 'Coach not found' }

  const { error } = await supabase.rpc('verify_coach_career_circumstances', {
    p_coach_id: coachId,
  })
  if (error) return { ok: false, error: 'Failed to verify career circumstances' }

  revalidateCoachWorkspace(coachId)
  return { ok: true }
}

export async function verifyCoachCareerCircumstancesFormAction(formData: FormData): Promise<void> {
  const coachId = text(formData, 'coach_id') ?? ''
  const result = await verifyCoachCareerCircumstancesAction(formData)
  circumstancesRedirect(coachId, result, 'Verified details now feed the internal record and assessment packs')
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
  revalidatePath('/intelligence')
  return { ok: true }
}

export async function addCoachPortalMaterialFormAction(formData: FormData): Promise<void> {
  await addCoachPortalMaterialAction(formData)
}

export async function updateCoachPortalMaterialVerificationAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const materialId = text(formData, 'material_id') ?? ''
  const coachId = text(formData, 'coach_id') ?? ''
  const verificationStatus = enumValue(
    text(formData, 'verification_status'),
    MATERIAL_VERIFICATION_STATUSES,
    'unverified'
  )

  if (!materialId || !coachId) return { ok: false, error: 'Missing material context' }
  if (!(await ownsCoach(supabase, user.id, coachId))) return { ok: false, error: 'Coach not found' }

  const { error } = await supabase
    .from('coach_private_materials')
    .update({
      verification_status: verificationStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', materialId)
    .eq('coach_id', coachId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'Failed to update material verification' }

  revalidatePath('/coach-portal')
  revalidatePath(`/coach-portal/${coachId}`)
  revalidatePath('/intelligence')
  return { ok: true }
}

export async function updateCoachPortalMaterialVerificationFormAction(formData: FormData): Promise<void> {
  await updateCoachPortalMaterialVerificationAction(formData)
}

export async function updateCoachPortalAccessStatusAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const requestId = text(formData, 'request_id') ?? ''
  const coachId = text(formData, 'coach_id') ?? ''
  const status = enumValue(text(formData, 'status'), ACCESS_REQUEST_STATUSES, 'requested')
  const internalNotes = text(formData, 'internal_notes')
  const decidedStatuses = ['approved', 'shared', 'declined', 'withdrawn']

  if (!requestId || !coachId) return { ok: false, error: 'Missing access request context' }
  if (!(await ownsCoach(supabase, user.id, coachId))) return { ok: false, error: 'Coach not found' }

  const { error } = await supabase
    .from('confidential_access_requests')
    .update({
      status,
      internal_notes: internalNotes,
      decided_at: decidedStatuses.includes(status) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('coach_id', coachId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'Failed to update access request' }

  revalidatePath('/coach-portal')
  revalidatePath(`/coach-portal/${coachId}`)
  return { ok: true }
}

export async function updateCoachPortalAccessStatusFormAction(formData: FormData): Promise<void> {
  await updateCoachPortalAccessStatusAction(formData)
}

export async function issueCoachInvitationAction(formData: FormData): Promise<InviteCoachUserResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }
  const coachId = text(formData, 'coach_id') ?? ''
  const email = (text(formData, 'email') ?? '').toLowerCase()
  const role = text(formData, 'role') ?? ''
  if (!coachId || !email || !['coach', 'coach_representative'].includes(role)) {
    return { ok: false, error: 'Enter an email address and choose coach or representative access.' }
  }
  if (!(await ownsCoach(supabase, user.id, coachId))) return { ok: false, error: 'Coach not found' }
  const { data: isOperator } = await supabase.rpc('is_internal_operator')
  if (!isOperator) return { ok: false, error: 'Only an internal owner or administrator can invite coach users.' }

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.rpc('issue_coach_invitation', {
    target_coach_id: coachId,
    intended_email: email,
    invited_role: role,
    invitation_token_hash: tokenHash,
    invitation_expires_at: expiresAt,
  })
  if (error) return { ok: false, error: error.message }

  const headerStore = headers()
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000'
  revalidateCoachWorkspace(coachId)
  return { ok: true, inviteLink: `${protocol}://${host}/coach/invite/${rawToken}` }
}

export async function revokeCoachInvitationAction(formData: FormData) {
  const { supabase, user } = await requireUser()
  if (!user) redirect('/login')
  const coachId = text(formData, 'coach_id') ?? ''
  const invitationId = text(formData, 'invitation_id') ?? ''
  if (!coachId || !(await ownsCoach(supabase, user.id, coachId))) {
    redirect('/coach-portal?error=coach_access')
  }
  const { error } = await supabase.rpc('revoke_coach_invitation', {
    target_invitation_id: invitationId,
  })
  if (error) redirect(`/coach-portal/${coachId}?error=coach_invite`)
  revalidateCoachWorkspace(coachId)
  redirect(`/coach-portal/${coachId}?revoked=coach_invite`)
}
