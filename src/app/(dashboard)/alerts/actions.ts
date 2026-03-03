'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { markAlertSeen } from '@/lib/db/alerts'
import { revalidatePath } from 'next/cache'

export async function markAlertSeenAction(alertId: string): Promise<{ error?: string }> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const result = await markAlertSeen(user.id, alertId)
  if (!result.error) revalidatePath('/alerts')
  return result
}
