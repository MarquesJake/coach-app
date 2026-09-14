'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
function toText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function toList(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function saveSuccessionPlanAction(formData: FormData): Promise<{ error: string | null }> {
  try {
  const clubId = toText(formData.get('club_id'))
  if (!clubId) return { error: 'Club is missing. Your draft has not been saved.' }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You’ve been signed out. Sign in again in another tab, then try again.' }

  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id')
    .eq('id', clubId)
    .single()

  if (clubError || !club) return { error: 'Couldn’t confirm your access to this club. Your draft is kept — check access and try again.' }

  const status = toText(formData.get('status')) || 'watching'
  const priority = toText(formData.get('priority')) || 'medium'
  const managerSecurity = toText(formData.get('manager_security')) || 'unknown'
  const nextReviewDate = toText(formData.get('next_review_date')) || null
  const desiredArchetype = toText(formData.get('desired_archetype')) || null
  const successionTimeline = toText(formData.get('succession_timeline')) || null
  const boardSignal = toText(formData.get('board_signal')) || null
  const ownerName = toText(formData.get('owner_name')) || null
  const notes = toText(formData.get('notes')) || null
  const riskTriggers = toList(toText(formData.get('risk_triggers')))
  if (!['watching', 'active_planning', 'mandate_ready', 'converted', 'paused', 'archived'].includes(status)
    || !['low', 'medium', 'high', 'urgent'].includes(priority)
    || !['unknown', 'secure', 'watch', 'at_risk', 'vacant'].includes(managerSecurity)) return { error: 'Choose a valid status, priority and manager security.' }
  if (nextReviewDate && (!/^\d{4}-\d{2}-\d{2}$/.test(nextReviewDate) || !Number.isFinite(Date.parse(nextReviewDate)) || new Date(nextReviewDate).toISOString().slice(0, 10) !== nextReviewDate)) return { error: 'Enter a valid next review date.' }

  const { error } = await supabase.from('succession_plans').upsert(
    {
      user_id: user.id,
      club_id: clubId,
      status,
      priority,
      manager_security: managerSecurity,
      next_review_date: nextReviewDate,
      desired_archetype: desiredArchetype,
      succession_timeline: successionTimeline,
      board_signal: boardSignal,
      owner_name: ownerName,
      notes,
      risk_triggers: riskTriggers,
      last_signal_at: boardSignal ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,club_id', ignoreDuplicates: false }
  )

  if (error) {
    return { error: 'The plan could not be saved. Your draft is kept. Check access and retry.' }
  }

  revalidatePath('/succession')
  revalidatePath(`/succession/${clubId}`)
  return { error: null }
  } catch {
    return { error: 'Save could not be confirmed. Your draft is kept. Check the saved plan before retrying.' }
  }
}

/** Conversion starts an editable brief; no inferred budget, timetable or automatic candidate assignments. */
export async function convertSuccessionPlanToMandateAction(formData: FormData) {
  const clubId = toText(formData.get('club_id'))
  if (!clubId) redirect('/succession?error=Missing+club')
  redirect(`/mandates/new?club_id=${encodeURIComponent(clubId)}`)
}
