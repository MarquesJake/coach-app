import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Building2, ClipboardList, FileInput, ShieldAlert, Target, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { displayClubName } from '@/lib/display-names'
import {
  buildSuccessionRadar,
  type RadarClub,
  type SuccessionClub,
  type SuccessionCoach,
  type SuccessionInboxSignal,
  type SuccessionIntelSignal,
  type SuccessionMandateSignal,
} from '@/lib/succession/radar'
import { cn } from '@/lib/utils'
import { convertSuccessionPlanToMandateAction } from '../actions'

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

function scoreClass(score: number) {
  if (score >= 75) return 'text-emerald-300'
  if (score >= 60) return 'text-primary'
  if (score >= 45) return 'text-amber-300'
  return 'text-muted-foreground'
}

function bandLabel(plan: RadarClub) {
  if (plan.band === 'urgent') return 'Build now'
  if (plan.band === 'watch') return 'Watch closely'
  return 'Nurture'
}

function FitBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default async function SuccessionPlanPage({
  params,
}: {
  params: { clubId: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const clubId = params.clubId

  const [clubRes, mandatesRes, intelRes, inboxRes, coachesRes] = await Promise.all([
    supabase
      .from('clubs')
      .select('id, name, league, country, tier, current_manager, board_risk_tolerance, strategic_priority, media_pressure, development_vs_win_now, environment_assessment, instability_risk, tactical_model, pressing_model, build_model, market_reputation')
      .eq('user_id', user.id)
      .eq('id', clubId)
      .single(),
    supabase
      .from('mandates')
      .select('id, club_id, pipeline_stage, status, strategic_objective, succession_timeline, created_at')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('intelligence_items')
      .select('id, entity_id, title, detail, category, direction, confidence, occurred_at, verified, source_type, source_name, sensitivity')
      .eq('user_id', user.id)
      .eq('entity_type', 'club')
      .eq('entity_id', clubId)
      .eq('is_deleted', false)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(30),
    supabase
      .from('intelligence_inbox_items')
      .select('id, club_id, review_status, verification_status, direction, source_recorded_at, created_at, headline, intake_type, sensitivity')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('coaches')
      .select('id, name, club_current, nationality, available_status, availability_status, market_status, tactical_identity, preferred_style, pressing_intensity, build_preference, player_development_model, academy_integration, leadership_style, overall_manual_score, intelligence_confidence')
      .eq('user_id', user.id)
      .limit(500),
  ])

  if (clubRes.error || !clubRes.data) redirect('/succession?error=Club+not+found')

  const [plan] = buildSuccessionRadar({
    clubs: [clubRes.data as SuccessionClub],
    mandates: (mandatesRes.data ?? []) as SuccessionMandateSignal[],
    intelligence: (intelRes.data ?? []) as SuccessionIntelSignal[],
    inbox: (inboxRes.data ?? []) as SuccessionInboxSignal[],
    coaches: (coachesRes.data ?? []) as SuccessionCoach[],
  })

  const clubName = displayClubName(plan.club.name, null)
  const defaults = plan.mandateDefaults
  const activeMandate = (mandatesRes.data ?? []).find((mandate) => mandate.pipeline_stage !== 'closed')
  const intelligence = intelRes.data ?? []
  const inbox = inboxRes.data ?? []
  const openInbox = inbox.filter((item) => !['promoted', 'archived'].includes(item.review_status))

  const gaps = [
    intelligence.length === 0 ? 'No verified club intelligence captured yet' : null,
    openInbox.length > 0 ? `${openInbox.length} inbox item${openInbox.length === 1 ? '' : 's'} need triage` : null,
    !plan.club.current_manager ? 'Current manager status is not confirmed in platform data' : null,
    !plan.club.environment_assessment ? 'Environment and ownership dynamics need a football-person read' : null,
    !plan.club.market_reputation ? 'Market reputation and agent temperature need checking' : null,
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/succession" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Succession radar
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link href={captureHref(plan.club)} className="inline-flex items-center gap-2 rounded border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15">
            <FileInput className="h-3.5 w-3.5" />
            Capture signal
          </Link>
          {activeMandate ? (
            <Link href={`/mandates/${activeMandate.id}/workspace`} className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              Open active mandate
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <form action={convertSuccessionPlanToMandateAction}>
              <input type="hidden" name="club_id" value={plan.club.id} />
              <button className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                Convert to mandate
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <ShieldAlert className="h-3.5 w-3.5" />
              Confidential succession plan
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{clubName}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Pre-mandate planning file for the club situation, coach archetype, source gaps and shadow shortlist before a formal search is opened.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
              <span className="rounded bg-muted px-2 py-1">{[plan.club.league, plan.club.country].filter(Boolean).join(' · ') || 'League context pending'}</span>
              <span className="rounded bg-muted px-2 py-1">{plan.club.current_manager ? `Manager: ${plan.club.current_manager}` : 'Manager not confirmed'}</span>
              <span className="rounded bg-primary/10 px-2 py-1 text-primary">{bandLabel(plan)}</span>
            </div>
          </div>
          <div className="rounded-md border border-border bg-background/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Succession heat</p>
            <p className={cn('mt-2 text-4xl font-semibold tabular-nums', scoreClass(plan.score))}>{plan.score}</p>
            <div className="mt-3 h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${plan.score}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{plan.nextAction}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Club situation</p>
              <div className="mt-3 grid gap-3">
                {[
                  ['Strategic priority', plan.club.strategic_priority],
                  ['Instability risk', plan.club.instability_risk],
                  ['Media pressure', plan.club.media_pressure],
                  ['Board risk tolerance', plan.club.board_risk_tolerance],
                  ['Environment read', plan.club.environment_assessment],
                  ['Market reputation', plan.club.market_reputation],
                ].map(([label, value]) => (
                  <div key={label} className="rounded border border-border bg-background/40 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-foreground">{value || 'Needs capture'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mandate shape if activated</p>
              <div className="mt-3 grid gap-3">
                {[
                  ['Objective', defaults.strategic_objective],
                  ['Coach archetype', plan.archetype],
                  ['Tactical model', defaults.tactical_model_required],
                  ['Pressing', defaults.pressing_intensity_required],
                  ['Build preference', defaults.build_preference_required],
                  ['Leadership', defaults.leadership_profile_required],
                  ['Timeline', defaults.succession_timeline],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 border-b border-border/70 pb-2 last:border-b-0 last:pb-0">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
                    <span className="max-w-[210px] text-right text-xs leading-5 text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shadow shortlist</p>
              <span className="text-[10px] text-muted-foreground">{plan.suggestedCoaches.length} current fits</span>
            </div>
            <div className="mt-3 grid gap-3">
              {plan.suggestedCoaches.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">Capture more club context before recommending names.</p>
              ) : plan.suggestedCoaches.map((coach) => (
                <Link key={coach.id} href={`/coaches/${coach.id}`} className="rounded-md border border-border bg-background/40 p-3 transition-colors hover:border-primary/35">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{coach.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{[coach.club_current, coach.nationality].filter(Boolean).join(' · ') || 'Profile context pending'}</p>
                    </div>
                    <span className={cn('text-lg font-semibold tabular-nums', scoreClass(coach.fitScore))}>{coach.fitScore}</span>
                  </div>
                  {coach.fitReasons.length > 0 && (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{coach.fitReasons.join(' · ')}</p>
                  )}
                  <div className="mt-3 grid gap-2 md:grid-cols-5">
                    <FitBar label="Tactical" value={coach.fitBreakdown.tactical} />
                    <FitBar label="Development" value={coach.fitBreakdown.development} />
                    <FitBar label="Environment" value={coach.fitBreakdown.environment} />
                    <FitBar label="Availability" value={coach.fitBreakdown.availability} />
                    <FitBar label="Evidence" value={coach.fitBreakdown.evidence} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent intelligence</p>
            <div className="mt-3 grid gap-2">
              {intelligence.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">No clean club intelligence yet. Capture board mood, staff situation, pressure triggers and likely decision timeline.</p>
              ) : intelligence.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded border border-border bg-background/40 px-3 py-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <span className="text-[10px] text-muted-foreground">{item.verified ? 'Verified' : 'Single source'}</span>
                  </div>
                  {item.detail && <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>}
                  <p className="mt-2 text-[10px] text-muted-foreground">{[item.source_type, item.source_name, item.sensitivity].filter(Boolean).join(' · ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Why this matters</p>
            <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
              <p>This is the layer for clubs who are not ready to sack a manager publicly, but need to know the market quietly.</p>
              <p>The value is not just names. It is knowing the club environment, who can survive it, and what evidence is still missing before a board recommendation.</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Triggers and rationale</p>
            <div className="mt-3 space-y-2">
              {plan.rationale.length === 0 ? (
                <p className="text-xs leading-5 text-muted-foreground">No major pressure trigger yet. Keep this club in nurture mode.</p>
              ) : plan.rationale.map((reason) => (
                <div key={reason} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Evidence gaps</p>
            <div className="mt-3 space-y-2">
              {gaps.length === 0 ? (
                <p className="text-xs leading-5 text-muted-foreground">The club file has enough source material to start shaping an appointment recommendation.</p>
              ) : gaps.map((gap) => (
                <div key={gap} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                  <span>{gap}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next operator actions</p>
            <div className="mt-3 space-y-2">
              {[
                'Speak to club-side source about board mood and manager security.',
                'Speak to agent network about which candidates are genuinely gettable.',
                'Watch recent interviews for cultural and communication fit.',
                'Convert only when the club wants formal options or the situation moves.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Link href={`/clubs/${plan.club.id}`} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 text-sm font-medium text-foreground hover:border-primary/35">
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Open club profile
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </aside>
      </section>
    </div>
  )
}
