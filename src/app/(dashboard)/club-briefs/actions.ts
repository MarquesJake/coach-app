'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'

export async function linkSubmittedBriefAction(form: FormData) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const org = await getInternalOrganizationId(user.id)
  if (!org) redirect('/no-access')
  const briefId = String(form.get('brief_id') ?? '')
  const mandateId = String(form.get('mandate_id') ?? '')
  const { data: brief } = await db.from('club_briefs').select('id,club_id,linked_mandate_id').eq('id', briefId).eq('service_organization_id', org).in('status', ['submitted','in_review']).maybeSingle()
  const { data: mandate } = await db.from('mandates').select('id,club_id').eq('id', mandateId).maybeSingle()
  if (!brief || !mandate || !brief.club_id || mandate.club_id !== brief.club_id || brief.linked_mandate_id) redirect('/club-briefs?error=Select+a+matching+unlinked+club+brief+and+mandate')
  const { data, error } = await db.from('club_briefs').update({linked_mandate_id:mandate.id,status:'converted',updated_at:new Date().toISOString()}).eq('id',brief.id).eq('service_organization_id',org).is('linked_mandate_id',null).in('status',['submitted','in_review']).select('id').single()
  if (error || !data) redirect('/club-briefs?error=Brief+could+not+be+linked.+Reload+and+try+again')
  revalidatePath('/club-briefs')
  revalidatePath('/club')
  revalidatePath('/club/brief')
  revalidatePath('/dashboard')
  redirect('/club-briefs?saved=1')
}
