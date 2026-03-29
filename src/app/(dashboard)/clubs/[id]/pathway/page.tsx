'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, TrendingUp, TrendingDown, Minus, Plus, Trash2 } from 'lucide-react'
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

type PathwayRow = {
  id: string
  season: string
  academy_debuts: number | null
  u21_minutes_percentage: number | null
  internal_promotions: number | null
  notes: string | null
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
  const [pathwayRows, setPathwayRows] = useState<PathwayRow[]>([])
  const [loading, setLoading] = useState(true)
  const [transferFilter, setTransferFilter] = useState<'all' | 'in' | 'out'>('all')
  const [seasonFilter, setSeasonFilter] = useState<string>('all')
  const [transferLimit, setTransferLimit] = useState(50)
  const [showPathwayForm, setShowPathwayForm] = useState(false)
  const [savingPathway, setSavingPathway] = useState(false)
  const [pathwayForm, setPathwayForm] = useState({
    season: '', academy_debuts: '', u21_minutes_percentage: '', internal_promotions: '', notes: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: seasonData }, { data: transferData }, { data: pathwayData }] = await Promise.all([
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
        supabase
          .from('club_pathway_data')
          .select('id, season, academy_debuts, u21_minutes_percentage, internal_promotions, notes')
          .eq('club_id', clubId)
          .order('season', { ascending: false }),
      ])
      setResults((seasonData ?? []) as SeasonRow[])
      setTransfers((transferData ?? []) as TransferRow[])
      setPathwayRows((pathwayData ?? []) as PathwayRow[])
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

  async function handleAddPathway() {
    if (!pathwayForm.season.trim()) return
    setSavingPathway(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingPathway(false); return }
    const { data } = await supabase.from('club_pathway_data').upsert({
      user_id: user.id,
      club_id: clubId,
      season: pathwayForm.season.trim(),
      academy_debuts: pathwayForm.academy_debuts ? parseInt(pathwayForm.academy_debuts) : null,
      u21_minutes_percentage: pathwayForm.u21_minutes_percentage ? parseFloat(pathwayForm.u21_minutes_percentage) : null,
      internal_promotions: pathwayForm.internal_promotions ? parseInt(pathwayForm.internal_promotions) : null,
      notes: pathwayForm.notes.trim() || null,
    }, { onConflict: 'club_id,season' }).select().single()
    if (data) {
      setPathwayRows(prev => {
        const existing = prev.findIndex(r => r.season === data.season)
        if (existing !== -1) { const next = [...prev]; next[existing] = data as PathwayRow; return next }
        return [data as PathwayRow, ...prev].sort((a, b) => b.season.localeCompare(a.season))
      })
    }
    setPathwayForm({ season: '', academy_debuts: '', u21_minutes_percentage: '', internal_promotions: '', notes: '' })
    setShowPathwayForm(false)
    setSavingPathway(false)
  }

  async function handleDeletePathway(id: string) {
    if (!confirm('Remove this pathway record?')) return
    const supabase = createClient()
    await supabase.from('club_pathway_data').delete().eq('id', id)
    setPathwayRows(prev => prev.filter(r => r.id !== id))
  }

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

      {/* Youth pathway */}
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-medium text-foreground">Youth pathway</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Academy integration and U21 development data by season</p>
          </div>
          <button
            onClick={() => setShowPathwayForm(v => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 h-8 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add season
          </button>
        </div>

        {/* Add form */}
        {showPathwayForm && (
          <div className="px-6 py-5 border-b border-border bg-surface/40 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">New pathway entry</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Season *</label>
                <input value={pathwayForm.season} onChange={e => setPathwayForm(f => ({ ...f, season: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="e.g. 2024/25" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Academy debuts</label>
                <input type="number" min={0} value={pathwayForm.academy_debuts}
                  onChange={e => setPathwayForm(f => ({ ...f, academy_debuts: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="Optional" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">U21 minutes %</label>
                <input type="number" min={0} max={100} step={0.1} value={pathwayForm.u21_minutes_percentage}
                  onChange={e => setPathwayForm(f => ({ ...f, u21_minutes_percentage: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="0–100" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Internal promotions</label>
                <input type="number" min={0} value={pathwayForm.internal_promotions}
                  onChange={e => setPathwayForm(f => ({ ...f, internal_promotions: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="Optional" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Notes</label>
                <input value={pathwayForm.notes} onChange={e => setPathwayForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="Optional context" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddPathway} disabled={savingPathway || !pathwayForm.season.trim()}
                className="h-8 px-4 bg-primary text-primary-foreground text-xs font-medium rounded disabled:opacity-50">
                {savingPathway ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setShowPathwayForm(false)} className="h-8 px-4 border border-border text-xs rounded text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}

        {pathwayRows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No pathway data yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add season-by-season academy metrics above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Season</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Academy debuts</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">U21 min %</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Promotions</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Notes</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {pathwayRows.map(row => (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-surface-overlay/30 group">
                    <td className="px-5 py-3 font-medium text-foreground tabular-nums">{row.season}</td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {row.academy_debuts != null
                        ? <span className={cn('font-semibold', row.academy_debuts >= 3 ? 'text-emerald-400' : 'text-foreground')}>{row.academy_debuts}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {row.u21_minutes_percentage != null ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-surface overflow-hidden">
                            <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(row.u21_minutes_percentage, 100)}%` }} />
                          </div>
                          <span className="text-foreground tabular-nums">{row.u21_minutes_percentage.toFixed(1)}%</span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {row.internal_promotions != null
                        ? <span className="text-foreground font-semibold">{row.internal_promotions}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs max-w-xs truncate">{row.notes ?? '—'}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => handleDeletePathway(row.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
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
