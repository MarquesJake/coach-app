'use server'

import { logActivity } from '@/lib/db/activity'

export type LogActivityActionParams = {
  entityType: string
  entityId: string
  actionType: string
  description: string
  metadata?: Record<string, unknown> | null
}

/**
 * Server action for client-originated activity (e.g. coach update, vacancy create).
 */
export async function logActivityAction(params: LogActivityActionParams): Promise<{ error?: string }> {
  return logActivity(params)
}
