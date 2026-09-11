'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CONFIG_PATHS, configPayload, isConfigTable } from '@/lib/config/editor'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import {
  getConfigList,
  createConfigItem,
  updateConfigItem,
  deleteConfigItem,
  type ConfigTableName,
} from '@/lib/db/config'

async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  if (!await getInternalOrganizationId(user.id)) throw new Error('Internal workspace access required')
  return { userId: user.id }
}

function pathForTable(table: ConfigTableName): string {
  return CONFIG_PATHS[table]
}

export async function createConfigAction(
  table: ConfigTableName,
  payload: Record<string, unknown> & { name: string }
) {
  const { userId } = await requireUser()
  const parsed = configPayload(table, payload)
  if (parsed.error !== null) return { error: parsed.error, data: null }
  const { data, error } = await createConfigItem(userId, table, parsed.payload)
  if (error) return { error: (error as Error).message, data: null }
  revalidatePath(pathForTable(table))
  revalidatePath('/config')
  return { error: null, data }
}

export async function updateConfigAction(
  table: ConfigTableName,
  id: string,
  payload: Record<string, unknown>
) {
  const { userId } = await requireUser()
  const parsed = configPayload(table, payload)
  if (parsed.error !== null) return { error: parsed.error }
  const { error } = await updateConfigItem(userId, table, id, parsed.payload)
  if (error) return { error: (error as Error).message }
  revalidatePath(pathForTable(table))
  revalidatePath('/config')
  return { error: null }
}

export async function deleteConfigAction(table: ConfigTableName, id: string) {
  const { userId } = await requireUser()
  if (!isConfigTable(table)) return { error: 'Unknown configuration list.' }
  const { error } = await deleteConfigItem(userId, table, id)
  if (error) return { error: (error as Error).message }
  revalidatePath(pathForTable(table))
  revalidatePath('/config')
  return { error: null }
}

export type ConfigOption = { id: string; name: string }

export async function getConfigOptionsAction(table: ConfigTableName): Promise<{
  error: string | null
  options: ConfigOption[]
}> {
  const { userId } = await requireUser()
  if (!isConfigTable(table)) return { error: 'Unknown configuration list.', options: [] }
  const { data, error } = await getConfigList(userId, table)
  if (error) return { error: (error as Error).message, options: [] }
  const options = (data ?? []).filter(r => r.is_active).map((r) => ({ id: r.id, name: r.name }))
  return { error: null, options }
}
