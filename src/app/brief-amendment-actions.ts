'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getClubPortalContext, getInternalOrganizationId } from '@/lib/organizations/context'
import { parseAmendmentForm } from '@/lib/clubs/brief-amendments'

async function refreshBrief(briefId: string) {
  revalidatePath('/club/brief')
  revalidatePath('/club-briefs')
  revalidatePath('/club')
  revalidatePath('/dashboard')
  const { data } = await (await createServerSupabaseClient()).from('club_briefs')
    .select('linked_mandate_id').eq('id', briefId).maybeSingle()
  if (data?.linked_mandate_id) revalidatePath(`/mandates/${data.linked_mandate_id}/workspace`)
}

function requestError(error: { code?: string; message: string }) {
  if (error.code === '23505') return 'There is already a pending request. Reload to review it before submitting another.'
  if (error.code === 'P0001') return error.message
  return 'The request didn’t save. What you wrote is still here — check your connection and access, then try again.'
}

export async function requestBriefAmendmentAction(form: FormData) {
  const context = await getClubPortalContext()
  if (!context || !['owner', 'admin', 'club_owner', 'club_director'].includes(context.membershipRole)) {
    return { error: 'Sign in as a club decision maker before requesting an amendment.' }
  }
  let parsed: ReturnType<typeof parseAmendmentForm>
  try { parsed = parseAmendmentForm(form) } catch (error) {
    return { error: error instanceof Error ? error.message : 'Check the requested changes.' }
  }
  const briefId = String(form.get('brief_id') ?? '')
  const db = await createServerSupabaseClient()
  const { data: brief } = await db.from('club_briefs').select('id').eq('id', briefId)
    .eq('buyer_organization_id', context.organizationId).eq('status', 'converted').maybeSingle()
  if (!brief) return { error: 'The agreed brief is no longer available. Reload before requesting an amendment.' }
  const { error } = await db.from('club_brief_amendments').insert({
    brief_id: briefId, base_version: parsed.baseVersion, changes: parsed.changes, request_reason: parsed.reason,
  })
  if (error) return { error: requestError(error) }
  await refreshBrief(briefId)
  return { success: 'Amendment requested. The current agreed wording stays in force until Gaffa accepts the changes.' }
}

export async function decideBriefAmendmentAction(form: FormData) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  const org = user ? await getInternalOrganizationId(user.id) : null
  if (!org) return { error: 'Sign in to the responsible Gaffa team to review amendments.' }
  const status = String(form.get('status') ?? '')
  const note = String(form.get('decision_note') ?? '').trim()
  const nextAction = String(form.get('next_action') ?? '').trim()
  if (!['accepted', 'declined'].includes(status) || !note || note.length > 4000 || !nextAction || nextAction.length > 4000) {
    return { error: 'Record a decision reason and next action (up to 4,000 characters each).' }
  }
  const briefId = String(form.get('brief_id') ?? '')
  const { data: brief } = await db.from('club_briefs').select('id').eq('id', briefId).eq('service_organization_id', org).maybeSingle()
  if (!brief) return { error: 'This brief is not available to your team.' }
  const { data, error } = await db.from('club_brief_amendments')
    .update({ status, decision_note: note, next_action: nextAction })
    .eq('id', String(form.get('amendment_id') ?? '')).eq('brief_id', briefId).eq('status', 'pending').select('id').maybeSingle()
  if (error) return { error: error.code === 'P0001' ? error.message : 'The decision didn’t save. Your notes are still here — check your connection and access, then try again.' }
  if (!data) return { error: 'This request has already been decided or your access changed. Reload to see the current history.' }
  await refreshBrief(briefId)
  return { success: status === 'accepted' ? 'Amendment accepted as the next agreed version. Follow the recorded next action to review the mandate and candidate work.' : 'Amendment declined. The agreed wording is unchanged.' }
}
