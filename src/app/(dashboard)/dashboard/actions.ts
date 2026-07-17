'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/db/activity'
import { OPERATIONS_FILTERS } from '@/lib/operations/desk'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function value(formData: FormData, key: string): string {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

function returnPath(formData: FormData): string {
  const filter = value(formData, 'return_filter')
  return OPERATIONS_FILTERS.includes(filter as (typeof OPERATIONS_FILTERS)[number])
    ? `/dashboard?filter=${filter}`
    : '/dashboard'
}

function resultPath(path: string, kind: 'success' | 'error', message: string): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${kind}=${encodeURIComponent(message)}`
}

export async function completeDeskItemAction(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const itemType = value(formData, 'item_type')
  const recordId = value(formData, 'record_id')
  const parentId = value(formData, 'parent_id')
  const destination = returnPath(formData)
  if (!recordId) redirect(destination)

  if (itemType === 'mandate_action') {
    const { data: mandate } = await supabase
      .from('mandates')
      .select('id')
      .eq('id', parentId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!mandate) redirect(destination)

    const { data: action } = await supabase
      .from('mandate_deliverables')
      .select('id, item, status')
      .eq('id', recordId)
      .eq('mandate_id', parentId)
      .maybeSingle()
    if (!action) redirect(destination)

    const { error } = await supabase
      .from('mandate_deliverables')
      .update({ status: 'Completed', completed_at: new Date().toISOString(), blocked_reason: null })
      .eq('id', recordId)
      .eq('mandate_id', parentId)
    if (error) redirect(resultPath(destination, 'error', 'The appointment action could not be completed.'))

    await logActivity({
      entityType: 'mandate',
      entityId: parentId,
      actionType: 'appointment_action_completed',
      description: action.item,
      metadata: { action_id: recordId, previous_status: action.status },
    })
    revalidatePath(`/mandates/${parentId}/plan`)
  } else if (itemType === 'source_follow_up') {
    const organizationId = await getInternalOrganizationId(user.id)
    if (!organizationId) redirect(destination)
    const { data: contact } = await supabase
      .from('football_contacts')
      .select('id, full_name, next_follow_up_at')
      .eq('id', recordId)
      .eq('org_id', organizationId)
      .maybeSingle()
    if (!contact) redirect(destination)

    const { error } = await supabase
      .from('football_contacts')
      .update({ last_contacted_at: new Date().toISOString(), next_follow_up_at: null })
      .eq('id', recordId)
      .eq('org_id', organizationId)
    if (error) redirect(resultPath(destination, 'error', 'The source follow-up could not be completed.'))

    await logActivity({
      entityType: 'football_contact',
      entityId: recordId,
      actionType: 'source_follow_up_completed',
      description: `Follow-up completed with ${contact.full_name}`,
      metadata: { scheduled_for: contact.next_follow_up_at },
    })
    revalidatePath(`/network/${recordId}`)
    revalidatePath('/network')
  } else if (itemType === 'agent_follow_up') {
    const { data: interaction } = await supabase
      .from('agent_interactions')
      .select('id, agent_id, summary, follow_up_date')
      .eq('id', recordId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!interaction) redirect(destination)

    const { error } = await supabase
      .from('agent_interactions')
      .update({ follow_up_date: null })
      .eq('id', recordId)
      .eq('user_id', user.id)
    if (error) redirect(resultPath(destination, 'error', 'The agent follow-up could not be completed.'))

    await logActivity({
      entityType: 'agent',
      entityId: interaction.agent_id,
      actionType: 'agent_follow_up_completed',
      description: interaction.summary,
      metadata: { interaction_id: recordId, scheduled_for: interaction.follow_up_date },
    })
    revalidatePath(`/agents/${interaction.agent_id}/interactions`)
  }

  revalidatePath('/dashboard')
  redirect(resultPath(destination, 'success', 'Action completed.'))
}
