'use client'

import { cn } from '@/lib/utils'

type Agent = {
  full_name: string | null
  agency_name: string | null
  base_location: string | null
  influence_score: number | null
  reliability_score: number | null
  responsiveness_score: number | null
  risk_flag: boolean
  risk_notes: string | null
}

export function AgentCommandBar({
  agent,
  coachesCount,
  clubsCount,
  lastInteractionAt,
  coveragePercent,
}: {
  agent: Agent
  coachesCount: number
  clubsCount: number
  lastInteractionAt: string | null
  coveragePercent: number
}) {
  const name = agent.full_name ?? 'Agent'
  const agency = agent.agency_name
  const baseLocation = agent.base_location
  const influence = agent.influence_score
  const reliability = agent.reliability_score
  const responsiveness = agent.responsiveness_score

  let lastContactDays: number | null = null
  if (lastInteractionAt) {
    lastContactDays = Math.floor((Date.now() - new Date(lastInteractionAt).getTime()) / (24 * 60 * 60 * 1000))
  }
  const lastContactClass =
    lastContactDays == null
      ? 'text-muted-foreground'
      : lastContactDays > 120
        ? 'text-red-600 dark:text-red-400'
        : lastContactDays > 60
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-muted-foreground'

  return (
    <header className="w-full bg-card/80 border-b border-border px-6 py-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{name}</h1>
          {agency && <p className="text-sm text-muted-foreground">{agency}</p>}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {baseLocation && (
              <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                {baseLocation}
              </span>
            )}
            {agent.risk_flag && (
              <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-600 dark:text-amber-400">
                Risk flagged
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {influence != null && (
              <span className="rounded-md border border-border bg-surface px-3 py-1 text-sm font-medium tabular-nums text-foreground" title="Influence">
                I {influence}
              </span>
            )}
            {reliability != null && (
              <span className="rounded-md border border-border bg-surface px-3 py-1 text-sm font-medium tabular-nums text-foreground" title="Reliability">
                R {reliability}
              </span>
            )}
            {responsiveness != null && (
              <span className="rounded-md border border-border bg-surface px-3 py-1 text-sm font-medium tabular-nums text-foreground" title="Responsiveness">
                Res {responsiveness}
              </span>
            )}
          </div>
          {lastContactDays != null && (
            <span className={cn('text-xs', lastContactClass)} title="Last contact">
              Last contact {lastContactDays} days ago
            </span>
          )}
          <div className="flex flex-col gap-0.5 min-w-[80px]">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, coveragePercent))}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">Coverage</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {coachesCount} coach{coachesCount !== 1 ? 'es' : ''} · {clubsCount} club{clubsCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </header>
  )
}
