'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/db/activity'
import {
  ACTION_CATEGORIES,
  ACTION_PRIORITIES,
  ACTION_STATUSES,
  isServiceModel,
  type ActionCategory,
  type ActionPriority,
  type ActionStatus,
} from '@/lib/mandates/appointment-plan'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function text(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function optionalText(formData: FormData, key: string): string | null {
  return text(formData, key) || null
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isAllowed<T extends string>(values: readonly T[], value: string): value is T {
  return values.includes(value as T)
}

async function requireOwnedMandate(mandateId: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isUuid(mandateId)) redirect('/mandates?error=Invalid+mandate')

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()

  if (!mandate) redirect('/mandates?error=Mandate+not+found')
  return { supabase, user }
}

function planPath(mandateId: string, message?: string, kind: 'success' | 'error' = 'success') {
  const query = message ? `?${kind}=${encodeURIComponent(message)}` : ''
  return `/mandates/${mandateId}/plan${query}`
}

function revalidateMandate(mandateId: string) {
  revalidatePath('/dashboard')
  revalidatePath('/mandates')
  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/plan`)
}

export async function updateMandatePlanSettingsAction(formData: FormData) {
  const mandateId = text(formData, 'mandate_id')
  const serviceModel = text(formData, 'service_model')
  const engagementOwner = optionalText(formData, 'engagement_owner')
  const { supabase } = await requireOwnedMandate(mandateId)

  if (!isServiceModel(serviceModel)) {
    redirect(planPath(mandateId, 'Choose a valid service model.', 'error'))
  }

  const { error } = await supabase
    .from('mandates')
    .update({ service_model: serviceModel, engagement_owner: engagementOwner })
    .eq('id', mandateId)

  if (error) redirect(planPath(mandateId, error.message, 'error'))

  await logActivity({
    entityType: 'mandate',
    entityId: mandateId,
    actionType: 'appointment_plan_updated',
    description: 'Appointment plan settings updated',
    metadata: { service_model: serviceModel, engagement_owner: engagementOwner },
  })

  revalidateMandate(mandateId)
  redirect(planPath(mandateId, 'Appointment plan updated.'))
}

export async function addMandateWorkItemAction(formData: FormData) {
  const mandateId = text(formData, 'mandate_id')
  const item = text(formData, 'item')
  const dueDate = text(formData, 'due_date')
  const category = text(formData, 'category')
  const priority = text(formData, 'priority')
  const assignedTo = optionalText(formData, 'assigned_to')
  const linkedCoachId = optionalText(formData, 'linked_coach_id')
  const notes = optionalText(formData, 'notes')
  const { supabase } = await requireOwnedMandate(mandateId)

  if (!item || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    redirect(planPath(mandateId, 'Add an action and a valid deadline.', 'error'))
  }
  if (!isAllowed(ACTION_CATEGORIES, category) || !isAllowed(ACTION_PRIORITIES, priority)) {
    redirect(planPath(mandateId, 'Choose a valid action category and priority.', 'error'))
  }

  if (linkedCoachId) {
    if (!isUuid(linkedCoachId)) redirect(planPath(mandateId, 'Choose a valid coach.', 'error'))
    const { data: candidate } = await supabase
      .from('mandate_shortlist')
      .select('id')
      .eq('mandate_id', mandateId)
      .eq('coach_id', linkedCoachId)
      .maybeSingle()
    if (!candidate) redirect(planPath(mandateId, 'The linked coach is not in this mandate.', 'error'))
  }

  const { data: created, error } = await supabase
    .from('mandate_deliverables')
    .insert({
      mandate_id: mandateId,
      item,
      due_date: dueDate,
      status: 'Not Started',
      category: category as ActionCategory,
      priority: priority as ActionPriority,
      assigned_to: assignedTo,
      linked_coach_id: linkedCoachId,
      notes,
    })
    .select('id')
    .single()

  if (error || !created) redirect(planPath(mandateId, error?.message ?? 'Could not add action.', 'error'))

  await logActivity({
    entityType: 'mandate',
    entityId: mandateId,
    actionType: 'appointment_action_added',
    description: item,
    metadata: { action_id: created.id, category, priority, due_date: dueDate, linked_coach_id: linkedCoachId },
  })

  revalidateMandate(mandateId)
  redirect(planPath(mandateId, 'Action added.'))
}

export async function updateMandateWorkItemAction(formData: FormData) {
  const mandateId = text(formData, 'mandate_id')
  const actionId = text(formData, 'action_id')
  const status = text(formData, 'status')
  const priority = text(formData, 'priority')
  const assignedTo = optionalText(formData, 'assigned_to')
  const blockedReason = optionalText(formData, 'blocked_reason')
  const { supabase } = await requireOwnedMandate(mandateId)

  if (!isUuid(actionId)) redirect(planPath(mandateId, 'Invalid action.', 'error'))
  if (!isAllowed(ACTION_STATUSES, status) || !isAllowed(ACTION_PRIORITIES, priority)) {
    redirect(planPath(mandateId, 'Choose a valid status and priority.', 'error'))
  }
  if (status === 'Blocked' && !blockedReason) {
    redirect(planPath(mandateId, 'Record why this action is blocked.', 'error'))
  }

  const { data: existing } = await supabase
    .from('mandate_deliverables')
    .select('id, status')
    .eq('id', actionId)
    .eq('mandate_id', mandateId)
    .single()
  if (!existing) redirect(planPath(mandateId, 'Action not found.', 'error'))

  const completedAt = status === 'Completed'
    ? existing.status === 'Completed' ? undefined : new Date().toISOString()
    : null

  const updates: {
    status: ActionStatus
    priority: ActionPriority
    assigned_to: string | null
    blocked_reason: string | null
    completed_at?: string | null
  } = {
    status: status as ActionStatus,
    priority: priority as ActionPriority,
    assigned_to: assignedTo,
    blocked_reason: status === 'Blocked' ? blockedReason : null,
  }
  if (completedAt !== undefined) updates.completed_at = completedAt

  const { error } = await supabase
    .from('mandate_deliverables')
    .update(updates)
    .eq('id', actionId)
    .eq('mandate_id', mandateId)

  if (error) redirect(planPath(mandateId, error.message, 'error'))

  await logActivity({
    entityType: 'mandate',
    entityId: mandateId,
    actionType: 'appointment_action_updated',
    description: `Appointment action moved to ${status}`,
    metadata: { action_id: actionId, status, priority, assigned_to: assignedTo, blocked_reason: blockedReason },
  })

  revalidateMandate(mandateId)
  redirect(planPath(mandateId, 'Action updated.'))
}
