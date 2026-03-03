'use client'

import { cn } from '@/lib/utils'

type CoachRecord = Record<string, unknown>

export type DerivedMetricsRow = {
  avg_squad_age?: number | null
  pct_minutes_u23?: number | null
  pct_minutes_30plus?: number | null
  rotation_index?: number | null
  avg_signing_age?: number | null
  repeat_signings_count?: number | null
  repeat_agents_count?: number | null
  loan_reliance_score?: number | null
  network_density_score?: number | null
}

/** Recruitment Network Density: simple weighted formula from repeat signings, agents, loan reliance. */
function recruitmentNetworkDensity(m: DerivedMetricsRow | null): number | null {
  if (!m) return null
  const repeatSignings = Math.min(Number(m.repeat_signings_count) || 0, 15)
  const repeatAgents = Math.min(Number(m.repeat_agents_count) || 0, 10)
  const loanRel = Math.max(0, Math.min(100, Number(m.loan_reliance_score) || 0))
  const raw = repeatSignings * 3 + repeatAgents * 5 + (100 - loanRel) * 0.15
  return Math.round(Math.max(0, Math.min(100, raw)))
}

function formatScore(v: number | null | undefined): string {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? '—' : String(Math.round(n))
}

function scoreBarClass(value: number | null | undefined): string {
  if (value == null) return 'bg-muted'
  const n = Math.max(0, Math.min(100, Number(value)))
  if (n >= 70) return 'bg-green-500'
  if (n >= 40) return 'bg-amber-500'
  return 'bg-red-500/70'
}

function ScoreBarRow({ label, value, subtitle }: { label: string; value: number | null | undefined; subtitle?: string }) {
  const n = value != null ? Math.max(0, Math.min(100, Number(value))) : 0
  return (
    <div className="py-2 border-b border-border/50 last:border-0">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums text-foreground">{formatScore(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', scoreBarClass(value))}
          style={{ width: `${n}%` }}
        />
      </div>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  )
}

/** TODO: Coaching model metrics can later be replaced by aggregated match data. */
/** TODO: Youth trust score can later come from player minutes tables. */
/** TODO: Rotation index can later be calculated from match lineups. */
function fmtNum(v: number | null | undefined): string {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? '—' : String(Math.round(n))
}

export function CoachingModelSection({ coach, derivedMetrics = null }: { coachId?: string; coach: CoachRecord; derivedMetrics?: DerivedMetricsRow | null }) {
  const buildPreference = coach.build_preference as string | null | undefined
  const pressingIntensity = coach.pressing_intensity as string | null | undefined
  const transitionModel = coach.transition_model as string | null | undefined

  const buildUpScore = buildPreference ? 60 : null
  const pressingScore = pressingIntensity ? 55 : null
  const defensiveLineScore = 50
  const transitionBiasScore = transitionModel ? 65 : null
  const riskAppetiteScore = 45
  const rotationIndexScore = derivedMetrics?.rotation_index ?? 40
  const youthTrustScore = 55
  const substitutionProfileScore = 50
  const recruitmentDensity = recruitmentNetworkDensity(derivedMetrics)

  return (
    <div className="space-y-4">
      {/* Squad DNA */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Squad DNA</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Average squad age</p>
            <p className="font-medium tabular-nums text-foreground">{derivedMetrics?.avg_squad_age != null ? String(Number(derivedMetrics.avg_squad_age).toFixed(1)) : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Youth minutes %</p>
            <p className="font-medium tabular-nums text-foreground">{fmtNum(derivedMetrics?.pct_minutes_u23)}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Senior minutes %</p>
            <p className="font-medium tabular-nums text-foreground">{fmtNum(derivedMetrics?.pct_minutes_30plus)}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Rotation index</p>
            <p className="font-medium tabular-nums text-foreground">{fmtNum(derivedMetrics?.rotation_index ?? null)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Average signing age</p>
            <p className="font-medium tabular-nums text-foreground">{derivedMetrics?.avg_signing_age != null ? String(Number(derivedMetrics.avg_signing_age).toFixed(1)) : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Repeat signings</p>
            <p className="font-medium tabular-nums text-foreground">{fmtNum(derivedMetrics?.repeat_signings_count ?? null)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Repeat agents</p>
            <p className="font-medium tabular-nums text-foreground">{fmtNum(derivedMetrics?.repeat_agents_count ?? null)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Network density</p>
            <p className="font-medium tabular-nums text-foreground">{fmtNum(derivedMetrics?.network_density_score ?? null)}</p>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Recruitment network density</p>
            <p className="font-medium tabular-nums text-foreground">{recruitmentDensity != null ? `${recruitmentDensity}` : '—'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Playing style</h2>
        <div className="space-y-0">
          <ScoreBarRow label="Build up style" value={buildUpScore} subtitle={buildPreference ?? undefined} />
          <ScoreBarRow label="Pressing intensity" value={pressingScore} subtitle={pressingIntensity ?? undefined} />
          <ScoreBarRow label="Defensive line height" value={defensiveLineScore} />
          <ScoreBarRow label="Transition bias" value={transitionBiasScore} subtitle={transitionModel ?? undefined} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Risk & rotation</h2>
        <div className="space-y-0">
          <ScoreBarRow label="Risk appetite" value={riskAppetiteScore} />
          <ScoreBarRow label="Rotation index" value={rotationIndexScore} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Squad usage</h2>
        <div className="space-y-0">
          <ScoreBarRow label="Youth trust score" value={youthTrustScore} />
          <ScoreBarRow label="Substitution profile" value={substitutionProfileScore} />
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Metrics are indicative. Full coaching model will be driven by match and squad data when integrated.
      </p>
    </div>
  )
}
