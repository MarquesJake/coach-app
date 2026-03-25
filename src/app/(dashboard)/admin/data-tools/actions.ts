'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/db'
import { validateClearConfirmation } from './clear-my-data'
import { runDemoSeed } from './seed-demo-impl'

type TableName = keyof Database['public']['Tables']

type ClaimResult = {
  clubs_claimed?: number
  coaches_claimed?: number
  error?: string
}

export async function claimUnownedRowsAction(): Promise<ClaimResult> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await (supabase as unknown as { rpc: (fn: string) => { single: () => Promise<{ data: ClaimResult | null; error: { message?: string } | null }> } }).rpc('claim_unowned_rows').single()

  if (error) return { error: error.message ?? 'Claim failed' }
  if (data && 'error' in data && data.error) return { error: String(data.error) }
  return (data ?? {}) as ClaimResult
}

export type SeedDemoResult = {
  ok: true
  counts: {
    clubs: number
    coaches: number
    staff: number
    coach_stints: number
    coach_staff_history: number
    staff_created: number
    staff_links_created: number
    intelligence_items: number
    scoring_models: number
    coach_scores: number
    coach_derived_metrics: number
    coach_similarity: number
    mandates: number
    mandate_longlist: number
    mandate_shortlist: number
    coach_tactical_reports: number
    coach_data_profiles: number
    coach_due_diligence_items: number
    coach_background_checks: number
    coach_recruitment_history: number
    agents?: number
    coach_agents?: number
    agent_club_relationships?: number
    agent_interactions?: number
    agent_deals?: number
  }
} | { ok: false; error: string }

export async function seedDemoDataAction(): Promise<SeedDemoResult> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { counts, coachIds, error } = await runDemoSeed(user.id)
  if (error) return { ok: false, error }

  revalidatePath('/admin/data-tools')
  revalidatePath('/coaches')
  revalidatePath('/agents')
  revalidatePath('/mandates')
  for (const id of coachIds) {
    revalidatePath(`/coaches/${id}`)
  }

  return { ok: true, counts }
}

/** Result of clear-my-data: counts per table, any skipped tables, and non-fatal errors. */
export type ClearMyDataResult =
  | {
      ok: true
      deletedCounts: Record<string, number>
      skippedTables: string[]
      errors: string[]
    }
  | { ok: false; error: string }

