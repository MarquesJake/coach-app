'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { RefreshCw, Plus, X, ChevronRight } from 'lucide-react'
import { generateLonglistAction, addCandidateFromLonglistAction } from '../../../actions-longlist'
import type { LonglistEntryData, ExcludedEntryData } from '../../../actions-longlist'

// ── Parsed fit data (stored as JSON in mandate_longlist.fit_explanation) ─────

export type ParsedFit = {
  combined: number
  footballFit: number
  appointability: number
  summary: string
  strengths: string[]
  concerns: string[]
  comparisonNote: string | null
  fitLabel: string
  ieFlags: string[]
  combinedGap: number | null
  gapType: 'TIED' | 'MARGINAL' | 'NEAR_TIE' | 'CLEAR' | null
  dims: Record<string, { score: number | null; label: string }>
}

function parseFit(raw: string | null): ParsedFit | null {
  if (!raw) return null
  try { return JSON.parse(raw) as ParsedFit } catch { return null }
}

// ── Visual helpers ────────────────────────────────────────────────────────────

function availDot(status: string | null) {
  if (status === 'Available') return 'bg-emerald-400'
  if (status === 'Open to offers' || status === 'Under contract - interested') return 'bg-amber-400'
  if (status === 'Under contract') return 'bg-blue-400'
  return 'bg-muted-foreground/30'
}

