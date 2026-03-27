'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft, Plus } from 'lucide-react'
import type { LonglistEntryData } from '../../../actions-longlist'
import type { ParsedFit } from './mandate-search-panel'

// ── Helpers ───────────────────────────────────────────────────────────────────

function dimLabel(label: string) {
  const map: Record<string, string> = {
    Strong: 'text-emerald-400',
    Moderate: 'text-amber-400',
    Weak: 'text-red-400',
    IE: 'text-muted-foreground',
  }
  return map[label] ?? 'text-muted-foreground'
}

function scoreBg(score: number | null, dim: string) {
  if (score === null) return 'bg-muted/20'
  if (dim === 'risk') {
    // Risk is inverted: lower = better
    if (score <= 30) return 'bg-emerald-500/20'
    if (score <= 67) return 'bg-amber-500/20'
    return 'bg-red-500/20'
  }
  if (score >= 75) return 'bg-emerald-500/20'
  if (score >= 50) return 'bg-amber-500/20'
  return 'bg-red-500/20'
}

const DIM_DISPLAY: Record<string, string> = {
  tactical: 'Tactical',
  level: 'Level',
  leadership: 'Leadership',
  budget: 'Budget',
  availability: 'Availability',
  risk: 'Risk',
}

function ScoreBar({ score, dim }: { score: number | null; dim: string }) {
  if (score === null) return <span className="text-[9px] text-muted-foreground">IE</span>
  const pct = dim === 'risk' ? 100 - score : score // invert risk for bar display
  const color = dim === 'risk'
    ? (score <= 30 ? 'bg-emerald-500' : score <= 67 ? 'bg-amber-500' : 'bg-red-500')
    : (score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500')
  return (
    <div className="flex items-center gap-1.5 flex-1">
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-semibold tabular-nums text-foreground w-7 text-right">
        {score}
      </span>
    </div>
  )
}

// ── FF / Ap display ───────────────────────────────────────────────────────────

function SubScoreBlock({ label, value, sublabel }: { label: string; value: number; sublabel: string }) {
  const color = value >= 70 ? 'text-emerald-400' : value >= 50 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="flex-1 rounded-lg border border-border bg-surface/40 px-3 py-2.5 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums mt-1', color)}>{value}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{sublabel}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MandateFitDetail({
  entry,
  fit,
  isInPipeline,
  pipelineStage,
  isAdding,
  onAdd,
  onBack,
}: {
  entry: LonglistEntryData
  fit: ParsedFit
  isInPipeline: boolean
  pipelineStage?: string
  isAdding: boolean
  onAdd: (coachId: string) => void
  onBack: () => void
}) {
  const availStatus = entry.coach_available_status
  const dims = fit.dims ?? {}

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">
      {/* Back + header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="mt-0.5 w-6 h-6 flex items-center justify-center rounded hover:bg-surface-overlay/30 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground truncate">
              {entry.coach_name ?? 'Unknown coach'}
            </h2>
            {availStatus && (
              <span className={cn(
                'text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0',
                availStatus === 'Available' && 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
                availStatus === 'Open to offers' && 'text-amber-400 bg-amber-400/10 border-amber-400/20',
                availStatus === 'Under contract - interested' && 'text-amber-400 bg-amber-400/10 border-amber-400/20',
                availStatus === 'Under contract' && 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                availStatus === 'Not available' && 'text-red-400 bg-red-400/10 border-red-400/20',
              )}>
                {availStatus}
              </span>
            )}
          </div>
          {entry.coach_club && (
            <p className="text-xs text-muted-foreground mt-0.5">{entry.coach_club}</p>
          )}
        </div>
      </div>

      {/* Combined score + FF / Ap */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-border bg-surface/40 px-3 py-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Combined</p>
            <p className={cn(
              'text-3xl font-bold tabular-nums mt-1',
              fit.combined >= 70 ? 'text-emerald-400' : fit.combined >= 50 ? 'text-amber-400' : 'text-red-400'
            )}>
              {fit.combined}
            </p>
          </div>
          <SubScoreBlock
            label="Football Fit"
            value={fit.footballFit}
            sublabel="Tactical · Level · Leadership"
          />
          <SubScoreBlock
            label="Appointability"
            value={fit.appointability}
            sublabel="Budget · Availability · Risk"
          />
        </div>
        {/* Fit label */}
        <p className="text-[10px] text-muted-foreground italic leading-relaxed">{fit.fitLabel}</p>
      </section>

      {/* Summary */}
      <section className="rounded-lg border border-border/60 bg-surface/30 px-3 py-2.5">
        <p className="text-xs text-foreground leading-relaxed">{fit.summary}</p>
      </section>

      {/* 6-dimension breakdown */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dimension breakdown</h3>
        <div className="space-y-1.5">
          {(['tactical', 'level', 'leadership', 'budget', 'availability', 'risk'] as const).map((dim) => {
            const d = dims[dim] as { score: number | null; label: string } | undefined
            if (!d) return null
            const isIE = d.label === 'IE'
            return (
              <div key={dim} className={cn('flex items-center gap-2 rounded px-2 py-1.5', scoreBg(d.score, dim))}>
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">{DIM_DISPLAY[dim]}</span>
                <ScoreBar score={d.score} dim={dim} />
                <span className={cn('text-[9px] font-semibold w-14 text-right shrink-0', dimLabel(d.label))}>
                  {isIE ? 'IE' : d.label}
                </span>
              </div>
            )
          })}
        </div>
        {fit.ieFlags && fit.ieFlags.length > 0 && (
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            IE flag on: {fit.ieFlags.join(', ')}. Score computed from available data only.
          </p>
        )}
      </section>

      {/* Strengths */}
      {fit.strengths && fit.strengths.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Strengths</h3>
          <div className="space-y-1.5">
            {fit.strengths.map((s, i) => (
              <div key={i} className="flex gap-2 text-xs text-foreground leading-relaxed">
                <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Concerns */}
      {fit.concerns && fit.concerns.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Concerns</h3>
          <div className="space-y-1.5">
            {fit.concerns.map((c, i) => (
              <div key={i} className="flex gap-2 text-xs text-foreground leading-relaxed">
                <span className="text-amber-400 shrink-0 mt-0.5">⚠</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comparison note */}
      {fit.comparisonNote && (
        <section className="rounded-lg border border-border/40 bg-surface/20 px-3 py-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">vs. adjacent ranked</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{fit.comparisonNote}</p>
        </section>
      )}

      {/* Add to pipeline */}
      <div className="pt-1 pb-4">
        {isInPipeline ? (
          <div className="w-full h-9 rounded-lg border border-emerald-400/20 bg-emerald-400/10 flex items-center justify-center gap-2">
            <span className="text-emerald-400 text-xs font-medium">
              In pipeline · {pipelineStage ?? 'Longlist'}
            </span>
          </div>
        ) : (
          <button
            type="button"
            disabled={isAdding}
            onClick={() => onAdd(entry.coach_id)}
            className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            {isAdding ? 'Adding…' : 'Add to pipeline · Longlist'}
          </button>
        )}
      </div>
    </div>
  )
}
