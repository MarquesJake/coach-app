import { db } from './client'
import type { Database } from '@/lib/types/db'

type CoachAgentRow = Database['public']['Tables']['coach_agents']['Row']
type CoachAgentInsert = Database['public']['Tables']['coach_agents']['Insert']
type CoachAgentUpdate = Database['public']['Tables']['coach_agents']['Update']
type AgentClubRow = Database['public']['Tables']['agent_club_relationships']['Row']
type AgentClubInsert = Database['public']['Tables']['agent_club_relationships']['Insert']
type AgentClubUpdate = Database['public']['Tables']['agent_club_relationships']['Update']

export type { CoachAgentRow, CoachAgentInsert, CoachAgentUpdate, AgentClubRow, AgentClubInsert, AgentClubUpdate }

export async function listCoachAgentsForCoach(userId: string, coachId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('coach_agents')
    .select(`
      id,
      coach_id,
      agent_id,
      relationship_type,
      started_on,
      ended_on,
      relationship_strength,
      confidence,
      notes,
      created_at,
      agents ( id, full_name, agency_name )
    `)
    .eq('user_id', userId)
    .eq('coach_id', coachId)
    .order('relationship_type')
  return { data: data ?? [], error }
}

export async function listCoachAgentsForAgent(userId: string, agentId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('coach_agents')
    .select(`
      id,
      coach_id,
      agent_id,
      relationship_type,
      started_on,
      ended_on,
      relationship_strength,
      confidence,
      notes,
      created_at,
      coaches ( id, name, role_current, club_current )
    `)
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('relationship_type')
  return { data: data ?? [], error }
}

export async function upsertCoachAgent(userId: string, payload: CoachAgentInsert) {
  const supabase = db()
  return supabase
    .from('coach_agents')
    .upsert({ ...payload, user_id: userId }, { onConflict: 'coach_id,agent_id' })
    .select()
    .single()
}

export async function deleteCoachAgent(userId: string, id: string) {
  const supabase = db()
  return supabase.from('coach_agents').delete().eq('id', id).eq('user_id', userId)
}

export async function listAgentClubRelationshipsForAgent(userId: string, agentId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('agent_club_relationships')
    .select(`
      id,
      agent_id,
      club_id,
      relationship_type,
      relationship_strength,
      last_active_on,
      notes,
      created_at,
      clubs ( id, name, league, country )
    `)
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('relationship_strength', { ascending: false, nullsFirst: false })
  return { data: data ?? [], error }
}

export async function upsertAgentClubRelationship(userId: string, payload: AgentClubInsert) {
  const supabase = db()
  return supabase
    .from('agent_club_relationships')
    .upsert({ ...payload, user_id: userId }, { onConflict: 'agent_id,club_id' })
    .select()
    .single()
}

export async function deleteAgentClubRelationship(userId: string, id: string) {
  const supabase = db()
  return supabase.from('agent_club_relationships').delete().eq('id', id).eq('user_id', userId)
}
