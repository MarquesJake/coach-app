import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/db'

export const AGREED_BRIEF_REFUSAL = 'This brief is already agreed or linked to a mandate. Its wording has not been changed. Contact Gaffa to arrange an amendment.'

export async function updateEditableClubBrief(
  client: Pick<SupabaseClient<Database>, 'from'>,
  briefId: string,
  buyerOrganizationId: string,
  payload: Database['public']['Tables']['club_briefs']['Update'],
): Promise<{ error: string | null }> {
  // Evaluate the lifecycle boundary in the UPDATE itself, including concurrent linking.
  const { data, error } = await client.from('club_briefs').update(payload)
    .eq('id', briefId).eq('buyer_organization_id', buyerOrganizationId)
    .neq('status', 'converted').is('linked_mandate_id', null)
    .select('id').maybeSingle()
  if (error) return { error: 'The brief could not be saved. Reload before trying again.' }
  if (!data) return { error: `${AGREED_BRIEF_REFUSAL} If the brief is missing or your access has changed, reload the club room.` }
  return { error: null }
}
