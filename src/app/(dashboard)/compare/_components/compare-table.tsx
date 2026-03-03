import React from 'react'

type CoachRecord = Record<string, unknown> & {
  id: string
  name: string | null
  _completeness?: number
  _evidenceCount?: number
  _recruitmentCount?: number
  _mediaCount?: number
  _mediaAvgSeverity?: number | null
}

function cell(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  if (typeof value === 'number' && !Number.isNaN(value)) return String(Math.round(value))
  return String(value).trim() || '—'
}

function Section({
  title,
  rows,
  coaches,
  cols,
}: {
  title: string
  rows: { label: string; key: string }[]
  coaches: CoachRecord[]
  cols: string
}) {
  return (
    <section className="border-b border-border last:border-b-0">
      <div className="grid gap-0 min-w-[600px]" style={{ gridTemplateColumns: cols }}>
        <div className="px-4 py-2 bg-surface/50 border-b border-border font-medium text-xs text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
        {coaches.map((c) => (
          <div key={c.id} className="px-4 py-2 bg-surface/50 border-b border-border" />
        ))}
        {rows.map((row) => (
          <React.Fragment key={row.key}>
            <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border/50">
              {row.label}
            </div>
            {coaches.map((c) => (
              <div
                key={`${row.key}-${c.id}`}
                className="px-4 py-2 text-sm text-foreground border-b border-border/50"
              >
                {cell(c[row.key])}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </section>
  )
}

export function CompareTable({ coachRecords }: { coachRecords: CoachRecord[] }) {
  const coaches = coachRecords as CoachRecord[]
  const colCount = coaches.length
  const cols = `180px repeat(${colCount}, minmax(120px, 1fr))`

  const coreScoreRows = [
    { label: 'Overall manual score', key: 'overall_manual_score' },
    { label: 'Intelligence confidence', key: 'intelligence_confidence' },
    { label: 'Tactical fit score', key: 'tactical_fit_score' },
    { label: 'Leadership score', key: 'leadership_score' },
    { label: 'Development score', key: 'development_score' },
    { label: 'Recruitment fit score', key: 'recruitment_fit_score' },
    { label: 'Media risk score', key: 'media_risk_score' },
    { label: 'Cultural alignment score', key: 'cultural_alignment_score' },
    { label: 'Adaptability score', key: 'adaptability_score' },
  ]
  const snapshotRows = [
    { label: 'Name', key: 'name' },
    { label: 'Availability', key: 'availability_status' },
    { label: 'Base location', key: 'base_location' },
    { label: 'Languages', key: 'languages' },
    { label: 'Market status', key: 'market_status' },
    { label: 'Relocation flexibility', key: 'relocation_flexibility' },
  ]
  const tacticalRows = [
    { label: 'Tactical identity', key: 'tactical_identity' },
    { label: 'Pressing intensity', key: 'pressing_intensity' },
    { label: 'Build preference', key: 'build_preference' },
    { label: 'Preferred style', key: 'preferred_style' },
  ]
  const leadershipRows = [
    { label: 'Leadership style', key: 'leadership_style' },
    { label: 'Staff management style', key: 'staff_management_style' },
    { label: 'Recruitment collaboration', key: 'recruitment_collaboration' },
    { label: 'Player development model', key: 'player_development_model' },
  ]
  const riskRows = [
    { label: 'Legal risk flag', key: 'legal_risk_flag' },
    { label: 'Integrity risk flag', key: 'integrity_risk_flag' },
    { label: 'Safeguarding risk flag', key: 'safeguarding_risk_flag' },
    { label: 'Due diligence summary', key: 'due_diligence_summary' },
  ]

  return (
    <div className="overflow-x-auto">
      {/* Header row: attribute | coach1 | coach2 | ... */}
      <div
        className="grid gap-0 border-b border-border bg-surface/50 min-w-[600px]"
        style={{ gridTemplateColumns: cols }}
      >
        <div className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider" />
        {coaches.map((c) => (
          <div key={c.id} className="px-4 py-3 text-sm font-medium text-foreground truncate" title={c.name ?? ''}>
            {c.name ?? '—'}
          </div>
        ))}
      </div>

      <Section title="Snapshot" rows={snapshotRows} coaches={coaches} cols={cols} />
      <Section title="Core scores" rows={coreScoreRows} coaches={coaches} cols={cols} />
      <Section title="Tactical identity" rows={tacticalRows} coaches={coaches} cols={cols} />
      <Section title="Leadership and staff management" rows={leadershipRows} coaches={coaches} cols={cols} />

      {/* Recruitment history summary */}
      <section className="border-b border-border">
        <div className="grid gap-0 min-w-[600px]" style={{ gridTemplateColumns: cols }}>
          <div className="px-4 py-2 bg-surface/50 font-medium text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
            Recruitment history summary
          </div>
          {coaches.map((c) => (
            <div key={c.id} className="px-4 py-2 text-sm text-foreground border-b border-border">
              {typeof c._recruitmentCount === 'number' ? `${c._recruitmentCount} entries` : '—'}
            </div>
          ))}
        </div>
      </section>

      {/* Media profile summary */}
      <section className="border-b border-border">
        <div className="grid gap-0 min-w-[600px]" style={{ gridTemplateColumns: cols }}>
          <div className="px-4 py-2 bg-surface/50 font-medium text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
            Media profile summary
          </div>
          {coaches.map((c) => (
            <div key={c.id} className="px-4 py-2 text-sm text-foreground border-b border-border">
              {typeof c._mediaCount === 'number' ? `${c._mediaCount} events` : '—'}
              {typeof c._mediaAvgSeverity === 'number' && !Number.isNaN(c._mediaAvgSeverity) ? ` · avg severity ${Math.round(c._mediaAvgSeverity)}` : ''}
            </div>
          ))}
        </div>
      </section>

      <Section title="Risk and intelligence" rows={riskRows} coaches={coaches} cols={cols} />

      {/* Staff network summary - single row placeholder */}
      <section className="border-b border-border">
        <div className="grid gap-0" style={{ gridTemplateColumns: cols }}>
          <div className="px-4 py-2 bg-surface/50 font-medium text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
            Staff network summary
          </div>
          {coaches.map((c) => (
            <div key={c.id} className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
              —
            </div>
          ))}
        </div>
      </section>

      {/* Evidence count */}
      <section className="border-b border-border">
        <div className="grid gap-0" style={{ gridTemplateColumns: cols }}>
          <div className="px-4 py-2 bg-surface/50 font-medium text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
            Evidence count
          </div>
          {coaches.map((c) => (
            <div key={c.id} className="px-4 py-2 text-sm text-foreground tabular-nums border-b border-border">
              {typeof c._evidenceCount === 'number' ? c._evidenceCount : '—'}
            </div>
          ))}
        </div>
      </section>

      {/* Profile completeness */}
      <section className="border-b border-border">
        <div className="grid gap-0" style={{ gridTemplateColumns: cols }}>
          <div className="px-4 py-2 bg-surface/50 font-medium text-xs text-muted-foreground uppercase tracking-wider">
            Profile completeness
          </div>
          {coaches.map((c) => (
            <div key={c.id} className="px-4 py-2 text-sm text-muted-foreground tabular-nums">
              {typeof c._completeness === 'number' ? `${c._completeness}%` : '—'}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
