import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById, getAgentCounts } from '@/lib/db/agents'
import { listCoachAgentsForAgent, listAgentClubRelationshipsForAgent } from '@/lib/db/agentLinks'
import Link from 'next/link'

export default async function AgentOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: agent, error } = await getAgentById(user.id, id)
  if (error || !agent) return null

  const [counts, coachLinks, clubLinks] = await Promise.all([
    getAgentCounts(user.id, id),
    listCoachAgentsForAgent(user.id, id),
    listAgentClubRelationshipsForAgent(user.id, id),
  ])

  const coaches = ((coachLinks.data ?? []) as unknown) as Array<{
    id: string
    coach_id: string
    relationship_type: string
    relationship_strength: number | null
    coaches?: { id: string; name: string; role_current: string | null; club_current: string | null } | null
  }>
  const clubs = ((clubLinks.data ?? []) as unknown) as Array<{
    id: string
    club_id: string
    relationship_type: string
    relationship_strength: number | null
    last_active_on: string | null
    clubs?: { id: string; name: string; league: string | null } | null
  }>

  const strongestCoach = coaches.length > 0 ? coaches.reduce((best, c) => ((c.relationship_strength ?? 0) > (best.relationship_strength ?? 0) ? c : best)) : null
  const mostActiveClub = clubs.length > 0 ? clubs.reduce((best, c) => (c.relationship_strength ?? 0) > (best.relationship_strength ?? 0) ? c : best) : null

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Summary</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Preferred contact</p>
            <p className="text-sm text-foreground">{agent.preferred_contact_channel ?? '—'}</p>
            {agent.email && <p className="text-sm text-foreground mt-0.5">{agent.email}</p>}
            {agent.whatsapp && <p className="text-sm text-foreground">{agent.whatsapp}</p>}
            {agent.phone && <p className="text-sm text-foreground">{agent.phone}</p>}
            {!agent.email && !agent.whatsapp && !agent.phone && <p className="text-sm text-muted-foreground">No contact details</p>}
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Markets & languages</p>
            <p className="text-sm text-foreground">{(agent.markets ?? []).length > 0 ? (agent.markets ?? []).join(', ') : '—'}</p>
            <p className="text-sm text-foreground mt-0.5">{(agent.languages ?? []).length > 0 ? (agent.languages ?? []).join(', ') : '—'}</p>
          </div>
        </div>
        {agent.notes && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{agent.notes}</p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Relationship insights</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <p className="text-sm text-foreground"><span className="font-medium tabular-nums">{counts.coachesCount}</span> coach{counts.coachesCount !== 1 ? 'es' : ''} represented</p>
          <p className="text-sm text-foreground"><span className="font-medium tabular-nums">{counts.clubsCount}</span> club{counts.clubsCount !== 1 ? 's' : ''} linked</p>
          {strongestCoach?.coaches && (
            <p className="text-sm text-foreground">
              Strongest coach link: <Link href={`/coaches/${strongestCoach.coach_id}`} className="text-primary hover:underline">{strongestCoach.coaches.name}</Link>
              {strongestCoach.relationship_strength != null && <span className="text-muted-foreground"> ({strongestCoach.relationship_strength}%)</span>}
            </p>
          )}
          {mostActiveClub?.clubs && (
            <p className="text-sm text-foreground">
              Most active club: <Link href={`/clubs/${mostActiveClub.club_id}`} className="text-primary hover:underline">{mostActiveClub.clubs.name}</Link>
              {mostActiveClub.relationship_strength != null && <span className="text-muted-foreground"> ({mostActiveClub.relationship_strength}%)</span>}
            </p>
          )}
        </div>
        {agent.risk_flag && agent.risk_notes && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Risk notes</p>
            <p className="text-sm text-foreground">{agent.risk_notes}</p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Coverage & gaps</h2>
        <p className="text-sm text-muted-foreground">
          Coverage score is based on: contact info, markets, at least one coach link, at least one club link, and at least three interactions. Use the tabs to add links and interactions.
        </p>
      </section>
    </div>
  )
}
