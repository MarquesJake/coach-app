'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getConfigList,
  createConfigItem,
  updateConfigItem,
  deleteConfigItem,
  type ConfigTableName,
} from '@/lib/db/config'

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { userId: user.id }
}

function pathForTable(table: ConfigTableName): string {
  const slug = table.replace('config_', '').replace(/_/g, '-')
  return `/config/${slug}`
}

export async function createConfigAction(
  table: ConfigTableName,
  payload: Record<string, unknown> & { name: string }
) {
  const { userId } = await requireUser()
  const { data, error } = await createConfigItem(userId, table, payload)
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
  const { error } = await updateConfigItem(userId, table, id, payload)
  if (error) return { error: (error as Error).message }
  revalidatePath(pathForTable(table))
  revalidatePath('/config')
  return { error: null }
}

export async function deleteConfigAction(table: ConfigTableName, id: string) {
  const { userId } = await requireUser()
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
  const { data, error } = await getConfigList(userId, table)
  if (error) return { error: (error as Error).message, options: [] }
  const options = (data ?? []).map((r) => ({ id: r.id, name: r.name }))
  return { error: null, options }
}
