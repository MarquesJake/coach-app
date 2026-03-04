import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById } from '@/lib/db/agents'
import { listAgentClubRelationshipsForAgent } from '@/lib/db/agentLinks'
import { AgentClubsClient } from '../_components/agent-clubs-client'

export default async function AgentClubsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agent } = await getAgentById(user.id, id)
  if (!agent) return null

  const { data: links } = await listAgentClubRelationshipsForAgent(user.id, id)
  const { data: clubs } = await supabase.from('clubs').select('id, name, league').eq('user_id', user.id).order('name')

  return (
    <AgentClubsClient
      agentId={id}
      links={((links ?? []) as unknown) as Array<{
        id: string
        club_id: string
        relationship_type: string
        relationship_strength: number | null
        last_active_on: string | null
        notes: string | null
        clubs?: { id: string; name: string; league: string | null; country?: string | null } | null
      }>}
      clubsOptions={clubs ?? []}
    />
  )
}
