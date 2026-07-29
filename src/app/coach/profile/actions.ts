'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachPortalContext } from '@/lib/organizations/context'

const PROFILE_FIELDS = [
  'coach_email',
  'coach_phone',
  'representative_name',
  'representative_email',
  'base_location',
  'preferred_contact_method',
  'short_bio',
  'personal_statement',
  'football_identity',
  'in_possession_model',
  'out_of_possession_model',
  'transition_model',
  'set_piece_model',
  'training_week',
  'session_design_principles',
  'player_development_proof',
  'academy_integration',
  'recruitment_preferences',
  'staff_network',
  'key_staff_likely_to_follow',
  'presentation_summary',
  'video_summary',
  'media_and_communication',
  'reference_permissions',
  'current_salary',
  'salary_expectation',
  'contract_expiry',
  'release_compensation',
  'availability_timeline',
  'family_situation',
  'relocation_requirements',
  'staff_cost_expectation',
  'appointment_conditions',
] as const

function formProfile(formData: FormData) {
  return Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, String(formData.get(field) ?? '').trim()])
  )
}

export async function saveOwnCoachProfileAction(formData: FormData) {
  const context = await getCoachPortalContext()
  if (!context) redirect('/coach/login')
  const submitForReview = String(formData.get('intent') ?? '') === 'submit'
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('save_own_coach_portal_profile', {
    target_coach_id: context.coachId,
    profile: formProfile(formData),
    submit_for_review: submitForReview,
  })
  if (error) {
    redirect(`/coach/profile?error=${encodeURIComponent(error.message)}`)
  }
  revalidatePath('/coach/profile')
  redirect(`/coach/profile?saved=${submitForReview ? 'Profile submitted for Coach First review' : 'Progress saved privately'}`)
}

export async function addOwnCoachMaterialAction(input: {
  title: string
  materialType: string
  description: string | null
  externalUrl: string | null
  storagePath: string | null
  originalFileName: string | null
  mimeType: string | null
  fileSizeBytes: number | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const context = await getCoachPortalContext()
  if (!context) return { ok: false, error: 'Coach access is not available.' }
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('add_own_coach_material_v2', {
    target_coach_id: context.coachId,
    material_title: input.title.trim(),
    material_kind: input.materialType,
    material_description: input.description?.trim() || undefined,
    material_external_url: input.externalUrl?.trim() || undefined,
    material_storage_path: input.storagePath || undefined,
    material_original_file_name: input.originalFileName?.trim() || undefined,
    material_mime_type: input.mimeType?.trim() || undefined,
    material_file_size_bytes: input.fileSizeBytes || undefined,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/coach/profile')
  revalidatePath(`/coach-portal/${context.coachId}`)
  return { ok: true }
}

type UploadReservation = {
  material_id: string
  storage_path: string
}

export async function beginOwnCoachMaterialUploadAction(input: {
  title: string
  materialType: string
  description: string | null
  externalUrl: string | null
  originalFileName: string
  mimeType: string
  fileSizeBytes: number
}): Promise<{ ok: true; reservation: UploadReservation } | { ok: false; error: string }> {
  const context = await getCoachPortalContext()
  if (!context) return { ok: false, error: 'Coach access is not available.' }
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('begin_own_coach_material_upload', {
    target_coach_id: context.coachId,
    material_title: input.title.trim(),
    material_kind: input.materialType,
    material_description: input.description?.trim() || '',
    material_external_url: input.externalUrl?.trim() || '',
    material_original_file_name: input.originalFileName.trim(),
    material_mime_type: input.mimeType.trim(),
    material_file_size_bytes: input.fileSizeBytes,
  })
  const reservation = data?.[0] as UploadReservation | undefined
  if (error || !reservation?.material_id || !reservation.storage_path) {
    return { ok: false, error: error?.message ?? 'The private upload could not be reserved.' }
  }
  return { ok: true, reservation }
}

export async function completeOwnCoachMaterialUploadAction(
  materialId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const context = await getCoachPortalContext()
  if (!context) return { ok: false, error: 'Coach access is not available.' }
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('complete_own_coach_material_upload', {
    target_material_id: materialId,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/coach/profile')
  revalidatePath(`/coach-portal/${context.coachId}`)
  return { ok: true }
}

export async function failOwnCoachMaterialUploadAction(
  materialId: string,
  reason: string
): Promise<void> {
  const context = await getCoachPortalContext()
  if (!context) return
  await (await createServerSupabaseClient()).rpc('fail_own_coach_material_upload', {
    target_material_id: materialId,
    failure_reason: reason.slice(0, 300),
  })
  revalidatePath('/coach/profile')
}

export async function signOutCoachAction() {
  await (await createServerSupabaseClient()).auth.signOut()
  redirect('/coach/login')
}
