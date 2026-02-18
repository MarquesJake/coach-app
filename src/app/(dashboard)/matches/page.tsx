'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Database } from '@/lib/types/db'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Target,
  SlidersHorizontal,
  Briefcase,
  Loader2,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react'

type Vacancy = Database['public']['Tables']['vacancies']['Row']
type MatchRow = Database['public']['Tables']['matches']['Row']
type CoachRow = Database['public']['Tables']['coaches']['Row']
type MatchWithCoach = MatchRow & {
  coaches: Pick<CoachRow, 'id' | 'name' | 'role_current' | 'club_current' | 'available_status' | 'league_experience'> | null
}

export default function MatchesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-primary" />
            <span className="text-xs text-muted-foreground tracking-wide">Loading shortlist...</span>
          </div>
        </div>
      }
    >
      <MatchesContent />
    </Suspense>
  )
}

function MatchesContent() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [matches, setMatches] = useState<MatchWithCoach[]>([])
  const [selectedVacancy, setSelectedVacancy] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const briefRef = useRef<HTMLDivElement | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadVacancies() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: clubs } = await supabase
        .from('clubs')
        .select('id')
        .eq('user_id', user.id) as { data: { id: string }[] | null }

      if (clubs && clubs.length > 0) {
        const { data: vacs } = await supabase
          .from('vacancies')
          .select('*')
          .eq('club_id', clubs[0].id)
          .order('created_at', { ascending: false }) as { data: Vacancy[] | null }

        setVacancies(vacs || [])

        const vacancyParam = searchParams.get('vacancy')
        if (vacancyParam) {
          setSelectedVacancy(vacancyParam)
        }
        // Only auto-select first vacancy if no query param and nothing already selected
        else if (!vacancyParam && vacs && vacs.length > 0) {
          setSelectedVacancy((prev) => prev || vacs[0].id)
        }
      }
      setLoading(false)
    }
    loadVacancies()
  }, [supabase, searchParams])

  useEffect(() => {
    async function loadMatches() {
      if (!selectedVacancy) return
      const { data } = await supabase
        .from('matches')
        .select('*, coaches(*)')
        .eq('vacancy_id', selectedVacancy)
        .order('overall_score', { ascending: false })

      setMatches((data as MatchWithCoach[]) || [])
    }
    loadMatches()
  }, [selectedVacancy, supabase])

  const currentVacancy = vacancies.find(v => v.id === selectedVacancy)

  useEffect(() => {
    if (!selectedVacancy) return
    if (!briefRef.current) return

    // Allow the UI to render before scrolling
    const t = window.setTimeout(() => {
      briefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)

    return () => window.clearTimeout(t)
  }, [selectedVacancy])


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-primary" />
          <span className="text-xs text-muted-foreground tracking-wide">Loading shortlist...</span>
        </div>
      </div>
    )
  }

  const activeCount = vacancies.filter((v) => v.status === 'open').length
  const inProgressCount = vacancies.filter((v) => v.status !== 'open').length

  return (
    <div className="animate-fade-in">
      <PageHeader title="Active Mandates" subtitle="Client engagements and placement projects">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 h-9 bg-surface border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
          </button>
          <Link
            href="/vacancies/new"
            className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            New Search
          </Link>
        </div>
      </PageHeader>

      {/* Metric cards — Figma style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={<Briefcase className="w-3.5 h-3.5" />}
          label="Total mandates"
          value={vacancies.length}
          subtitle="All engagements"
        />
        <MetricCard
          icon={<Loader2 className="w-3.5 h-3.5" />}
          label="Active"
          value={activeCount}
          subtitle="Open searches"
          accentColor="text-emerald-400"
        />
        <MetricCard
          icon={<Clock className="w-3.5 h-3.5" />}
          label="In progress"
          value={inProgressCount}
          subtitle="Placement phase"
        />
        <MetricCard
          icon={<AlertCircle className="w-3.5 h-3.5 text-destructive/80" />}
          label="High priority"
          value={activeCount}
          subtitle="Urgent"
          accentColor="text-destructive"
        />
      </div>

      {/* Mandates table — full width briefing panel (dark) */}
      <div className="card-surface rounded-xl overflow-hidden mb-8">
        <div className="grid grid-cols-[1fr_80px_90px_90px_100px_100px_1fr_72px] px-5 py-2.5 border-b border-border items-center min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Club</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">League</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Priority</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Target date</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Shortlist</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Budget band</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-right">Action</span>
        </div>
        <div className="divide-y divide-border/50">
          {vacancies.length === 0 ? (
            <div className="py-12 px-5 text-center">
              <Briefcase className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No mandates yet</p>
              <Link
                href="/vacancies/new"
                className="text-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 mt-2"
              >
                Create a vacancy to add your first mandate
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            vacancies.map((v) => (
              <Link
                key={v.id}
                href={`/matches?vacancy=${v.id}#brief`}
                aria-current={v.id === selectedVacancy ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault()

                  // Make the UI react immediately.
                  setSelectedVacancy(v.id)

                  // Push the URL (including hash) so the page can be shared / refreshed.
                  router.push(`/matches?vacancy=${v.id}#brief`)

                  // Scroll straight away (don’t rely on hash timing).
                  window.setTimeout(() => {
                    briefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 50)
                }}
                className={cn(
                  'grid grid-cols-[1fr_80px_90px_90px_100px_100px_1fr_72px] px-5 py-3.5 items-center min-w-0 transition-colors',
                  v.id === selectedVacancy
                    ? 'bg-surface-overlay/30 outline outline-1 outline-primary/20'
                    : 'hover:bg-surface-overlay/30'
                )}
              >
                <span className="text-sm text-foreground truncate">—</span>
                <span className="text-2xs text-muted-foreground truncate">—</span>
                <div>
                  <Badge variant={v.status === 'open' ? 'success' : 'warning'}>
                    {v.status === 'open' ? 'Active' : 'In progress'}
                  </Badge>
                </div>
                <div>
                  <Badge variant={v.status === 'open' ? 'danger' : 'outline'}>
                    {v.status === 'open' ? 'High' : 'Medium'}
                  </Badge>
                </div>
                <span className="text-2xs text-muted-foreground tabular-nums">{v.timeline || '—'}</span>
                <span className="text-2xs text-muted-foreground">3 candidates</span>
                <span className="text-2xs text-muted-foreground truncate">{v.budget_range || '—'}</span>
                <div className="flex justify-end">
                  <span className="text-2xs font-medium text-primary inline-flex items-center gap-0.5">
                    View
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Mandate briefing (when ?vacancy= selected) — Figma mandate briefing screen */}
      {currentVacancy && (
        <>
          {/* A) Top briefing header */}
          <div ref={briefRef} id="brief" className="card-surface rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href="/matches"
                  className="inline-flex items-center gap-1.5 text-2xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back to Mandates
                </Link>
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  Mandate Brief
                </h2>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <Badge variant={currentVacancy.status === 'open' ? 'success' : 'warning'}>
                    {currentVacancy.status === 'open' ? 'Active' : 'In progress'}
                  </Badge>
                  <Badge variant={currentVacancy.status === 'open' ? 'danger' : 'outline'}>
                    {currentVacancy.status === 'open' ? 'High' : 'Medium'}
                  </Badge>
                  <Badge variant="outline">Board only</Badge>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Generate Executive Brief
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-border/50 border-t border-border/50">
              <div className="px-5 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground block mb-1">Target completion</span>
                <span className="text-sm text-foreground">{currentVacancy.timeline || '—'}</span>
              </div>
              <div className="px-5 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground block mb-1">Shortlist</span>
                <span className="text-sm text-foreground tabular-nums">{matches.length} candidates</span>
              </div>
              <div className="px-5 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground block mb-1">Board risk appetite</span>
                <span className="text-sm text-muted-foreground">—</span>
              </div>
              <div className="px-5 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground block mb-1">Key stakeholders</span>
                <span className="text-sm text-muted-foreground">—</span>
              </div>
            </div>
          </div>

          {/* B) Two column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Club overview */}
              <div className="card-surface rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border/50">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">Club overview</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground block mb-1">Ownership structure</span>
                    <span className="text-sm text-muted-foreground">—</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground block mb-1">Strategic objective</span>
                    <span className="text-sm text-foreground">{currentVacancy.objective || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground block mb-1">Succession timeline</span>
                    <span className="text-sm text-foreground">{currentVacancy.timeline || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Budget band */}
              <div className="card-surface rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border/50">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">Budget band</h3>
                </div>
                <div className="px-5 py-4">
                  <span className="text-sm font-medium text-foreground">{currentVacancy.budget_range || '—'}</span>
                </div>
              </div>

              {/* Ranked shortlist */}
              <div className="card-surface rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">Ranked shortlist</h3>
                  <span className="text-2xs text-muted-foreground tabular-nums">{matches.length} candidates</span>
                </div>
                {matches.length === 0 ? (
                  <div className="py-12 px-5 text-center">
                    <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No match results for this vacancy.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-[48px_1fr_110px_120px_130px_90px_80px_80px_56px] px-5 py-2.5 border-b border-border/50 items-center">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Rank</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Coach</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">League</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Contract</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Compensation</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Overall</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Tactical</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</span>
                      <span />
                    </div>
                    <div className="divide-y divide-border/50">
                      {matches.map((match, index) => {
                        const coach = match.coaches
                        if (!coach) return null
                        const overallScore = match.overall_score ?? 0
                        const tacticalScore = match.tactical_fit_score ?? 0
                        const financialScore = match.financial_fit_score ?? 0
                        const coachLeagues = coach.league_experience ?? []
                        const compensation = getCompensationInfo(coach.available_status, financialScore)
                        const statusBadge = getStatusBadge(coach.available_status)
                        const overallColor = getScoreColorClass(overallScore)
                        const tacticalColor = getScoreColorClass(tacticalScore)
                        return (
                          <div
                            key={match.id}
                            className="grid grid-cols-[48px_1fr_110px_120px_130px_90px_80px_80px_56px] px-5 py-3.5 items-center hover:bg-surface-overlay/30 transition-colors"
                          >
                            <span className={cn('text-sm font-bold tabular-nums', index < 3 ? 'text-foreground' : 'text-muted-foreground/70')}>
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <Link href={`/coaches/${match.coach_id}`} className="text-[13px] font-medium text-foreground hover:text-primary transition-colors truncate block">
                                {coach.name}
                              </Link>
                              <span className="text-2xs text-muted-foreground truncate block">
                                {coach.role_current}{coach.club_current ? ` · ${coach.club_current}` : ''}
                              </span>
                            </div>
                            <span className="text-2xs text-muted-foreground">
                              {coachLeagues.length > 0 ? coachLeagues[0] : '—'}
                            </span>
                            <span className="text-2xs text-muted-foreground">{getContractStatus(coach.available_status)}</span>
                            <span className={cn('text-2xs font-medium', compensation.color)}>{compensation.label}</span>
                            <div className="flex items-center gap-2">
                              <span className={cn('text-xs font-semibold tabular-nums', overallColor)}>{overallScore}</span>
                              <MiniBar score={overallScore} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn('text-xs font-semibold tabular-nums', tacticalColor)}>{tacticalScore}</span>
                              <MiniBar score={tacticalScore} />
                            </div>
                            <Badge variant={statusBadge.variant as 'success' | 'warning' | 'danger' | 'outline'}>
                              {statusBadge.label}
                            </Badge>
                            <div className="flex justify-end">
                              <Link href={`/coaches/${match.coach_id}`} className="text-2xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-0.5">
                                View
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Key stakeholders */}
              <div className="card-surface rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border/50">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">Key stakeholders</h3>
                </div>
                <ul className="p-5 divide-y divide-border/50">
                  <li className="py-2.5 text-sm text-muted-foreground first:pt-0">Director of Football</li>
                  <li className="py-2.5 text-sm text-muted-foreground">Chief Executive</li>
                  <li className="py-2.5 text-sm text-muted-foreground last:pb-0">Ownership representative</li>
                </ul>
              </div>

              {/* Deliverables */}
              <div className="card-surface rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border/50">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">Deliverables</h3>
                </div>
                <ul className="p-5 divide-y divide-border/50">
                  <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <span className="text-sm text-foreground">Initial shortlist</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="success">Done</Badge>
                      <span className="text-2xs text-muted-foreground">—</span>
                    </div>
                  </li>
                  <li className="flex items-center justify-between gap-3 py-3">
                    <span className="text-sm text-foreground">Due diligence pack</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="warning">In progress</Badge>
                      <span className="text-2xs text-muted-foreground">—</span>
                    </div>
                  </li>
                  <li className="flex items-center justify-between gap-3 py-3">
                    <span className="text-sm text-foreground">Board presentation</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">Pending</Badge>
                      <span className="text-2xs text-muted-foreground">—</span>
                    </div>
                  </li>
                  <li className="flex items-center justify-between gap-3 py-3 last:pb-0">
                    <span className="text-sm text-foreground">Final recommendation</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">Pending</Badge>
                      <span className="text-2xs text-muted-foreground">—</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* Helper Components */

function MiniBar({ score }: { score: number }) {
  const color = score >= 80
    ? 'bg-emerald-500/60'
    : score >= 60
      ? 'bg-yellow-500/60'
      : score >= 40
        ? 'bg-orange-500/60'
        : 'bg-red-500/60'

  return (
    <div className="w-10 h-1 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full', color)}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

/* Data Helpers */

function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

function getContractStatus(status: string): string {
  switch (status) {
    case 'Available': return 'Unattached'
    case 'Open to offers': return 'Negotiable exit'
    case 'Under contract - interested': return 'Under contract'
    case 'Under contract': return 'Under contract'
    case 'Not available': return 'Committed'
    default: return status
  }
}

function getCompensationInfo(status: string, financialScore: number): { label: string; color: string; lightColor: string } {
  if (status === 'Available') {
    return { label: 'No compensation', color: 'text-emerald-400', lightColor: 'text-emerald-600' }
  }
  if (status === 'Open to offers') {
    return { label: 'Minimal fee', color: 'text-sky-400', lightColor: 'text-sky-600' }
  }
  if (financialScore >= 70) {
    return { label: 'Within budget', color: 'text-yellow-400', lightColor: 'text-yellow-600' }
  }
  if (financialScore >= 40) {
    return { label: 'Buyout required', color: 'text-orange-400', lightColor: 'text-orange-500' }
  }
  return { label: 'Significant outlay', color: 'text-red-400', lightColor: 'text-red-500' }
}

function getStatusBadge(status: string): { variant: string; label: string } {
  switch (status) {
    case 'Available':
      return { variant: 'success', label: 'Available' }
    case 'Open to offers':
      return { variant: 'warning', label: 'Negotiable' }
    case 'Under contract - interested':
      return { variant: 'warning', label: 'Negotiable' }
    case 'Under contract':
      return { variant: 'danger', label: 'Contracted' }
    case 'Not available':
      return { variant: 'outline', label: 'Unavailable' }
    default:
      return { variant: 'outline', label: status }
  }
}
