import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById, getAgentCounts } from '@/lib/db/agents'
import { AgentCommandBar } from './_components/agent-command-bar'
import { AgentTabNav } from './_components/agent-tab-nav'
import type { Metadata } from 'next'

function agentCoverageScore(agent: {
  email?: string | null
  whatsapp?: string | null
  phone?: string | null
  markets?: string[] | null
}, coachesCount: number, clubsCount: number, interactionsCount: number): number {
  let score = 0
  const hasContact = Boolean((agent.email ?? '').trim() || (agent.whatsapp ?? '').trim() || (agent.phone ?? '').trim())
  if (hasContact) score += 20
  if ((agent.markets ?? []).length > 0) score += 20
  if (coachesCount >= 1) score += 20
  if (clubsCount >= 1) score += 20
  if (interactionsCount >= 3) score += 20
  return score
}

// Names the entity in the tab so several open records can be told apart; child
// tabs supply their own label through the template ("Career · Kieran McKenna").
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('agents').select('full_name').eq('id', id).maybeSingle()
  const name = data?.full_name?.trim() || 'Agent'
  return { title: { default: name, template: `%s · ${name} · Gaffa` } }
}

export default async function AgentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agent, error } = await getAgentById(id)
  if (error) throw new Error('Could not load agent')
  if (!agent) notFound()

  const counts = await getAgentCounts(user.id, id)
  const { count: interactionsCount, error: interactionsError } = await supabase
    .from('agent_interactions')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', id)
  if (interactionsError) throw new Error('Could not load agent interactions')
  const coverage = agentCoverageScore(agent, counts.coachesCount, counts.clubsCount, interactionsCount ?? 0)

  return (
    <div className="animate-fade-in">
      <AgentCommandBar
        agentId={id}
        agent={agent}
        coachesCount={counts.coachesCount}
        clubsCount={counts.clubsCount}
        lastInteractionAt={counts.lastInteractionAt}
        coveragePercent={coverage}
      />
      <AgentTabNav agentId={id} />
      {children}
    </div>
  )
}
