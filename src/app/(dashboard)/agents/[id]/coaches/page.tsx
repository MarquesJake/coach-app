import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById } from '@/lib/db/agents'
import { listCoachAgentsForAgent } from '@/lib/db/agentLinks'
import { AgentCoachesClient } from '../_components/agent-coaches-client'

export const metadata = { title: 'Coaches' }


export default async function AgentCoachesPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agent, error } = await getAgentById(id)
  if (error) throw new Error('Could not load agent')
  if (!agent) notFound()

  const { data: links, error: linksError } = await listCoachAgentsForAgent(id)
  const { data: coaches, error: optionsError } = await supabase.from('coaches').select('id, name').order('name')
  if (linksError || optionsError) throw new Error('Could not load relationships')

  return (
    <AgentCoachesClient
      agentId={id}
      links={((links ?? []) as unknown) as Array<{
        id: string
        coach_id: string
        relationship_type: string
        started_on: string | null
        ended_on: string | null
        relationship_strength: number | null
        notes: string | null
        coaches?: { id: string; name: string; role_current: string | null; club_current: string | null } | null
      }>}
      coachesOptions={coaches ?? []}
    />
  )
}
