import { db } from './client'

export type AlertRow = {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  alert_type: string
  title: string
  detail: string | null
  created_at: string
  seen: boolean
}

/**
 * Create an alert. Ownership enforced by passing userId (must match auth).
 */
export async function createAlert(params: {
  userId: string
  entityType: string
  entityId: string
  alertType: string
  title: string
  detail?: string | null
}): Promise<{ error?: string }> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== params.userId) return { error: 'Unauthorized' }

  const { error } = await supabase.from('alerts').insert({
    user_id: params.userId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    alert_type: params.alertType,
    title: params.title?.trim() ?? '',
    detail: params.detail?.trim() || null,
  })
  if (error) return { error: error.message }
  return {}
}

/**
 * Get alerts for the current user. Ownership enforced by userId.
 */
export async function getAlertsForUser(
  userId: string,
  options: { unseenOnly?: boolean } = {}
): Promise<{ data: AlertRow[]; error?: string }> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return { data: [], error: 'Unauthorized' }

  let q = supabase
    .from('alerts')
    .select('id, user_id, entity_type, entity_id, alert_type, title, detail, created_at, seen')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (options.unseenOnly) q = q.eq('seen', false)
  const { data, error } = await q
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as AlertRow[] }
}

/**
 * Mark a single alert as seen. Ownership enforced: only the alert owner can mark.
 */
export async function markAlertSeen(userId: string, alertId: string): Promise<{ error?: string }> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('alerts')
    .update({ seen: true })
    .eq('id', alertId)
    .eq('user_id', userId)
  if (error) return { error: error.message }
  return {}
}