export async function clearMyDataAction(confirmation: string): Promise<ClearMyDataResult> {
  if (!validateClearConfirmation(confirmation)) {
    return { ok: false, error: 'Confirmation text did not match. Type CLEAR to proceed.' }
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const uid = user.id
  const deletedCounts: Record<string, number> = {}
  const skippedTables: string[] = []
  const errors: string[] = []

  function isMissingTable(e: { message?: string; code?: string } | null): boolean {
    if (!e) return false
    const msg = (e.message ?? '').toLowerCase()
    const code = e.code ?? ''
    return msg.includes('does not exist') || msg.includes('relation') || code === '42P01' || code === '42P07'
  }

  async function deleteWhere(
    table: string,
    column: string,
    values: string[]
  ): Promise<number> {
    if (values.length === 0) return 0
    try {
      const { data, error } = await supabase.from(table as TableName).delete().in(column, values).select('id')
      if (error) {
        if (isMissingTable(error)) {
          skippedTables.push(table)
          return 0
        }
        errors.push(`${table}: ${error.message ?? 'Unknown error'}`)
        return 0
      }
      const count = Array.isArray(data) ? data.length : 0
      deletedCounts[table] = (deletedCounts[table] ?? 0) + count
      return count
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.toLowerCase().includes('exist') || message.toLowerCase().includes('relation')) {
        skippedTables.push(table)
        return 0
      }
      errors.push(`${table}: ${message}`)
      return 0
    }
  }

  async function deleteByUserId(table: string): Promise<number> {
    try {
      const { data, error } = await supabase.from(table as TableName).delete().eq('user_id', uid).select('user_id')
      if (error) {
        if (isMissingTable(error)) {
          skippedTables.push(table)
          return 0
        }
        errors.push(`${table}: ${error.message ?? 'Unknown error'}`)
        return 0
      }
      const count = Array.isArray(data) ? data.length : 0
      deletedCounts[table] = (deletedCounts[table] ?? 0) + count
      return count
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.toLowerCase().includes('exist') || message.toLowerCase().includes('relation')) {
        skippedTables.push(table)
        return 0
      }
      errors.push(`${table}: ${message}`)
      return 0
    }
  }

  // Resolve owned IDs
  const { data: coachesData } = await supabase.from('coaches').select('id').eq('user_id', uid)
  const coachIds = (coachesData ?? []).map((r) => r.id)
  const { data: clubsData } = await supabase.from('clubs').select('id').eq('user_id', uid)
  const clubIds = (clubsData ?? []).map((r) => r.id)
  const { data: mandatesData } = await supabase.from('mandates').select('id').eq('user_id', uid)
  const mandateIds = (mandatesData ?? []).map((r) => r.id)

  // Mandate children
  await deleteWhere('mandate_shortlist', 'mandate_id', mandateIds)
  await deleteWhere('mandate_longlist', 'mandate_id', mandateIds)
  await deleteWhere('mandate_deliverables', 'mandate_id', mandateIds)

  // Vacancies and matches
  if (clubIds.length > 0) {
    const { data: vacData } = await supabase.from('vacancies').select('id').in('club_id', clubIds)
    const vacancyIds = (vacData ?? []).map((r) => r.id)
    await deleteWhere('matches', 'vacancy_id', vacancyIds)
    await deleteWhere('vacancies', 'club_id', clubIds)
  }

  // Agent-related (all user-scoped)
  await deleteByUserId('agent_deals')
  await deleteByUserId('agent_interactions')
  await deleteByUserId('agent_club_relationships')
  await deleteByUserId('coach_agents')
  await deleteByUserId('agents')

  // Coach children
  if (coachIds.length > 0) {
    await deleteWhere('coach_stints', 'coach_id', coachIds)
    await deleteWhere('coach_tactical_reports', 'coach_id', coachIds)
    await deleteWhere('coach_background_checks', 'coach_id', coachIds)
    await deleteWhere('coach_due_diligence_items', 'coach_id', coachIds)
    await deleteWhere('coach_references', 'coach_id', coachIds)
    await deleteWhere('coach_data_profiles', 'coach_id', coachIds)
    await deleteWhere('coach_recruitment_history', 'coach_id', coachIds)
    await deleteWhere('coach_media_events', 'coach_id', coachIds)
    await deleteWhere('coach_derived_metrics', 'coach_id', coachIds)
    await deleteWhere('coach_updates', 'coach_id', coachIds)
    await deleteWhere('coach_staff_history', 'coach_id', coachIds)

    // coach_staff_groups and members
    const { data: groupData } = await supabase.from('coach_staff_groups').select('id').in('coach_id', coachIds)
    const groupIds = (groupData ?? []).map((r) => r.id)
    await deleteWhere('coach_staff_group_members', 'group_id', groupIds)
    await deleteWhere('coach_staff_groups', 'coach_id', coachIds)

    // Similarity (either coach in pair) – one delete with or()
    try {
      const orClause = `coach_a_id.in.(${coachIds.join(',')}),coach_b_id.in.(${coachIds.join(',')})`
      // @ts-ignore - coach_similarity table not yet in DB schema
      const { data, error } = await supabase.from('coach_similarity').delete().or(orClause).select('coach_a_id')
      if (error) {
        if (isMissingTable(error)) skippedTables.push('coach_similarity')
        else errors.push(`coach_similarity: ${error.message ?? 'Unknown error'}`)
      } else {
        const count = Array.isArray(data) ? data.length : 0
        deletedCounts['coach_similarity'] = (deletedCounts['coach_similarity'] ?? 0) + count
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.toLowerCase().includes('exist') || message.toLowerCase().includes('relation')) skippedTables.push('coach_similarity')
      else errors.push(`coach_similarity: ${message}`)
    }
    await deleteWhere('coach_scores', 'coach_id', coachIds)
  }

  // Staff owned by user
  await deleteByUserId('staff')

  // Parents: coaches, then user-scoped tables
  await deleteByUserId('coaches')
  await deleteByUserId('activity_log')
  await deleteByUserId('intelligence_items')
  await deleteByUserId('evidence_items')
  await deleteByUserId('watchlist_coaches')
  await deleteByUserId('alerts')
  await deleteByUserId('clubs')
  await deleteByUserId('mandates')

  // Config (all have user_id)
  await deleteByUserId('config_pipeline_stages')
  await deleteByUserId('config_reputation_tiers')
  await deleteByUserId('config_availability_statuses')
  await deleteByUserId('config_preferred_styles')
  await deleteByUserId('config_pressing_intensity')
  await deleteByUserId('config_build_preferences')
  await deleteByUserId('config_mandate_preference_categories')
  await deleteByUserId('config_formation_presets')
  await deleteByUserId('config_scoring_weights')

  await deleteByUserId('demo_seeds')

  revalidatePath('/coaches')
  revalidatePath('/mandates')
  revalidatePath('/intelligence')
  revalidatePath('/staff')
  revalidatePath('/clubs')
  revalidatePath('/agents')
  revalidatePath('/matches')
  revalidatePath('/admin/data-tools')

  return {
    ok: true,
    deletedCounts,
    skippedTables: Array.from(new Set(skippedTables)),
    errors,
  }
}
