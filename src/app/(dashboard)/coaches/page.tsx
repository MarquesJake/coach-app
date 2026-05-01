'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/db'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageState } from '@/components/ui/page-state'
import { Search, Users, ChevronRight, Filter, GitCompare, Plus, X, RefreshCw } from 'lucide-react'
import { toastError, toastSuccess } from '@/lib/ui/toast'

import { setStoredCompareIds, MAX_COMPARE } from '@/lib/compare'
import { computeCoachCompleteness } from '@/app/(dashboard)/coaches/[id]/_lib/coach-completeness'
import { getCoachStintAndIntelCountsAction } from './actions'

const MIN_COMPARE = 2

type Coach = Database['public']['Tables']['coaches']['Row']

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'overall_score', label: 'Overall score' },
  { value: 'mandate_fit', label: 'Mandate fit' },
  { value: 'intelligence_confidence', label: 'Intelligence confidence' },
  { value: 'recently_updated', label: 'Recently updated' },
] as const

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'secondary' | 'outline'> = {
  'Available': 'success',
  'Open to offers': 'warning',
  'Under contract - interested': 'warning',
  'Under contract': 'danger',
  'Not available': 'outline',
}

const REPUTATION_VARIANT: Record<string, 'purple' | 'warning' | 'info' | 'default' | 'outline'> = {
  'World-class': 'purple',
  'Elite': 'warning',
  'Established': 'info',
  'Emerging': 'default',
  'Unknown': 'outline',
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Available', label: 'Available' },
  { value: 'Open to offers', label: 'Open to Offers' },
  { value: 'Under contract - interested', label: 'Interested' },
  { value: 'Under contract', label: 'Under Contract' },
]

type SyncStatus = 'idle' | 'running' | 'paused' | 'rate_limited' | 'completed'

const BASE_FILTERS = {
  pressing_intensity: '',
  build_preference: '',
  preferred_systems: '' as string,
  leadership_style: '',
  media_style: '',
  risk_band: '',
  availability: '',
  reputation_tier: '',
  wage_band: '',
  youth_trust_min: '',
  youth_trust_max: '',
  rotation_min: '',
  rotation_max: '',
  overall_min: '',
  overall_max: '',
  nationality: '',
  league_experience: '',
  employed_only: '',
  age_min: '',
  age_max: '',
  club_current_query: '',
}

