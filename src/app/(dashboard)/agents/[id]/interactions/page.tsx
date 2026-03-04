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

  const { data: interactions } = await listInteractionsForAgent(user.id, id)

  return <AgentInteractionsClient agentId={id} interactions={interactions ?? []} />
}
