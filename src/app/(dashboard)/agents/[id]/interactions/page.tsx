import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById } from '@/lib/db/agents'
import { listInteractionsForAgent } from '@/lib/db/agentInteractions'
import { AgentInteractionsClient } from '../_components/agent-interactions-client'

export default async function AgentInteractionsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agent } = await getAgentById(user.id, id)
  if (!agent) return null

  const [interactionsRes, coachesRes, clubsRes] = await Promise.all([
    listInteractionsForAgent(user.id, id),
    supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
    supabase.from('clubs').select('id, name').eq('user_id', user.id).order('name'),
  ])

  const coaches = (coachesRes.data ?? []).map((c) => ({ id: c.id, name: (c as { name: string }).name }))
  const clubs = (clubsRes.data ?? []).map((c) => ({ id: c.id, name: (c as { name: string }).name }))

  return (
    <AgentInteractionsClient
      agentId={id}
      interactions={interactionsRes.data ?? []}
      coaches={coaches}
      clubs={clubs}
    />
  )
}
