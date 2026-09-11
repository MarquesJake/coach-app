import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/db.ts'
import { isValidPipelineStage, normaliseStage } from '../constants/mandateStages.ts'

type Client = Pick<SupabaseClient<Database>, 'from'>

export async function moveMandateRecord(client: Client, id: string, destination: string, expectedStage?: string | null) {
  const stage = normaliseStage(destination)
  if (!isValidPipelineStage(stage)) return { error: 'Invalid pipeline stage' }
  let query = client.from('mandates').update({ pipeline_stage: stage }).eq('id', id)
  if (expectedStage !== undefined) query = expectedStage === null ? query.is('pipeline_stage', null) : query.eq('pipeline_stage', expectedStage)
  const { data, error } = await query.select('id').maybeSingle()
  if (error) return { error: 'The stage could not be saved. Check your connection and access, then retry.' }
  if (!data) return { error: 'This mandate changed or is no longer available. Reload the board before moving it again.' }
  return {}
}

export async function deleteMandateRecord(client: Client, id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  // Friendly preflight; restrictive foreign keys enforce this again at deletion time.
  const linked = await Promise.all([
    client.from('coach_research_questions').select('id').eq('mandate_id', id),
    client.from('club_briefs').select('id').eq('linked_mandate_id', id),
    client.from('confidential_access_requests').select('id').eq('mandate_id', id),
    client.from('dossier_offers').select('id').eq('mandate_id', id),
    client.from('dossier_orders').select('id').eq('mandate_id', id),
  ])
  if (linked.some(result => result.error)) return { ok: false, error: 'Linked records could not be checked. Nothing was deleted; reload and try again.' }
  if (linked.some(result => result.data?.length)) return { ok: false, error: 'This mandate has a linked research, club brief, dossier or confidential access history. Keep it for the record; use Closed instead of deleting it.' }
  const { data, error } = await client.from('mandates').delete().eq('id', id).select('id').maybeSingle()
  if (error) return { ok: false, error: ['23503', 'P0001'].includes(error.code) ? 'Linked records protect this mandate from deletion. Use Closed to retain its history.' : 'The mandate could not be deleted. Check your connection and access, then retry.' }
  if (!data) return { ok: false, error: 'The mandate was not deleted. It may already be gone or your access may have changed; reload the board.' }
  return { ok: true }
}
