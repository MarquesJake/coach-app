'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { RefreshCw, ChevronRight, ChevronDown } from 'lucide-react'
import { generateLonglistAction, addCandidateFromLonglistAction } from '../../../actions-longlist'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Button } from '@/components/ui/button'

type LonglistRow = {
  id: string
  coach_id: string
  ranking_score: number | null
  fit_explanation: string | null
}

type ParsedFit = {
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

function scoreColor(s: number) {
  if (s >= 70) return 'text-emerald-400'
  if (s >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function scoreBarColor(s: number) {
  if (s >= 70) return 'bg-emerald-500'
  if (s >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

const DIM_DISPLAY: Record<string, string> = {
  tactical: 'Tactical', level: 'Level', leadership: 'Leadership',
  budget: 'Budget', availability: 'Avail.', risk: 'Risk',
}

function dimLabelColor(label: string) {
  if (label === 'Strong') return 'text-emerald-400'
  if (label === 'Moderate') return 'text-amber-400'
  if (label === 'Weak') return 'text-red-400'
  return 'text-muted-foreground'
}

type CoachStub = { id: string; name: string | null; club_current?: string | null }

export function MandateLonglistClient({
  mandateId,
  initialLonglist,
  coaches = [],
}: {
  mandateId: string
  initialLonglist: LonglistRow[]
  coaches?: CoachStub[]
}) {
  const [longlist, setLonglist] = useState<LonglistRow[]>(initialLonglist)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const coachMap = new Map(coaches.map((c) => [c.id, c]))

  async function handleGenerate() {
    setLoading(true)
    const { data, error } = await generateLonglistAction(mandateId)
    setLoading(false)
    if (error) { toastError(error); return }
    if (data) setLonglist(data)
    toastSuccess('Longlist generated')
  }

  async function handleAdd(coachId: string) {
    setAddingId(coachId)
    const result = await addCandidateFromLonglistAction(mandateId, coachId)
    setAddingId(null)
    if (!result.error || result.error === 'Already added') {
      setAddedIds((prev) => new Set(prev).add(coachId))
      toastSuccess(result.error === 'Already added' ? 'Already in pipeline' : 'Added to pipeline')
    } else {
      toastError(result.error)
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={handleGenerate} disabled={loading}>
          <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', loading && 'animate-spin')} />
          {loading ? 'Scoring…' : longlist.length > 0 ? 'Refresh' : 'Generate longlist'}
        </Button>
        {longlist.length > 0 && (
          <p className="text-xs text-muted-foreground">{longlist.length} coaches ranked</p>
        )}
      </div>

      {longlist.length === 0 && !loading && (
        <div className="rounded-lg border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          No longlist yet. Click Generate longlist to score coaches for this mandate.
        </div>
      )}

      {longlist.length > 0 && (
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {longlist.map((row, i) => {
            const fit = parseFit(row.fit_explanation)
            const score = row.ranking_score ?? 0
            const isExpanded = expandedId === row.id
            const inPipeline = addedIds.has(row.coach_id)
            const isAdding = addingId === row.coach_id
            const isClearBreak = i > 0 && fit?.gapType === 'CLEAR'

            return (
              <div key={row.id}>
                {isClearBreak && (
                  <div className="flex items-center gap-2 px-5 py-1">
                    <div className="flex-1 border-t border-border/40" />
                    <span className="text-[9px] text-muted-foreground/40 shrink-0">gap</span>
                    <div className="flex-1 border-t border-border/40" />
                  </div>
                )}

                <div className="px-5 py-3.5">
                  {/* Row: rank + name + score + expand toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground/50 w-5 shrink-0 tabular-nums">
                      {i + 1}
                    </span>

                    <Link
                      href={`/coaches/${row.coach_id}`}
                      className="flex-1 text-sm font-medium text-foreground hover:text-primary truncate min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {coachMap.get(row.coach_id)?.name ?? `Coach ${i + 1}`}
                    </Link>

                    {/* Score + bar */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', scoreBarColor(score))}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className={cn('text-sm font-bold tabular-nums w-6 text-right', scoreColor(score))}>
                        {score}
                      </span>
                    </div>

                    {/* Sub-scores if parsed */}
                    {fit && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums shrink-0">
                        <span>FF:{fit.footballFit}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span>Ap:{fit.appointability}</span>
                      </div>
                    )}

                    {/* Fit label */}
                    {fit && (
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0',
                        fit.fitLabel === 'Strong fit' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                        fit.fitLabel === 'Moderate fit' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' :
                        'text-muted-foreground border-border'
                      )}>
                        {fit.fitLabel}
                      </span>
                    )}

                    {/* Expand / add */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {inPipeline ? (
                        <span className="text-[10px] text-emerald-400 font-medium">In pipeline ✓</span>
                      ) : (
                        <button
                          type="button"
                          disabled={isAdding}
                          onClick={() => handleAdd(row.coach_id)}
                          className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors"
                        >
                          {isAdding ? '…' : '+ Longlist'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5" />
                          : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Summary line */}
                  {fit?.summary && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed pl-8 line-clamp-2">
                      {fit.summary}
                    </p>
                  )}

                  {/* Expanded detail */}
                  {isExpanded && fit && (
                    <div className="mt-3 pl-8 space-y-3">
                      {/* 6-dim breakdown */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['tactical', 'level', 'leadership', 'budget', 'availability', 'risk'] as const).map((dim) => {
                          const d = fit.dims?.[dim]
                          if (!d) return null
                          const pct = dim === 'risk' ? 100 - (d.score ?? 0) : (d.score ?? 0)
                          const barColor = d.score === null ? 'bg-muted/30' :
                            dim === 'risk'
                              ? (d.score <= 30 ? 'bg-emerald-500' : d.score <= 67 ? 'bg-amber-500' : 'bg-red-500')
                              : (d.score >= 75 ? 'bg-emerald-500' : d.score >= 50 ? 'bg-amber-500' : 'bg-red-500')
                          return (
                            <div key={dim} className="rounded border border-border/50 bg-surface/30 px-2 py-1.5">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{DIM_DISPLAY[dim]}</p>
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-1 rounded-full bg-muted/20 overflow-hidden">
                                  <div className={cn('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={cn('text-[10px] font-semibold tabular-nums', dimLabelColor(d.label))}>
                                  {d.score ?? 'IE'}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Strengths */}
                      {fit.strengths.length > 0 && (
                        <div className="space-y-1">
                          {fit.strengths.map((s, j) => (
                            <p key={j} className="text-[11px] text-foreground flex gap-1.5 leading-relaxed">
                              <span className="text-emerald-400 shrink-0">✓</span>{s}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Concerns */}
                      {fit.concerns.length > 0 && (
                        <div className="space-y-1">
                          {fit.concerns.map((c, j) => (
                            <p key={j} className="text-[11px] text-foreground flex gap-1.5 leading-relaxed">
                              <span className="text-amber-400 shrink-0">⚠</span>{c}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Comparison note */}
                      {fit.comparisonNote && (
                        <p className="text-[10px] text-muted-foreground italic leading-relaxed border-l-2 border-border pl-2">
                          {fit.comparisonNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
