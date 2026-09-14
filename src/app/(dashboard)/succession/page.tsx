import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { assertRouteQueries, successionCaptureHref, isActiveAppointment } from '@/lib/coaches/route-audit'
import { redirect } from 'next/navigation'
import { Activity, ArrowRight, Building2, ClipboardList, Clock, FileInput, Radio, ShieldAlert, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { displayClubName } from '@/lib/display-names'
import {
  buildSuccessionRadar,
  type SuccessionClub,
  type SuccessionCoach,
  type SuccessionInboxSignal,
  type SuccessionIntelSignal,
  type SuccessionMandateSignal,
  type SuccessionPlan,
} from '@/lib/succession/radar'
import { cn } from '@/lib/utils'
import { ResearchComparison } from './_components/research-comparison'

export const metadata = { title: 'Succession' }


function bandClass(band: string) {
  if (band === 'urgent') return 'border-red-500/30 bg-red-500/10 text-red-200'
  if (band === 'watch') return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
  return 'border-sky-500/25 bg-sky-500/10 text-sky-200'
}

function scoreBar(score: number) {
  if (score >= 55) return 'bg-red-400'
  if (score >= 30) return 'bg-amber-400'
  return 'bg-sky-400'
}

function prettyBand(band: string) {
  if (band === 'urgent') return 'Build now'
  if (band === 'watch') return 'Watch closely'
  return 'Nurture'
}

function captureHref(club: SuccessionClub) {
  return successionCaptureHref({ id: club.id, name: displayClubName(club.name, null) })
}

export default async function SuccessionRadarPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string; show?: string }> }) {
  const feedback = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [clubsRes, mandatesRes, intelRes, inboxRes, coachesRes, plansRes] = await Promise.all([
    (async () => {
      const fetchPage = (offset: number) => supabase
        .from('clubs')
        .select('id, name, league, country, tier, current_manager, board_risk_tolerance, strategic_priority, media_pressure, development_vs_win_now, environment_assessment, instability_risk, tactical_model, pressing_model, build_model, market_reputation', { count: 'exact' })
        .order('id')
        .range(offset, offset + 299)
      const first = await fetchPage(0)
      assertRouteQueries('Succession clubs', first)
      const data = [...(first.data ?? [])]
      while (data.length < (first.count ?? 0)) {
        const next = await fetchPage(data.length)
        assertRouteQueries('Succession clubs', next)
        if (!next.data?.length) throw new Error('Club records changed while loading. Refresh succession planning.')
        data.push(...next.data)
      }
      return { ...first, data }
    })(),
    supabase
      .from('mandates')
      .select('id, club_id, pipeline_stage, status, strategic_objective, succession_timeline, created_at, tactical_model_required, pressing_intensity_required, build_preference_required, decision_brief', { count: 'exact' })
      .in('status', ['Active', 'In Progress', 'On Hold'])
      .or('pipeline_stage.is.null,pipeline_stage.neq.closed')
      .limit(1000),
    supabase
      .from('intelligence_items')
      .select('id, entity_id, title, category, direction, confidence, occurred_at, verified')
      .eq('entity_type', 'club')
      .eq('is_deleted', false)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(500),
    supabase
      .from('intelligence_inbox_items')
      .select('id, club_id, review_status, verification_status, direction, source_recorded_at, created_at')
      .not('club_id', 'is', null)
      .limit(300),
    supabase
      .from('coaches')
      .select('id, name, club_current, nationality, available_status, availability_status, market_status, tactical_identity, preferred_style, pressing_intensity, build_preference, player_development_model, academy_integration, leadership_style, overall_manual_score, intelligence_confidence')
      .limit(500),
    supabase
      .from('succession_plans')
      .select('id, club_id, linked_mandate_id, status, priority, owner_name, next_review_date, manager_security, succession_timeline, desired_archetype, board_signal, risk_triggers, target_profile, notes, last_signal_at, updated_at')
      .limit(300),
  ])

  assertRouteQueries('Succession radar', clubsRes, mandatesRes, intelRes, inboxRes, coachesRes, plansRes)
  if ((mandatesRes.count ?? 0) > (mandatesRes.data?.length ?? 0)) throw new Error('Active mandate briefs were truncated. Load all linked briefs before comparing coaches.')

  const activeMandates = (mandatesRes.data ?? []).filter(isActiveAppointment) as SuccessionMandateSignal[]
  const linkedClubIds = new Set(activeMandates.map((mandate) => mandate.club_id))
  const radar = buildSuccessionRadar({
    clubs: (clubsRes.data ?? []) as SuccessionClub[],
    mandates: activeMandates,
    intelligence: (intelRes.data ?? []) as SuccessionIntelSignal[],
    inbox: (inboxRes.data ?? []) as SuccessionInboxSignal[],
    coaches: (coachesRes.data ?? []) as SuccessionCoach[],
    plans: (plansRes.data ?? []) as SuccessionPlan[],
  })

  // Keep the urgency order within each group; only explicit club_id relations qualify.
  const linkedClubs = radar.filter((item) => linkedClubIds.has(item.club.id))
  const otherClubs = radar.filter((item) => !linkedClubIds.has(item.club.id))
  const showAll = feedback.show === 'all'
  const groups = [
    { id: 'linked-briefs', title: 'Clubs with active linked briefs', items: linkedClubs, total: linkedClubs.length,
      description: 'All clubs with an explicitly linked active brief appear here, regardless of planning urgency. Multiple briefs require a selection in the plan.' },
    { id: 'other-clubs', title: 'Other clubs by planning urgency', items: showAll ? otherClubs : otherClubs.slice(0, 18), total: otherClubs.length,
      description: 'No active brief is linked to these club records. Fit uses supported saved club fields only; similarly named records do not share requirements.' },
  ]
  const buildNow = radar.filter((item) => item.band === 'urgent')
  const watch = radar.filter((item) => item.band === 'watch')
  const openIntel = radar.reduce((total, item) => total + item.openInboxCount, 0)
  const staleIntel = radar.reduce((total, item) => total + item.staleIntelCount, 0)

  return (
    <div className="space-y-5">
      {feedback.error && <p role="alert" className="rounded border p-3 text-sm text-destructive">{feedback.error}</p>}
      {feedback.success && <p role="status" className="rounded border p-3 text-sm">{feedback.success}</p>}
      <p className="text-sm text-muted-foreground">Urgency prioritises planning work from saved signals and evidence gaps. Football fit uses reviewed research and supported saved requirements separately.</p>
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <Activity className="h-3.5 w-3.5" />
              Pre-mandate intelligence
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Succession planning</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Track succession signals, agree the club’s requirements and compare researched coaches before a formal search opens.
            </p>
          </div>
          <Link
            href={successionCaptureHref()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <FileInput className="h-3.5 w-3.5" />
            Capture succession signal
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            { label: 'Build now', value: buildNow.length, icon: ShieldAlert },
            { label: 'Watch closely', value: watch.length, icon: Radio },
            { label: 'Open club intel', value: openIntel, icon: FileInput },
            { label: 'Stale sources', value: staleIntel, icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-md border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
              </div>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{radar.length} club records · {linkedClubs.length} with active linked briefs · {otherClubs.length} without. Each record appears once; urgency scores are unchanged by grouping.</p>
          {groups.map((group) => (
            <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="space-y-3">
              <div className="pt-3">
                <h2 id={`${group.id}-heading`} className="text-lg font-semibold">{group.title} <span className="text-sm font-normal text-muted-foreground">({group.items.length} of {group.total})</span></h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{group.description}</p>
                {group.id === 'other-clubs' && otherClubs.length > 18 && (
                  <Link href={showAll ? '/succession#other-clubs' : '/succession?show=all#other-clubs'} className="mt-2 inline-block text-sm text-primary underline">
                    {showAll ? 'Show first 18 other clubs' : `Show all ${otherClubs.length} other clubs`}
                  </Link>
                )}
                {group.total === 0 && <p className="mt-2 text-sm text-muted-foreground">No club records in this group.</p>}
              </div>
          {group.items.map((item) => {
            const clubName = displayClubName(item.club.name, null)
            return (
              <article key={item.club.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{clubName}</h3>
                      <span className={cn('rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', bandClass(item.band))}>
                        {prettyBand(item.band)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[item.club.league, item.club.country, item.club.current_manager ? `Manager: ${item.club.current_manager}` : 'Manager not confirmed'].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {linkedClubIds.has(item.club.id) ? 'Source: active brief linked to this club record' : 'Source: saved club fields · no active brief linked to this record'}
                    </p>
                    <p className="mt-1 break-all text-[10px] text-muted-foreground">Club record: {item.club.id}</p>
                  </div>
                  <div className="min-w-[160px] text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Planning urgency</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{item.score}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-muted">
                      <div className={cn('h-1.5 rounded-full', scoreBar(item.score))} style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
                  <div className="rounded-md border border-border bg-background/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Planning archetype</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{item.archetype}</p><p className="mt-1 text-xs text-muted-foreground">{item.plan?.desired_archetype ? 'Saved plan value · not scored' : 'Inferred planning prompt · not a saved requirement or scored criterion'}</p>
                    <div className="mt-3 space-y-1.5">
                      {item.rationale.length > 0 ? item.rationale.map((reason) => (
                        <p key={reason} className="text-xs leading-5 text-muted-foreground">- {reason}</p>
                      )) : (
                        <p className="text-xs leading-5 text-muted-foreground">No strong pressure showing — but that doesn’t mean the manager is safe.</p>
                      )}
                    </div>
                    <p className="mt-3 rounded border border-primary/20 bg-primary/10 px-3 py-2 text-xs leading-5 text-primary">
                      {item.nextAction}
                    </p>
                  </div>

                  <ResearchComparison plan={item} returnTo="/succession" compact />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span className="rounded bg-muted px-2 py-1">{item.intelCount} club intel</span>
                    <span className="rounded bg-muted px-2 py-1">{item.openInboxCount} open inbox</span>
                    <span className="rounded bg-muted px-2 py-1">{item.staleIntelCount} stale sources</span>
                    {item.warmMandate && <span className="rounded bg-primary/10 px-2 py-1 text-primary">warm mandate</span>}
                    {item.plan && <span className="rounded bg-primary/10 px-2 py-1 text-primary">{item.plan.status.replaceAll('_', ' ')}</span>}
                    {item.plan?.next_review_date && <span className="rounded bg-muted px-2 py-1">review {item.plan.next_review_date}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/succession/${item.club.id}`} className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Open plan
                    </Link>
                    <Link href={`/clubs/${item.club.id}`} className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      Open club
                    </Link>
                    <Link href={captureHref(item.club)} className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/15">
                      Capture signal
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
            </section>
          ))}
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">How this should work</p>
            <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
              <p>A club doesn’t have to become a mandate straight away — it can sit here on the watch list first.</p>
              <p>Every signal answers one question: is a job likely to come up, and what kind of coach would succeed there?</p>
              <p>When the job comes up, you already have a quiet shortlist, the background and a list of what’s missing.</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Capture checklist</p>
            <div className="mt-3 space-y-2">
              {[
                'Manager security and board mood',
                'Sporting director / CEO stability',
                'Likely budget and compensation tolerance',
                'Squad direction: rebuild, promotion, survival, youth',
                'Owner risk appetite and media pressure',
                'Early coach archetype and gettable names',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
