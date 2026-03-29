import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAgentById, getAgentCounts } from '@/lib/db/agents'
import { listCoachAgentsForAgent, listAgentClubRelationshipsForAgent } from '@/lib/db/agentLinks'
import { computeCoachIntelSignals } from '@/lib/intelligence/coach-intel-signals'
import type { IntelItem } from '@/lib/intelligence/coach-intel-signals'
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

  // ── Intelligence aggregate: fetch intel for all linked coaches ────────────
  const linkedCoachIds = coaches.map((c) => c.coach_id)

  const intelItemsRaw = linkedCoachIds.length > 0
    ? (await supabase
        .from('intelligence_items')
        .select('id, entity_id, direction, confidence, source_tier, category, title, sensitivity, occurred_at, created_at, is_deleted')
        .eq('user_id', user.id)
        .eq('entity_type', 'coach')
        .in('entity_id', linkedCoachIds)
      ).data ?? []
    : []

  // Group by coach_id and compute signals per coach
  const intelByCoach: Record<string, IntelItem[]> = {}
  for (const item of intelItemsRaw) {
    if (item.is_deleted) continue
    const cid = (item as { entity_id: string }).entity_id
    if (!intelByCoach[cid]) intelByCoach[cid] = []
    intelByCoach[cid].push({
      id: item.id,
      direction: item.direction,
      confidence: item.confidence,
      source_tier: item.source_tier,
      category: item.category,
      title: item.title,
      sensitivity: item.sensitivity ?? 'Standard',
      occurred_at: item.occurred_at,
      created_at: item.created_at,
    })
  }

  const signalsByCoach = Object.fromEntries(
    Object.entries(intelByCoach).map(([cid, items]) => [cid, computeCoachIntelSignals(items)])
  )

  // Aggregate intel indicators
  const coachesWithIntel = Object.keys(signalsByCoach).length
  const coachesWithRisk = Object.values(signalsByCoach).filter((s) => s.topNegative.length > 0).length
  const coachesWithSensitive = Object.values(signalsByCoach).filter((s) => s.hasSensitive).length
  const totalIntelEntries = intelItemsRaw.filter((i) => !i.is_deleted).length

  // Category frequency across all linked coaches
  const categoryTotals: Record<string, number> = {}
  for (const signals of Object.values(signalsByCoach)) {
    for (const [cat, count] of Object.entries(signals.categoryGroups)) {
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + count
    }
  }
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Recent activity: last 30 days
  const cutoff30 = new Date()
  cutoff30.setDate(cutoff30.getDate() - 30)
  const recentIntelCount = intelItemsRaw.filter((i) => {
    if (i.is_deleted) return false
    const d = new Date((i as { occurred_at: string | null }).occurred_at ?? i.created_at)
    return d >= cutoff30
  }).length

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

      {/* Intelligence overview — only shown when linked coaches exist */}
      {linkedCoachIds.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Intelligence overview</h2>
            {recentIntelCount > 0 && (
              <span className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                {recentIntelCount} entr{recentIntelCount === 1 ? 'y' : 'ies'} in last 30 days
              </span>
            )}
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="text-2xl font-bold text-foreground tabular-nums">{coachesWithIntel}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">of {linkedCoachIds.length} coaches<br/>have intel</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="text-2xl font-bold text-foreground tabular-nums">{totalIntelEntries}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">total entries<br/>across portfolio</p>
            </div>
            <div className={`rounded-lg border p-3 text-center ${coachesWithRisk > 0 ? 'border-red-400/20 bg-red-400/5' : 'border-border bg-surface'}`}>
              <p className={`text-2xl font-bold tabular-nums ${coachesWithRisk > 0 ? 'text-red-400' : 'text-foreground'}`}>{coachesWithRisk}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">coaches with<br/>risk signals</p>
            </div>
            <div className={`rounded-lg border p-3 text-center ${coachesWithSensitive > 0 ? 'border-amber-400/20 bg-amber-400/5' : 'border-border bg-surface'}`}>
              <p className={`text-2xl font-bold tabular-nums ${coachesWithSensitive > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>{coachesWithSensitive}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">coaches with<br/>sensitive entries</p>
            </div>
          </div>

          {/* Top categories */}
          {topCategories.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Most active categories</p>
              <div className="flex flex-wrap gap-2">
                {topCategories.map(([cat, count]) => (
                  <span key={cat} className="inline-flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground">
                    {cat}
                    <span className="tabular-nums text-muted-foreground">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Per-coach signals — compact list */}
          {coachesWithIntel > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Coach intel breakdown</p>
              <div className="rounded-lg border border-border divide-y divide-border">
                {coaches
                  .filter((c) => signalsByCoach[c.coach_id])
                  .sort((a, b) => (signalsByCoach[b.coach_id]?.count ?? 0) - (signalsByCoach[a.coach_id]?.count ?? 0))
                  .slice(0, 8)
                  .map((c) => {
                    const sig = signalsByCoach[c.coach_id]
                    const relColor =
                      sig.profileReliability === 'High' ? 'text-emerald-400' :
                      sig.profileReliability === 'Medium' ? 'text-amber-400' :
                      'text-muted-foreground'
                    return (
                      <div key={c.coach_id} className="flex items-center justify-between gap-4 px-4 py-2.5 hover:bg-muted/20">
                        <div className="min-w-0 flex-1">
                          <Link href={`/coaches/${c.coach_id}`} className="text-sm font-medium text-foreground hover:text-primary truncate block">
                            {c.coaches?.name ?? 'Unknown coach'}
                          </Link>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {c.coaches?.club_current || 'Free agent'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-[10px]">
                          <span className="tabular-nums text-muted-foreground">{sig.count} entr{sig.count === 1 ? 'y' : 'ies'}</span>
                          <span className={relColor}>{sig.profileReliability}</span>
                          {sig.topNegative.length > 0 && (
                            <span className="text-red-400">{sig.topNegative.length} risk</span>
                          )}
                          {sig.hasSensitive && (
                            <span className="text-amber-400">Sensitive</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
              {coaches.filter((c) => signalsByCoach[c.coach_id]).length > 8 && (
                <p className="text-[10px] text-muted-foreground">
                  +{coaches.filter((c) => signalsByCoach[c.coach_id]).length - 8} more coaches with intel. View in Coaches tab.
                </p>
              )}
            </div>
          )}

          {coachesWithIntel === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No intelligence entries recorded for coaches linked to this agent.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
