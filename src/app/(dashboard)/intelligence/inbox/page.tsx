import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { IntelligenceInboxClient, type IntelligenceInboxItem } from '../_components/intelligence-inbox-client'

export default async function IntelligenceInboxPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    inboxRes,
    coachesRes,
    clubsRes,
    agentsRes,
    mandatesRes,
  ] = await Promise.all([
    supabase
      .from('intelligence_inbox_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(300),
    supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
    supabase.from('clubs').select('id, name').eq('user_id', user.id).order('name'),
    supabase.from('agents').select('id, full_name, agency_name').eq('user_id', user.id).order('full_name'),
    supabase.from('mandates').select('id, custom_club_name, clubs(name)').eq('user_id', user.id).limit(150),
  ])

  const coaches = (coachesRes.data ?? []).map((coach) => ({ id: coach.id, name: coach.name }))
  const clubs = (clubsRes.data ?? []).map((club) => ({ id: club.id, name: club.name }))
  const agents = (agentsRes.data ?? []).map((agent) => ({
    id: agent.id,
    name: agent.full_name ?? agent.agency_name ?? 'Agent',
  }))
  const mandates = (mandatesRes.data ?? []).map((mandate) => {
    const clubName = (mandate.clubs as { name?: string } | null)?.name
    return { id: mandate.id, label: mandate.custom_club_name || clubName || mandate.id }
  })

  const coachMap = new Map(coaches.map((coach) => [coach.id, coach.name]))
  const clubMap = new Map(clubs.map((club) => [club.id, club.name]))
  const agentMap = new Map(agents.map((agent) => [agent.id, agent.name]))
  const mandateMap = new Map(mandates.map((mandate) => [mandate.id, mandate.label]))

  const items: IntelligenceInboxItem[] = (inboxRes.data ?? []).map((item) => ({
    ...item,
    coach_name: item.coach_id ? coachMap.get(item.coach_id) ?? null : null,
    club_name: item.club_id ? clubMap.get(item.club_id) ?? null : null,
    mandate_label: item.mandate_id ? mandateMap.get(item.mandate_id) ?? null : null,
    agent_name: item.agent_id ? agentMap.get(item.agent_id) ?? null : null,
  }))

  return (
    <IntelligenceInboxClient
      items={items}
      coaches={coaches}
      clubs={clubs}
      agents={agents}
      mandates={mandates}
    />
  )
}
