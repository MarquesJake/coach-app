import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/db'

type LonglistEntry = Pick<Database['public']['Tables']['mandate_longlist']['Row'],
  'id' | 'coach_id' | 'ranking_score' | 'fit_explanation'>
type GeneratedEntry = Pick<LonglistEntry, 'coach_id' | 'ranking_score' | 'fit_explanation'>

export async function reconcileGeneratedLonglist(
  client: Pick<SupabaseClient<Database>, 'from'>,
  mandateId: string,
  generated: GeneratedEntry[],
  excludedCoachIds: string[],
): Promise<{ data: LonglistEntry[] | null; error: string | null }> {
  const excluded = new Set(excludedCoachIds)
  if (!mandateId || generated.some((row) => excluded.has(row.coach_id))) {
    return { data: null, error: 'Inconsistent longlist generation. Reload and try again.' }
  }

  // Remove only known exclusions, leaving the separately managed shortlist intact.
  if (excluded.size > 0) {
    const { error } = await client.from('mandate_longlist').delete()
      .eq('mandate_id', mandateId).in('coach_id', [...excluded])
    if (error) return { data: null, error: 'Could not remove excluded candidates. Regenerate before using this longlist.' }
  }

  if (generated.length > 0) {
    const scoredAt = new Date().toISOString()
    const { error } = await client.from('mandate_longlist').upsert(
      generated.map((row) => ({ ...row, mandate_id: mandateId, created_at: scoredAt })),
      { onConflict: 'mandate_id,coach_id', ignoreDuplicates: false },
    )
    if (error) return { data: null, error: 'Could not save the regenerated rankings. Regenerate before using this longlist.' }
  }

  const { data, error } = await client.from('mandate_longlist')
    .select('id, coach_id, ranking_score, fit_explanation').eq('mandate_id', mandateId)
    .order('ranking_score', { ascending: false })
  if (error || !data) return { data: null, error: 'Could not verify the regenerated longlist. Reload and try again.' }
  if (data.some((row) => excluded.has(row.coach_id))) {
    return { data: null, error: 'Excluded candidates remain in the longlist. Reload and regenerate before using it.' }
  }
  return { data, error: null }
}
