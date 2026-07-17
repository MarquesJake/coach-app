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
  const supabase = createServerSupabaseClient()
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
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const context = await getCoachPortalContext()
  if (!context) return { ok: false, error: 'Coach access is not available.' }
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.rpc('add_own_coach_material', {
    target_coach_id: context.coachId,
    material_title: input.title.trim(),
    material_kind: input.materialType,
    material_description: input.description?.trim() || undefined,
    material_external_url: input.externalUrl?.trim() || undefined,
    material_storage_path: input.storagePath || undefined,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/coach/profile')
  revalidatePath(`/coach-portal/${context.coachId}`)
  return { ok: true }
}

export async function signOutCoachAction() {
  await createServerSupabaseClient().auth.signOut()
  redirect('/coach/login')
}
