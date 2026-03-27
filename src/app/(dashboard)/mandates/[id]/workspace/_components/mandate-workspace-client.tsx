'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { updateShortlistWorkspaceAction, addCandidateToWorkspaceAction } from '../../../actions'
import { addCandidateFromLonglistAction } from '../../../actions-longlist'
import { fmtTenure, type StabilityMetrics } from '@/lib/analysis/coaching-stability'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Search } from 'lucide-react'
import { MandateSearchPanel } from './mandate-search-panel'
import { MandateFitDetail } from './mandate-fit-detail'
import type { LonglistEntryData } from '../../../actions-longlist'
import type { ParsedFit } from './mandate-search-panel'

// ── Types ─────────────────────────────────────────────────────────────────────

type Club = {
  id?: string
  name: string | null
  league: string | null
  country: string | null
  tier: string | null
  ownership_model: string | null
  tactical_model: string | null
  pressing_model: string | null
  build_model: string | null
  board_risk_tolerance: string | null
  strategic_priority: string | null
  market_reputation: string | null
  media_pressure: string | null
  development_vs_win_now: string | null
  environment_assessment: string | null
  instability_risk: string | null
  stadium: string | null
  founded_year: string | null
  current_manager: string | null
  website: string | null
  badge_url: string | null
  notes: string | null
  last_synced_at: string | null
}

type Mandate = {
  id: string
  strategic_objective: string | null
  board_risk_appetite: string | null
  budget_band: string | null
  succession_timeline: string | null
  custom_club_name: string | null
  status: string | null
  priority: string | null
  clubs: Club | null
}

type Candidate = {
  id: string
  coach_id: string
  candidate_stage: string
  placement_probability: number
  risk_rating: string
  status: string
  notes: string | null
  network_source: string | null
  network_recommender: string | null
  network_relationship: string | null
  fit_tactical: string | null
  fit_cultural: string | null
  fit_level: string | null
  fit_communication: string | null
  fit_network: string | null
  fit_notes: string | null
  coaches: { name: string | null; club_current: string | null; nationality: string | null } | null
}

type CoachSearchResult = {
  id: string
  name: string | null
  club_current: string | null
  nationality: string | null
  available_status: string | null
}

type SeasonResult = {
  season: string
  league_position: number | null
  points: number | null
  goals_for: number | null
  goals_against: number | null
}

type CoachingRecord = {
  coach_name: string
  start_date: string | null
  end_date: string | null
  reason_for_exit: string | null
  style_tags: string[]
  data_source: string | null
}

export type { Mandate, Candidate, SeasonResult, CoachingRecord, StabilityMetrics }

// ── Constants ─────────────────────────────────────────────────────────────────

const CANDIDATE_STAGES = ['Tracked', 'Longlist', 'Shortlist', 'Interview', 'Final'] as const
const FIT_SIGNALS = ['Strong', 'Moderate', 'Weak', 'Unknown'] as const
const NETWORK_SOURCES = ['Data search', 'Direct recommendation', 'Network suggestion', 'Proactive approach'] as const
const NETWORK_RELATIONSHIPS = ['Direct', 'Indirect', 'Cold'] as const

const AVAILABLE_STATUS_FILTERS = ['All', 'Available', 'Open to offers', 'Under contract'] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function fitDot(signal: string | null) {
  if (signal === 'Strong') return 'bg-emerald-400'
  if (signal === 'Moderate') return 'bg-amber-400'
  if (signal === 'Weak') return 'bg-red-400'
  return 'bg-muted-foreground/30'
}

function overallFit(c: Candidate): 'strong' | 'moderate' | 'weak' | 'unknown' {
  const signals = [c.fit_tactical, c.fit_cultural, c.fit_level, c.fit_communication, c.fit_network]
  const scored = signals.filter(Boolean)
  if (scored.length === 0) return 'unknown'
  if (scored.some((s) => s === 'Weak')) return 'weak'
  if (scored.every((s) => s === 'Strong')) return 'strong'
  return 'moderate'
}

function tenure(start: string | null, end: string | null) {
  if (!start) return '—'
  const s = new Date(start).getFullYear()
  const e = end ? new Date(end).getFullYear() : 'present'
  return `${s}–${e}`
}

