import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStageLabel } from '@/lib/constants/mandateStages'
import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, Users, TrendingUp, CheckCircle2, ChevronRight, Activity, Bell, Plus, Radio } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type MandateRow = {
  id: string
  status: string
  priority: string
  pipeline_stage: string | null
  target_completion_date: string
  engagement_date: string
  budget_band: string
  custom_club_name: string | null
  clubs: { name: string | null; league: string | null } | null
  mandate_shortlist: { id: string }[]
}

type DeliverableRow = {
  id: string
  item: string
  due_date: string
  status: string
  mandate_id: string
  mandates: { custom_club_name: string | null; clubs: { name: string | null } | null } | null
}

type ActivityRow = {
  id: string
  entity_id: string
  action_type: string
  description: string
  created_at: string
  metadata: Record<string, unknown> | null
}

type AlertRow = {
  id: string
  title: string
  detail: string | null
  alert_type: string
  created_at: string
}

type CoachUpdateRow = {
  id: string
  update_note: string
  update_type: string | null
  confidence: string | null
  occurred_at: string | null
  coaches: { id: string; name: string | null; club_current: string | null } | null
}

type NextAction = {
  id: string
  title: string
  detail: string
  href: string
  tone: 'danger' | 'warning' | 'info'
}

// ── Risk flag logic ────────────────────────────────────────────────────────────

type RiskFlag = 'overdue' | 'no_depth' | 'stale' | 'no_shortlist'

