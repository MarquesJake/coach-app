'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getFitResultAction, addToLonglistAction, addToShortlistAction } from '@/app/(dashboard)/coaches/[id]/fit/actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

type CoachHeader = {
  name: string | null
  preferred_name?: string | null
  availability_status?: string | null
  market_status?: string | null
  overall_manual_score?: number | null
  intelligence_confidence?: number | null
}

type MandateOption = { id: string; label: string }

const SCORE_BADGE = {
  high: 'text-green-400 border-green-500/40 bg-green-500/10',
  mid: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  low: 'text-red-400 border-red-500/40 bg-red-500/10',
}

function scoreClass(v: number | null | undefined): string {
  if (v == null) return SCORE_BADGE.low
  const n = Number(v)
  if (n >= 70) return SCORE_BADGE.high
  if (n >= 40) return SCORE_BADGE.mid
  return SCORE_BADGE.low
}

export function FitClient({
  coachId,
  coach,
  mandates,
  evidenceCount,
  completenessPercent,
}: {
  coachId: string
  coach: CoachHeader
  mandates: MandateOption[]
  evidenceCount: number
  completenessPercent: number
}) {
  const [selectedMandateId, setSelectedMandateId] = useState('')
  const [fitResult, setFitResult] = useState<{
    overallScore: number
    componentScores: { tactical: number; leadership: number; recruitment: number; risk: number }
    whyFits: string[]
    concerns: string[]
    confidence: 'high' | 'medium' | 'low'
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [longlistPending, setLonglistPending] = useState(false)
  const [shortlistPending, setShortlistPending] = useState(false)

  const name = (coach.preferred_name || coach.name) ?? 'Coach'

  const onSelectMandate = (mandateId: string) => {
    setSelectedMandateId(mandateId)
    if (!mandateId) {
      setFitResult(null)
      return
    }
    startTransition(async () => {
      const { data, error } = await getFitResultAction(coachId, mandateId)
      if (error) {
        setFitResult(null)
        return
      }
      setFitResult(data ?? null)
    })
  }

  const handleAddToLonglist = () => {
    if (!selectedMandateId || !fitResult) return
    setLonglistPending(true)
    addToLonglistAction(selectedMandateId, coachId, fitResult.overallScore, fitResult.whyFits.join('; ') || null)
      .then((r) => {
        if (r.ok) toastSuccess('Added to longlist')
        else toastError(r.error ?? 'Unknown error')
      })
      .finally(() => setLonglistPending(false))
  }

  const handleAddToShortlist = () => {
    if (!selectedMandateId) return
    setShortlistPending(true)
    addToShortlistAction(selectedMandateId, coachId, null)
      .then((r) => {
        if (r.ok) toastSuccess('Added to shortlist')
        else toastError(r.error ?? 'Unknown error')
      })
      .finally(() => setShortlistPending(false))
  }

  return (
    <div className="space-y-6">
      {/* Coach header */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {coach.availability_status && (
                <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground">
                  {coach.availability_status}
                </span>
              )}
              {coach.market_status && (
                <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground">
                  {coach.market_status}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('rounded-md border px-2.5 py-1 text-sm font-medium tabular-nums', scoreClass(coach.overall_manual_score))}>
              {coach.overall_manual_score != null ? Math.round(coach.overall_manual_score) : '—'}
            </span>
            <span className={cn('rounded-md border px-2.5 py-1 text-sm font-medium tabular-nums', scoreClass(coach.intelligence_confidence))}>
              IC {coach.intelligence_confidence != null ? Math.round(coach.intelligence_confidence) : '—'}
            </span>
            <div className="flex flex-col gap-0.5 min-w-[72px]">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(100, Math.max(0, completenessPercent))}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">Completeness</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mandate selector */}
      <section>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Select mandate</label>
        {mandates.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">No data available.</p>
            <Link href="/mandates/new" className="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20">
              Create mandate
            </Link>
          </div>
        ) : (
          <select
            value={selectedMandateId}
            onChange={(e) => onSelectMandate(e.target.value)}
            disabled={isPending}
            className="w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="">Choose a mandate…</option>
            {mandates.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        )}
      </section>

      {selectedMandateId && isPending && !fitResult && (
        <p className="text-sm text-muted-foreground">Computing fit…</p>
      )}

      {fitResult && (
        <>
          {/* Weight distribution. Future: configurable per mandate. */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Weight distribution</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Tactical', percent: 25 },
                { label: 'Leadership', percent: 20 },
                { label: 'Budget', percent: 15 },
                { label: 'Risk', percent: 15 },
                { label: 'Youth', percent: 10 },
                { label: 'Timeline', percent: 10 },
                { label: 'Staff', percent: 5 },
              ].map(({ label, percent }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
                  <p className="font-medium tabular-nums text-foreground">{percent}%</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Fit summary</h2>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div>
                <span className="text-2xl font-semibold tabular-nums text-foreground">{fitResult.overallScore}</span>
                <span className="text-muted-foreground ml-1">/ 100</span>
              </div>
              <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground capitalize">
                Confidence: {fitResult.confidence}
              </span>
              <span className="text-xs text-muted-foreground">Evidence items: {evidenceCount}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tactical</p>
                <p className="font-medium tabular-nums">{fitResult.componentScores.tactical}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Leadership</p>
                <p className="font-medium tabular-nums">{fitResult.componentScores.leadership}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recruitment</p>
                <p className="font-medium tabular-nums">{fitResult.componentScores.recruitment}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk</p>
                <p className="font-medium tabular-nums">{fitResult.componentScores.risk}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Why this fits</h3>
              <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                {fitResult.whyFits.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Concerns</h3>
              {fitResult.concerns.length ? (
                <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                  {fitResult.concerns.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None identified</p>
              )}
            </div>
          </section>

          <section className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddToLonglist}
              disabled={longlistPending}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface/80 disabled:opacity-50"
            >
              {longlistPending ? 'Adding…' : 'Add to longlist'}
            </button>
            <button
              type="button"
              onClick={handleAddToShortlist}
              disabled={shortlistPending}
              className="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              {shortlistPending ? 'Adding…' : 'Add to shortlist'}
            </button>
          </section>
        </>
      )}
    </div>
  )
}
