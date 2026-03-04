import { db } from './client'
import type { Database } from '@/lib/types/db'

type AgentRow = Database['public']['Tables']['agents']['Row']
type AgentInsert = Database['public']['Tables']['agents']['Insert']
type AgentUpdate = Database['public']['Tables']['agents']['Update']

export type { AgentRow, AgentInsert, AgentUpdate }

export async function getAgentsForUser(userId: string) {
  const supabase = db()
  return supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .order('full_name', { ascending: true })
}

export async function getAgentById(userId: string, agentId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .eq('user_id', userId)
    .single()
  return { data: data as AgentRow | null, error }
}

export async function createAgent(userId: string, input: Omit<AgentInsert, 'user_id' | 'id'>) {
  const supabase = db()
  return supabase
    .from('agents')
    .insert({ ...input, user_id: userId })
    .select('id')
    .single()
}

export async function updateAgent(userId: string, agentId: string, input: AgentUpdate) {
  const supabase = db()
  return supabase
    .from('agents')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', agentId)
    .eq('user_id', userId)
    .select()
    .single()
}

export async function deleteAgent(userId: string, agentId: string) {
  const supabase = db()
  return supabase.from('agents').delete().eq('id', agentId).eq('user_id', userId)
}

export async function getAgentCounts(
  userId: string,
  agentId: string
): Promise<{ coachesCount: number; clubsCount: number; lastInteractionAt: string | null }> {
  const supabase = db()
  const [ca, acr, last] = await Promise.all([
    supabase.from('coach_agents').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('agent_id', agentId),
    supabase.from('agent_club_relationships').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('agent_id', agentId),
    supabase.from('agent_interactions').select('occurred_at').eq('user_id', userId).eq('agent_id', agentId).order('occurred_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  return {
    coachesCount: ca.count ?? 0,
    clubsCount: acr.count ?? 0,
    lastInteractionAt: (last.data as { occurred_at?: string } | null)?.occurred_at ?? null,
  }
}

export type AgentDealRow = Database['public']['Tables']['agent_deals']['Row']
type AgentDealInsert = Database['public']['Tables']['agent_deals']['Insert']

export async function listAgentDealsForAgent(userId: string, agentId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('agent_deals')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('occurred_on', { ascending: false, nullsFirst: false })
  return { data: (data ?? []) as AgentDealRow[], error }
}

export async function createAgentDeal(userId: string, input: Omit<AgentDealInsert, 'user_id' | 'id'>) {
  const supabase = db()
  return supabase.from('agent_deals').insert({ ...input, user_id: userId }).select().single()
}

export async function deleteAgentDeal(userId: string, id: string) {
  const supabase = db()
  return supabase.from('agent_deals').delete().eq('id', id).eq('user_id', userId)
}
