'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getClubPortalContext, getInternalOrganizationId } from '@/lib/organizations/context'

const BRIEF_FIELDS = [
  'title', 'role_title', 'appointment_context', 'football_identity',
  'in_possession_requirements', 'out_of_possession_requirements', 'transition_requirements',
  'set_piece_requirements', 'squad_context', 'player_development_priorities',
  'leadership_and_culture', 'budget_parameters', 'availability_timeline',
  'location_requirements', 'work_permit_position', 'process_requirements', 'confidentiality_notes',
] as const

export async function saveClubBriefAction(formData: FormData) {
  const context = await getClubPortalContext()
  if (!context || !['owner', 'admin', 'club_owner', 'club_director'].includes(context.membershipRole)) redirect('/club/brief?error=permission')
  const supabase = createServerSupabaseClient()
  const serviceOrganizationId = await getInternalOrganizationId(context.userId)
  if (!serviceOrganizationId) redirect('/club/brief?error=service')

  const status = formData.get('intent') === 'submit' ? 'submitted' : 'draft'
  const values = Object.fromEntries(BRIEF_FIELDS.map((field) => [field, String(formData.get(field) ?? '').trim() || null]))
  if (!values.title || !values.role_title) redirect('/club/brief?error=required')
  const briefId = String(formData.get('brief_id') ?? '')
  const payload = {
    ...values,
    status,
    submitted_at: status === 'submitted' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  const result = briefId
    ? await supabase.from('club_briefs').update(payload).eq('id', briefId).eq('buyer_organization_id', context.organizationId)
    : await supabase.from('club_briefs').insert({
        ...payload,
        buyer_organization_id: context.organizationId,
        service_organization_id: serviceOrganizationId,
        club_id: context.clubId,
        created_by: context.userId,
        title: values.title,
        role_title: values.role_title,
      })
  if (result.error) redirect('/club/brief?error=save')
  revalidatePath('/club')
  revalidatePath('/club/brief')
  redirect(`/club/brief?saved=${status}`)
}

export async function submitDossierOrderAction(formData: FormData) {
  const context = await getClubPortalContext()
  if (!context || !['owner', 'admin', 'club_owner', 'club_director'].includes(context.membershipRole)) redirect('/club/dossiers?error=permission')
  const offerId = String(formData.get('offer_id') ?? '')
  const intendedUse = String(formData.get('intended_use') ?? '').trim()
  const buyerReference = String(formData.get('buyer_reference') ?? '').trim()
  if (!offerId || !intendedUse) redirect(`/club/dossiers/${offerId}?error=required`)

  const { data, error } = await createServerSupabaseClient().rpc('submit_dossier_order', {
    target_offer_id: offerId,
    intended_use_text: intendedUse,
    buyer_reference_text: buyerReference || undefined,
  })
  if (error || !data) redirect(`/club/dossiers/${offerId}?error=order`)
  revalidatePath('/club')
  revalidatePath('/club/dossiers')
  redirect(`/club/dossiers/${offerId}?ordered=1`)
}
