'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Vacancy, MatchWithCoach } from '@/lib/types/database'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import {
  ChevronDown,
  ChevronRight,
  Users,
  Target,
  DollarSign,
  CalendarCheck,
  Package,
} from 'lucide-react'

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
  const searchParams = useSearchParams()
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
        } else if (vacs && vacs.length > 0) {
          setSelectedVacancy(vacs[0].id)
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

  const immediatelyAvailable = matches.filter(
    m => m.coaches.available_status === 'Available' || m.coaches.available_status === 'Open to offers'
  ).length
  const compensationFree = matches.filter(
    m => m.coaches.available_status === 'Available'
  ).length
  const staffPackageReady = matches.filter(
    m => m.coaches.staff_cost_estimate !== 'N/A' && m.coaches.staff_cost_estimate !== ''
  ).length

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

  return (
    <div className="animate-fade-in">
      <PageHeader title="Match Results" subtitle="Ranked candidates for current vacancy">
        {vacancies.length > 0 && (
          <div className="relative">
            <select
              value={selectedVacancy}
              onChange={(e) => setSelectedVacancy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-surface border border-border rounded-md text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 cursor-pointer min-w-[240px]"
            >
              {vacancies.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.role_type} — {v.objective}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        )}
        <Link
          href="/vacancies/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium text-xs rounded-md hover:bg-primary/90 transition-colors"
        >
          <Target className="w-3.5 h-3.5" />
          New Search
        </Link>
      </PageHeader>

      {/* Current Vacancy Parameters */}
      {currentVacancy && (
        <div className="card-surface rounded-lg mb-5">
          <div className="px-5 py-3 border-b border-border/50">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
              Current Vacancy Parameters
            </span>
          </div>
          <div className="grid grid-cols-4 divide-x divide-border/30">
            <ParamCell label="Objective" value={currentVacancy.objective} />
            <ParamCell label="Timeline" value={currentVacancy.timeline} />
            <ParamCell label="Budget" value={currentVacancy.budget_range} />
            <ParamCell label="League Level" value={currentVacancy.league_experience_required ? 'Required' : 'Not Required'} />
          </div>
        </div>
      )}

      {/* Operational Stat Cards */}
      {matches.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <MetricCard
            icon={<CalendarCheck className="w-4 h-4" />}
            label="Immediate Availability"
            value={immediatelyAvailable}
            subtitle="Can start within 7 days"
            accentColor="text-emerald-400"
          />
          <MetricCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Compensation Free"
            value={compensationFree}
            subtitle="No buyout required"
            accentColor="text-sky-400"
          />
          <MetricCard
            icon={<Package className="w-4 h-4" />}
            label="Staff Package Ready"
            value={staffPackageReady}
            subtitle="Brings complete backroom team"
            accentColor="text-amber-400"
          />
        </div>
      )}

      {/* Empty State */}
      {matches.length === 0 ? (
        <div className="card-surface rounded-lg text-center py-16">
          <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">
            {vacancies.length === 0
              ? 'No vacancies created yet.'
              : 'No match results for this vacancy.'}
          </p>
          <Link
            href="/vacancies/new"
            className="text-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 mt-2"
          >
            Create a vacancy to generate matches
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        /* Ranked Shortlist Table */
        <div className="card-surface rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                Ranked Shortlist
              </span>
              <Badge variant="secondary">{matches.length}</Badge>
            </div>
            <span className="text-[10px] text-muted-foreground/40">
              Sorted by composite score
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[48px_1fr_110px_120px_130px_90px_80px_80px_56px] px-5 py-2.5 border-b border-border/50 bg-background-subtle/50 items-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Rank</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Coach</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">League</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Contract Status</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Compensation</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Overall Fit</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Tactical</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Status</span>
            <span />
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border/30">
            {matches.map((match, index) => {
              const coach = match.coaches
              const compensation = getCompensationInfo(coach.available_status, match.financial_fit_score)
              const statusBadge = getStatusBadge(coach.available_status)
              const overallColor = getScoreColorClass(match.overall_score)
              const tacticalColor = getScoreColorClass(match.tactical_fit_score)

              return (
                <div
                  key={match.id}
                  className="grid grid-cols-[48px_1fr_110px_120px_130px_90px_80px_80px_56px] px-5 py-3 items-center hover:bg-surface-overlay/30 transition-colors group animate-fade-in"
                  style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                >
                  <span className={cn(
                    'text-sm font-bold tabular-nums',
                    index === 0 ? 'text-emerald-400' : index < 3 ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <span className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors truncate block">
                      {coach.name}
                    </span>
                    <span className="text-2xs text-muted-foreground truncate block">
                      {coach.current_role}{coach.current_club ? ` · ${coach.current_club}` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-2xs text-muted-foreground">
                      {coach.league_experience.length > 0 ? coach.league_experience[0] : '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-2xs text-muted-foreground">
                      {getContractStatus(coach.available_status)}
                    </span>
                  </div>

                  <div>
                    <span className={cn('text-2xs font-medium', compensation.color)}>
                      {compensation.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold tabular-nums', overallColor)}>
                      {match.overall_score}
                    </span>
                    <MiniBar score={match.overall_score} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold tabular-nums', tacticalColor)}>
                      {match.tactical_fit_score}
                    </span>
                    <MiniBar score={match.tactical_fit_score} />
                  </div>

                  <div>
                    <Badge variant={statusBadge.variant as 'success' | 'warning' | 'danger' | 'outline'}>
                      {statusBadge.label}
                    </Badge>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/coaches/${match.coach_id}`}
                      className="text-2xs text-muted-foreground/50 hover:text-primary transition-colors inline-flex items-center gap-0.5 group-hover:text-primary/60"
                    >
                      View
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* Helper Components */

function ParamCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 block mb-1">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function MiniBar({ score }: { score: number }) {
  const color = score >= 80
    ? 'bg-emerald-400/70'
    : score >= 60
      ? 'bg-yellow-400/70'
      : score >= 40
        ? 'bg-orange-400/70'
        : 'bg-red-400/70'

  return (
    <div className="w-10 h-1 bg-secondary rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full', color)}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

/* Data Helpers */

function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
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

function getCompensationInfo(status: string, financialScore: number): { label: string; color: string } {
  if (status === 'Available') {
    return { label: 'No compensation', color: 'text-emerald-400' }
  }
  if (status === 'Open to offers') {
    return { label: 'Minimal fee', color: 'text-sky-400' }
  }
  if (financialScore >= 70) {
    return { label: 'Within budget', color: 'text-yellow-400' }
  }
  if (financialScore >= 40) {
    return { label: 'Buyout required', color: 'text-orange-400' }
  }
  return { label: 'Significant outlay', color: 'text-red-400' }
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
