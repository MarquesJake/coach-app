'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/db/activity'
import { createAlert } from '@/lib/db/alerts'

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function createIntelligenceItemAction(input: {
  entity_type: string
  entity_id: string
  title: string
  detail?: string | null
  category?: string | null
  source_name?: string | null
  source_type?: string | null
  source_link?: string | null
  source_tier?: string | null
  source_notes?: string | null
  confidence?: number | null
  occurred_at?: string | null
  verified?: boolean
  verified_by?: string | null
}) {
  const { supabase, user } = await requireUser()
  const allowed = ['coach', 'staff', 'club', 'mandate']
  if (!allowed.includes(input.entity_type) || !input.entity_id || !input.title?.trim()) {
    return { data: null, error: 'Invalid entity type, entity id, or title' }
  }
  const verified = input.verified === true
  const verified_at = verified ? new Date().toISOString() : null
  const { data, error } = await supabase
    .from('intelligence_items')
    .insert({
      user_id: user.id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      title: input.title.trim(),
      detail: input.detail?.trim() || null,
      category: input.category?.trim() || null,
      source_name: input.source_name?.trim() || null,
      source_type: input.source_type?.trim() || null,
      source_link: input.source_link?.trim() || null,
      source_tier: input.source_tier?.trim() || null,
      source_notes: input.source_notes?.trim() || null,
      confidence: input.confidence != null ? Math.max(0, Math.min(100, input.confidence)) : null,
      occurred_at: input.occurred_at || null,
      verified,
      verified_at,
      verified_by: input.verified_by?.trim() || null,
    })
    .select('id')
    .single()
  if (!error) {
    revalidatePath('/intelligence')
    if (input.entity_type === 'coach' && input.entity_id) {
      revalidatePath(`/coaches/${input.entity_id}/risk`)
    }
    await logActivity({
      entityType: input.entity_type,
      entityId: input.entity_id,
      actionType: 'intelligence_added',
      description: 'Intelligence added',
      metadata: { title: input.title.trim() },
    })
    if (input.entity_type === 'coach' && input.entity_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: onList } = await (supabase as any).from('watchlist_coaches').select('coach_id').eq('user_id', user.id).eq('coach_id', input.entity_id).maybeSingle()
      if (onList) {
        await createAlert({
          userId: user.id,
          entityType: 'coach',
          entityId: input.entity_id,
          alertType: 'new_intelligence',
          title: 'New intelligence added',
          detail: input.title?.trim() || input.category?.trim() || undefined,
        })
      }
    }
  }
  return { data: data as { id: string } | null, error: error?.message ?? null }
}