function provenanceDots(rel: string | null) {
  if (rel === 'Direct') return '●●●'
  if (rel === 'Indirect') return '●●○'
  return '●○○'
}

function availabilityDotClass(status: string | null) {
  if (status === 'Available') return 'bg-emerald-400'
  if (status === 'Open to offers') return 'bg-amber-400'
  if (status === 'Under contract') return 'bg-blue-400'
  return 'bg-muted-foreground/30'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FitSignalSelect({ name, label, value }: { name: string; label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
      <select
        name={name}
        defaultValue={value ?? 'Unknown'}
        className="w-full h-9 rounded bg-surface border border-border px-2 text-xs text-foreground"
      >
        {FIT_SIGNALS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  )
}

// ── Stability label styles ────────────────────────────────────────────────────

const STABILITY_STYLES: Record<string, string> = {
  emerald: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  amber:   'text-amber-400  border-amber-400/30  bg-amber-400/10',
  red:     'text-red-400    border-red-400/30    bg-red-400/10',
  muted:   'text-muted-foreground border-border bg-surface',
}

// ── Left Panel: Club Brief ────────────────────────────────────────────────────

function ClubBrief({
  mandate,
  seasonResults,
  coachingHistory,
  stabilityMetrics,
}: {
  mandate: Mandate
  seasonResults: SeasonResult[]
  coachingHistory: CoachingRecord[]
  stabilityMetrics: StabilityMetrics
}) {
  const club = mandate.clubs
  const clubName = mandate.custom_club_name ?? club?.name ?? 'Unknown club'

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">

      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">{clubName}</h2>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {club?.league && (
            <span className="text-[10px] border border-border bg-surface px-2 py-0.5 rounded text-muted-foreground">{club.league}</span>
          )}
          {club?.country && (
            <span className="text-[10px] border border-border bg-surface px-2 py-0.5 rounded text-muted-foreground">{club.country}</span>
          )}
          {club?.tier && (
            <span className="text-[10px] border border-primary/20 bg-primary/10 px-2 py-0.5 rounded text-primary">{club.tier}</span>
          )}
          {club?.market_reputation && (
            <span className="text-[10px] border border-border bg-surface px-2 py-0.5 rounded text-muted-foreground">{club.market_reputation}</span>
          )}
        </div>
        {(club?.founded_year || club?.stadium) && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {club.founded_year ? `Est. ${club.founded_year}` : ''}
            {club.founded_year && club.stadium ? ' · ' : ''}
            {club.stadium ?? ''}
          </p>
        )}
      </div>

      {/* Club intelligence */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Club intelligence</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Ownership</p>
            <p className="text-foreground font-medium mt-0.5">{club?.ownership_model || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Board risk</p>
            <p className="text-foreground font-medium mt-0.5">
              {club?.board_risk_tolerance || mandate.board_risk_appetite || '—'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Tactical identity</p>
            <p className="text-foreground font-medium mt-0.5">{club?.tactical_model || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Strategic priority</p>
            <p className="text-foreground font-medium mt-0.5">{club?.strategic_priority || '—'}</p>
          </div>
          {club?.development_vs_win_now && (
            <div>
              <p className="text-muted-foreground">Focus</p>
              <p className="text-foreground font-medium mt-0.5">{club.development_vs_win_now}</p>
            </div>
          )}
          {club?.media_pressure && (
            <div>
              <p className="text-muted-foreground">Media pressure</p>
              <p className="text-foreground font-medium mt-0.5">{club.media_pressure}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Budget band</p>
            <p className="text-foreground font-medium mt-0.5">{mandate.budget_band || '—'}</p>
          </div>
        </div>
        {club?.environment_assessment && (
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 italic">
            {club.environment_assessment}
          </p>
        )}
        {club?.instability_risk && (
          <div className="rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1.5">
            <p className="text-[10px] text-amber-400 leading-relaxed">⚠ {club.instability_risk}</p>
          </div>
        )}
      </section>

      {/* Coaching stability */}
      {stabilityMetrics.has_sufficient_data && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Coaching stability</h3>
            <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STABILITY_STYLES[stabilityMetrics.stability_color]}`}>
              {stabilityMetrics.stability_label}
            </span>
          </div>

          {/* Key metrics — 3 compact figures */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground text-[10px]">Avg tenure</p>
              <p className="text-foreground font-semibold tabular-nums mt-0.5">
                {fmtTenure(stabilityMetrics.avg_tenure_months)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px]">Last 5yr</p>
              <p className={`font-semibold tabular-nums mt-0.5 ${
                stabilityMetrics.coaches_last_5_years >= 4 ? 'text-red-400'
                  : stabilityMetrics.coaches_last_5_years >= 3 ? 'text-amber-400'
                    : 'text-foreground'
              }`}>
                {stabilityMetrics.coaches_last_5_years}
              </p>
            </div>
            {stabilityMetrics.current_tenure_months !== null && (
              <div>
                <p className="text-muted-foreground text-[10px]">Current</p>
                <p className="text-foreground font-semibold tabular-nums mt-0.5">
                  {fmtTenure(stabilityMetrics.current_tenure_months)}
                </p>
              </div>
            )}
          </div>

          {/* 1-line interpretation */}
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            {stabilityMetrics.interpretation}
          </p>

          {/* Recruitment risk note */}
          <div className={`rounded border px-2 py-1.5 ${STABILITY_STYLES[stabilityMetrics.stability_color]}`}>
            <p className="text-[10px] leading-relaxed">{stabilityMetrics.recruitment_note}</p>
          </div>
        </section>
      )}

      {/* Performance trajectory */}
      {seasonResults.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Performance trajectory</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left py-1 font-medium">Season</th>
                <th className="text-right py-1 font-medium">Pos</th>
                <th className="text-right py-1 font-medium">Pts</th>
                <th className="text-right py-1 font-medium">GD</th>
              </tr>
            </thead>
            <tbody>
              {seasonResults.map((r) => {
                const gd = r.goals_for != null && r.goals_against != null ? r.goals_for - r.goals_against : null
                return (
                  <tr key={r.season} className="border-t border-border/50">
                    <td className="py-1 text-foreground">{r.season}</td>
                    <td className="py-1 text-right text-foreground">{r.league_position ?? '—'}</td>
                    <td className="py-1 text-right text-foreground">{r.points ?? '—'}</td>
                    <td className={`py-1 text-right ${gd != null && gd > 0 ? 'text-emerald-400' : gd != null && gd < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {gd != null ? `${gd > 0 ? '+' : ''}${gd}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Coaching history */}
      {coachingHistory.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Coaching history</h3>
          <div className="space-y-2">
            {coachingHistory.map((c, i) => (
              <div key={i} className="text-xs">
                <p className="text-foreground font-medium">{c.coach_name}</p>
                <p className="text-muted-foreground">
                  {tenure(c.start_date, c.end_date)}
                  {c.reason_for_exit ? ` · ${c.reason_for_exit}` : ''}
                </p>
                {c.style_tags && c.style_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.style_tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[9px] border border-border px-1 rounded text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mandate brief */}
      {mandate.strategic_objective && (
        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mandate brief</h3>
          <p className="text-xs text-foreground leading-relaxed">{mandate.strategic_objective}</p>
        </section>
      )}

      {mandate.succession_timeline && (
        <section className="space-y-1">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Succession timeline</h3>
          <p className="text-xs text-foreground">{mandate.succession_timeline}</p>
        </section>
      )}
    </div>
  )
}

// ── Center Panel: Fit Assessment ──────────────────────────────────────────────

function FitAssessment({
  candidate,
  mandateId,
}: {
  candidate: Candidate | null
  mandateId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  if (!candidate) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-3">
        <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
          <span className="text-lg">←</span>
        </div>
        <p className="text-sm font-medium text-foreground">Select a candidate</p>
        <p className="text-xs text-muted-foreground">Click any candidate in the pipeline to open their fit assessment here.</p>
      </div>
    )
  }

  const coachName = candidate.coaches?.name ?? 'Unknown coach'
  const overall = overallFit(candidate)

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateShortlistWorkspaceAction(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">
      {/* Candidate header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{coachName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {candidate.coaches?.club_current || 'Free agent'}
            {candidate.coaches?.nationality ? ` · ${candidate.coaches.nationality}` : ''}
          </p>
        </div>
        <span className={cn(
          'text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border',
          overall === 'strong' && 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
          overall === 'moderate' && 'text-amber-400 bg-amber-400/10 border-amber-400/20',
          overall === 'weak' && 'text-red-400 bg-red-400/10 border-red-400/20',
          overall === 'unknown' && 'text-muted-foreground bg-surface border-border',
        )}>
          {overall === 'unknown' ? 'Unscored' : overall}
        </span>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <input type="hidden" name="shortlist_id" value={candidate.id} />
        <input type="hidden" name="mandate_id" value={mandateId} />

        {/* Stage */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stage</h3>
          <select
            name="candidate_stage"
            defaultValue={candidate.candidate_stage}
            className="w-full h-9 rounded bg-surface border border-border px-2 text-xs text-foreground"
          >
            {CANDIDATE_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </section>

        {/* Network provenance */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Network provenance</h3>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">How identified</label>
            <select
              name="network_source"
              defaultValue={candidate.network_source ?? ''}
              className="w-full h-9 rounded bg-surface border border-border px-2 text-xs text-foreground"
            >
              <option value="">Select…</option>
              {NETWORK_SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Recommended by</label>
              <input
                type="text"
                name="network_recommender"
                defaultValue={candidate.network_recommender ?? ''}
                placeholder="Name, role"
                className="w-full h-9 rounded bg-surface border border-border px-2 text-xs text-foreground placeholder-muted-foreground/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Relationship</label>
              <select
                name="network_relationship"
                defaultValue={candidate.network_relationship ?? ''}
                className="w-full h-9 rounded bg-surface border border-border px-2 text-xs text-foreground"
              >
                <option value="">Select…</option>
                {NETWORK_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>{r === 'Direct' ? '●●● Direct' : r === 'Indirect' ? '●●○ Indirect' : '●○○ Cold'}</option>
                ))}
              </select>
            </div>
          </div>
          {candidate.network_relationship && (
            <p className="text-[10px] text-muted-foreground">
              {candidate.network_relationship === 'Direct' && 'Recommender worked directly with this coach in a similar setup.'}
              {candidate.network_relationship === 'Indirect' && 'Recommender has observed or studied this coach without working together.'}
              {candidate.network_relationship === 'Cold' && 'Based on reputation or third-hand information only.'}
            </p>
          )}
        </section>

        {/* Fit dimensions */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fit assessment</h3>
          <div className="grid grid-cols-2 gap-3">
            <FitSignalSelect name="fit_tactical" label="Tactical / style fit" value={candidate.fit_tactical} />
            <FitSignalSelect name="fit_level" label="League / level fit" value={candidate.fit_level} />
            <FitSignalSelect name="fit_cultural" label="Cultural fit" value={candidate.fit_cultural} />
            <FitSignalSelect name="fit_communication" label="Communication" value={candidate.fit_communication} />
            <FitSignalSelect name="fit_network" label="Network standing" value={candidate.fit_network} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Assessment notes</label>
            <textarea
              name="fit_notes"
              defaultValue={candidate.fit_notes ?? ''}
              rows={3}
              placeholder="Observations, risks, behavioural signals…"
              className="w-full rounded bg-surface border border-border px-2 py-2 text-xs text-foreground placeholder-muted-foreground/40 resize-none"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save assessment'}
        </button>
      </form>
    </div>
  )
}

// ── Add Candidate Search Panel ────────────────────────────────────────────────

function AddCandidatePanel({
  mandateId,
  existingCoachIds,
  onBack,
  onAdded,
}: {
  mandateId: string
  existingCoachIds: Set<string>
  onBack: () => void
  onAdded: () => void
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [results, setResults] = useState<CoachSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const router = useRouter()

  const search = useCallback(async () => {
    setSearching(true)
    const supabase = createClient()
    let q = supabase
      .from('coaches')
      .select('id, name, club_current, nationality, available_status')
      .order('name', { ascending: true })
      .limit(30)

    if (query.trim()) {
      q = q.or(
        `name.ilike.%${query.trim()}%,club_current.ilike.%${query.trim()}%,nationality.ilike.%${query.trim()}%`
      )
    }

    if (statusFilter !== 'All') {
      q = q.eq('available_status', statusFilter)
    }

    const { data } = await q
    setResults((data as CoachSearchResult[]) ?? [])
    setSearching(false)
  }, [query, statusFilter])

  useEffect(() => {
    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [search])

  async function handleAdd(coachId: string) {
    setAddingId(coachId)
    const result = await addCandidateToWorkspaceAction(mandateId, coachId)
    setAddingId(null)
    if (result.error && result.error !== 'Already added') {
      // silently handle — user can retry
      return
    }
    setAddedIds((prev) => new Set(prev).add(coachId))
    router.refresh()
    onAdded()
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-surface-overlay/30 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to pipeline"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add candidate</h2>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, club, nationality…"
          autoFocus
          className="w-full h-9 rounded bg-surface border border-border pl-8 pr-3 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {AVAILABLE_STATUS_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-medium border transition-colors',
              statusFilter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground border-border hover:text-foreground'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
        {searching && (
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-surface/50 animate-pulse border border-border" />
            ))}
          </div>
        )}

        {!searching && results.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No coaches found.</p>
        )}

        {!searching && results.map((coach) => {
          const alreadyOnShortlist = existingCoachIds.has(coach.id) || addedIds.has(coach.id)
          const isAdding = addingId === coach.id
          return (
            <div
              key={coach.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn('w-1.5 h-1.5 rounded-full shrink-0', availabilityDotClass(coach.available_status))}
                  />
                  <p className="text-xs font-medium text-foreground truncate">{coach.name ?? 'Unknown'}</p>
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {coach.club_current || 'Free agent'}
                  {coach.nationality ? ` · ${coach.nationality}` : ''}
                </p>
              </div>
              {alreadyOnShortlist ? (
                <span className="text-[10px] font-medium text-emerald-400 shrink-0">Added ✓</span>
              ) : (
                <button
                  type="button"
                  disabled={isAdding}
                  onClick={() => handleAdd(coach.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  {isAdding ? '…' : 'Add'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Right Panel: Candidate Pipeline ───────────────────────────────────────────

function CandidatePipeline({
  candidates,
  selectedId,
  onSelect,
  mandateId,
}: {
  candidates: Candidate[]
  selectedId: string | null
  onSelect: (id: string) => void
  mandateId: string
}) {
  const [showSearch, setShowSearch] = useState(false)

  const existingCoachIds = new Set(candidates.map((c) => c.coach_id))

  const byStage = CANDIDATE_STAGES.map((stage) => ({
    stage,
    items: candidates.filter((c) => c.candidate_stage === stage),
  })).filter((g) => g.items.length > 0)

  const unstaged = candidates.filter(
    (c) => !CANDIDATE_STAGES.includes(c.candidate_stage as typeof CANDIDATE_STAGES[number])
  )

  const allGroups = [
    ...byStage,
    ...(unstaged.length > 0 ? [{ stage: 'Unassigned', items: unstaged }] : []),
  ]

  if (showSearch) {
    return (
      <AddCandidatePanel
        mandateId={mandateId}
        existingCoachIds={existingCoachIds}
        onBack={() => setShowSearch(false)}
        onAdded={() => setShowSearch(false)}
      />
    )
  }

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Candidates</h2>
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add candidate
        </button>
      </div>

      {candidates.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-xs text-muted-foreground">
            No candidates yet. Add a coach to get started.
          </p>
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add candidate
          </button>
        </div>
      )}

      {allGroups.map(({ stage, items }) => (
        <div key={stage} className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">{stage}</p>
          {items.map((c) => {
            const overall = overallFit(c)
            const isSelected = c.id === selectedId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  'w-full text-left rounded-lg border px-3 py-2.5 transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/[0.06]'
                    : 'border-border bg-surface/40 hover:bg-surface-overlay/30'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground truncate">{c.coaches?.name ?? 'Unknown'}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.network_relationship && (
                      <span className="text-[9px] text-muted-foreground font-mono">{provenanceDots(c.network_relationship)}</span>
                    )}
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', fitDot(
                      overall === 'strong' ? 'Strong'
                        : overall === 'moderate' ? 'Moderate'
                          : overall === 'weak' ? 'Weak'
                            : null
                    ))} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {c.coaches?.club_current || 'Free agent'}
                </p>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Main Workspace ────────────────────────────────────────────────────────────

export function MandateWorkspaceClient({
  mandate,
  shortlist,
  seasonResults,
  coachingHistory,
  stabilityMetrics,
  longlistEntries,
}: {
  mandate: Mandate
  shortlist: Candidate[]
  seasonResults: SeasonResult[]
  coachingHistory: CoachingRecord[]
  stabilityMetrics: StabilityMetrics
  longlistEntries: LonglistEntryData[]
}) {
  const router = useRouter()

  // Pipeline candidate selection (center = FitAssessment)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Recommendation selection (center = MandateFitDetail)
  const [recEntry, setRecEntry] = useState<LonglistEntryData | null>(null)
  const [recFit, setRecFit] = useState<ParsedFit | null>(null)

  // Right panel tab
  const [rightTab, setRightTab] = useState<'recommendations' | 'pipeline'>('recommendations')

  // Adding from fit-detail panel
  const [addingFromDetail, setAddingFromDetail] = useState(false)

  const existingCoachIds = new Set(shortlist.map((c) => c.coach_id))
  const existingStages = new Map(shortlist.map((c) => [c.coach_id, c.candidate_stage]))

  const selectedCandidate = shortlist.find((c) => c.id === selectedId) ?? null

  function handleSelectRec(entry: LonglistEntryData, fit: ParsedFit) {
    setRecEntry(entry)
    setRecFit(fit)
    setSelectedId(null) // clear pipeline selection
  }

  function handleSelectPipeline(id: string) {
    setSelectedId(id)
    setRecEntry(null)
    setRecFit(null)
  }

  function handleBackFromDetail() {
    setRecEntry(null)
    setRecFit(null)
  }

  async function handleAddFromDetail(coachId: string) {
    setAddingFromDetail(true)
    const result = await addCandidateFromLonglistAction(mandate.id, coachId)
    setAddingFromDetail(false)
    if (!result.error || result.error === 'Already added') {
      router.refresh()
    }
  }

  // Center panel: show fit-detail if a recommendation is selected, else pipeline assessment
  const showFitDetail = recEntry !== null && recFit !== null

  return (
    <div className="grid grid-cols-[280px_1fr_260px] gap-4 h-[calc(100vh-12rem)]">
      {/* Left: Club Brief */}
      <div className="rounded-lg border border-border bg-card p-4 overflow-hidden">
        <ClubBrief
          mandate={mandate}
          seasonResults={seasonResults}
          coachingHistory={coachingHistory}
          stabilityMetrics={stabilityMetrics}
        />
      </div>

      {/* Center: Fit Detail or Fit Assessment */}
      <div className="rounded-lg border border-border bg-card p-4 overflow-hidden">
        {showFitDetail ? (
          <MandateFitDetail
            entry={recEntry}
            fit={recFit}
            isInPipeline={existingCoachIds.has(recEntry.coach_id)}
            pipelineStage={existingStages.get(recEntry.coach_id)}
            isAdding={addingFromDetail}
            onAdd={handleAddFromDetail}
            onBack={handleBackFromDetail}
          />
        ) : (
          <FitAssessment candidate={selectedCandidate} mandateId={mandate.id} />
        )}
      </div>

      {/* Right: Tab switcher + panel */}
      <div className="rounded-lg border border-border bg-card p-4 overflow-hidden flex flex-col gap-3">
        {/* Tab switcher */}
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setRightTab('recommendations')}
            className={cn(
              'flex-1 h-7 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors',
              rightTab === 'recommendations'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Ranked
          </button>
          <button
            type="button"
            onClick={() => setRightTab('pipeline')}
            className={cn(
              'flex-1 h-7 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors',
              rightTab === 'pipeline'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Pipeline {shortlist.length > 0 && `(${shortlist.length})`}
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden">
          {rightTab === 'recommendations' ? (
            <MandateSearchPanel
              mandateId={mandate.id}
              initialEntries={longlistEntries}
              existingCoachIds={existingCoachIds}
              existingStages={existingStages}
              onSelectEntry={handleSelectRec}
              selectedCoachId={recEntry?.coach_id ?? null}
            />
          ) : (
            <CandidatePipeline
              candidates={shortlist}
              selectedId={selectedId}
              onSelect={handleSelectPipeline}
              mandateId={mandate.id}
            />
          )}
        </div>
      </div>
    </div>
  )
}
