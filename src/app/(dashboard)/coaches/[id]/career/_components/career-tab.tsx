'use client'

import { useState } from 'react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { SourceConfidenceFields, IntelPill } from '@/components/source-confidence-fields'
import { upsertStintAction, deleteStintAction } from '../../actions'

type Stint = {
  id: string
  club_name: string
  role_title: string | null
  started_on: string | null
  ended_on: string | null
  appointment_context: string | null
  exit_context: string | null
  points_per_game: number | null
  win_rate: number | null
  notable_outcomes: string | null
  league?: string | null
  source_type?: string | null
  source_name?: string | null
  confidence?: number | null
  verified?: boolean
}

function formatDate(s: string | null | undefined): string {
  if (!s) return ''
  try {
    return new Date(s).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function formatDisplayDate(s: string | null | undefined): string {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function calcTenure(start: string | null, end: string | null): string {
  if (!start) return '—'
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  const months = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  if (months < 1) return '<1m'
  if (months < 12) return `${months}m`
  const yrs = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${yrs}y ${rem}m` : `${yrs}y`
}

function calcTenureYears(start: string | null, end: string | null): number {
  if (!start) return 0
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  return (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
}

function classifyLeague(league: string | null): { label: string; tier: number } {
  if (!league) return { label: 'Unknown', tier: 99 }
  const l = league.toLowerCase()
  if (
    l.includes('premier league') ||
    l.includes('bundesliga') ||
    l.includes('la liga') ||
    l.includes('serie a') ||
    l.includes('ligue 1') ||
    l.includes('eredivisie') ||
    l.includes('primeira liga')
  )
    return { label: 'T1', tier: 1 }
  if (
    l.includes('championship') ||
    l.includes('2. bundesliga') ||
    l.includes('serie b') ||
    l.includes('segunda') ||
    l.includes('ligue 2') ||
    l.includes('eerste divisie')
  )
    return { label: 'T2', tier: 2 }
  if (l.includes('league one') || l.includes('3. liga') || l.includes('serie c') || l.includes('liga pro'))
    return { label: 'T3', tier: 3 }
  if (l.includes('league two') || l.includes('national league')) return { label: 'T4', tier: 4 }
  return { label: league, tier: 5 }
}

function PPGPill({ value }: { value: number }) {
  const v = Number(value)
  const cls =
    v >= 2.0
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      : v >= 1.5
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
        : 'bg-muted text-muted-foreground'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {v.toFixed(2)} PPG
    </span>
  )
}

function TierBadge({ league }: { league: string | null }) {
  const { label, tier } = classifyLeague(league)
  if (!league) return null
  const cls =
    tier === 1
      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
      : tier === 2
        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
        : tier === 3
          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
          : tier === 4
            ? 'bg-zinc-500/15 text-zinc-500'
            : 'bg-muted text-muted-foreground'
  const displayLabel = tier <= 4 ? label : league
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {displayLabel}
    </span>
  )
}

function calcTrajectory(stints: Stint[]): { label: string; direction: 'up' | 'stable' | 'down' } | null {
  if (stints.length < 3) return null
  const sorted = [...stints].sort((a, b) => {
    if (!a.started_on) return 1
    if (!b.started_on) return -1
    return new Date(a.started_on).getTime() - new Date(b.started_on).getTime()
  })
  const first3 = sorted.slice(0, 3).map((s) => classifyLeague(s.league ?? null).tier)
  const last3 = sorted.slice(-3).map((s) => classifyLeague(s.league ?? null).tier)
  const avgFirst = first3.reduce((a, b) => a + b, 0) / first3.length
  const avgLast = last3.reduce((a, b) => a + b, 0) / last3.length
  // lower tier number = higher level
  if (avgLast < avgFirst - 0.5) return { label: 'Upward', direction: 'up' }
  if (avgLast > avgFirst + 0.5) return { label: 'Declining', direction: 'down' }
  return { label: 'Stable', direction: 'stable' }
}

export function CareerTab({
  coachId,
  stints,
}: {
  coachId: string
  stints: Stint[]
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Stint | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const openAdd = () => {
    setEditing(null)
    setSubmitError(null)
    setDrawerOpen(true)
  }
  const openEdit = (s: Stint) => {
    setEditing(s)
    setSubmitError(null)
    setDrawerOpen(true)
  }
  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditing(null)
    setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('id', editing?.id ?? '')
    const result = await upsertStintAction(coachId, formData)
    if (result.error) {
      setSubmitError(result.error)
      return
    }
    closeDrawer()
  }

  const handleDelete = async (stintId: string) => {
    if (!confirm('Delete this stint?')) return
    setPendingDelete(stintId)
    const result = await deleteStintAction(coachId, stintId)
    setPendingDelete(null)
    if (result.error) {
      setSubmitError(result.error)
    }
  }

  // ── Career stats ──────────────────────────────────────────────────────────
  const totalRoles = stints.length

  const avgTenure =
    totalRoles > 0
      ? (stints.reduce((acc, s) => acc + calcTenureYears(s.started_on, s.ended_on), 0) / totalRoles).toFixed(1)
      : null

  const ppgStints = stints.filter((s) => s.points_per_game != null)
  const avgPPG =
    ppgStints.length > 0
      ? (ppgStints.reduce((acc, s) => acc + Number(s.points_per_game), 0) / ppgStints.length).toFixed(2)
      : null

  const wrStints = stints.filter((s) => s.win_rate != null)
  const avgWR =
    wrStints.length > 0
      ? Math.round(wrStints.reduce((acc, s) => acc + Number(s.win_rate), 0) / wrStints.length)
      : null

  // ── League summary ────────────────────────────────────────────────────────
  type LeagueGroup = { league: string; tier: number; roles: number; seasons: number }
  const leagueMap = new Map<string, LeagueGroup>()
  for (const s of stints) {
    const { label, tier } = classifyLeague(s.league ?? null)
    const key = s.league ?? 'Unknown'
    const existing = leagueMap.get(key)
    const seasons = calcTenureYears(s.started_on, s.ended_on)
    if (existing) {
      existing.roles += 1
      existing.seasons += seasons
    } else {
      leagueMap.set(key, { league: label === 'Unknown' ? 'Unknown' : (s.league ?? 'Unknown'), tier, roles: 1, seasons })
    }
  }
  const leagueGroups = Array.from(leagueMap.values()).sort((a, b) => a.tier - b.tier)

  // ── Trajectory ────────────────────────────────────────────────────────────
  const trajectory = calcTrajectory(stints)

  return (
    <div className="space-y-4">
      {/* ── Career Stats Bar ─────────────────────────────────────────────── */}
      {totalRoles > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total roles', value: String(totalRoles) },
            { label: 'Avg tenure', value: avgTenure ? `${avgTenure} yrs` : '—' },
            { label: 'Avg PPG', value: avgPPG ? `${avgPPG} PPG` : '—' },
            { label: 'Avg win rate', value: avgWR != null ? `${avgWR}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
              <p className="text-lg font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Career Timeline ───────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Career timeline</h2>
          <Button variant="outline" onClick={openAdd}>
            Add stint
          </Button>
        </div>
        {!stints.length ? (
          <p className="text-sm text-muted-foreground py-4">No data available.</p>
        ) : (
          <ul className="space-y-5">
            {stints.map((s) => (
              <li key={s.id} className="border-b border-border/50 pb-5 last:border-0 last:pb-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Club + role */}
                    <p className="font-semibold text-foreground">{s.club_name}</p>
                    {s.role_title && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.role_title}</p>
                    )}

                    {/* Dates + tenure */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        {formatDisplayDate(s.started_on)} – {s.ended_on ? formatDisplayDate(s.ended_on) : 'Present'}
                      </span>
                      {s.started_on && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {calcTenure(s.started_on, s.ended_on)}
                        </span>
                      )}
                    </div>

                    {/* League + tier + PPG + win rate */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {s.league && (
                        <span className="text-[10px] text-muted-foreground">{s.league}</span>
                      )}
                      <TierBadge league={s.league ?? null} />
                      {s.points_per_game != null && <PPGPill value={s.points_per_game} />}
                      {s.win_rate != null && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {Number(s.win_rate).toFixed(0)}% wins
                        </span>
                      )}
                    </div>

                    {/* Intel pill */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <IntelPill
                        confidence={s.confidence}
                        verified={s.verified}
                        sourceType={s.source_type}
                        sourceName={s.source_name}
                        className="flex items-center gap-1"
                      />
                    </div>

                    {/* Notable outcomes */}
                    {s.notable_outcomes && (
                      <p className="text-xs text-foreground italic mt-1.5">{s.notable_outcomes}</p>
                    )}

                    {/* Exit context */}
                    {s.exit_context && (
                      <p className="text-[11px] text-muted-foreground mt-1">Exit: {s.exit_context}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEdit(s)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDelete(s.id)}
                      disabled={pendingDelete === s.id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Level & Experience Summary ─────────────────────────────────────── */}
      {leagueGroups.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-medium text-foreground mb-3">Level &amp; experience summary</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground pb-2 font-medium">
                  League
                </th>
                <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground pb-2 font-medium">
                  Roles
                </th>
                <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground pb-2 font-medium">
                  Seasons
                </th>
              </tr>
            </thead>
            <tbody>
              {leagueGroups.map((g) => (
                <tr key={g.league} className="border-b border-border/30 last:border-0">
                  <td className="py-2 text-sm text-foreground">{g.league}</td>
                  <td className="py-2 text-sm text-center text-foreground">{g.roles}</td>
                  <td className="py-2 text-sm text-center text-muted-foreground">
                    {g.seasons.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Career Trajectory ─────────────────────────────────────────────── */}
      {trajectory && (
        <section className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Career trajectory</p>
          <p
            className={
              trajectory.direction === 'up'
                ? 'text-sm font-semibold text-emerald-600 dark:text-emerald-400'
                : trajectory.direction === 'stable'
                  ? 'text-sm font-semibold text-amber-600 dark:text-amber-400'
                  : 'text-sm font-semibold text-muted-foreground'
            }
          >
            {trajectory.direction === 'up' ? '↑' : trajectory.direction === 'stable' ? '→' : '↓'}{' '}
            {trajectory.label}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Based on league level of first vs last 3 roles
          </p>
        </section>
      )}

      {/* ── Drawer ────────────────────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? 'Edit stint' : 'Add stint'}
        footer={
          <>
            <Button variant="outline" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button type="submit" form="stint-form">
              {editing ? 'Save' : 'Add'}
            </Button>
          </>
        }
      >
        <form id="stint-form" onSubmit={handleSubmit} className="space-y-4">
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <input type="hidden" name="id" value={editing?.id ?? ''} />
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Club name</label>
            <input
              name="club_name"
              defaultValue={editing?.club_name ?? ''}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
            <input
              name="role_title"
              defaultValue={editing?.role_title ?? ''}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Started</label>
              <input
                type="date"
                name="started_on"
                defaultValue={formatDate(editing?.started_on)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Ended</label>
              <input
                type="date"
                name="ended_on"
                defaultValue={formatDate(editing?.ended_on)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Appointment context</label>
            <input
              name="appointment_context"
              defaultValue={editing?.appointment_context ?? ''}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Exit context</label>
            <input
              name="exit_context"
              defaultValue={editing?.exit_context ?? ''}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Points per game</label>
              <input
                type="number"
                step="any"
                name="points_per_game"
                defaultValue={editing?.points_per_game ?? ''}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Win rate %</label>
              <input
                type="number"
                step="any"
                name="win_rate"
                defaultValue={editing?.win_rate ?? ''}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Notable outcomes</label>
            <textarea
              name="notable_outcomes"
              defaultValue={editing?.notable_outcomes ?? ''}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-none"
            />
          </div>
          <SourceConfidenceFields
            initial={{
              source_type: editing?.source_type ?? null,
              source_name: editing?.source_name ?? null,
              source_link: (editing as { source_link?: string | null })?.source_link ?? null,
              source_notes: (editing as { source_notes?: string | null })?.source_notes ?? null,
              confidence: (editing as { confidence?: number | null })?.confidence ?? null,
              verified: (editing as { verified?: boolean })?.verified ?? false,
              verified_by: (editing as { verified_by?: string | null })?.verified_by ?? null,
              verified_at: null,
            }}
          />
        </form>
      </Drawer>
    </div>
  )
}
