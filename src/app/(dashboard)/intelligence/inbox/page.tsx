import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { IntelligenceInboxClient, type IntelligenceInboxItem } from '../_components/intelligence-inbox-client'
import { displayClubName } from '@/lib/display-names'
import { readResearchContext, captureResearchContext, type ResearchParams } from '@/lib/research-context'

export const metadata = { title: 'Inbox · Research & sources' }


export default async function IntelligenceInboxPage({ searchParams }: { searchParams: Promise<ResearchParams> }) {
  const context = captureResearchContext(readResearchContext(await searchParams))
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  let questionQuery = supabase.from('coach_research_questions').select('id,question,coach_id,mandate_id')
  if (context.coach) questionQuery = questionQuery.eq('coach_id', context.coach)
  questionQuery = context.mandate ? questionQuery.eq('mandate_id', context.mandate) : questionQuery.is('mandate_id', null)
  const questions = await questionQuery
  if (questions.error) return <p role="alert">Research questions didn’t load. Refresh before logging anything against a question.</p>

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
      .order('created_at', { ascending: false })
      .limit(300),
    supabase.from('coaches').select('id, name').order('name'),
    supabase.from('clubs').select('id, name').order('name'),
    supabase.from('agents').select('id, full_name, agency_name').order('full_name'),
    supabase.from('mandates').select('id, custom_club_name, clubs(name)').limit(150),
  ])

  const coaches = (coachesRes.data ?? []).map((coach) => ({ id: coach.id, name: coach.name }))
  const clubs = (clubsRes.data ?? []).map((club) => ({ id: club.id, name: club.name }))
  const agents = (agentsRes.data ?? []).map((agent) => ({
    id: agent.id,
    name: agent.full_name ?? agent.agency_name ?? 'Agent',
  }))
  const mandates = (mandatesRes.data ?? []).map((mandate) => {
    const clubName = (mandate.clubs as { name?: string } | null)?.name
    return { id: mandate.id, label: displayClubName(mandate.custom_club_name, clubName, mandate.id) }
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
      questions={questions.data ?? []}
      coaches={coaches}
      clubs={clubs}
      agents={agents}
      mandates={mandates}
    />
  )
}
