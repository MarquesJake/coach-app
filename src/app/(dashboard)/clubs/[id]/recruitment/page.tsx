'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink, Plus, Trash2, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

type MandateRow = {
  id: string
  status: string
  priority: string | null
  strategic_objective: string | null
  succession_timeline: string | null
  created_at: string
  _shortlist_count: number
}

type TransferRow = {
  id: string
  player_name: string
  direction: 'in' | 'out'
  fee_band: string | null
  fee_amount: number | null
  age_at_transfer: number | null
  nationality: string | null
  position: string | null
  other_club: string | null
  transfer_type: string | null
  transfer_date: string | null
  season: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_COLOURS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-400',
  low: 'bg-muted-foreground',
}

const FEE_BANDS = ['Free', 'Loan', '£0-5m', '£5-15m', '£15-30m', '£30m+', 'Undisclosed'] as const

const TRANSFER_TYPES = ['Permanent', 'Loan', 'Free', 'End of Contract'] as const

const AGE_BANDS = [
  { label: 'U21', test: (a: number) => a < 21 },
  { label: '21–25', test: (a: number) => a >= 21 && a <= 25 },
  { label: '26–29', test: (a: number) => a >= 26 && a <= 29 },
  { label: '30+', test: (a: number) => a >= 30 },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMandateDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function feeBadge(band: string | null, type: string | null) {
  if (band) return band
  if (type === 'Free' || type === 'End of Contract') return 'Free'
  if (type === 'Loan') return 'Loan'
  return '—'
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function ClubRecruitmentPage() {
  const params = useParams()
  const clubId = params.id as string

  const [mandates, setMandates] = useState<MandateRow[]>([])
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [loading, setLoading] = useState(true)

  // Transfer filters
  const [dirFilter, setDirFilter] = useState<'all' | 'in' | 'out'>('all')
  const [seasonFilter, setSeasonFilter] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add form state
  const [form, setForm] = useState({
    player_name: '',
    direction: 'in' as 'in' | 'out',
    fee_band: '',
    age_at_transfer: '',
    nationality: '',
    position: '',
    other_club: '',
    transfer_type: '',
    transfer_date: '',
    season: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [mandateRes, transferRes] = await Promise.all([
        supabase
          .from('mandates')
          .select('id, status, priority, strategic_objective, succession_timeline, created_at')
          .eq('club_id', clubId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('club_transfers')
          .select('id, player_name, direction, fee_band, fee_amount, age_at_transfer, nationality, position, other_club, transfer_type, transfer_date, season')
          .eq('club_id', clubId)
          .eq('user_id', user.id)
          .order('transfer_date', { ascending: false }),
      ])

      const mandateData = mandateRes.data ?? []
      if (mandateData.length > 0) {
        const mandateIds = mandateData.map((m) => m.id)
        const { data: shortlistData } = await supabase
          .from('mandate_shortlist')
          .select('mandate_id')
          .in('mandate_id', mandateIds)
        const counts: Record<string, number> = {}
        for (const row of shortlistData ?? []) counts[row.mandate_id] = (counts[row.mandate_id] ?? 0) + 1
        setMandates(mandateData.map((m) => ({ ...m, _shortlist_count: counts[m.id] ?? 0 })))
      } else {
        setMandates([])
      }

      setTransfers((transferRes.data ?? []) as TransferRow[])
      setLoading(false)
    }
    load()
  }, [clubId])

  // Derived transfer data
  const seasons = useMemo(() =>
    Array.from(new Set(transfers.map(t => t.season).filter(Boolean))).sort((a, b) => (b ?? '').localeCompare(a ?? '')),
    [transfers]
  )

  const filtered = useMemo(() => transfers.filter(t => {
    if (dirFilter !== 'all' && t.direction !== dirFilter) return false
    if (seasonFilter !== 'all' && t.season !== seasonFilter) return false
    return true
  }), [transfers, dirFilter, seasonFilter])

  const insWithAge = transfers.filter(t => t.direction === 'in' && t.age_at_transfer != null)
  const ageBandCounts = AGE_BANDS.map(({ label, test }) => ({
    label,
    count: insWithAge.filter(t => test(t.age_at_transfer!)).length,
  }))
  const maxAgeBandCount = Math.max(...ageBandCounts.map(b => b.count), 1)

  // Nationality spread (ins only)
  const nationalityCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of transfers.filter(t => t.direction === 'in' && t.nationality)) {
      const n = t.nationality!
      map[n] = (map[n] ?? 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [transfers])
  const maxNatCount = Math.max(...nationalityCounts.map(([, c]) => c), 1)

  async function handleAddTransfer() {
    if (!form.player_name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data } = await supabase.from('club_transfers').insert({
      user_id: user.id,
      club_id: clubId,
      player_name: form.player_name.trim(),
      direction: form.direction,
      fee_band: form.fee_band || null,
      age_at_transfer: form.age_at_transfer ? parseInt(form.age_at_transfer) : null,
      nationality: form.nationality.trim() || null,
      position: form.position.trim() || null,
      other_club: form.other_club.trim() || null,
      transfer_type: form.transfer_type || null,
      transfer_date: form.transfer_date || null,
      season: form.season.trim() || null,
    }).select().single()

    if (data) setTransfers(prev => [data as TransferRow, ...prev])
    setForm({ player_name: '', direction: 'in', fee_band: '', age_at_transfer: '', nationality: '', position: '', other_club: '', transfer_type: '', transfer_date: '', season: '' })
    setShowAddForm(false)
    setSaving(false)
  }

  async function handleDeleteTransfer(id: string) {
    if (!confirm('Remove this transfer record?')) return
    const supabase = createClient()
    await supabase.from('club_transfers').delete().eq('id', id)
    setTransfers(prev => prev.filter(t => t.id !== id))
  }

  if (loading) {
    return (
      <section className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </section>
    )
  }

  const inCount = transfers.filter(t => t.direction === 'in').length
  const outCount = transfers.filter(t => t.direction === 'out').length

  return (
    <div className="space-y-6">

      {/* ── Transfer Activity ────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-medium text-foreground">Transfer activity</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Player movements in and out of the club</p>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 h-8 transition-colors"
          >
            {showAddForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddForm ? 'Cancel' : 'Add transfer'}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-px bg-border border-b border-border">
          {[
            { label: 'Total', value: transfers.length, color: 'text-foreground' },
            { label: 'In', value: inCount, color: 'text-emerald-400' },
            { label: 'Out', value: outCount, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card px-5 py-3 text-center">
              <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="px-6 py-5 border-b border-border bg-surface/40 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">New transfer record</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Player name *</label>
                <input value={form.player_name} onChange={e => setForm(f => ({ ...f, player_name: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="Required" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Direction</label>
                <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value as 'in' | 'out' }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground">
                  <option value="in">In (Buy)</option>
                  <option value="out">Out (Sell)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Fee band</label>
                <select value={form.fee_band} onChange={e => setForm(f => ({ ...f, fee_band: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground">
                  <option value="">—</option>
                  {FEE_BANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Age at transfer</label>
                <input type="number" min={14} max={45} value={form.age_at_transfer}
                  onChange={e => setForm(f => ({ ...f, age_at_transfer: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="Optional" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Nationality</label>
                <input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="Optional" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Position</label>
                <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="Optional" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Other club</label>
                <input value={form.other_club} onChange={e => setForm(f => ({ ...f, other_club: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="Optional" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Transfer type</label>
                <select value={form.transfer_type} onChange={e => setForm(f => ({ ...f, transfer_type: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground">
                  <option value="">—</option>
                  {TRANSFER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Season</label>
                <input value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))}
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  placeholder="e.g. 2024/25" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddTransfer} disabled={saving || !form.player_name.trim()}
                className="h-8 px-4 bg-primary text-primary-foreground text-xs font-medium rounded disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setShowAddForm(false)} className="h-8 px-4 border border-border text-xs rounded text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        {transfers.length > 0 && (
          <div className="px-6 py-3 border-b border-border flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs">
              {(['all', 'in', 'out'] as const).map(d => (
                <button key={d} onClick={() => setDirFilter(d)}
                  className={cn('px-3 h-7 transition-colors', dirFilter === d ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  {d === 'all' ? 'All' : d === 'in' ? 'Ins' : 'Outs'}
                </button>
              ))}
            </div>
            {seasons.length > 0 && (
              <select value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)}
                className="h-7 rounded border border-border bg-surface px-2 text-xs">
                <option value="all">All seasons</option>
                {seasons.map(s => <option key={s} value={s!}>{s}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Table */}
        {transfers.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No transfer records yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add transfers to build a recruitment profile.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">No transfers match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Player</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Dir</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Season</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Fee</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Age</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Nationality</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Position</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Club</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-surface-overlay/20 group">
                    <td className="px-5 py-2.5 font-medium text-foreground">{t.player_name}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        t.direction === 'in' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400')}>
                        {t.direction === 'in' ? '↓ In' : '↑ Out'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{t.season ?? '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{feeBadge(t.fee_band, t.transfer_type)}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground tabular-nums">{t.age_at_transfer ?? '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{t.nationality ?? '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{t.position ?? '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{t.other_club ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => handleDeleteTransfer(t.id)}
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

      {/* ── Age Profile ───────────────────────────────────────────────────── */}
      {insWithAge.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Age profile of signings</h2>
          <div className="space-y-2.5">
            {ageBandCounts.map(({ label, count }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12 shrink-0">{label}</span>
                <div className="flex-1 h-5 rounded bg-surface/60 overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded transition-all"
                    style={{ width: count > 0 ? `${Math.round((count / maxAgeBandCount) * 100)}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground w-6 text-right tabular-nums">{count}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Based on {insWithAge.length} signings with age data</p>
        </section>
      )}

      {/* ── Nationality Spread ────────────────────────────────────────────── */}
      {nationalityCounts.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Nationality spread (signings)</h2>
          <div className="space-y-2.5">
            {nationalityCounts.map(([nat, count]) => (
              <div key={nat} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{nat}</span>
                <div className="flex-1 h-5 rounded bg-surface/60 overflow-hidden">
                  <div
                    className="h-full bg-sky-400/60 rounded transition-all"
                    style={{ width: `${Math.round((count / maxNatCount) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground w-6 text-right tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Mandate History ───────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-medium text-foreground">Mandate history</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Head coach searches run for this club</p>
          </div>
          <Link
            href={`/mandates/new?club_id=${clubId}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 h-8 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New mandate
          </Link>
        </div>

        {mandates.length === 0 ? (
          <div className="px-6 py-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No mandates for this club yet.</p>
            <Link
              href={`/mandates/new?club_id=${clubId}`}
              className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Open mandate
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {mandates.map((mandate) => (
              <div key={mandate.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-overlay/20 group">
                <div className={cn('w-2 h-2 rounded-full shrink-0', PRIORITY_DOT[mandate.priority ?? 'medium'] ?? 'bg-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{mandate.strategic_objective ?? 'Head coach search'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium capitalize', STATUS_COLOURS[mandate.status] ?? 'bg-surface text-muted-foreground border-border')}>
                      {mandate.status}
                    </span>
                    {mandate.succession_timeline && (
                      <span className="text-[10px] text-muted-foreground">{mandate.succession_timeline}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">Opened {formatMandateDate(mandate.created_at)}</span>
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-lg font-bold text-foreground tabular-nums leading-none">{mandate._shortlist_count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">candidates</p>
                </div>
                <Link href={`/mandates/${mandate.id}/workspace`}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
