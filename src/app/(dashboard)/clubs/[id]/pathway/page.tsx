'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type SeasonRow = {
  id: string
  season: string
  league_label: string | null
  league_position: number | null
  points: number | null
  goals_for: number | null
  goals_against: number | null
  data_source: string | null
}

type TransferRow = {
  id: string
  player_name: string
  direction: 'in' | 'out'
  other_club: string | null
  transfer_type: string | null
  fee_amount: number | null
  fee_currency: string | null
  transfer_date: string | null
  season: string | null
}

const LEAGUE_COLOUR: Record<string, string> = {
  'Premier League':  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Championship':    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'League One':      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'League Two':      'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

function leagueBadge(label: string | null) {
  if (!label) return null
  return (
    <span className={cn(
      'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold',
      LEAGUE_COLOUR[label] ?? 'bg-surface text-muted-foreground border-border'
    )}>
      {label}
    </span>
  )
}

function positionOrdinal(n: number) {
  const s = ['th','st','nd','rd'], v = n % 100
  return n + (s[(v-20)%10] || s[v] || s[0])
}

function formatFee(amount: number | null, currency: string | null) {
  if (!amount) return null
  const m = amount / 1_000_000
  return `${currency ?? '€'}${m >= 1 ? m.toFixed(1) + 'M' : (amount / 1000).toFixed(0) + 'K'}`
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

const SEASONS_ORDER = ['2024/25', '2023/24', '2022/23', '2021/22', '2020/21']

export default function ClubPathwayPage() {
  const params = useParams()
  const clubId = params.id as string
  const [results, setResults] = useState<SeasonRow[]>([])
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [transferFilter, setTransferFilter] = useState<'all' | 'in' | 'out'>('all')
  const [seasonFilter, setSeasonFilter] = useState<string>('all')
  const [transferLimit, setTransferLimit] = useState(50)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: seasonData }, { data: transferData }] = await Promise.all([
        supabase
          .from('club_season_results')
          .select('id, season, league_label, league_position, points, goals_for, goals_against, data_source')
          .eq('club_id', clubId)
          .order('season', { ascending: false }),
        supabase
          .from('club_transfers')
          .select('id, player_name, direction, other_club, transfer_type, fee_amount, fee_currency, transfer_date, season')
          .eq('club_id', clubId)
          .order('transfer_date', { ascending: false }),
      ])
      setResults((seasonData ?? []) as SeasonRow[])
      setTransfers((transferData ?? []) as TransferRow[])
      setLoading(false)
    }
    load()
  }, [clubId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Sort seasons in canonical order, fall back to alphabetical for unknowns
  const sortedResults = [...results].sort((a, b) => {
    const ai = SEASONS_ORDER.indexOf(a.season)
    const bi = SEASONS_ORDER.indexOf(b.season)
    if (ai !== -1 && bi !== -1) return ai - bi
    return b.season.localeCompare(a.season)
  })

  // Compute trend vs previous season (lower position = better)
  function trend(i: number): 'up' | 'down' | 'neutral' | null {
    const curr = sortedResults[i]?.league_position
    const prev = sortedResults[i + 1]?.league_position
    if (!curr || !prev) return null
    if (curr < prev) return 'up'
    if (curr > prev) return 'down'
    return 'neutral'
  }

  // Transfer tab data
  const transferSeasons = Array.from(new Set(transfers.map(t => t.season).filter(Boolean))).sort((a, b) => (b ?? '').localeCompare(a ?? ''))
  const filteredTransfers = transfers.filter(t => {
    if (transferFilter !== 'all' && t.direction !== transferFilter) return false
    if (seasonFilter !== 'all' && t.season !== seasonFilter) return false
    return true
  })
  const visibleTransfers = filteredTransfers.slice(0, transferLimit)

  const inCount = transfers.filter(t => t.direction === 'in').length
  const outCount = transfers.filter(t => t.direction === 'out').length

  return (
    <div className="space-y-6">

      {/* League journey */}
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">League journey</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Season-by-season league performance</p>
        </div>

        {sortedResults.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No season data yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Run standings sync to pull historical data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Season</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Division</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Pos</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Pts</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">GF</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">GA</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">GD</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Trend</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((row, i) => {
                  const gd = (row.goals_for ?? 0) - (row.goals_against ?? 0)
                  const t = trend(i)
                  return (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-surface-overlay/30">
                      <td className="px-5 py-3 font-medium text-foreground tabular-nums">{row.season}</td>
                      <td className="px-5 py-3">{leagueBadge(row.league_label)}</td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground tabular-nums">
                        {row.league_position ? positionOrdinal(row.league_position) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-foreground tabular-nums">{row.points ?? '—'}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{row.goals_for ?? '—'}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{row.goals_against ?? '—'}</td>
                      <td className={cn(
                        'px-4 py-3 text-center tabular-nums font-medium',
                        gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-muted-foreground'
                      )}>
                        {row.goals_for !== null ? (gd > 0 ? `+${gd}` : String(gd)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mx-auto" />}
                        {t === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400 mx-auto" />}
                        {t === 'neutral' && <Minus className="w-3.5 h-3.5 text-muted-foreground mx-auto" />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Transfer activity */}
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-medium text-foreground">Transfer activity</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Player movements since 2022</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Season filter */}
            {transferSeasons.length > 0 && (
              <select
                value={seasonFilter}
                onChange={e => { setSeasonFilter(e.target.value); setTransferLimit(50) }}
                className="h-7 rounded border border-border bg-surface text-[10px] px-2 text-muted-foreground"
              >
                <option value="all">All seasons</option>
                {transferSeasons.map(s => (
                  <option key={s} value={s ?? ''}>{s}</option>
                ))}
              </select>
            )}
            {/* Direction tabs */}
            <div className="flex rounded border border-border overflow-hidden text-[10px] font-medium">
              {(['all', 'in', 'out'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { setTransferFilter(f); setTransferLimit(50) }}
                  className={cn(
                    'px-2.5 h-7 capitalize',
                    transferFilter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f === 'all' ? `All (${transfers.length})` : f === 'in' ? `In (${inCount})` : `Out (${outCount})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {transfers.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No transfer data yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Visit the club overview page to trigger a sync.</p>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">No transfers match the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Player</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Dir</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Club</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Type</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Fee</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {visibleTransfers.map(t => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-surface-overlay/30">
                    <td className="px-5 py-2.5 font-medium text-foreground">{t.player_name}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn(
                        'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        t.direction === 'in'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      )}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-muted-foreground">{t.other_club ?? '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground capitalize">{t.transfer_type ?? '—'}</td>
                    <td className="px-5 py-2.5 text-right text-foreground tabular-nums">
                      {formatFee(t.fee_amount, t.fee_currency) ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-2.5 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                      {formatDate(t.transfer_date) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransfers.length > transferLimit && (
              <div className="px-6 py-3 border-t border-border text-center">
                <button
                  onClick={() => setTransferLimit(l => l + 50)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Show more ({filteredTransfers.length - transferLimit} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  )
}
