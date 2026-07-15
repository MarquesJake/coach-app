import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Inbox,
  MessageSquarePlus,
  Network,
  ShieldCheck,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'

/* eslint-disable @typescript-eslint/no-explicit-any */

type Signal = {
  id: string
  title: string
  detail: string | null
  entity_type: string
  entity_id: string
  source_name: string | null
  source_type: string | null
  source_tier: string | null
  confidence: number | null
  occurred_at: string | null
  created_at: string
  verified: boolean
  direction: string | null
  sensitivity: string | null
  source_expires_at: string | null
}

function displayDate(value: string | null) {
  if (!value) return 'Date not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date not recorded'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function entityHref(signal: Signal) {
  if (signal.entity_type === 'coach') return `/coaches/${signal.entity_id}/intelligence?entry=${signal.id}`
  if (signal.entity_type === 'club') return `/clubs/${signal.entity_id}`
  if (signal.entity_type === 'mandate') return `/mandates/${signal.entity_id}/workspace`
  return '/intelligence'
}

function statusLabel(signal: Signal, now: Date) {
  if (signal.source_expires_at && new Date(signal.source_expires_at) < now) return 'Refresh required'
  if (signal.sensitivity?.toLowerCase() === 'high') return 'Sensitive'
  if (signal.verified) return 'Verified'
  return 'Needs review'
}

function statusClass(signal: Signal, now: Date) {
  if (signal.source_expires_at && new Date(signal.source_expires_at) < now) return 'border-amber-700/20 bg-amber-50 text-amber-900'
  if (signal.sensitivity?.toLowerCase() === 'high') return 'border-red-700/20 bg-red-50 text-red-900'
  if (signal.verified) return 'border-emerald-700/20 bg-emerald-50 text-emerald-900'
  return 'border-border bg-muted/40 text-muted-foreground'
}

function directionClass(direction: string | null) {
  if (direction === 'Positive') return 'text-emerald-800'
  if (direction === 'Negative') return 'text-red-800'
  return 'text-muted-foreground'
}

function WorkCard({
  icon: Icon,
  eyebrow,
  value,
  label,
  detail,
  href,
}: {
  icon: typeof Inbox
  eyebrow: string
  value: number
  label: string
  detail: string
  href: string
}) {
  return (
    <Link href={href} className="group border border-border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-muted/25">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{eyebrow}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
          <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
        </div>
        <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{detail}</p>
    </Link>
  )
}

export default async function IntelligencePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const organizationId = await getInternalOrganizationId(user.id)
  const db = supabase as any
  const now = new Date()

  const [
    signalsRes,
    inboxRes,
    coachesRes,
    sessionsRes,
    claimsRes,
    campaignsRes,
    contactsRes,
  ] = await Promise.all([
    supabase
      .from('intelligence_items')
      .select('id, title, detail, entity_type, entity_id, source_name, source_type, source_tier, confidence, occurred_at, created_at, verified, direction, sensitivity, source_expires_at')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('intelligence_inbox_items')
      .select('id, review_status')
      .eq('user_id', user.id)
      .in('review_status', ['captured', 'triage', 'needs_verification', 'ready_to_promote']),
    supabase.from('coaches').select('id, name').eq('user_id', user.id),
    organizationId
      ? db.from('intelligence_sessions').select('id, processing_status').eq('org_id', organizationId).in('processing_status', ['captured', 'reviewing'])
      : Promise.resolve({ data: [] }),
    organizationId
      ? db.from('profile_claims').select('id, review_status').eq('org_id', organizationId).is('deleted_at', null).eq('review_status', 'pending')
      : Promise.resolve({ data: [] }),
    organizationId
      ? db.from('reference_campaigns').select('id, next_action, next_review_at').eq('org_id', organizationId).in('status', ['draft', 'active'])
      : Promise.resolve({ data: [] }),
    organizationId
      ? db.from('football_contacts').select('id, next_follow_up_at').eq('org_id', organizationId).not('next_follow_up_at', 'is', null)
      : Promise.resolve({ data: [] }),
  ])

  const coachNames = new Map((coachesRes.data ?? []).map((coach) => [coach.id, coach.name]))
  const signals = (signalsRes.data ?? []) as Signal[]
  const inboxCount = inboxRes.data?.length ?? 0
  const openSessions = sessionsRes.data?.length ?? 0
  const pendingClaims = claimsRes.data?.length ?? 0
  const activeCampaigns = campaignsRes.data?.length ?? 0
  const overdueFollowUps = [
    ...(campaignsRes.data ?? []).map((campaign: { next_review_at: string | null }) => campaign.next_review_at),
    ...(contactsRes.data ?? []).map((contact: { next_follow_up_at: string | null }) => contact.next_follow_up_at),
  ].filter((date): date is string => Boolean(date) && new Date(date) < now).length
  const nextCampaign = (campaignsRes.data ?? []).find((campaign: { next_action: string | null }) => campaign.next_action)?.next_action

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5">
      <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Internal decision desk</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground">Current work</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Current signals and the work needed to turn football knowledge into approved, usable evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/intelligence/inbox" className="inline-flex h-9 items-center gap-2 border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/35">
            <Inbox className="h-4 w-4" />Triage intake
          </Link>
          <Link href="/intelligence/conversations" className="inline-flex h-9 items-center gap-2 bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <MessageSquarePlus className="h-4 w-4" />Capture conversation
          </Link>
        </div>
      </header>

      <section className="grid border border-border bg-card sm:grid-cols-2 xl:grid-cols-4">
        <WorkCard icon={Inbox} eyebrow="Intake" value={inboxCount} label="items to triage" detail="Raw material stays outside recommendations until reviewed." href="/intelligence/inbox" />
        <WorkCard icon={MessageSquarePlus} eyebrow="Conversations" value={openSessions} label="sessions in review" detail="Turn notes or transcripts into narrow, reviewable findings." href="/intelligence/conversations" />
        <WorkCard icon={ClipboardCheck} eyebrow="Findings" value={pendingClaims} label="findings awaiting sign-off" detail="Only reviewed findings strengthen a profile or assessment." href="/intelligence/review" />
        <WorkCard icon={Clock3} eyebrow="Network" value={overdueFollowUps} label="overdue follow-ups" detail={nextCampaign ?? `${activeCampaigns} active reference round${activeCampaigns === 1 ? '' : 's'}.`} href="/network/campaigns" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Live signals</p>
              <h2 className="mt-1 text-base font-semibold text-foreground">Current, discrete intelligence only</h2>
            </div>
            <p className="text-xs text-muted-foreground">Assessment evidence, references and private materials live in their relevant workspaces.</p>
          </div>

          {signals.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/40"><CheckCircle2 className="h-5 w-5 text-emerald-700" /></span>
              <h3 className="mt-4 text-base font-semibold text-foreground">The live feed is clear</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Capture the next real conversation or triage a new source. It will enter the evidence process before it appears as a usable signal.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link href="/intelligence/conversations" className="inline-flex h-9 items-center gap-2 bg-primary px-3 text-sm font-semibold text-primary-foreground"><MessageSquarePlus className="h-4 w-4" />Capture conversation</Link>
                <Link href="/intelligence/inbox" className="inline-flex h-9 items-center gap-2 border border-border bg-card px-3 text-sm font-medium text-foreground"><Inbox className="h-4 w-4" />Triage intake</Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {signals.map((signal) => {
                const coachName = signal.entity_type === 'coach' ? coachNames.get(signal.entity_id) : null
                const label = statusLabel(signal, now)
                return (
                  <Link key={signal.id} href={entityHref(signal)} className="group block px-5 py-4 transition-colors hover:bg-muted/25">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${statusClass(signal, now)}`}>{label}</span>
                          {signal.direction && <span className={`text-[11px] font-medium ${directionClass(signal.direction)}`}>{signal.direction}</span>}
                          {coachName && <span className="text-[11px] text-muted-foreground">{coachName}</span>}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">{signal.title}</p>
                        {signal.detail && <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{signal.detail}</p>}
                        <p className="mt-3 text-xs text-muted-foreground">{[signal.source_type, signal.source_name, signal.source_tier ? `T${signal.source_tier.replace(/^T/i, '')}` : null, signal.confidence != null ? `${signal.confidence}% confidence` : null].filter(Boolean).join(' · ') || 'Source context incomplete'}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground"><span>{displayDate(signal.occurred_at ?? signal.created_at)}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="border border-border bg-card p-5">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Evidence rule</p></div>
            <p className="mt-3 text-sm font-semibold leading-6 text-foreground">A signal is not a recommendation.</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Raw notes are captured first. An analyst reviews findings, records confidence and provenance, then explicitly uses approved evidence in a mandate.</p>
          </section>
          <section className="border border-border bg-card p-5">
            <div className="flex items-center gap-2"><Network className="h-4 w-4 text-primary" /><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Next network move</p></div>
            <p className="mt-3 text-sm font-semibold leading-6 text-foreground">{nextCampaign ?? 'Start with a contact, not a generic research task.'}</p>
            <Link href="/network" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">Open Football Network <ArrowRight className="h-3.5 w-3.5" /></Link>
          </section>
        </aside>
      </section>
    </div>
  )
}
