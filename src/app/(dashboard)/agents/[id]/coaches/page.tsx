import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById } from '@/lib/db/agents'
import { listCoachAgentsForAgent } from '@/lib/db/agentLinks'
import { AgentCoachesClient } from '../_components/agent-coaches-client'

export default async function AgentCoachesPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agent } = await getAgentById(user.id, id)
  if (!agent) return null

  const { data: links } = await listCoachAgentsForAgent(user.id, id)
  const { data: coaches } = await supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name')

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
        confidence: number | null
        notes: string | null
        coaches?: { id: string; name: string; role_current: string | null; club_current: string | null } | null
      }>}
      coachesOptions={coaches ?? []}
    />
  )
}
