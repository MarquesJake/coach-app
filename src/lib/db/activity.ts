import { db } from './client'
import type { Json } from '@/lib/types/db'

export type LogActivityParams = {
  entityType: string
  entityId: string
  actionType: string
  description: string
  metadata?: Record<string, unknown> | null
  beforeData?: Record<string, unknown> | null
  afterData?: Record<string, unknown> | null
}

/**
 * Log an activity event. Uses the current auth user (server-side).
 * Call from server actions or API routes; for client-originated events
 * use a server action that calls this.
 */
export async function logActivity(params: LogActivityParams): Promise<{ error?: string }> {
  const supabase = db()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const insert: {
    user_id: string
    entity_type: string
    entity_id: string
    action_type: string
    description: string
    metadata?: Json | null
    before_data?: Json | null
    after_data?: Json | null
  } = {
    user_id: user.id,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action_type: params.actionType,
    description: params.description,
    metadata: (params.metadata ?? null) as Json | null,
  }
  if (params.beforeData != null) insert.before_data = params.beforeData as Json
  if (params.afterData != null) insert.after_data = params.afterData as Json

  const { error } = await supabase.from('activity_log').insert(insert)

  if (error) return { error: error.message }
  return {}
}

export type ActivityLogRow = {
  id: string
  entity_type: string
  entity_id: string
  action_type: string
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}

/**
 * Fetch activity log entries for an entity, newest first.
 */
export async function getActivityForEntity(
  entityType: string,
  entityId: string
): Promise<{ data: ActivityLogRow[] | null; error?: string }> {
  const supabase = db()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('activity_log')
    .select('id, entity_type, entity_id, action_type, description, metadata, created_at')
    .eq('user_id', user.id)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as ActivityLogRow[] }
}
