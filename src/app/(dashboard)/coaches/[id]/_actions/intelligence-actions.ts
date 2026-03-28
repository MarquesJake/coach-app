'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function softDeleteIntelligenceItemAction(
  id: string,
  coachId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('intelligence_items')
    .update({ is_deleted: true })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/coaches/${coachId}/intelligence`)
  revalidatePath('/intelligence')
  return { ok: true }
}
