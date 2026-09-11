'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getClubPortalContext } from '@/lib/organizations/context'
import { AGREED_BRIEF_REFUSAL, updateEditableClubBrief } from '@/lib/clubs/brief-lifecycle'

import { BRIEF_FIELDS } from '@/lib/clubs/brief-amendments'

export async function saveClubBriefAction(formData: FormData) {
  const context = await getClubPortalContext()
  if (!context || !['owner', 'admin', 'club_owner', 'club_director'].includes(context.membershipRole)) redirect('/club/brief?error=permission')
  const supabase = await createServerSupabaseClient()
  const { data: serviceOrganizationId, error: serviceOrganizationError } = await supabase.rpc(
    'get_club_service_organization_id',
    { target_buyer_organization_id: context.organizationId }
  )
  if (serviceOrganizationError || !serviceOrganizationId) redirect('/club/brief?error=service')

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
    ? await updateEditableClubBrief(supabase, briefId, context.organizationId, payload)
    : await supabase.from('club_briefs').insert({
        ...payload,
        buyer_organization_id: context.organizationId,
        service_organization_id: serviceOrganizationId,
        club_id: context.clubId,
        created_by: context.userId,
        title: values.title,
        role_title: values.role_title,
      })
  if (result.error) {
    const reason = typeof result.error === 'string' && result.error.startsWith(AGREED_BRIEF_REFUSAL) ? 'agreed' : 'save'
    redirect(`/club/brief?error=${reason}`)
  }
  revalidatePath('/club')
  revalidatePath('/club/brief')
  redirect(`/club/brief?saved=${status}`)
}

export async function submitDossierOrderAction(formData: FormData) {
  const context = await getClubPortalContext()
  if (!context || !['owner', 'admin', 'club_owner', 'club_director'].includes(context.membershipRole)) throw new Error('A club director or organisation owner must submit this request.')
  const offerId = String(formData.get('offer_id') ?? '')
  const intendedUse = String(formData.get('intended_use') ?? '').trim()
  const buyerReference = String(formData.get('buyer_reference') ?? '').trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(offerId) || !intendedUse) throw new Error('Select a dossier and describe the intended use.')

  const { data, error } = await (await createServerSupabaseClient()).rpc('submit_dossier_order', {
    target_offer_id: offerId,
    intended_use_text: intendedUse,
    buyer_reference_text: buyerReference || undefined,
  })
  if (error || !data) throw new Error('The dossier request could not be confirmed. Retry after checking the request status.')
  revalidatePath('/club')
  revalidatePath('/club/dossiers')
  redirect(`/club/dossiers/${offerId}?ordered=1`)
}