function getRiskFlags(
  mandate: MandateRow,
  lastActivityMap: Map<string, string>
): RiskFlag[] {
  const flags: RiskFlag[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(mandate.target_completion_date)
  const shortlistCount = mandate.mandate_shortlist.length
  const isLive = !['closed'].includes(mandate.pipeline_stage ?? '')
  const isCompleted = mandate.status === 'Completed'

  if (!isCompleted && target < today) flags.push('overdue')

  if (isLive && !isCompleted) {
    if (shortlistCount === 0 && mandate.pipeline_stage !== 'identified') flags.push('no_shortlist')
    else if (shortlistCount < 2 && ['shortlisting', 'interviews', 'final_2', 'offer'].includes(mandate.pipeline_stage ?? '')) flags.push('no_depth')
  }

  // Stale: no activity in 7+ days (real data if available, else based on engagement_date)
  const lastActivity = lastActivityMap.get(mandate.id)
  const lastDate = lastActivity ? new Date(lastActivity) : new Date(mandate.engagement_date)
  const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  if (!isCompleted && daysSince >= 7) flags.push('stale')

  return flags
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stageColour(stage: string | null) {
  switch (stage) {
    case 'identified': return 'text-muted-foreground bg-surface border-border'
    case 'board_approved': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    case 'shortlisting': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    case 'interviews': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    case 'final_2': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    case 'offer': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    case 'closed': return 'text-muted-foreground bg-surface border-border'
    default: return 'text-muted-foreground bg-surface border-border'
  }
}

function priorityDot(priority: string) {
  if (priority === 'High') return 'bg-red-400'
  if (priority === 'Medium') return 'bg-amber-400'
  return 'bg-muted-foreground/30'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatRelative(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`
  return formatDate(iso)
}

function actionToneClass(tone: NextAction['tone']) {
  if (tone === 'danger') return 'border-red-400/20 bg-red-400/[0.06] text-red-300'
  if (tone === 'warning') return 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300'
  return 'border-sky-400/20 bg-sky-400/[0.06] text-sky-300'
}

function clubName(m: { custom_club_name: string | null; clubs: { name: string | null } | null } | null) {
  if (!m) return 'Unknown'
  return m.custom_club_name ?? m.clubs?.name ?? 'Unknown club'
}

function getMandateNextStep(mandate: MandateRow, flags: RiskFlag[]) {
  if (flags.includes('overdue')) return 'Reset target date or close the search'
  if (flags.includes('no_shortlist')) return 'Build an initial shortlist'
  if (flags.includes('no_depth')) return 'Add shortlist depth before board review'
  if (flags.includes('stale')) return 'Record the next search action'
  if ((mandate.mandate_shortlist?.length ?? 0) >= 3) return 'Prepare decision recommendation'
  return 'Advance candidate evidence'
}

function riskIcon(flag: RiskFlag) {
  switch (flag) {
    case 'overdue': return { icon: Clock, label: 'Overdue', colour: 'text-red-400' }
    case 'no_shortlist': return { icon: Users, label: 'No shortlist', colour: 'text-red-400' }
    case 'no_depth': return { icon: Users, label: 'Thin shortlist', colour: 'text-amber-400' }
    case 'stale': return { icon: Activity, label: 'Stale', colour: 'text-amber-400' }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  // All fetches in parallel
  const [mandatesRes, deliverablesRes, activityRes, alertsRes, coachUpdatesRes] = await Promise.all([
    supabase
      .from('mandates')
      .select(`
        id, status, priority, pipeline_stage,
        target_completion_date, engagement_date, budget_band,
        custom_club_name,
        clubs ( name, league ),
        mandate_shortlist ( id )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('mandate_deliverables')
      .select(`
        id, item, due_date, status, mandate_id,
        mandates ( custom_club_name, clubs ( name ) )
      `)
      .eq('mandates.user_id', user.id)
      .neq('status', 'Completed')
      .gte('due_date', today.toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(6),

    supabase
      .from('activity_log')
      .select('id, entity_id, action_type, description, created_at, metadata')
      .eq('user_id', user.id)
      .eq('entity_type', 'mandate')
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('alerts')
      .select('id, title, detail, alert_type, created_at')
      .eq('user_id', user.id)
      .eq('is_seen', false)
      .order('created_at', { ascending: false })
      .limit(4),

    supabase
      .from('coach_updates')
      .select(`
        id, update_note, update_type, confidence, occurred_at,
        coaches!inner ( id, name, club_current )
      `)
      .eq('coaches.user_id', user.id)
      .eq('confidence', 'High')
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(4),
  ])

  const mandates = (mandatesRes.data ?? []) as MandateRow[]
  const deliverables = (deliverablesRes.data ?? []) as DeliverableRow[]
  const activityLog = (activityRes.data ?? []) as ActivityRow[]
  const alerts = (alertsRes.data ?? []) as AlertRow[]
  const coachUpdates = (coachUpdatesRes.data ?? []) as CoachUpdateRow[]

  // Build last-activity-per-mandate map
  const lastActivityMap = new Map<string, string>()
  for (const a of activityLog) {
    if (!lastActivityMap.has(a.entity_id)) {
      lastActivityMap.set(a.entity_id, a.created_at)
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeMandates = mandates.filter(m =>
    ['Active', 'In Progress'].includes(m.status) && m.pipeline_stage !== 'closed'
  )
  const trackedCount = mandates.filter(m => m.pipeline_stage === 'identified').length
  const shortlistingCount = mandates.filter(m =>
    ['shortlisting'].includes(m.pipeline_stage ?? '')
  ).length
  const finalStageCount = mandates.filter(m =>
    ['final_2', 'offer'].includes(m.pipeline_stage ?? '')
  ).length
  const closedThisMonth = mandates.filter(m =>
    m.status === 'Completed' && m.target_completion_date >= startOfMonth
  ).length

  // ── Warm pipeline (pre-vacancy) ────────────────────────────────────────────
  const warmPipeline = mandates.filter(m =>
    ['identified', 'board_approved'].includes(m.pipeline_stage ?? '') &&
    m.status !== 'Completed'
  )

  // ── Active mandates with risk flags ───────────────────────────────────────
  const activeMandatesWithFlags = activeMandates.map(m => ({
    ...m,
    flags: getRiskFlags(m, lastActivityMap),
    lastActivity: lastActivityMap.get(m.id) ?? null,
  }))

  // Sort: high-risk first, then by priority
  activeMandatesWithFlags.sort((a, b) => {
    const riskA = a.flags.some(f => f === 'overdue' || f === 'no_shortlist') ? 0 : a.flags.length > 0 ? 1 : 2
    const riskB = b.flags.some(f => f === 'overdue' || f === 'no_shortlist') ? 0 : b.flags.length > 0 ? 1 : 2
    if (riskA !== riskB) return riskA - riskB
    const pOrder = { High: 0, Medium: 1, Low: 2 }
    return (pOrder[a.priority as keyof typeof pOrder] ?? 2) - (pOrder[b.priority as keyof typeof pOrder] ?? 2)
  })

  const totalRiskCount = activeMandatesWithFlags.filter(m => m.flags.length > 0).length
  const shortlistMovement = activityLog
    .filter((a) => /shortlist|candidate|stage|moved|pipeline/i.test(`${a.action_type} ${a.description}`))
    .slice(0, 6)
  const nextActions: NextAction[] = [
    ...activeMandatesWithFlags
      .filter(m => m.flags.length > 0)
      .slice(0, 3)
      .map(m => ({
        id: `mandate-${m.id}`,
        title: clubName(m),
        detail: m.flags.map(flag => riskIcon(flag).label).join(' + '),
        href: `/mandates/${m.id}/workspace`,
        tone: m.flags.some(flag => flag === 'overdue' || flag === 'no_shortlist') ? 'danger' as const : 'warning' as const,
      })),
    ...deliverables.slice(0, 2).map(d => ({
      id: `deliverable-${d.id}`,
      title: d.item,
      detail: `${clubName(d.mandates)} due ${formatDate(d.due_date)}`,
      href: `/mandates/${d.mandate_id}`,
      tone: new Date(d.due_date) < today ? 'danger' as const : 'info' as const,
    })),
    ...alerts.slice(0, 2).map(a => ({
      id: `alert-${a.id}`,
      title: a.title,
      detail: a.detail ?? a.alert_type,
      href: '/alerts',
      tone: 'warning' as const,
    })),
  ].slice(0, 6)

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── Header ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(59,130,246,0.05)_42%,rgba(19,21,30,1)_100%)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <Activity className="h-3 w-3 text-primary" />
              Operating brief
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mandate Control Centre</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Link
                href="/mandates/new"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                New mandate
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Live', value: activeMandates.length },
                { label: 'Need attention', value: totalRiskCount },
                { label: 'Open alerts', value: alerts.length },
                { label: 'High confidence intel', value: coachUpdates.length },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-white/10 bg-black/10 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/15">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Next best actions</h2>
              <Bell className="h-3.5 w-3.5 text-primary" />
            </div>
            {nextActions.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs font-medium text-foreground">Search desk is clear</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  No live mandates are blocked by dates, shortlist depth, or unread alerts.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {nextActions.map(action => (
                  <Link key={action.id} href={action.href} className="group flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{action.title}</p>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">{action.detail}</p>
                    </div>
                    <span className={cn('mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider', actionToneClass(action.tone))}>
                      {action.tone}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Top stats ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Active', value: activeMandates.length, icon: TrendingUp, colour: 'text-primary', href: '/mandates' },
          { label: 'Tracked', value: trackedCount, icon: Users, colour: 'text-blue-400', href: '/mandates' },
          { label: 'Shortlisting', value: shortlistingCount, icon: Users, colour: 'text-amber-400', href: '/mandates' },
          { label: 'Final stage', value: finalStageCount, icon: CheckCircle2, colour: 'text-purple-400', href: '/mandates' },
          { label: 'Closed this month', value: closedThisMonth, icon: CheckCircle2, colour: 'text-emerald-400', href: '/mandates' },
        ].map(({ label, value, icon: Icon, colour, href }) => (
          <Link key={label} href={href} className="card-surface group rounded-lg p-4 flex flex-col gap-2 hover:bg-surface-overlay/10 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
              <Icon className={cn('w-3.5 h-3.5 transition-transform group-hover:scale-110', colour)} />
            </div>
            <span className={cn('text-2xl font-bold', colour)}>{value}</span>
          </Link>
        ))}
      </div>

      {/* ── Risk banner (if any) ── */}
      {totalRiskCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-400/20 bg-amber-400/5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400 font-medium">
            {totalRiskCount} mandate{totalRiskCount > 1 ? 's' : ''} need attention —
            {' '}{activeMandatesWithFlags.filter(m => m.flags.includes('overdue')).length > 0 && 'overdue target dates, '}
            {activeMandatesWithFlags.filter(m => m.flags.includes('no_shortlist')).length > 0 && 'missing shortlists, '}
            {activeMandatesWithFlags.filter(m => m.flags.includes('stale')).length > 0 && 'stale activity'}
          </p>
        </div>
      )}

      {/* ── Active mandates table ── */}
      <div className="card-surface rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Active mandates</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Live searches ranked by decision risk and urgency</p>
          </div>
          <span className="text-[10px] text-muted-foreground">{activeMandatesWithFlags.length} live</span>
        </div>

        {activeMandatesWithFlags.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No live searches on the desk</p>
            <p className="mt-1 text-xs text-muted-foreground">Create a mandate when a club brief is ready to track through shortlist and board decision.</p>
            <Link href="/mandates/new" className="text-xs text-primary hover:underline mt-2 inline-block">Start a mandate →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Club', 'Stage', 'Shortlist', 'Target date', 'Last activity', 'Risk', 'Next action'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {activeMandatesWithFlags.map((m, i) => (
                  <tr
                    key={m.id}
                    className={cn(
                      'border-b border-border/50 hover:bg-surface-overlay/20 transition-colors',
                      i === activeMandatesWithFlags.length - 1 && 'border-b-0'
                    )}
                  >
                    {/* Club */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', priorityDot(m.priority))} title={`${m.priority} priority`} />
                        <div>
                          <p className="font-medium text-foreground">{clubName(m)}</p>
                          {m.clubs?.league && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{m.clubs.league}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider',
                        stageColour(m.pipeline_stage)
                      )}>
                        {getStageLabel(m.pipeline_stage ?? 'identified')}
                      </span>
                    </td>

                    {/* Shortlist */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-sm font-semibold',
                        m.mandate_shortlist.length === 0 ? 'text-muted-foreground/40' : 'text-foreground'
                      )}>
                        {m.mandate_shortlist.length}
                      </span>
                      <span className="text-muted-foreground ml-1">candidates</span>
                    </td>

                    {/* Target date */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-foreground',
                        new Date(m.target_completion_date) < new Date() && m.status !== 'Completed'
                          ? 'text-red-400 font-medium'
                          : 'text-foreground'
                      )}>
                        {formatDate(m.target_completion_date)}
                      </span>
                    </td>

                    {/* Last activity */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.lastActivity ? formatRelative(m.lastActivity) : '—'}
                    </td>

                    {/* Risk flags */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {m.flags.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground/40">—</span>
                        ) : (
                          m.flags.map(flag => {
                            const { icon: FlagIcon, label, colour } = riskIcon(flag)
                            return (
                              <span key={flag} title={label} className={cn('flex items-center gap-1 text-[10px] font-medium', colour)}>
                                <FlagIcon className="w-3 h-3" />
                                <span className="hidden lg:inline">{label}</span>
                              </span>
                            )
                          })
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {getMandateNextStep(m, m.flags)}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/mandates/${m.id}/workspace`}
                        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium"
                      >
                        Open <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Secondary row ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">

        {/* Upcoming actions */}
        <div className="card-surface rounded-lg overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Upcoming actions</h2>
          </div>
          {deliverables.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs font-medium text-foreground">No dated deliverables</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Add board packs, interview windows, or outreach deadlines inside a mandate.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {deliverables.map(d => (
                <div key={d.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{d.item}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {clubName(d.mandates)}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium shrink-0 mt-0.5',
                    new Date(d.due_date) < new Date() ? 'text-red-400' : 'text-muted-foreground'
                  )}>
                    {formatDate(d.due_date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warm pipeline */}
        <div className="card-surface rounded-lg overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Warm pipeline</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pre-vacancy mandates</p>
          </div>
          {warmPipeline.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs font-medium text-foreground">No succession watchlist</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Use identified or board approved mandates to track likely future searches.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {warmPipeline.map(m => (
                <Link
                  key={m.id}
                  href={`/mandates/${m.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-overlay/20 transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">{clubName(m)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {m.clubs?.league ?? '—'} · {getStageLabel(m.pipeline_stage ?? 'identified')}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Intelligence pulse */}
        <div className="card-surface rounded-lg overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Recent intelligence</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">High confidence updates</p>
            </div>
            <Radio className="h-3.5 w-3.5 text-primary" />
          </div>
          {coachUpdates.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs font-medium text-foreground">No high confidence coach movement</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Verified intelligence will appear here when a coach profile changes.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {coachUpdates.map(update => (
                <Link
                  key={update.id}
                  href={update.coaches?.id ? `/coaches/${update.coaches.id}/intelligence` : '/intelligence'}
                  className="block px-4 py-3 hover:bg-surface-overlay/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-medium text-foreground">
                      {update.coaches?.name ?? 'Coach update'}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {update.occurred_at ? formatRelative(update.occurred_at) : 'New'}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    {update.update_note}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Shortlist movement */}
        <div className="card-surface rounded-lg overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Shortlist movement</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Candidate and pipeline changes</p>
          </div>
          {shortlistMovement.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs font-medium text-foreground">No shortlist movement yet</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Candidate additions, stage moves, and shortlist changes will be tracked here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {shortlistMovement.map(a => (
                <div key={a.id} className="px-4 py-2.5 flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground leading-snug truncate">{a.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