function scoreBarColor(score: number) {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function GapBadge({ gap, type }: { gap: number | null; type: ParsedFit['gapType'] }) {
  if (gap === null || type === null) return null
  if (type === 'CLEAR') return null // shown via separator

  const config = {
    TIED:     { text: '≈',       cls: 'text-muted-foreground bg-muted/40 border-border' },
    MARGINAL: { text: `~${gap}`, cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    NEAR_TIE: { text: `↑${gap}`, cls: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  }[type]

  return (
    <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0', config.cls)}>
      {config.text}
    </span>
  )
}

// ── Excluded modal ────────────────────────────────────────────────────────────

function ExcludedModal({
  excluded,
  onClose,
}: {
  excluded: ExcludedEntryData[]
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Excluded candidates</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{excluded.length} removed before scoring</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-overlay/30 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
          Exclusions reflect the mandate's urgency, board risk appetite, and relocation requirements — not a quality judgement.
        </p>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {excluded.map((e) => (
            <div key={e.coachId} className="rounded-lg border border-border bg-surface/40 px-3 py-2">
              <p className="text-xs font-medium text-foreground">{e.name ?? 'Unknown coach'}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{e.reason.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full h-8 rounded border border-border bg-surface text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MandateSearchPanel({
  mandateId,
  initialEntries,
  existingCoachIds,
  existingStages,
  onSelectEntry,
  selectedCoachId,
}: {
  mandateId: string
  initialEntries: LonglistEntryData[]
  existingCoachIds: Set<string>
  existingStages: Map<string, string>
  onSelectEntry: (entry: LonglistEntryData, fit: ParsedFit) => void
  selectedCoachId: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sessionExcluded, setSessionExcluded] = useState<ExcludedEntryData[]>([])
  const [showExcluded, setShowExcluded] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedThisSession, setAddedThisSession] = useState<Set<string>>(new Set())

  // Sync excluded list when initialEntries change (after server refresh)
  const entries = initialEntries

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateLonglistAction(mandateId)
      if (result.excluded?.length) {
        setSessionExcluded(result.excluded)
      }
      router.refresh()
    })
  }

  async function handleAdd(coachId: string) {
    setAddingId(coachId)
    const result = await addCandidateFromLonglistAction(mandateId, coachId)
    setAddingId(null)
    if (!result.error || result.error === 'Already added') {
      setAddedThisSession((prev) => new Set(prev).add(coachId))
      router.refresh()
    }
  }

  const hasData = entries.length > 0

  // Detect clear breaks (≥15 point gap) for visual separator
  function isClearBreakAbove(index: number): boolean {
    if (index === 0) return false
    const fit = parseFit(entries[index].fit_explanation)
    return fit?.gapType === 'CLEAR'
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recommendations</h2>
          {hasData && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {entries.length} ranked
              {sessionExcluded.length > 0 && (
                <>
                  {' · '}
                  <button
                    onClick={() => setShowExcluded(true)}
                    className="text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline transition-colors"
                  >
                    {sessionExcluded.length} excluded
                  </button>
                </>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-medium transition-colors',
            isPending
              ? 'border-border text-muted-foreground cursor-not-allowed'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
          )}
          title={hasData ? 'Refresh recommendations' : 'Generate recommendations'}
        >
          <RefreshCw className={cn('w-3 h-3', isPending && 'animate-spin')} />
          {isPending ? 'Scoring…' : hasData ? 'Refresh' : 'Generate'}
        </button>
      </div>

      {/* Empty state */}
      {!hasData && !isPending && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-lg">
            ◎
          </div>
          <p className="text-xs font-medium text-foreground">No recommendations yet</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Score and rank all coaches against this mandate's requirements.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Generate recommendations
          </button>
        </div>
      )}

      {/* Generating skeleton */}
      {!hasData && isPending && (
        <div className="flex-1 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-surface/50 animate-pulse border border-border" />
          ))}
        </div>
      )}

      {/* Ranked list */}
      {hasData && (
        <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
          {entries.map((entry, i) => {
            const fit = parseFit(entry.fit_explanation)
            const isSelected = entry.coach_id === selectedCoachId
            const alreadyInPipeline = existingCoachIds.has(entry.coach_id) || addedThisSession.has(entry.coach_id)
            const isAdding = addingId === entry.coach_id
            const pipelineStage = existingStages.get(entry.coach_id)
            const clearBreak = isClearBreakAbove(i)
            const rank = i + 1

            return (
              <div key={entry.id}>
                {/* Visual separator for clear gaps (≥15 points) */}
                {clearBreak && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 border-t border-border/40" />
                    <span className="text-[9px] text-muted-foreground/50 shrink-0">gap</span>
                    <div className="flex-1 border-t border-border/40" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fit && onSelectEntry(entry, fit)}
                  className={cn(
                    'w-full text-left rounded-lg border px-3 py-2.5 transition-colors group',
                    isSelected
                      ? 'border-primary bg-primary/[0.06]'
                      : 'border-border bg-surface/40 hover:bg-surface-overlay/20 hover:border-border/80'
                  )}
                >
                  {/* Row 1: rank + name + combined score + gap badge */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0 w-4">
                      {rank}
                    </span>
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', availDot(entry.coach_available_status))} />
                    <span className="text-xs font-medium text-foreground truncate flex-1">
                      {entry.coach_name ?? 'Unknown'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {fit && <GapBadge gap={fit.combinedGap} type={fit.gapType} />}
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        {entry.ranking_score}
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                  </div>

                  {/* Row 2: score bar + FF/Ap */}
                  {fit && (
                    <div className="flex items-center gap-2 mt-1.5 pl-5">
                      {/* Score bar */}
                      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', scoreBarColor(entry.ranking_score))}
                          style={{ width: `${entry.ranking_score}%` }}
                        />
                      </div>
                      {/* Sub-scores */}
                      <span className="text-[9px] text-muted-foreground tabular-nums shrink-0">
                        FF:{fit.footballFit}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50">·</span>
                      <span className="text-[9px] text-muted-foreground tabular-nums shrink-0">
                        Ap:{fit.appointability}
                      </span>
                    </div>
                  )}

                  {/* Row 3: add/pipeline button + IE flags */}
                  <div className="flex items-center justify-between mt-1.5 pl-5">
                    <div className="flex gap-1">
                      {fit?.ieFlags && fit.ieFlags.length > 0 && (
                        <span className="text-[9px] text-muted-foreground/50">
                          IE: {fit.ieFlags.join(', ')}
                        </span>
                      )}
                    </div>

                    {alreadyInPipeline ? (
                      <span className="text-[9px] font-medium text-emerald-400 shrink-0">
                        {pipelineStage ?? 'In pipeline'} ✓
                      </span>
                    ) : (
                      <span
                        role="button"
                        aria-disabled={isAdding}
                        onClick={(e) => { e.stopPropagation(); if (!isAdding) handleAdd(entry.coach_id) }}
                        className={cn(
                          'flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-medium hover:bg-primary/20 transition-colors shrink-0 cursor-pointer',
                          isAdding && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Plus className="w-2.5 h-2.5" />
                        {isAdding ? '…' : 'Longlist'}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            )
          })}

          {/* Excluded footer (after generation) */}
          {sessionExcluded.length > 0 && (
            <div className="pt-2 border-t border-border/30">
              <button
                onClick={() => setShowExcluded(true)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {sessionExcluded.length} excluded — why?
              </button>
            </div>
          )}
        </div>
      )}

      {/* Excluded modal */}
      {showExcluded && (
        <ExcludedModal excluded={sessionExcluded} onClose={() => setShowExcluded(false)} />
      )}
    </div>
  )
}
