import Link from 'next/link'
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
  const search = new URLSearchParams({
    entity: 'club',
    clubId: club.id,
    intake: 'club_meeting',
    sourceType: 'club',
    sourceTier: '1',
    sensitivity: 'confidential',
    destination: 'intelligence_item',
    headline: `${displayClubName(club.name, null)} succession signal`,
  })
  return `/intelligence/inbox?${search.toString()}`
}

export default async function SuccessionRadarPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [clubsRes, mandatesRes, intelRes, inboxRes, coachesRes, plansRes] = await Promise.all([
    supabase
      .from('clubs')
      .select('id, name, league, country, tier, current_manager, board_risk_tolerance, strategic_priority, media_pressure, development_vs_win_now, environment_assessment, instability_risk, tactical_model, pressing_model, build_model, market_reputation')
      .eq('user_id', user.id)
      .limit(300),
    supabase
      .from('mandates')
      .select('id, club_id, pipeline_stage, status, strategic_objective, succession_timeline, created_at')
      .eq('user_id', user.id)
      .in('pipeline_stage', ['identified', 'board_approved', 'shortlisting'])
      .limit(150),
    supabase
      .from('intelligence_items')
      .select('id, entity_id, title, category, direction, confidence, occurred_at, verified')
      .eq('user_id', user.id)
      .eq('entity_type', 'club')
      .eq('is_deleted', false)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(500),
    supabase
      .from('intelligence_inbox_items')
      .select('id, club_id, review_status, verification_status, direction, source_recorded_at, created_at')
      .eq('user_id', user.id)
      .not('club_id', 'is', null)
      .limit(300),
    supabase
      .from('coaches')
      .select('id, name, club_current, nationality, available_status, availability_status, market_status, tactical_identity, preferred_style, pressing_intensity, build_preference, player_development_model, academy_integration, leadership_style, overall_manual_score, intelligence_confidence')
      .eq('user_id', user.id)
      .limit(500),
    supabase
      .from('succession_plans')
      .select('id, club_id, linked_mandate_id, status, priority, owner_name, next_review_date, manager_security, succession_timeline, desired_archetype, board_signal, risk_triggers, target_profile, notes, last_signal_at, updated_at')
      .eq('user_id', user.id)
      .limit(300),
  ])

  const radar = buildSuccessionRadar({
    clubs: (clubsRes.data ?? []) as SuccessionClub[],
    mandates: (mandatesRes.data ?? []) as SuccessionMandateSignal[],
    intelligence: (intelRes.data ?? []) as SuccessionIntelSignal[],
    inbox: (inboxRes.data ?? []) as SuccessionInboxSignal[],
    coaches: (coachesRes.data ?? []) as SuccessionCoach[],
    plans: (plansRes.data ?? []) as SuccessionPlan[],
  })

  const buildNow = radar.filter((item) => item.band === 'urgent')
  const watch = radar.filter((item) => item.band === 'watch')
  const openIntel = radar.reduce((total, item) => total + item.openInboxCount, 0)
  const staleIntel = radar.reduce((total, item) => total + item.staleIntelCount, 0)

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <Activity className="h-3.5 w-3.5" />
              Pre-mandate intelligence
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Succession Radar</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Track clubs before they sack a manager, before a formal search opens, and before the market knows. This is where club intelligence becomes a shadow shortlist.
            </p>
          </div>
          <Link
            href="/intelligence/inbox?entity=club&intake=club_meeting&sourceType=club&sourceTier=1&sensitivity=confidential&destination=intelligence_item"
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
          {radar.slice(0, 18).map((item) => {
            const clubName = displayClubName(item.club.name, null)
            return (
              <article key={item.club.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{clubName}</h2>
                      <span className={cn('rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', bandClass(item.band))}>
                        {prettyBand(item.band)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[item.club.league, item.club.country, item.club.current_manager ? `Manager: ${item.club.current_manager}` : 'Manager not confirmed'].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="min-w-[160px] text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Succession heat</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{item.score}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-muted">
                      <div className={cn('h-1.5 rounded-full', scoreBar(item.score))} style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
                  <div className="rounded-md border border-border bg-background/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Likely coach type</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{item.archetype}</p>
                    <div className="mt-3 space-y-1.5">
                      {item.rationale.length > 0 ? item.rationale.map((reason) => (
                        <p key={reason} className="text-xs leading-5 text-muted-foreground">- {reason}</p>
                      )) : (
                        <p className="text-xs leading-5 text-muted-foreground">No strong succession pressure yet. Keep monitoring the club environment.</p>
                      )}
                    </div>
                    <p className="mt-3 rounded border border-primary/20 bg-primary/10 px-3 py-2 text-xs leading-5 text-primary">
                      {item.nextAction}
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-background/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shadow shortlist prompts</p>
                      <span className="text-[10px] text-muted-foreground">{item.suggestedCoaches.length} coach fits</span>
                    </div>
                    {item.suggestedCoaches.length === 0 ? (
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        Capture club context first, then run a mandate-style scan when the target profile is clearer.
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-2">
                        {item.suggestedCoaches.map((coach) => (
                          <Link key={coach.id} href={`/coaches/${coach.id}`} className="rounded border border-border bg-card/60 px-3 py-2 transition-colors hover:border-primary/35">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold text-foreground">{coach.name}</p>
                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                  {[coach.club_current, coach.nationality].filter(Boolean).join(' · ') || 'Profile context pending'}
                                </p>
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-primary">{coach.fitScore}</span>
                            </div>
                            {coach.fitReasons.length > 0 && (
                              <p className="mt-2 text-[10px] leading-4 text-muted-foreground">{coach.fitReasons.join(' · ')}</p>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
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
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">How this should work</p>
            <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
              <p>Clubs do not have to become mandates immediately. First they can sit here as succession watch items.</p>
              <p>Every signal should answer one question: is this a future appointment situation, and what kind of coach would survive it?</p>
              <p>When the club becomes real, you already have a shadow shortlist, source history and evidence gaps.</p>
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
