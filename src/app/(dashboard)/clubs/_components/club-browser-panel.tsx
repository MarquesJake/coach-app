'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toastError, toastSuccess } from '@/lib/ui/toast'

type ClubRow = {
  id: string
  name: string
  league: string
  country: string
  tier: string | null
  badge_url: string | null
}

const PAGE_SIZE = 30

// Ordered tier labels for English football pyramid — shown as quick-filter chips
const ENGLISH_TIERS = [
  { tier: '1', label: 'PL' },
  { tier: '2', label: 'Champ' },
  { tier: '3', label: 'L1' },
  { tier: '4', label: 'L2' },
]

export function ClubBrowserPanel() {
  const pathname = usePathname()
  const [clubs, setClubs] = useState<ClubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<string | null>(null)
  const [leagueFilter, setLeagueFilter] = useState<string>('')
  const [countryFilter, setCountryFilter] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [syncingEngland, setSyncingEngland] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('clubs')
        .select('id, name, league, country, tier, badge_url')
        .eq('user_id', user.id)
        .order('tier', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })
        .limit(500)
        .then(({ data }) => {
          setClubs((data as ClubRow[]) ?? [])
          setLoading(false)
        })
    })
  }, [])

  // Which tier chips to show (only tiers present in data)
  const presentTiers = useMemo(() => {
    const tiers = new Set(clubs.map(c => c.tier).filter(Boolean))
    return ENGLISH_TIERS.filter(t => tiers.has(t.tier))
  }, [clubs])

  // Unique leagues + countries for dropdowns
  const leagues = useMemo(() =>
    Array.from(new Set(clubs.map(c => c.league).filter(Boolean))).sort(),
    [clubs]
  )
  const countries = useMemo(() =>
    Array.from(new Set(clubs.map(c => c.country).filter(Boolean))).sort(),
    [clubs]
  )

  const hasDropdownFilters = leagues.length > 1 || countries.length > 1

  const filtered = useMemo(() => {
    let result = clubs
    if (tierFilter) result = result.filter(c => c.tier === tierFilter)
    if (leagueFilter) result = result.filter(c => c.league === leagueFilter)
    if (countryFilter) result = result.filter(c => c.country === countryFilter)
    const q = query.trim().toLowerCase()
    if (q) result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.league ?? '').toLowerCase().includes(q) ||
      (c.country ?? '').toLowerCase().includes(q)
    )
    return result
  }, [clubs, query, tierFilter, leagueFilter, countryFilter])

  const visible = filtered.slice(0, visibleCount)

  const selectedId = pathname.match(/^\/clubs\/([a-f0-9-]{36})/)?.[1] ?? null

  return (
    <div className="flex flex-col h-full bg-transparent">

      {/* Header */}
      <div className="px-4 py-3 border-b border-border space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Club database
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/clubs/new"
              title="Add club"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <details className="rounded-md border border-border/70 bg-surface/50">
          <summary className="flex cursor-pointer list-none items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
            Internal sync
            <span className="rounded border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[8px] text-amber-300">Admin only</span>
          </summary>
          <div className="border-t border-border px-2.5 py-2 space-y-2">
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Refresh English clubs from API-Football. Use only when preparing or repairing demo data.
            </p>
            <button
              type="button"
              title="Sync England clubs from API-Football"
              disabled={syncingEngland}
              onClick={async () => {
                setSyncingEngland(true)
                try {
                  const res = await fetch(`/api/integrations/clubs/sync-english?t=${Date.now()}`, {
                    method: 'POST',
                    cache: 'no-store',
                  })
                  const body = await res.json()
                  const hasRows = Number(body?.added ?? 0) + Number(body?.updated ?? 0) > 0
                  if (!res.ok || (!body?.ok && !hasRows)) {
                    const detail =
                      body?.error ||
                      (Array.isArray(body?.errors) && body.errors.length > 0 ? body.errors.slice(0, 2).join(' | ') : null)
                    toastError(detail ?? 'Club sync failed')
                    return
                  }
                  if (body?.partial && Array.isArray(body?.errors) && body.errors.length > 0) {
                    toastError(`Partial sync: ${body.errors.slice(0, 2).join(' | ')}`)
                  } else {
                    toastSuccess(
                      `England sync complete: ${body.added ?? 0} added, ${body.updated ?? 0} updated${
                        body.removed_stale_season ? `, ${body.removed_stale_season} removed` : ''
                      }`
                    )
                  }
                  const supabase = createClient()
                  const { data: { user } } = await supabase.auth.getUser()
                  if (user) {
                    const { data } = await supabase
                      .from('clubs')
                      .select('id, name, league, country, tier, badge_url')
                      .eq('user_id', user.id)
                      .order('tier', { ascending: true, nullsFirst: false })
                      .order('name', { ascending: true })
                      .limit(500)
                    setClubs((data as ClubRow[]) ?? [])
                    setVisibleCount(PAGE_SIZE)
                  }
                } catch {
                  toastError('Club sync failed')
                } finally {
                  setSyncingEngland(false)
                }
              }}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', syncingEngland && 'animate-spin')} />
              {syncingEngland ? 'Syncing…' : 'Sync England'}
            </button>
          </div>
        </details>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search clubs…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE) }}
            className="w-full h-8 pl-8 pr-3 rounded bg-surface border border-border text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* League + country dropdowns — shown when multiple distinct values exist */}
        {hasDropdownFilters && (
          <div className="flex gap-1.5">
            {leagues.length > 1 && (
              <select
                value={leagueFilter}
                onChange={e => { setLeagueFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
                className="flex-1 h-7 rounded border border-border bg-surface text-[10px] px-2 text-foreground min-w-0"
              >
                <option value="">League…</option>
                {leagues.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            )}
            {countries.length > 1 && (
              <select
                value={countryFilter}
                onChange={e => { setCountryFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
                className="flex-1 h-7 rounded border border-border bg-surface text-[10px] px-2 text-foreground min-w-0"
              >
                <option value="">Country…</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {(leagueFilter || countryFilter) && (
              <button
                type="button"
                onClick={() => { setLeagueFilter(''); setCountryFilter(''); setVisibleCount(PAGE_SIZE) }}
                className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground border border-border rounded transition-colors shrink-0"
                title="Clear filters"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* League tier filter chips — only shown when English pyramid clubs exist */}
        {presentTiers.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => { setTierFilter(null); setVisibleCount(PAGE_SIZE) }}
              className={cn(
                'h-5 px-2 rounded text-[9px] font-semibold uppercase tracking-wide border transition-colors',
                tierFilter === null
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              )}
            >
              All
            </button>
            {presentTiers.map(t => (
              <button
                key={t.tier}
                type="button"
                onClick={() => { setTierFilter(tierFilter === t.tier ? null : t.tier); setVisibleCount(PAGE_SIZE) }}
                className={cn(
                  'h-5 px-2 rounded text-[9px] font-semibold uppercase tracking-wide border transition-colors',
                  tierFilter === t.tier
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-1 py-1.5 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-surface-overlay/40 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 bg-surface-overlay/40 rounded w-3/4" />
                  <div className="h-2 bg-surface-overlay/30 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center space-y-2">
            <p className="text-xs font-medium text-foreground">
              {query || tierFilter || leagueFilter || countryFilter ? 'No clubs match this view' : 'No clubs in the workspace yet'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {query || tierFilter || leagueFilter || countryFilter
                ? 'Clear a filter to return to the full club landscape.'
                : 'Add a club to anchor mandates, coach fit and market intelligence.'}
            </p>
            {!query && !tierFilter && !leagueFilter && !countryFilter && (
              <Link href="/clubs/new" className="text-xs text-primary hover:underline">
                Add your first club →
              </Link>
            )}
          </div>
        ) : (
          <>
            {visible.map((club) => {
              const isSelected = club.id === selectedId
              return (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 border-b border-border/30 transition-colors group',
                    isSelected
                      ? 'bg-white/[0.06] border-l-2 border-l-primary'
                      : 'hover:bg-white/[0.04] border-l-2 border-l-transparent'
                  )}
                >
                  {/* Badge / fallback avatar */}
                  <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                    {club.badge_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={club.badge_url}
                        alt=""
                        className="w-7 h-7 object-contain"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                          {club.name.slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'text-xs font-medium truncate leading-tight',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {club.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-tight">
                      {[club.league, club.country].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  {/* Tier badge */}
                  {club.tier && (
                    <span className={cn(
                      'shrink-0 text-[9px] px-1.5 py-0.5 rounded border',
                      isSelected
                        ? 'text-primary border-primary/30 bg-primary/5'
                        : 'text-muted-foreground border-border bg-surface'
                    )}>
                      T{club.tier}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* Load more */}
            {filtered.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="w-full py-3 text-[10px] text-muted-foreground hover:text-foreground transition-colors border-t border-border/50 font-medium uppercase tracking-wider"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-border shrink-0">
        <p className="text-[10px] text-muted-foreground/60">
          {loading ? '…' : `${filtered.length} club${filtered.length !== 1 ? 's' : ''}${query || tierFilter || leagueFilter || countryFilter ? ` found` : ''}`}
        </p>
      </div>
    </div>
  )
}
