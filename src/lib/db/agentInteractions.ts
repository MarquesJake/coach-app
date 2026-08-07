import { db } from './client'
import type { Database } from '@/lib/types/db'

type InteractionRow = Database['public']['Tables']['agent_interactions']['Row']
type InteractionInsert = Database['public']['Tables']['agent_interactions']['Insert']

export type { InteractionRow, InteractionInsert }

export async function listInteractionsForAgent(userId: string, agentId: string, limit = 100) {
  const supabase = await db()
  const { data, error } = await supabase
    .from('agent_interactions')
    .select('*')
    .eq('agent_id', agentId)
    .order('occurred_at', { ascending: false })
    .limit(limit)
  return { data: (data ?? []) as InteractionRow[], error }
}

export async function listInteractionsGlobal(userId: string, limit = 100) {
  const supabase = await db()
  const { data, error } = await supabase
    .from('agent_interactions')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(limit)
  return { data: (data ?? []) as InteractionRow[], error }
}

export async function createInteraction(userId: string, input: Omit<InteractionInsert, 'user_id' | 'id'>) {
  const supabase = await db()
  return supabase
    .from('agent_interactions')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
}

export async function updateInteraction(userId: string, id: string, input: Partial<InteractionInsert>) {
  const supabase = await db()
  return supabase
    .from('agent_interactions')
    .update(input)
    .eq('id', id)
    .select()
    .single()
}

export async function deleteInteraction(userId: string, id: string) {
  const supabase = await db()
  return supabase.from('agent_interactions').delete().eq('id', id)
}

export async function getLastInteractionForAgent(userId: string, agentId: string) {
  const supabase = await db()
  const { data, error } = await supabase
    .from('agent_interactions')
    .select('occurred_at')
    .eq('agent_id', agentId)
    .order('occurred_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return { data: (data as { occurred_at: string } | null) ?? null, error }
}