export default function CoachesPage() {
  const router = useRouter()
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [counts, setCounts] = useState<Record<string, { stintCount: number; intelligenceCount: number }>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [syncingEngland, setSyncingEngland] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncProgress, setSyncProgress] = useState<{ cursor: number; total: number; remaining: number; pct?: number }>({ cursor: 0, total: 0, remaining: 0 })
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [filters, setFilters] = useState(BASE_FILTERS)
  const supabase = createClient()

  useEffect(() => {
    async function loadCoaches() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCoaches([])
        setCounts({})
        setLoading(false)
        return
      }
      const [coachRes, countData] = await Promise.all([
        supabase
          .from('coaches')
          .select('id, user_id, name, age, nationality, role_current, club_current, preferred_style, pressing_intensity, build_preference, leadership_style, wage_expectation, staff_cost_estimate, available_status, reputation_tier, league_experience, last_updated, placement_score, board_compatibility, ownership_fit, cultural_risk, agent_relationship, media_risk, overall_fit, tactical_fit, financial_feasibility, overall_manual_score, intelligence_confidence, media_style, preferred_systems')
          .eq('user_id', user.id)
          .order('name'),
        getCoachStintAndIntelCountsAction(),
      ])
      setCoaches((coachRes.data || []) as Coach[])
      setCounts(countData)
      setLoading(false)
    }
    loadCoaches()
  }, [supabase])

  useEffect(() => {
    let cancelled = false
    async function loadSyncStatus() {
      try {
        const res = await fetch('/api/integrations/coaches/sync-english/status', { cache: 'no-store' })
        const body = await res.json()
        if (cancelled || !res.ok) return
        setSyncStatus((body?.status ?? 'idle') as SyncStatus)
        setSyncProgress(body?.progress ?? { cursor: 0, total: 0, remaining: 0 })
        setSyncMessage(body?.error ?? null)
      } catch {
        // noop
      }
    }
    loadSyncStatus()
    const interval = setInterval(loadSyncStatus, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  async function refreshCoaches() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [coachRes, countData] = await Promise.all([
      supabase
        .from('coaches')
        .select('id, user_id, name, age, nationality, role_current, club_current, preferred_style, pressing_intensity, build_preference, leadership_style, wage_expectation, staff_cost_estimate, available_status, reputation_tier, league_experience, last_updated, placement_score, board_compatibility, ownership_fit, cultural_risk, agent_relationship, media_risk, overall_fit, tactical_fit, financial_feasibility, overall_manual_score, intelligence_confidence, media_style, preferred_systems')
        .eq('user_id', user.id)
        .order('name'),
      getCoachStintAndIntelCountsAction(),
    ])
    setCoaches((coachRes.data || []) as Coach[])
    setCounts(countData)
  }

  const filtered = coaches
    .filter((c) => {
      const searchLower = search.trim().toLowerCase()
      const matchSearch =
        !searchLower ||
        c.name.toLowerCase().includes(searchLower) ||
        (c.club_current || '').toLowerCase().includes(searchLower) ||
        (c.nationality || '').toLowerCase().includes(searchLower) ||
        (Array.isArray(c.league_experience) && c.league_experience.some((l: string) => l.toLowerCase().includes(searchLower)))
      const matchStatus = statusFilter === 'all' || c.available_status === statusFilter
      if (!matchSearch || !matchStatus) return false
      if (filters.pressing_intensity && (c.pressing_intensity || '') !== filters.pressing_intensity) return false
      if (filters.build_preference && (c.build_preference || '') !== filters.build_preference) return false
      if (filters.preferred_systems && !(Array.isArray(c.preferred_systems) && c.preferred_systems.includes(filters.preferred_systems))) return false
      if (filters.leadership_style && (c.leadership_style || '') !== filters.leadership_style) return false
      if (filters.media_style && (c.media_style as string || '') !== filters.media_style) return false
      if (filters.availability && (c.available_status || '') !== filters.availability) return false
      if (filters.reputation_tier && (c.reputation_tier || '') !== filters.reputation_tier) return false
      if (filters.wage_band && (c.wage_expectation || '') !== filters.wage_band) return false
      if (filters.nationality && (c.nationality || '') !== filters.nationality) return false
      if (filters.league_experience) {
        const leagues = Array.isArray(c.league_experience) ? c.league_experience : []
        if (!leagues.includes(filters.league_experience)) return false
      }
      if (filters.employed_only === 'employed' && !(c.club_current && c.club_current.trim())) return false
      if (filters.employed_only === 'available' && c.club_current && c.club_current.trim()) return false
      if (filters.age_min && ((c.age ?? 0) < Number(filters.age_min))) return false
      if (filters.age_max && ((c.age ?? 999) > Number(filters.age_max))) return false
      if (filters.club_current_query) {
        const q = filters.club_current_query.toLowerCase().trim()
        if (!(c.club_current ?? '').toLowerCase().includes(q)) return false
      }
      const overall = (c.overall_manual_score as number | null) ?? 0
      if (filters.overall_min && overall < Number(filters.overall_min)) return false
      if (filters.overall_max && overall > Number(filters.overall_max)) return false
      if (filters.risk_band) {
        const risk = (c.media_risk as number | null) ?? 0
        if (filters.risk_band === 'low' && risk > 33) return false
        if (filters.risk_band === 'medium' && (risk <= 33 || risk > 66)) return false
        if (filters.risk_band === 'high' && risk <= 66) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'overall_score') {
        const sa = (a.overall_manual_score as number | null) ?? 0
        const sb = (b.overall_manual_score as number | null) ?? 0
        return sb - sa
      }
      if (sortBy === 'intelligence_confidence') {
        const sa = (a.intelligence_confidence as number | null) ?? 0
        const sb = (b.intelligence_confidence as number | null) ?? 0
        return sb - sa
      }
      if (sortBy === 'recently_updated') {
        const ta = new Date(a.last_updated || 0).getTime()
        const tb = new Date(b.last_updated || 0).getTime()
        return tb - ta
      }
      if (sortBy === 'mandate_fit') {
        const sa = (a.overall_fit as number | null) ?? (a.placement_score as number | null) ?? 0
        const sb = (b.overall_fit as number | null) ?? (b.placement_score as number | null) ?? 0
        return sb - sa
      }
      return (a.name || '').localeCompare(b.name || '')
    })

  const availableCount = coaches.filter(c => c.available_status === 'Available').length
  const interestedCount = coaches.filter(c => c.available_status === 'Open to offers' || c.available_status === 'Under contract - interested').length

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < MAX_COMPARE) next.add(id)
      return next
    })
  }

  const selectAllFiltered = () => {
    const ids = filtered.map((c) => c.id).slice(0, MAX_COMPARE)
    setSelectedIds(new Set(ids))
  }

  const goToCompare = () => {
    const ids = Array.from(selectedIds)
    if (ids.length < MIN_COMPARE || ids.length > MAX_COMPARE) return
    setStoredCompareIds(ids)
    router.push(`/coaches/compare?ids=${encodeURIComponent(ids.join(','))}`)
  }

  const canCompare = selectedIds.size >= MIN_COMPARE && selectedIds.size <= MAX_COMPARE
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (statusFilter !== 'all' ? 1 : 0)

  const applyFilterPreset = (preset: 'recruiting-now' | 'efl-available' | 'high-readiness-low-risk') => {
    if (preset === 'recruiting-now') {
      setFilters({
        ...BASE_FILTERS,
        employed_only: 'available',
        availability: 'Open to offers',
      })
      setSortBy('recently_updated')
      return
    }
    if (preset === 'efl-available') {
      setFilters({
        ...BASE_FILTERS,
        league_experience: 'Championship',
        employed_only: 'available',
      })
      setSortBy('overall_score')
      return
    }
    setFilters({
      ...BASE_FILTERS,
      risk_band: 'low',
      overall_min: '70',
    })
    setSortBy('overall_score')
  }

  if (loading) {
    return <PageState state="loading" minHeight="sm" />
  }

  if (coaches.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Link href="/coaches/new">
            <Button className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add coach
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <EmptyState
            title="No coach intelligence profiles yet"
            description="Add the first coach profile to start building availability, fit and risk evidence for future searches."
            actionLabel="Add coach"
            actionHref="/coaches/new"
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-lg font-medium text-foreground mb-4">Coach Inventory</h1>
      <details className="mb-4 rounded-lg border border-border/70 bg-card/70">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest">Internal data sync</p>
            <p className="mt-0.5 text-xs">
              England coach import: <span className="font-medium capitalize text-foreground">{syncStatus.replace('_', ' ')}</span>
              {syncProgress.total > 0 ? ` · ${syncProgress.cursor}/${syncProgress.total} teams` : ''}
            </p>
          </div>
          <span className="rounded border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
            Admin only
          </span>
        </summary>
        <div className="border-t border-border px-3 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground">
                Use this only when refreshing demo data from API-Football. It can update existing coach records.
              </p>
              {syncMessage ? <p className="text-xs text-amber-600 mt-1">{syncMessage}</p> : null}
            </div>
            {syncProgress.total > 0 ? (
              <div className="w-full sm:w-56">
                <div className="h-2 rounded bg-muted">
                  <div
                    className="h-2 rounded bg-primary transition-all"
                    style={{ width: `${Math.min(syncProgress.pct ?? Math.round((syncProgress.cursor / Math.max(syncProgress.total, 1)) * 100), 100)}%` }}
                  />
                </div>
              </div>
            ) : null}
            <Button
              variant="outline"
              onClick={async () => {
                setSyncingEngland(true)
                try {
                  const res = await fetch(`/api/integrations/coaches/sync-english?t=${Date.now()}`, {
                    method: 'POST',
                    cache: 'no-store',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ confirmReset: syncStatus === 'completed' }),
                  })
                  const body = await res.json()
                  if (!res.ok || !body?.ok) {
                    const detail = body?.error || (Array.isArray(body?.errors) ? body.errors.slice(0, 2).join(' | ') : null)
                    toastError(detail ?? 'Coach sync failed')
                    return
                  }
                  setSyncStatus((body?.status ?? 'paused') as SyncStatus)
                  setSyncProgress(body?.progress ?? { cursor: 0, total: 0, remaining: 0 })
                  setSyncMessage(body?.errors?.[0] ?? null)
                  if (body?.partial && Array.isArray(body?.errors) && body.errors.length > 0) {
                    toastError(`Partial coach sync: ${body.errors.slice(0, 2).join(' | ')}`)
                  } else {
                    const verb = body?.status === 'completed' ? 'complete' : 'progressed'
                    toastSuccess(`Coach sync ${verb}: ${body.added ?? 0} added, ${body.updated ?? 0} updated`)
                  }
                  await refreshCoaches()
                } catch {
                  toastError('Coach sync failed')
                } finally {
                  setSyncingEngland(false)
                }
              }}
              className="gap-1.5 text-xs py-1.5 px-3"
              disabled={syncingEngland}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', syncingEngland && 'animate-spin')} />
              {syncingEngland ? 'Syncing…' : syncStatus === 'completed' ? 'Re-sync England Coaches' : 'Continue England Coach Sync'}
            </Button>
          </div>
        </div>
      </details>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {coaches.length} profiles &middot; {availableCount} available &middot; {interestedCount} open to offers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/coaches/new">
            <Button className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add coach
            </Button>
          </Link>
          {canCompare && (
            <Button
              variant="outline"
              onClick={goToCompare}
              className="gap-1.5 text-xs py-1.5 px-3"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare ({selectedIds.size})
            </Button>
          )}
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium tabular-nums">{filtered.length} shown</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-lg border border-border bg-card p-3 mb-4">
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-2xs uppercase tracking-wide text-muted-foreground">Presets</span>
          <button onClick={() => applyFilterPreset('recruiting-now')} className="px-2 py-1 rounded border border-border text-2xs hover:bg-secondary/50">Recruiting now</button>
          <button onClick={() => applyFilterPreset('efl-available')} className="px-2 py-1 rounded border border-border text-2xs hover:bg-secondary/50">EFL available</button>
          <button onClick={() => applyFilterPreset('high-readiness-low-risk')} className="px-2 py-1 rounded border border-border text-2xs hover:bg-secondary/50">High readiness, low risk</button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, nationality, league..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface rounded-md text-sm text-foreground placeholder-muted-foreground/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs font-medium border',
              filtersOpen ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </button>
          <div className="flex items-center gap-1 border-l border-border pl-3">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  'px-2.5 py-1.5 rounded text-2xs font-medium transition-colors',
                  statusFilter === opt.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} aria-hidden />
          <div className="relative w-full max-w-md bg-card border-l border-border shadow-xl overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground">Filters</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Tactical</h3>
                <div className="space-y-2">
                  <label className="block text-xs text-foreground">Pressing intensity</label>
                  <select value={filters.pressing_intensity} onChange={(e) => setFilters((f) => ({ ...f, pressing_intensity: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm">
                    <option value="">Any</option>
                    {Array.from(new Set(coaches.map((c) => c.pressing_intensity).filter(Boolean))).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <label className="block text-xs text-foreground">Build preference</label>
                  <select value={filters.build_preference} onChange={(e) => setFilters((f) => ({ ...f, build_preference: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm">
                    <option value="">Any</option>
                    {Array.from(new Set(coaches.map((c) => c.build_preference).filter(Boolean))).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Leadership</h3>
                <div className="space-y-2">
                  <label className="block text-xs text-foreground">Leadership style</label>
                  <select value={filters.leadership_style} onChange={(e) => setFilters((f) => ({ ...f, leadership_style: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm">
                    <option value="">Any</option>
                    {Array.from(new Set(coaches.map((c) => c.leadership_style).filter(Boolean))).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <label className="block text-xs text-foreground">Risk band</label>
                  <select value={filters.risk_band} onChange={(e) => setFilters((f) => ({ ...f, risk_band: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm">
                    <option value="">Any</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Market</h3>
                <div className="space-y-2">
                  <label className="block text-xs text-foreground">Availability</label>
                  <select value={filters.availability} onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm">
                    <option value="">Any</option>
                    {Array.from(new Set(coaches.map((c) => c.available_status).filter(Boolean))).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <label className="block text-xs text-foreground">Reputation tier</label>
                  <select value={filters.reputation_tier} onChange={(e) => setFilters((f) => ({ ...f, reputation_tier: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm">
                    <option value="">Any</option>
                    {Array.from(new Set(coaches.map((c) => c.reputation_tier).filter(Boolean))).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <label className="block text-xs text-foreground">Wage band</label>
                  <select value={filters.wage_band} onChange={(e) => setFilters((f) => ({ ...f, wage_band: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm">
                    <option value="">Any</option>
                    {Array.from(new Set(coaches.map((c) => c.wage_expectation).filter(Boolean))).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <label className="block text-xs text-foreground">Nationality</label>
                  <select value={filters.nationality} onChange={(e) => setFilters((f) => ({ ...f, nationality: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm">
                    <option value="">Any</option>
                    {Array.from(new Set(coaches.map((c) => c.nationality).filter(Boolean))).map((v) => (
                      <option key={v} value={v!}>{v}</option>
                    ))}
                  </select>
                  <label className="block text-xs text-foreground">League experience</label>
                  <select value={filters.league_experience} onChange={(e) => setFilters((f) => ({ ...f, league_experience: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm">
                    <option value="">Any</option>
                    {Array.from(new Set(coaches.flatMap((c) => (Array.isArray(c.league_experience) ? c.league_experience : [])).filter(Boolean))).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <label className="block text-xs text-foreground">Employment status</label>
                  <select value={filters.employed_only} onChange={(e) => setFilters((f) => ({ ...f, employed_only: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm">
                    <option value="">Any</option>
                    <option value="employed">Currently employed</option>
                    <option value="available">No current club</option>
                  </select>
                  <label className="block text-xs text-foreground">Current club contains</label>
                  <input type="text" value={filters.club_current_query} onChange={(e) => setFilters((f) => ({ ...f, club_current_query: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm" placeholder="e.g. United" />
                </div>
              </section>
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Performance</h3>
                <div className="space-y-2">
                  <label className="block text-xs text-foreground">Overall score range</label>
                  <div className="flex gap-2">
                    <input type="number" min={0} max={100} placeholder="Min" value={filters.overall_min} onChange={(e) => setFilters((f) => ({ ...f, overall_min: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm" />
                    <input type="number" min={0} max={100} placeholder="Max" value={filters.overall_max} onChange={(e) => setFilters((f) => ({ ...f, overall_max: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm" />
                  </div>
                  <label className="block text-xs text-foreground">Age range</label>
                  <div className="flex gap-2">
                    <input type="number" min={18} max={90} placeholder="Min age" value={filters.age_min} onChange={(e) => setFilters((f) => ({ ...f, age_min: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm" />
                    <input type="number" min={18} max={90} placeholder="Max age" value={filters.age_max} onChange={(e) => setFilters((f) => ({ ...f, age_max: e.target.value }))} className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm" />
                  </div>
                </div>
              </section>
              <Button variant="outline" className="w-full" onClick={() => setFilters(BASE_FILTERS)}>
                Clear filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Coach Table/List */}
      <div className="card-surface rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[32px_1fr_140px_120px_100px_80px_60px_60px_32px] px-5 py-2.5 border-b border-border bg-surface/50">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))}
              onChange={(e) => (e.target.checked ? selectAllFiltered() : setSelectedIds(new Set()))}
              className="rounded border-border"
              aria-label="Select all"
            />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Coach</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Style</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Status</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Reputation</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Wage</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Complete</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Ready</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          {filtered.map((coach, i) => {
            const completeness = computeCoachCompleteness(coach as Record<string, unknown>, counts[coach.id])
            const intelligenceConf = (coach.intelligence_confidence as number | null | undefined) ?? 0
            const readiness = Math.round(completeness * 0.6 + intelligenceConf * 0.4)
            const readinessBadge =
              readiness >= 70
                ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400'
                : readiness >= 40
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-border bg-muted/50 text-muted-foreground'
            return (
            <div
              key={coach.id}
              className="grid grid-cols-[32px_1fr_140px_120px_100px_80px_60px_60px_32px] px-5 py-3 items-center hover:bg-surface-overlay/30 transition-colors group animate-fade-in"
              style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
            >
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(coach.id)}
                  onChange={() => toggleSelect(coach.id)}
                  disabled={!selectedIds.has(coach.id) && selectedIds.size >= MAX_COMPARE}
                  className="rounded border-border"
                  aria-label={`Select ${coach.name}`}
                />
              </div>
              <Link
                href={`/coaches/${coach.id}`}
                className="min-w-0 flex flex-col"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {coach.name}
                  </span>
                  {coach.nationality && (
                    <span className="text-2xs text-muted-foreground/50 hidden lg:inline">{coach.nationality}</span>
                  )}
                </div>
                <span className="text-2xs text-muted-foreground truncate block">
                  {coach.role_current}{coach.club_current ? ` · ${coach.club_current}` : ''}
                </span>
              </Link>

              {/* Style */}
              <div>
                <span className="text-2xs text-muted-foreground">{coach.preferred_style}</span>
              </div>

              {/* Status */}
              <div>
                <Badge variant={STATUS_VARIANT[coach.available_status] || 'outline'}>
                  {coach.available_status === 'Under contract - interested' ? 'Interested' : coach.available_status}
                </Badge>
              </div>

              {/* Reputation */}
              <div>
                <Badge variant={REPUTATION_VARIANT[coach.reputation_tier] || 'outline'}>
                  {coach.reputation_tier}
                </Badge>
              </div>

              {/* Wage */}
              <div>
                <span className="text-2xs text-muted-foreground tabular-nums">{coach.wage_expectation}</span>
              </div>

              {/* Completeness */}
              <div className="tabular-nums text-2xs font-medium text-muted-foreground">
                {completeness}%
              </div>

              {/* Readiness */}
              <div>
                <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-2xs font-medium tabular-nums', readinessBadge)}>
                  {readiness}%
                </span>
              </div>

              {/* Arrow */}
              <div className="flex justify-end">
                <Link href={`/coaches/${coach.id}`} className="inline-flex">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                </Link>
              </div>
            </div>
          )})}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="py-16">
          <EmptyState title="No coaches match this view" description="Adjust search or filters to bring coach profiles back into the market view." />
          <div className="text-center mt-3">
            <button
              onClick={() => { setSearch(''); setStatusFilter('all') }}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
