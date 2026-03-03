import { db } from './client'

export type ConfigTableName =
  | 'config_pipeline_stages'
  | 'config_reputation_tiers'
  | 'config_availability_statuses'
  | 'config_preferred_styles'
  | 'config_pressing_intensity'
  | 'config_build_preferences'
  | 'config_mandate_preference_categories'
  | 'config_formation_presets'
  | 'config_scoring_weights'

type ConfigRowBase = {
  id: string
  user_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ConfigPipelineStage = ConfigRowBase
export type ConfigReputationTier = ConfigRowBase
export type ConfigAvailabilityStatus = ConfigRowBase
export type ConfigPreferredStyle = ConfigRowBase
export type ConfigPressingIntensity = ConfigRowBase
export type ConfigBuildPreference = ConfigRowBase
export type ConfigMandatePreferenceCategory = ConfigRowBase
export type ConfigFormationPreset = ConfigRowBase & { formation: string | null; notes: string | null }
export type ConfigScoringWeight = ConfigRowBase & { key: string; weight: number }

export type ConfigRow = ConfigRowBase | ConfigFormationPreset | ConfigScoringWeight

function nextSortOrder(items: { sort_order: number }[]): number {
  if (items.length === 0) return 0
  return Math.max(...items.map((i) => i.sort_order), 0) + 1
}

export async function getConfigList<T extends ConfigRow>(
  userId: string,
  table: ConfigTableName
): Promise<{ data: T[]; error: unknown }> {
  const supabase = db()
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  return { data: (data ?? []) as T[], error }
}

export async function createConfigItem(
  userId: string,
  table: ConfigTableName,
  payload: Record<string, unknown>
): Promise<{ data: ConfigRow | null; error: unknown }> {
  const supabase = db()
  const { data: existing } = await supabase.from(table).select('sort_order').eq('user_id', userId)
  const sort_order = nextSortOrder((existing ?? []) as { sort_order: number }[])
  const row = {
    user_id: userId,
    name: String(payload.name ?? ''),
    sort_order: typeof payload.sort_order === 'number' ? payload.sort_order : sort_order,
    is_active: payload.is_active !== false,
    updated_at: new Date().toISOString(),
    ...payload,
  }
  const { data, error } = await supabase.from(table).insert(row as never).select().single()
  return { data: data as ConfigRow | null, error }
}

export async function updateConfigItem(
  userId: string,
  table: ConfigTableName,
  id: string,
  payload: Record<string, unknown>
): Promise<{ data: ConfigRow | null; error: unknown }> {
  const supabase = db()
  const { data, error } = await supabase
    .from(table)
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  return { data: data as ConfigRow | null, error }
}

export async function deleteConfigItem(
  userId: string,
  table: ConfigTableName,
  id: string
): Promise<{ error: unknown }> {
  const supabase = db()
  const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId)
  return { error }
}

export async function reorderConfigItems(
  userId: string,
  table: ConfigTableName,
  id: string,
  newSortOrder: number
): Promise<{ error: unknown }> {
  const supabase = db()
  const { error } = await supabase
    .from(table)
    .update({ sort_order: newSortOrder, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('user_id', userId)
  return { error }
}
