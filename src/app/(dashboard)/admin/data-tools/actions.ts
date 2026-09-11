'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'

type ClaimResult = {
  clubs_claimed?: number
  coaches_claimed?: number
  error?: string
}

export async function claimUnownedRowsAction(): Promise<ClaimResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!await getInternalOrganizationId(user.id)) return { error: 'Internal workspace access required' }

  const { data, error } = await (supabase as unknown as { rpc: (fn: string) => { single: () => Promise<{ data: ClaimResult | null; error: { message?: string } | null }> } }).rpc('claim_unowned_rows').single()

  if (error) return { error: error.message ?? 'Claim failed' }
  if (data && 'error' in data && data.error) return { error: String(data.error) }
  return (data ?? {}) as ClaimResult
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

// The single-user reset cannot safely identify ownership in the shared corpus.
// Keep old callers fail-closed rather than retaining a callable bulk-delete path.
export async function clearMyDataAction(_confirmation: string): Promise<ClearMyDataResult> {
  void _confirmation
  return { ok: false, error: 'Bulk reset is unavailable in a shared workspace. Use the guarded cleanup on an individual appointment.' }
}
