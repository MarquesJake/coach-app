'use client'

type CoachRecord = Record<string, unknown>

function formatDate(s: string | null | undefined): string {
  if (!s) return '—'
  try {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  const v = value != null && String(value).trim() !== '' ? String(value).trim() : '—'
  return (
    <div className="py-2 border-b border-border/50 last:border-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{v}</p>
    </div>
  )
}

export function CoachDossierRail({ coach }: { coach: CoachRecord }) {
  const availability = (coach.availability_status as string) ?? (coach.available_status as string) ?? null
  const marketStatus = coach.market_status as string | null | undefined
  const baseLocation = coach.base_location as string | null | undefined
  const relocation = coach.relocation_flexibility as string | null | undefined
  const languages = Array.isArray(coach.languages) ? (coach.languages as string[]).join(', ') : (coach.languages as string) ?? null
  const agent = (coach.agent_name as string) ?? null
  const compensation = (coach.compensation_expectation as string) ?? (coach.wage_expectation as string) ?? null
  const staffCost = coach.staff_cost_estimate as string | null | undefined
  const lastUpdated = coach.last_updated as string | null | undefined
  const intelligenceConf = coach.intelligence_confidence as number | null | undefined

  return (
    <aside className="w-56 shrink-0">
      <div className="rounded-lg border border-border bg-card p-4 sticky top-4">
        <h2 className="text-lg font-medium text-foreground mb-3">Dossier</h2>
        <Row label="Availability" value={availability} />
        <Row label="Market status" value={marketStatus ?? null} />
        <Row label="Base location" value={baseLocation ?? null} />
        <Row label="Relocation flexibility" value={relocation ?? null} />
        <Row label="Languages" value={languages} />
        <Row label="Agent" value={agent} />
        <Row label="Compensation band" value={compensation} />
        <Row label="Staff cost band" value={staffCost ?? null} />
        <Row label="Last updated" value={lastUpdated ? formatDate(lastUpdated) : null} />
        <div className="py-2 border-b border-border/50 last:border-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Intelligence confidence</p>
          <p className="text-sm font-medium tabular-nums text-foreground">{intelligenceConf != null ? `${Math.round(Number(intelligenceConf))}%` : '—'}</p>
        </div>
      </div>
    </aside>
  )
}
