import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  Briefcase,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
  Shield,
  Calendar,
} from 'lucide-react'
import { ScoreBar } from '@/components/ScoreBar'

function dateLabel(value: string | null) {
  if (!value) return 'Unknown time'
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function signalTypeLabel(updateType: string | null) {
  const key = (updateType || '').toLowerCase()
  if (key.includes('availability')) return 'availability'
  if (key.includes('contract') || key.includes('transfer')) return 'contract'
  if (key.includes('reputation')) return 'reputation'
  return 'performance'
}


type PlacementReadyRow = {
  id: string
  name: string
  nationality: string | null
  club_current: string | null
  placement_score: number | null
}

type TopPlacementRow = {
  id: string
  name: string
  available_status: string
  placement_score: number | null
}

type RecentSignalRow = {
  id: string
  update_type: string | null
  update_note: string
  occurred_at: string | null
  coaches: { name: string } | null
}

export default async function DashboardOverviewPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: mandates, error: mandatesError } = await supabase
    .from('mandates')
    .select(`
      id,
      status,
      priority,
      target_completion_date,
      strategic_objective,
      clubs (
        name,
        league
      ),
      mandate_shortlist (
        coach_id,
        status
      )
    `)
    .eq('user_id', user.id)
    .order('target_completion_date', { ascending: true })

  if (mandatesError) {
    throw new Error(`Failed to load overview mandates: ${mandatesError.message}`)
  }

  const { data: scopedCoachIdsRows, error: coachIdsError } = await supabase
    .from('mandate_shortlist')
    .select('coach_id, mandates!inner(user_id)')
    .eq('mandates.user_id', user.id)

  if (coachIdsError) {
    throw new Error(`Failed to load scoped coach ids: ${coachIdsError.message}`)
  }

  const coachIds = Array.from(
    new Set(
      (scopedCoachIdsRows ?? [])
        .map((row: { coach_id: string | null }) => row.coach_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  let placementReady: PlacementReadyRow[] = []
  let topPlacementScores: TopPlacementRow[] = []
  let recentSignals: RecentSignalRow[] = []
  let highConfidenceSignalsCount = 0

  if (coachIds.length > 0) {
    const [placementReadyResult, topScoresResult, highSignalCountResult, signalsResult] = await Promise.all([
      supabase
        .from('coaches')
        .select('id, name, nationality, club_current, placement_score')
        .in('id', coachIds)
        .eq('available_status', 'Available')
        .gte('placement_score', 85)
        .order('placement_score', { ascending: false })
        .limit(3),
      supabase
        .from('coaches')
        .select('id, name, available_status, placement_score')
        .in('id', coachIds)
        .order('placement_score', { ascending: false })
        .limit(4),
      supabase
        .from('coach_updates')
        .select('id', { count: 'exact', head: true })
        .in('coach_id', coachIds)
        .in('confidence', ['high', 'High']),
      supabase
        .from('coach_updates')
        .select(`
          id,
          update_type,
          update_note,
          occurred_at,
          coaches (
            name
          )
        `)
        .in('coach_id', coachIds)
        .in('confidence', ['high', 'High'])
        .order('occurred_at', { ascending: false, nullsFirst: false })
        .limit(4),
    ])

    if (placementReadyResult.error) {
      throw new Error(`Failed to load placement-ready coaches: ${placementReadyResult.error.message}`)
    }
    if (topScoresResult.error) {
      throw new Error(`Failed to load top placement scores: ${topScoresResult.error.message}`)
    }
    if (highSignalCountResult.error) {
      throw new Error(`Failed to count high-confidence signals: ${highSignalCountResult.error.message}`)
    }
    if (signalsResult.error) {
      throw new Error(`Failed to load intelligence signals: ${signalsResult.error.message}`)
    }

    placementReady = (placementReadyResult.data || []) as PlacementReadyRow[]
    topPlacementScores = (topScoresResult.data || []) as TopPlacementRow[]
    recentSignals = (signalsResult.data || []) as RecentSignalRow[]
    highConfidenceSignalsCount = highSignalCountResult.count ?? 0
  }

  const activeMandates = mandates.filter(m => m.status === 'Active' || m.status === 'In Progress').length
  const clubsInMonitoring = mandates.length
  const placementReadyCoaches = placementReady.length
  const highRiskSituations = mandates.filter(m => m.priority === 'High').length

  const displayMandates = mandates.filter(m => m.status === 'Active' || m.status === 'In Progress').slice(0, 3)
  const highRisk = mandates.filter(m => m.priority === 'High')

  return (
    <div className="max-w-[1800px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground uppercase tracking-wide">Executive Overview</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
            Confidential Advisory Intelligence
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Updated</div>
          <div className="text-xs text-foreground font-semibold">
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} GMT
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="card-surface rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Active Mandates</span>
            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">{activeMandates}</div>
          <div className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">In Progress</div>
        </div>

        <div className="card-surface rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Clubs Monitoring</span>
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">{clubsInMonitoring}</div>
          <div className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">Total Engagements</div>
        </div>

        <div className="card-surface rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Placement Ready</span>
            <Users className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{placementReadyCoaches}</div>
          <div className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">High Confidence</div>
        </div>

        <div className="card-surface rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">High Risk</span>
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-destructive">{highRiskSituations}</div>
          <div className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">Urgent Mandates</div>
        </div>

        <div className="card-surface rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Intel Signals</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{highConfidenceSignalsCount}</div>
          <div className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">High Confidence</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="card-surface rounded">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Active Mandates</h2>
              <Link href="/mandates" className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-widest">
                View All
              </Link>
            </div>
            <div className="divide-y divide-border">
              {displayMandates.map((mandate) => (
                <Link
                  key={mandate.id}
                  href={`/mandates/${mandate.id}`}
                  className="block px-4 py-3 hover:bg-surface-overlay/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground">{mandate.clubs?.name ?? 'Unknown Club'}</h3>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            mandate.priority === 'High'
                              ? 'bg-red-950/40 text-red-500 border-red-900/40'
                              : mandate.priority === 'Medium'
                                ? 'bg-amber-950/40 text-amber-600 border-amber-900/40'
                                : 'bg-surface text-muted-foreground border-border'
                          }`}
                        >
                          {mandate.priority}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            mandate.status === 'Active'
                              ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900/40'
                              : 'bg-slate-900/40 text-slate-400 border-slate-800/40'
                          }`}
                        >
                          {mandate.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">
                        {mandate.clubs?.league ?? 'Unknown League'} · Target:{' '}
                        {mandate.target_completion_date
                          ? new Date(mandate.target_completion_date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {(mandate.strategic_objective ?? '').length > 120
                          ? `${(mandate.strategic_objective ?? '').slice(0, 120)}...`
                          : (mandate.strategic_objective ?? '')}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card-surface rounded">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Placement Ready Coaches</h2>
              <Link href="/coaches" className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-widest">
                View Inventory
              </Link>
            </div>
            <div className="divide-y divide-border">
              {placementReady.map((coach) => (
                <div key={coach.id} className="block px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0">
                      {coach.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-foreground">{coach.name}</h3>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/40 text-emerald-500 border border-emerald-900/40 uppercase tracking-wider">
                          Available
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {coach.club_current || 'Free Agent'} · {coach.nationality || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-foreground">{coach.placement_score ?? 0}</div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-surface rounded">
            <div className="px-4 py-2.5 border-b border-border">
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">High Risk Mandates</h2>
            </div>
            <div className="divide-y divide-border">
              {highRisk.map((mandate) => (
                <div key={mandate.id} className="px-4 py-3">
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{mandate.clubs?.name ?? 'Unknown Club'}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                        Deadline:{' '}
                        {mandate.target_completion_date
                          ? new Date(mandate.target_completion_date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'Unknown'}
                      </div>
                      <div className="text-[10px] text-destructive mt-1">
                        {mandate.mandate_shortlist.filter((s: { status: string }) => s.status === 'In Negotiations').length > 0
                          ? 'Negotiations active'
                          : 'Awaiting decision'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface rounded">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Intelligence Signals</h2>
              <Link href="/intelligence" className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-widest">
                View Feed
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentSignals.map((signal) => {
                const type = signalTypeLabel(signal.update_type)
                return (
                  <div key={signal.id} className="px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 border ${
                          type === 'availability'
                            ? 'bg-emerald-950/40 border-emerald-900/40'
                            : type === 'contract'
                              ? 'bg-amber-950/40 border-amber-900/40'
                              : type === 'performance'
                                ? 'bg-slate-900/40 border-slate-800/40'
                                : 'bg-surface border-border'
                        }`}
                      >
                        {type === 'availability' && <Clock className="w-3 h-3 text-emerald-500" />}
                        {type === 'contract' && <Calendar className="w-3 h-3 text-amber-600" />}
                        {type === 'performance' && <TrendingUp className="w-3 h-3 text-slate-400" />}
                        {type === 'reputation' && <AlertCircle className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground leading-tight">
                          {signal.update_note.length > 72 ? `${signal.update_note.slice(0, 72)}...` : signal.update_note}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {signal.coaches?.name ?? 'Unknown coach'} · {dateLabel(signal.occurred_at)}
                        </div>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950/40 text-red-500 border border-red-900/40 mt-1.5 uppercase tracking-wider">
                          High
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card-surface rounded">
            <div className="px-4 py-2.5 border-b border-border">
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Top Placement Scores</h2>
            </div>
            <div className="divide-y divide-border">
              {topPlacementScores.map((coach) => (
                <div key={coach.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{coach.name}</div>
                    <div className="text-[10px] text-muted-foreground">{coach.available_status}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ScoreBar score={coach.placement_score ?? 0} width="60px" />
                    <span className="text-xs font-bold text-foreground w-6 text-right">{coach.placement_score ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
