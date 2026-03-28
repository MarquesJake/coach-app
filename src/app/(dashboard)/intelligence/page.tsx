import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CombinedFeed } from './_components/combined-feed'
import type { IntelFeedItem } from './_components/combined-feed'

export default async function IntelligencePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all data in parallel
  const [intelRes, interRes, coachesRes, agentsRes, clubsRes, mandatesRes] = await Promise.all([
    supabase
      .from('intelligence_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(200),
    supabase
      .from('agent_interactions')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(200),
    supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
    supabase.from('agents').select('id, full_name, agency_name').eq('user_id', user.id).order('full_name'),
    supabase.from('clubs').select('id, name').eq('user_id', user.id).order('name'),
    supabase.from('mandates').select('id, custom_club_name, clubs(name)').eq('user_id', user.id).limit(100),
  ])

  const coaches = (coachesRes.data ?? []).map((c) => ({ id: c.id, name: (c as { name: string }).name }))
  const coachMap = new Map(coaches.map((c) => [c.id, c.name]))

  const agents = (agentsRes.data ?? []).map((a) => ({
    id: a.id,
    name: ((a as { full_name?: string | null; agency_name?: string | null }).full_name ?? (a as { agency_name?: string | null }).agency_name ?? 'Agent'),
  }))
  const agentMap = new Map(agents.map((a) => [a.id, a.name]))

  const clubs = (clubsRes.data ?? []).map((c) => ({ id: c.id, name: (c as { name: string }).name }))
  const clubMap = new Map(clubs.map((c) => [c.id, c.name]))

  const mandates = (mandatesRes.data ?? []).map((m) => {
    const clubName = (m.clubs as { name?: string } | null)?.name
    return { id: m.id, label: m.custom_club_name || clubName || m.id }
  })
  const mandateMap = new Map(mandates.map((m) => [m.id, m.label]))

  // Build unified feed items
  const intelItems: IntelFeedItem[] = (intelRes.data ?? []).map((item) => ({
    id: item.id,
    kind: 'intel' as const,
    occurred_at: item.occurred_at ?? item.created_at,
    title: item.title,
    detail: item.detail,
    category: item.category,
    direction: item.direction,
    sensitivity: item.sensitivity,
    confidence: item.confidence,
    source_tier: item.source_tier,
    source_name: item.source_name,
    source_type: item.source_type,
    verified: item.verified,
    entity_type: item.entity_type,
    entity_id: item.entity_id,
    mandate_id: item.mandate_id,
    entity_name: item.entity_type === 'coach' ? coachMap.get(item.entity_id) ?? item.entity_id
      : item.entity_type === 'club' ? clubMap.get(item.entity_id) ?? item.entity_id
      : mandateMap.get(item.entity_id) ?? item.entity_id,
    mandate_label: item.mandate_id ? mandateMap.get(item.mandate_id) ?? null : null,
    coach_id: item.entity_type === 'coach' ? item.entity_id : null,
    coach_name: item.entity_type === 'coach' ? coachMap.get(item.entity_id) ?? null : null,
  }))

  const interactionItems: IntelFeedItem[] = (interRes.data ?? []).map((item) => ({
    id: item.id,
    kind: 'interaction' as const,
    occurred_at: item.occurred_at,
    summary: item.summary,
    detail: item.detail,
    topic: item.topic,
    sentiment: item.sentiment,
    interaction_type: item.interaction_type,
    channel: item.channel,
    confidence: item.confidence,
    reliability_score: item.reliability_score,
    influence_score: item.influence_score,
    follow_up_date: item.follow_up_date,
    agent_id: item.agent_id,
    agent_name: agentMap.get(item.agent_id) ?? 'Agent',
    coach_id: item.coach_id,
    coach_name: item.coach_id ? coachMap.get(item.coach_id) ?? null : null,
    club_id: item.club_id,
    club_name: item.club_id ? clubMap.get(item.club_id) ?? null : null,
  }))

  // Merge and sort by occurred_at desc
  const allItems = [...intelItems, ...interactionItems].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  )

  return (
    <CombinedFeed
      items={allItems}
      coaches={coaches}
      agents={agents}
      clubs={clubs}
      mandates={mandates}
    />
  )
}
