'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

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
