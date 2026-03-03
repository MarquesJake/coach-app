'use client'

import { cn } from '@/lib/utils'

/** Dummy positioning: stability vs risk (x), development vs win-now (y). Values 0–100. */
export type Positioning = {
  id: string
  label: string
  stability: number
  risk: number
  development: number
  winNow: number
}

/** 2x2 quadrant: Stability ↔ Risk (x), Development ↔ Win Now (y). This coach highlighted. */
export function PositioningMatrix({
  positions,
  highlightedId,
}: {
  positions: Positioning[]
  highlightedId: string | null
}) {
  const cell = (quad: 'tl' | 'tr' | 'bl' | 'br', label: string) => {
    const inQuad = positions.filter((p) => {
      const x = p.stability - p.risk
      const y = p.development - p.winNow
      if (quad === 'tl') return x >= 0 && y >= 0
      if (quad === 'tr') return x < 0 && y >= 0
      if (quad === 'bl') return x >= 0 && y < 0
      return x < 0 && y < 0
    })
    return (
      <div className="relative flex flex-col items-center justify-center rounded-lg border border-border bg-card/50 p-4 min-h-[100px]">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground absolute top-2 left-2">{label}</span>
        <div className="flex flex-wrap gap-1 justify-center items-center mt-4">
          {inQuad.map((p) => (
            <span
              key={p.id}
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                highlightedId === p.id
                  ? 'ring-2 ring-primary bg-primary/20 text-primary'
                  : 'bg-surface border border-border text-muted-foreground'
              )}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-medium text-foreground mb-2">Positioning Matrix</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Stability ↔ Risk (horizontal) · Development ↔ Win Now (vertical)
      </p>
      <div className="grid grid-cols-2 gap-3">
        {cell('tl', 'Stability / Development')}
        {cell('tr', 'Risk / Development')}
        {cell('bl', 'Stability / Win Now')}
        {cell('br', 'Risk / Win Now')}
      </div>
    </div>
  )
}
