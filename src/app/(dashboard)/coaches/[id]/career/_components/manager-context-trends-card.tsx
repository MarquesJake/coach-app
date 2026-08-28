import { Link2, Minus, TrendingDown, TrendingUp } from 'lucide-react'

import type { ManagerContextSummary, ManagerContextStintTrend } from '@/lib/analysis/manager-context-trends'
import { cn } from '@/lib/utils'

function formatMonth(value: string | null): string {
  if (!value) return 'Present'
  return new Date(value).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function formatMovement(value: number | null): string {
  if (value === null) return 'Needs data'
  return value > 0 ? `+${value}` : String(value)
}

function trendStyle(signal: ManagerContextStintTrend['signal']) {
  if (signal === 'rising') return { icon: TrendingUp, label: 'Club context rose', className: 'text-emerald-700' }
  if (signal === 'declining') return { icon: TrendingDown, label: 'Club context declined', className: 'text-red-700' }
  if (signal === 'stable') return { icon: Minus, label: 'Club context stable', className: 'text-amber-700' }
  return { icon: Link2, label: 'Not trend-ready', className: 'text-muted-foreground' }
}

export function ManagerContextTrendsCard({ summary }: { summary: ManagerContextSummary }) {
  const trendRows = summary.stints.filter((stint) => stint.movement !== null).slice(0, 5)
  const missingLinkCount = summary.totalStints - summary.linkedStintCount

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="manager-context-heading">
      <div className="flex flex-col justify-between gap-3 border-b border-border px-6 py-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="manager-context-heading" className="text-base font-semibold text-foreground">Manager-context trends</h2>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
              Context proxy
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            Club season-results strength during recorded tenures. This is not manager ELO, provider-grade match attribution or a claim that the coach caused the movement.
          </p>
        </div>
        <span className={cn(
          'w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
          summary.coverage === 'complete'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
            : summary.coverage === 'partial'
              ? 'border-amber-300 bg-amber-50 text-amber-800'
              : 'border-border bg-secondary/50 text-muted-foreground'
        )}>
          {summary.trendReadyCount}/{summary.totalStints} tenures trend-ready
        </span>
      </div>

      <dl className="grid gap-px bg-border sm:grid-cols-4">
        <div className="bg-card px-5 py-3">
          <dt className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Club links</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">{summary.linkedStintCount}/{summary.totalStints}</dd>
        </div>
        <div className="bg-card px-5 py-3">
          <dt className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Rising context</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-emerald-700">{summary.risingCount}</dd>
        </div>
        <div className="bg-card px-5 py-3">
          <dt className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Stable context</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-amber-700">{summary.stableCount}</dd>
        </div>
        <div className="bg-card px-5 py-3">
          <dt className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Declining context</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-red-700">{summary.decliningCount}</dd>
        </div>
      </dl>

      {trendRows.length > 0 ? (
        <div className="divide-y divide-border">
          {trendRows.map((stint) => {
            const style = trendStyle(stint.signal)
            const Icon = style.icon
            return (
              <div key={stint.stintId} className="grid gap-3 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-foreground">{stint.clubName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatMonth(stint.startedOn)} to {formatMonth(stint.endedOn)} · {stint.seasons.join(', ')}
                  </p>
                </div>
                <div className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', style.className)}>
                  <Icon className="h-3.5 w-3.5" />
                  {style.label}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">{formatMovement(stint.movement)}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Proxy movement</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-6 py-8 text-center">
          <Link2 className="mx-auto h-5 w-5 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-semibold text-foreground">Manager context needs linked club history</p>
          <p className="mx-auto mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            Link stint records to clubs and store at least two overlapping season results. Until then, the product shows the coverage gap instead of inventing manager impact.
          </p>
        </div>
      )}

      {(missingLinkCount > 0 || summary.linkedStintCount > summary.trendReadyCount) && (
        <div className="border-t border-border bg-secondary/20 px-6 py-3 text-xs text-muted-foreground">
          Coverage gap: {missingLinkCount} stint{missingLinkCount === 1 ? '' : 's'} without a club link and {summary.linkedStintCount - summary.trendReadyCount} linked stint{summary.linkedStintCount - summary.trendReadyCount === 1 ? '' : 's'} without enough dated, overlapping season data.
        </div>
      )}
    </section>
  )
}
