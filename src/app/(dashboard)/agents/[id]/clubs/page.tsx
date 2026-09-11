import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById } from '@/lib/db/agents'
import { listAgentClubRelationshipsForAgent } from '@/lib/db/agentLinks'
import { AgentClubsClient } from '../_components/agent-clubs-client'

export const metadata = { title: 'Clubs' }


export default async function AgentClubsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agent, error } = await getAgentById(id)
  if (error) throw new Error('Could not load agent')
  if (!agent) notFound()

  const { data: links, error: linksError } = await listAgentClubRelationshipsForAgent(id)
  const { data: clubs, error: optionsError } = await supabase.from('clubs').select('id, name, league').order('name')
  if (linksError || optionsError) throw new Error('Could not load relationships')

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
