import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById } from '@/lib/db/agents'
import { listAgentDealsForAgent } from '@/lib/db/agents'
import { AgentDealsClient } from '../_components/agent-deals-client'

export default async function AgentDealsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agent } = await getAgentById(user.id, id)
  if (!agent) return null

  const { data: deals } = await listAgentDealsForAgent(user.id, id)

  return <AgentDealsClient agentId={id} deals={deals ?? []} />
}
