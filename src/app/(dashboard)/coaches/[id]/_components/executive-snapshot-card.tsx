'use client'

type CoachRecord = Record<string, unknown>

function deriveStrengths(coach: CoachRecord): string[] {
  const out: string[] = []
  const pressing = (coach.pressing_intensity as string)?.toLowerCase()
  if (pressing === 'high' || pressing === 'very high') out.push('High intensity tactical profile')
  const leadership = (coach.leadership_style as string)?.toLowerCase() ?? ''
  if (leadership.includes('collaborative')) out.push('Collaborative leadership approach')
  const youthTrust = coach.youth_trust as number | null | undefined
  const hasDevelopment = youthTrust != null || (coach.academy_integration as string)?.trim() || (coach.player_development_model as string)?.trim()
  if (hasDevelopment) out.push('Development oriented profile')
  const tier = (coach.reputation_tier as string)?.toLowerCase()
  if (tier === 'elite' || tier === 'established' || tier === 'world-class') out.push('Proven at senior level')
  return out.slice(0, 3)
}

function deriveWatchAreas(
  coach: CoachRecord,
  completenessPercent: number,
  intelligenceConfidence: number
): string[] {
  const out: string[] = []
  const legal = (coach.legal_risk_flag as boolean) ?? false
  const integrity = (coach.integrity_risk_flag as boolean) ?? false
  const safeguarding = (coach.safeguarding_risk_flag as boolean) ?? false
  if (legal) out.push('Legal risk flag')
  if (integrity) out.push('Integrity risk flag')
  if (safeguarding) out.push('Safeguarding risk flag')
  if (completenessPercent < 50) out.push('Limited intelligence coverage')
  if (intelligenceConfidence < 40) out.push('Low evidence confidence')
  return out.slice(0, 5)
}

export function ExecutiveSnapshotCard({
  coach,
  completenessPercent,
  intelligenceWeightedConfidence = 0,
}: {
  coach: CoachRecord
  completenessPercent: number
  intelligenceWeightedConfidence?: number
}) {
  const strengths = deriveStrengths(coach)
  const watchAreas = deriveWatchAreas(coach, completenessPercent, intelligenceWeightedConfidence)

  return (
    <section className="rounded-lg border border-border bg-card p-6 mb-4">
      <h2 className="text-base font-medium text-foreground mb-3">Executive Snapshot</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Strengths</p>
          <ul className="list-disc list-inside text-sm text-foreground space-y-1">
            {strengths.length > 0 ? strengths.map((s, i) => <li key={i}>{s}</li>) : <li className="text-muted-foreground">—</li>}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Watch areas</p>
          <ul className="list-disc list-inside text-sm text-foreground space-y-1">
            {watchAreas.length > 0 ? watchAreas.map((w, i) => <li key={i}>{w}</li>) : <li className="text-muted-foreground">None identified</li>}
          </ul>
        </div>
      </div>
    </section>
  )
}
