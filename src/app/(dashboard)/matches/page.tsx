'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Database } from '@/lib/types/db'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import { PageState } from '@/components/ui/page-state'
import { runMatchingAction, generateBriefAction } from './actions'
import { ChevronRight, FileText, Loader2, Target, Users } from 'lucide-react'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import {
  getScoreColorClass,
  getRiskLevel,
  getConfidenceLevel,
  getRiskTooltipText,
  getConfidenceTooltipText,
} from '@/lib/scoring/engine'
import { Badge } from '@/components/ui/badge'

type VacancyRow = Database['public']['Tables']['vacancies']['Row']
type MatchRow = Database['public']['Tables']['matches']['Row']
type CoachRow = Database['public']['Tables']['coaches']['Row']
type MatchWithCoach = MatchRow & {
  coaches: Pick<CoachRow, 'id' | 'name' | 'role_current' | 'club_current' | 'available_status'> | null
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<PageState state="loading" minHeight="sm" />}>
      <MatchesContent />
    </Suspense>
  )
}

function MatchesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const vacancyId = searchParams.get('vacancy')

  const [vacancies, setVacancies] = useState<VacancyRow[]>([])
  const [vacancy, setVacancy] = useState<VacancyRow | null>(null)
  const [matches, setMatches] = useState<MatchWithCoach[]>([])
  const [loading, setLoading] = useState(true)
  const [runMatchingLoading, setRunMatchingLoading] = useState(false)
  const [generateBriefLoading, setGenerateBriefLoading] = useState(false)

  const supabase = createClient()

  const loadVacancies = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data: clubs } = await supabase.from('clubs').select('id').eq('user_id', user.id)
    const clubIds = (clubs ?? []).map((c) => c.id)
    if (clubIds.length === 0) return []
    const { data } = await supabase
      .from('vacancies')
      .select('*')
      .in('club_id', clubIds)
      .order('created_at', { ascending: false })
    return (data ?? []) as VacancyRow[]
  }, [supabase])

  const loadVacancyAndMatches = useCallback(
    async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { vacancy: null, matches: [] as MatchWithCoach[] }
      const { data: clubs } = await supabase.from('clubs').select('id').eq('user_id', user.id)
      const clubIds = (clubs ?? []).map((c) => c.id)
      if (clubIds.length === 0) return { vacancy: null, matches: [] as MatchWithCoach[] }
      const [vacRes, matchRes] = await Promise.all([
        supabase.from('vacancies').select('*').eq('id', id).single(),
        supabase
          .from('matches')
          .select('*, coaches(id, name, role_current, club_current, available_status)')
          .eq('vacancy_id', id)
          .order('overall_score', { ascending: false }),
      ])
      const v = vacRes.data as VacancyRow | null
      const m = (matchRes.data ?? []) as MatchWithCoach[]
      const vacancy = v && clubIds.includes(v.club_id) ? v : null
      return { vacancy, matches: vacancy ? m : ([] as MatchWithCoach[]) }
    },
    [supabase]
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const vacs = await loadVacancies()
      if (cancelled) return
      setVacancies(vacs)

      if (!vacancyId) {
        setVacancy(null)
        setMatches([])
        setLoading(false)
        return
      }

      const { vacancy: v, matches: m } = await loadVacancyAndMatches(vacancyId)
      if (cancelled) return
      setVacancy(v)
      setMatches(m)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [vacancyId, loadVacancies, loadVacancyAndMatches])

  async function handleRunMatching() {
    if (!vacancyId) return
    setRunMatchingLoading(true)
    const { error } = await runMatchingAction(vacancyId)
    setRunMatchingLoading(false)
    if (error) {
      toastError(error)
      return
    }
    toastSuccess('Matching complete')
    const { vacancy: v, matches: m } = await loadVacancyAndMatches(vacancyId)
    setVacancy(v)
    setMatches(m)
  }

  async function handleGenerateBrief() {
    if (!vacancyId) return
    setGenerateBriefLoading(true)
    const { error } = await generateBriefAction(vacancyId)
    setGenerateBriefLoading(false)
    if (error) {
      toastError(error)
      return
    }
    toastSuccess('Executive brief saved')
    const { vacancy: v } = await loadVacancyAndMatches(vacancyId)
    setVacancy(v)
  }

  function setVacancyParam(id: string) {
    if (!id) {
      router.push('/matches')
      return
    }
    router.push(`/matches?vacancy=${id}`)
  }

  if (loading) {
    return <PageState state="loading" minHeight="sm" />
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">Matches</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select a vacancy and run matching to build a ranked shortlist
        </p>
      </div>

      {vacancies.length === 0 && !vacancyId && (
        <EmptyState
          title="No vacancies yet"
          description="Create a vacancy to run matching and build shortlists."
          actionLabel="Go to Vacancies"
          actionHref="/vacancies"
        />
      )}

      {vacancies.length > 0 && !vacancyId && (
        <EmptyState
          title="Select a vacancy"
          description="Choose a vacancy from the dropdown or create a new one."
          actionLabel="New vacancy"
          actionHref="/vacancies/new"
        />
      )}

      {vacancies.length > 0 && (
        <div className="card-surface rounded-lg p-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
            Vacancy
          </label>
          <select
            value={vacancyId ?? ''}
            onChange={(e) => setVacancyParam(e.target.value)}
            className="w-full max-w-md h-10 rounded bg-surface border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
          >
            <option value="">Select vacancy</option>
            {vacancies.map((v) => (
              <option key={v.id} value={v.id}>
                {v.objective?.slice(0, 60) ?? v.id} {v.timeline ? ` · ${v.timeline}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {vacancyId && vacancy === null && !loading && (
        <PageState
          state="error"
          message="Vacancy not found or you don’t have access."
          onRetry={() => router.push('/matches')}
        />
      )}

      {vacancyId && vacancy && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card-surface rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
                  Ranked shortlist
                </h2>
                {matches.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleRunMatching}
                    disabled={runMatchingLoading}
                    className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {runMatchingLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Running…
                      </>
                    ) : (
                      <>
                        <Target className="w-3.5 h-3.5" />
                        Run Matching
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-2xs text-muted-foreground tabular-nums">
                    {matches.length} candidate{matches.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {matches.length === 0 ? (
                <div className="py-12 px-5 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No match results yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Click Run Matching to score coaches.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[48px_1fr_72px_72px_88px_80px_56px_70px_82px_56px] px-5 py-2.5 border-b border-border items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Rank
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Coach
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Overall
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Financial
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Cultural
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Avail
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Risk
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Confidence
                    </span>
                    <span />
                  </div>
                  <div className="divide-y divide-border/50">
                    {matches.map((match, index) => {
                      const coach = match.coaches
                      if (!coach) return null
                      const overall = match.overall_score ?? 0
                      const financial = match.financial_fit_score ?? 0
                      const cultural = match.cultural_fit_score ?? 0
                      const availability = match.availability_score ?? 0
                      const riskLevel = getRiskLevel(match.risk_score)
                      const confidenceLevel = getConfidenceLevel(match.confidence_score)
                      return (
                        <div
                          key={match.id}
                          className="grid grid-cols-[48px_1fr_72px_72px_88px_80px_56px_70px_82px_56px] px-5 py-3.5 items-center gap-2 hover:bg-surface-overlay/30 transition-colors"
                        >
                          <span
                            className={cn(
                              'text-sm font-bold tabular-nums',
                              index < 3 ? 'text-foreground' : 'text-muted-foreground/70'
                            )}
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/coaches/${match.coach_id}`}
                              className="text-[13px] font-medium text-foreground hover:text-primary transition-colors truncate block"
                            >
                              {coach.name}
                            </Link>
                            <span className="text-2xs text-muted-foreground truncate block">
                              {coach.role_current}
                              {coach.club_current ? ` · ${coach.club_current}` : ''}
                            </span>
                          </div>
                          <span className={cn('text-xs font-semibold tabular-nums', getScoreColorClass(overall))}>
                            {overall}
                          </span>
                          <span className={cn('text-xs font-medium tabular-nums', getScoreColorClass(financial))}>
                            {financial}
                          </span>
                          <span className={cn('text-xs font-medium tabular-nums', getScoreColorClass(cultural))}>
                            {cultural}
                          </span>
                          <span className={cn('text-xs font-medium tabular-nums', getScoreColorClass(availability))}>
                            {availability}
                          </span>
                          <span title={getRiskTooltipText(match.risk_score)} className="cursor-help">
                            <Badge
                              variant={riskLevel === 'Low' ? 'success' : riskLevel === 'High' ? 'danger' : 'warning'}
                              className="text-[10px] font-medium"
                            >
                              {riskLevel}
                            </Badge>
                          </span>
                          <span title={getConfidenceTooltipText(match.confidence_score)} className="cursor-help">
                            <Badge
                              variant={confidenceLevel === 'High' ? 'success' : confidenceLevel === 'Low' ? 'secondary' : 'info'}
                              className="text-[10px] font-medium"
                            >
                              {confidenceLevel}
                            </Badge>
                          </span>
                          <Link
                            href={`/coaches/${match.coach_id}`}
                            className="text-2xs text-muted-foreground hover:text-primary inline-flex items-center gap-0.5"
                          >
                            View
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="card-surface rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
                  Executive brief
                </h2>
                <button
                  type="button"
                  onClick={handleGenerateBrief}
                  disabled={generateBriefLoading || matches.length === 0}
                  className="inline-flex items-center gap-2 px-3 h-8 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {generateBriefLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  Generate
                </button>
              </div>
              <div className="p-5">
                {vacancy.executive_brief ? (
                  <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                    {vacancy.executive_brief}
                  </pre>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Run matching, then click Generate to create and save an executive brief.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {vacancyId && vacancy && (
        <div className="card-surface rounded-lg p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Vacancy details
          </h3>
          <p className="text-sm text-foreground">{vacancy.objective}</p>
          <p className="text-2xs text-muted-foreground mt-1">
            {vacancy.style_of_play} · {vacancy.budget_range} · {vacancy.timeline}
          </p>
        </div>
      )}
    </div>
  )
}

