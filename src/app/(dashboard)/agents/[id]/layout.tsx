import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById, getAgentCounts } from '@/lib/db/agents'
import { AgentCommandBar } from './_components/agent-command-bar'
import { AgentTabNav } from './_components/agent-tab-nav'

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

export default async function AgentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agentRaw, error } = await getAgentById(user.id, id)
  if (error || !agentRaw) notFound()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent = agentRaw as any

  const counts = await getAgentCounts(user.id, id)
  const { count: interactionsCount } = await supabase
    .from('agent_interactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('agent_id', id)
  const coverage = agentCoverageScore(agent, counts.coachesCount, counts.clubsCount, interactionsCount ?? 0)

  return (
    <div className="animate-fade-in">
      <AgentCommandBar
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
