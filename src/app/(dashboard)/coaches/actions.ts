'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createCoach, createCoachFull } from '@/lib/db/coaches'
import { logActivity } from '@/lib/db/activity'

function toText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function formPayload(formData: FormData): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  Array.from(formData.entries()).forEach(([k, v]) => {
    if (v === null || v === undefined) return
    if (typeof v === 'string') {
      const trimmed = v.trim()
      o[k] = trimmed === '' ? null : trimmed
    } else if (v instanceof File) {
      if (v.size) o[k] = v.name
      else o[k] = null
    } else {
      o[k] = v
    }
  })
  // Multi-value: comma-separated strings -> arrays
  const lang = formData.get('languages')
  if (lang !== null && lang !== undefined) {
    const s = typeof lang === 'string' ? lang : String(lang)
    o.languages = s.split(',').map((x) => x.trim()).filter(Boolean)
  }
  const systems = formData.get('preferred_systems')
  if (systems !== null && systems !== undefined) {
    const s = typeof systems === 'string' ? systems : String(systems)
    o.preferred_systems = s.split(',').map((x) => x.trim()).filter(Boolean)
  }
  return o
}

export type CreateCoachResult = { data: { id: string } } | { error: string }

/** Quick add: name only. Returns id for client to redirect to /coaches/[id]. */
export async function createCoachQuickAction(formData: FormData): Promise<CreateCoachResult> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = toText(formData.get('name'))
  if (!name) return { error: 'Name is required' }

  const { data, error } = await createCoach(user.id, { name })
  if (error) return { error: error.message ?? 'Could not create coach' }
  if (!data?.id) return { error: 'No coach id returned' }
  await logActivity({
    entityType: 'coach',
    entityId: data.id,
    actionType: 'coach_created',
    description: 'Coach created',
  })
  return { data: { id: data.id } }
}

/** Full create: all optional fields from form. Returns id for client to redirect to /coaches/[id]. */
export async function createCoachFullAction(formData: FormData): Promise<CreateCoachResult> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const payload = formPayload(formData)
  const { data, error } = await createCoachFull(user.id, payload)
  if (error) return { error: error.message }
  if (!data?.id) return { error: 'No coach id returned' }
  await logActivity({
    entityType: 'coach',
    entityId: data.id,
    actionType: 'coach_created',
    description: 'Coach created',
  })
  return { data: { id: data.id } }
}

export async function createCoachAction(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = toText(formData.get('name'))
  const returnTo = toText(formData.get('returnTo')) || '/coaches'
  if (!name) {
    redirect(`/coaches/new?error=Name+required${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`)
  }

  const { data, error } = await createCoach(user.id, { name })
  if (error) {
    redirect(`/coaches/new?error=Could+not+create+coach${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`)
  }
  if (data?.id) {
    await logActivity({
      entityType: 'coach',
      entityId: data.id,
      actionType: 'coach_created',
      description: 'Coach created',
    })
  }

  redirect(`${returnTo}?coach_created=${data?.id ?? ''}`)
}

/** Stint and intelligence counts per coach for completeness. */
export async function getCoachStintAndIntelCountsAction(): Promise<
  Record<string, { stintCount: number; intelligenceCount: number }>
> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}
  const { data: coaches } = await supabase.from('coaches').select('id').eq('user_id', user.id)
  const ids = (coaches ?? []).map((c) => c.id)
  if (ids.length === 0) return {}
  const out: Record<string, { stintCount: number; intelligenceCount: number }> = {}
  ids.forEach((id) => { out[id] = { stintCount: 0, intelligenceCount: 0 } })
  const [stintsRes, intelRes] = await Promise.all([
    supabase.from('coach_stints').select('coach_id').in('coach_id', ids),
    supabase.from('intelligence_items').select('entity_id').eq('entity_type', 'coach').in('entity_id', ids),
  ])
  ;(stintsRes.data ?? []).forEach((r: { coach_id: string }) => {
    if (out[r.coach_id]) out[r.coach_id].stintCount++
  })
  ;(intelRes.data ?? []).forEach((r: { entity_id: string }) => {
    if (out[r.entity_id]) out[r.entity_id].intelligenceCount++
  })
  return out
}
