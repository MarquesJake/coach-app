import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById } from '@/lib/db/agents'
import { listInteractionsForAgent } from '@/lib/db/agentInteractions'
import { AgentInteractionsClient } from '../_components/agent-interactions-client'
import type { Database } from '@/lib/types/db'

export const metadata = { title: 'Interactions' }


export default async function AgentInteractionsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agent, error } = await getAgentById(id)
  if (error) throw new Error('Could not load agent')
  if (!agent) notFound()

  const [interactionsRes, coachesRes, clubsRes, claimsRes] = await Promise.all([
    listInteractionsForAgent(id),
    supabase.from('coaches').select('id, name').order('name'),
    supabase.from('clubs').select('id, name').order('name'),
    supabase
      .from('profile_claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_id', id)
      .order('occurred_at', { ascending: false, nullsFirst: false }),
  ])
  if ([interactionsRes, coachesRes, clubsRes, claimsRes].some((result) => result.error)) throw new Error('Could not load conversations')

  const coaches = (coachesRes.data ?? []).map((c) => ({ id: c.id, name: (c as { name: string }).name }))
  const clubs = (clubsRes.data ?? []).map((c) => ({ id: c.id, name: (c as { name: string }).name }))

  return (
    <AgentInteractionsClient
      agentId={id}
      interactions={interactionsRes.data ?? []}
      claims={(claimsRes.data ?? []) as Database['public']['Tables']['profile_claims']['Row'][]}
      coaches={coaches}
      clubs={clubs}
    />
  )
}
