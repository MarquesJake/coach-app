import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById } from '@/lib/db/agents'
import { listAgentDealsForAgent } from '@/lib/db/agents'
import { AgentDealsClient } from '../_components/agent-deals-client'

export const metadata = { title: 'Deals' }


export default async function AgentDealsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agent, error } = await getAgentById(id)
  if (error) throw new Error('Could not load agent')
  if (!agent) notFound()

  const { data: deals, error: dealsError } = await listAgentDealsForAgent(id)
  if (dealsError) throw new Error('Could not load deals')

  const [coaches, clubs] = await Promise.all([
    supabase.from('coaches').select('id, name').order('name'),
    supabase.from('clubs').select('id, name').order('name'),
  ])
  if (coaches.error || clubs.error) throw new Error('Could not load deal participants')
  return <AgentDealsClient agentId={id} deals={deals ?? []} coaches={coaches.data ?? []} clubs={clubs.data ?? []} />
}
