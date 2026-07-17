import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Building2, MessageSquareText, UserRound } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById, getAgentCounts } from '@/lib/db/agents'
import { listCoachAgentsForAgent, listAgentClubRelationshipsForAgent } from '@/lib/db/agentLinks'

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
    clubs?: { id: string; name: string; league: string | null } | null
  }>

  return (
    <div className="space-y-5">
      <section className="border border-border bg-card">
        <div className="grid divide-y divide-border md:grid-cols-[1.15fr_0.85fr] md:divide-x md:divide-y-0">
          <div className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Relationship record</p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Agency</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{agent.agency_name || 'Independent / not recorded'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Base</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{agent.base_location || 'Not recorded'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Preferred contact</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{agent.preferred_contact_channel || 'Not agreed'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Markets</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{agent.markets?.length ? agent.markets.join(', ') : 'Not recorded'}</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-border pt-4 text-sm text-foreground">
              {agent.email && <p>{agent.email}</p>}
              {agent.whatsapp && <p>{agent.whatsapp} · WhatsApp</p>}
              {agent.phone && agent.phone !== agent.whatsapp && <p>{agent.phone}</p>}
              {!agent.email && !agent.whatsapp && !agent.phone && <p className="text-muted-foreground">No contact route recorded.</p>}
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Working context</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{counts.coachesCount}</p>
                <p className="text-xs text-muted-foreground">coach links</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{counts.clubsCount}</p>
                <p className="text-xs text-muted-foreground">club links</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {counts.lastInteractionAt
                    ? new Date(counts.lastInteractionAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    : 'None'}
                </p>
                <p className="text-xs text-muted-foreground">last contact</p>
              </div>
            </div>
            {agent.risk_flag && (
              <div className="mt-4 border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <p className="font-medium">Relationship caution</p>
                <p className="mt-1">{agent.risk_notes || 'Review the source record before relying on information from this contact.'}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Coach relationships</h2>
            </div>
            <Link href={`/agents/${id}/coaches`} className="text-xs font-medium text-primary">Manage</Link>
          </div>
          <div className="divide-y divide-border">
            {coaches.slice(0, 5).map((relationship) => (
              <Link key={relationship.id} href={`/coaches/${relationship.coach_id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/40">
                <div>
                  <p className="text-sm font-medium text-foreground">{relationship.coaches?.name || 'Coach record'}</p>
                  <p className="text-xs text-muted-foreground">
                    {[relationship.relationship_type, relationship.coaches?.club_current].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {!coaches.length && <p className="px-5 py-8 text-sm text-muted-foreground">No coach relationship recorded yet.</p>}
          </div>
        </section>

        <section className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Club relationships</h2>
            </div>
            <Link href={`/agents/${id}/clubs`} className="text-xs font-medium text-primary">Manage</Link>
          </div>
          <div className="divide-y divide-border">
            {clubs.slice(0, 5).map((relationship) => (
              <Link key={relationship.id} href={`/clubs/${relationship.club_id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/40">
                <div>
                  <p className="text-sm font-medium text-foreground">{relationship.clubs?.name || 'Club record'}</p>
                  <p className="text-xs text-muted-foreground">
                    {[relationship.relationship_type, relationship.clubs?.league].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {!clubs.length && <p className="px-5 py-8 text-sm text-muted-foreground">No club relationship recorded yet.</p>}
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3 border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Next conversation</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture what was said, separate representation from independent evidence, and send any coach finding through Review.
          </p>
        </div>
        <Link href={`/agents/${id}/interactions`} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          Open conversation log
        </Link>
      </section>

      {agent.notes && (
        <section className="border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Internal relationship notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{agent.notes}</p>
        </section>
      )}
    </div>
  )
}
