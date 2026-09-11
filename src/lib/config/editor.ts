export const CONFIG_PATHS = {
  config_pipeline_stages: '/config/pipeline-stages',
  config_reputation_tiers: '/config/reputation-tiers',
  config_availability_statuses: '/config/availability-statuses',
  config_preferred_styles: '/config/preferred-styles',
  config_pressing_intensity: '/config/pressing-intensity',
  config_build_preferences: '/config/build-preference',
  config_mandate_preference_categories: '/config/mandate-preference-categories',
  config_formation_presets: '/config/formation-presets',
  config_scoring_weights: '/config/scoring-weights',
} as const

export type ConfigTable = keyof typeof CONFIG_PATHS

export function isConfigTable(table: string): table is ConfigTable {
  return Object.hasOwn(CONFIG_PATHS, table)
}

// Only editable fields cross the mutation boundary; never accept ownership or IDs.
export function configPayload(table: string, values: Record<string, unknown>):
  { error: string; payload?: never } | { error: null; payload: Record<string, unknown> & { name: string } } {
  if (!isConfigTable(table)) return { error: 'Unknown configuration list.' }
  const name = String(values.name ?? '').trim()
  if (!name) return { error: 'Name is required.' }
  const payload: Record<string, unknown> & { name: string } = { name, is_active: values.is_active !== false }
  if (table === 'config_scoring_weights') {
    const key = String(values.key ?? '').trim()
    if (!key) return { error: 'Key is required.' }
    const raw = values.weight
    if ((typeof raw !== 'string' && typeof raw !== 'number') || String(raw).trim() === '' || !Number.isFinite(Number(raw)) || Number(raw) < 0) {
      return { error: 'Enter a weight of zero or greater.' }
    }
    payload.key = key
    payload.weight = Number(raw)
  }
  if (table === 'config_formation_presets') {
    for (const key of ['formation', 'notes']) payload[key] = String(values[key] ?? '').trim() || null
  }
  return { error: null, payload }
}
