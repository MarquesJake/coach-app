import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AgentsInventoryClient } from './_components/agents-inventory-client'
import type { AgentInventoryAgent } from './_components/agents-inventory-client'
import { EmptyState } from '@/components/ui/empty-state'

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; market?: string; risk?: string; min_influence?: string; channel?: string; sort?: string }>
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const q = (params.q ?? '').trim().toLowerCase()
  const market = (params.market ?? '').trim()
  const risk = (params.risk ?? '').trim()
  const minInfluence = params.min_influence != null && params.min_influence !== '' ? parseInt(params.min_influence, 10) : null
  const channel = (params.channel ?? '').trim()
  const sort = (params.sort ?? 'name').trim()

  const { data: agents } = await supabase
    .from('agents')
    .select('id, full_name, agency_name, base_location, markets, influence_score, reliability_score, risk_flag, preferred_contact_channel, created_at')
    .eq('user_id', user.id)
    .order('full_name')

  if (!agents || agents.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Link href="/agents/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Add agent
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <EmptyState title="No agents yet" description="Add agents to track relationships with coaches and clubs." actionLabel="Add agent" actionHref="/agents/new" />
        </div>
      </div>
    )
  }

  const agentList: AgentInventoryAgent[] = agents
  const agentIds = agentList.map((a) => a.id)
  const [caCounts, acrCounts, lastInt] = await Promise.all([
    supabase.from('coach_agents').select('agent_id').eq('user_id', user.id).in('agent_id', agentIds),
    supabase.from('agent_club_relationships').select('agent_id').eq('user_id', user.id).in('agent_id', agentIds),
    supabase.from('agent_interactions').select('agent_id, occurred_at').eq('user_id', user.id).in('agent_id', agentIds).order('occurred_at', { ascending: false }),
  ])

  const coachesCountByAgent: Record<string, number> = {}
  const clubsCountByAgent: Record<string, number> = {}
  const lastInteractionByAgent: Record<string, string> = {}
  for (const id of agentIds) {
    coachesCountByAgent[id] = 0
    clubsCountByAgent[id] = 0
  }
  for (const r of caCounts.data ?? []) {
    const aid = r.agent_id
    if (aid) coachesCountByAgent[aid] = (coachesCountByAgent[aid] ?? 0) + 1
  }
  for (const r of acrCounts.data ?? []) {
    const aid = r.agent_id
    if (aid) clubsCountByAgent[aid] = (clubsCountByAgent[aid] ?? 0) + 1
  }
  for (const r of lastInt.data ?? []) {
    const aid = r.agent_id
    if (aid && !lastInteractionByAgent[aid]) lastInteractionByAgent[aid] = r.occurred_at
  }

  let filtered = agentList
  if (q) filtered = filtered.filter((a) => (a.full_name?.toLowerCase().includes(q) || (a.agency_name ?? '').toLowerCase().includes(q)))
  if (market) filtered = filtered.filter((a) => (a.markets ?? []).includes(market))
  if (risk === 'yes') filtered = filtered.filter((a) => a.risk_flag === true)
  if (risk === 'no') filtered = filtered.filter((a) => a.risk_flag !== true)
  if (minInfluence != null && !Number.isNaN(minInfluence)) filtered = filtered.filter((a) => (a.influence_score ?? 0) >= minInfluence)
  if (channel) filtered = filtered.filter((a) => (a.preferred_contact_channel ?? '') === channel)

  if (sort === 'influence') filtered = [...filtered].sort((a, b) => (b.influence_score ?? 0) - (a.influence_score ?? 0))
  else if (sort === 'reliability') filtered = [...filtered].sort((a, b) => (b.reliability_score ?? 0) - (a.reliability_score ?? 0))
  else if (sort === 'last_interaction') filtered = [...filtered].sort((a, b) => (lastInteractionByAgent[b.id] ?? '').localeCompare(lastInteractionByAgent[a.id] ?? ''))
  else if (sort === 'coaches') filtered = [...filtered].sort((a, b) => (coachesCountByAgent[b.id] ?? 0) - (coachesCountByAgent[a.id] ?? 0))
  else filtered = [...filtered].sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''))

  return (
    <AgentsInventoryClient
      agents={filtered}
      coachesCountByAgent={coachesCountByAgent}
      clubsCountByAgent={clubsCountByAgent}
      lastInteractionByAgent={lastInteractionByAgent}
      initialQ={params.q}
      initialMarket={params.market}
      initialRisk={params.risk}
      initialMinInfluence={params.min_influence}
      initialChannel={params.channel}
      initialSort={params.sort ?? 'name'}
      allMarkets={Array.from(new Set(agentList.flatMap((a) => a.markets ?? []))).sort()}
      allChannels={Array.from(new Set(agentList.map((a) => a.preferred_contact_channel).filter((channel): channel is string => Boolean(channel))))}
    />
  )
}
