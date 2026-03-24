'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'

type SeasonRow = {
  id: string
  season: string
  league_position: number | null
  points: number | null
  goals_for: number | null
  goals_against: number | null
}

function PositionTrend({ rows }: { rows: SeasonRow[] }) {
  if (rows.length < 2) return null
  const sorted = [...rows].sort((a, b) => a.season.localeCompare(b.season))
  const last = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  if (!last.league_position || !prev.league_position) return null
  const diff = prev.league_position - last.league_position
  if (diff > 0) return <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px]"><TrendingUp className="w-3 h-3" />+{diff}</span>
  if (diff < 0) return <span className="inline-flex items-center gap-0.5 text-red-400 text-[10px]"><TrendingDown className="w-3 h-3" />{diff}</span>
  return <span className="inline-flex items-center gap-0.5 text-muted-foreground text-[10px]"><Minus className="w-3 h-3" />—</span>
}

export function ClubSeasonResultsSection({ clubId }: { clubId: string }) {
  const [rows, setRows] = useState<SeasonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    season: '',
    league_position: '',
    points: '',
    goals_for: '',
    goals_against: '',
  })

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('club_season_results')
      .select('id, season, league_position, points, goals_for, goals_against')
      .eq('club_id', clubId)
      .eq('user_id', user.id)
      .order('season', { ascending: false })
    setRows(((data ?? []) as unknown) as SeasonRow[])
    setLoading(false)
  }

  useEffect(() => { load() }, [clubId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.season.trim()) { toastError('Season is required'); return }
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const { error } = await supabase.from('club_season_results').insert({
      user_id: user.id,
      club_id: clubId,
      season: form.season.trim(),
      league_position: form.league_position ? parseInt(form.league_position, 10) : null,
      points: form.points ? parseInt(form.points, 10) : null,
      goals_for: form.goals_for ? parseInt(form.goals_for, 10) : null,
      goals_against: form.goals_against ? parseInt(form.goals_against, 10) : null,
    })
    setSubmitting(false)
    if (error) { toastError(error.message); return }
    toastSuccess('Season added')
    setShowForm(false)
    setForm({ season: '', league_position: '', points: '', goals_for: '', goals_against: '' })
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this season?')) return
    const supabase = createClient()
    const { error } = await supabase.from('club_season_results').delete().eq('id', id)
    if (error) { toastError(error.message); return }
    toastSuccess('Season removed')
    await load()
  }

  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-foreground">Season results</h2>
          {rows.length >= 2 && <PositionTrend rows={rows} />}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 h-8 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add season
        </button>
      </div>

      {/* Add row form */}
      {showForm && (
        <form onSubmit={handleAdd} className="px-6 py-4 border-b border-border bg-surface/40 space-y-3">
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Season <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. 2023/24"
                value={form.season}
                onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
                className="w-full h-8 rounded border border-border bg-surface px-2.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Pos.</label>
              <input
                type="number"
                placeholder="1"
                min={1}
                max={30}
                value={form.league_position}
                onChange={(e) => setForm((f) => ({ ...f, league_position: e.target.value }))}
                className="w-full h-8 rounded border border-border bg-surface px-2.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Pts</label>
              <input
                type="number"
                placeholder="72"
                min={0}
                value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
                className="w-full h-8 rounded border border-border bg-surface px-2.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">GD</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="GF"
                  min={0}
                  value={form.goals_for}
                  onChange={(e) => setForm((f) => ({ ...f, goals_for: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-surface px-2 text-xs"
                />
                <input
                  type="number"
                  placeholder="GA"
                  min={0}
                  value={form.goals_against}
                  onChange={(e) => setForm((f) => ({ ...f, goals_against: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-surface px-2 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 h-8 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save season'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 h-8 border border-border text-xs rounded-lg text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">No season results yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add seasons to track performance trajectory.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-6 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Season</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Pos.</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Pts</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">GF</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">GA</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">GD</th>
                <th className="w-16 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const gd = (row.goals_for ?? 0) - (row.goals_against ?? 0)
                return (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-surface-overlay/30">
                    <td className="px-6 py-3 font-medium text-foreground tabular-nums">{row.season}</td>
                    <td className="px-4 py-3 text-center">
                      {row.league_position != null ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-border text-xs font-bold text-foreground">
                          {row.league_position}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-foreground tabular-nums">
                      {row.points ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{row.goals_for ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{row.goals_against ?? '—'}</td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {row.goals_for != null && row.goals_against != null ? (
                        <span className={gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-muted-foreground'}>
                          {gd > 0 ? '+' : ''}{gd}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
