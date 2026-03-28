'use client'

import { cn } from '@/lib/utils'
import type { CoachIntelSignals } from '@/lib/intelligence/coach-intel-signals'

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
  intelSignals,
}: {
  coach: CoachRecord
  completenessPercent: number
  intelligenceWeightedConfidence?: number
  intelSignals?: CoachIntelSignals
}) {
  const strengths = deriveStrengths(coach)
  const watchAreas = deriveWatchAreas(coach, completenessPercent, intelligenceWeightedConfidence)

  const reliabilityColor =
    intelSignals?.profileReliability === 'High' ? 'text-emerald-400' :
    intelSignals?.profileReliability === 'Medium' ? 'text-amber-400' :
    'text-muted-foreground'

  return (
    <section className="rounded-lg border border-border bg-card p-6 mb-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h2 className="text-base font-medium text-foreground">Executive Snapshot</h2>
        {intelSignals && intelSignals.count > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            {intelSignals.hasSensitive && (
              <span className="text-[10px] font-medium text-red-400 border border-red-400/20 bg-red-400/5 rounded px-2 py-0.5">
                Sensitive
              </span>
            )}
            {intelSignals.volatile && (
              <span className="text-[10px] font-medium text-amber-400 border border-amber-400/20 bg-amber-400/5 rounded px-2 py-0.5">
                Volatile
              </span>
            )}
            {intelSignals.overallScore !== null && (
              <div className="text-right">
                <div className={cn(
                  'text-lg font-bold leading-none',
                  intelSignals.overallScore >= 70 ? 'text-emerald-400' :
                  intelSignals.overallScore >= 45 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {intelSignals.overallScore}
                </div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Intel score</div>
              </div>
            )}
            {intelSignals.riskIndex !== null && (
              <div className="text-right">
                <div className={cn(
                  'text-lg font-bold leading-none',
                  intelSignals.riskIndex <= 20 ? 'text-emerald-400' :
                  intelSignals.riskIndex <= 50 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {intelSignals.riskIndex}
                </div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Risk index</div>
              </div>
            )}
            <div className="text-right">
              <div className={cn('text-xs font-medium', reliabilityColor)}>
                {intelSignals.profileReliability}
              </div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">{intelSignals.count} entries</div>
            </div>
          </div>
        )}
      </div>
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

      {intelSignals && (intelSignals.topPositive.length > 0 || intelSignals.topNegative.length > 0) && (
        <div className="mt-4 pt-4 border-t border-border grid gap-3 sm:grid-cols-2">
          {intelSignals.topPositive.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Key positives</p>
              {intelSignals.topPositive.map((item: { id: string; title: string }) => (
                <div key={item.id} className="text-xs text-foreground bg-emerald-400/5 border border-emerald-400/15 rounded px-2.5 py-1.5">
                  {item.title}
                </div>
              ))}
            </div>
          )}
          {intelSignals.topNegative.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Key risks</p>
              {intelSignals.topNegative.map((item: { id: string; title: string }) => (
                <div key={item.id} className="text-xs text-foreground bg-red-400/5 border border-red-400/15 rounded px-2.5 py-1.5">
                  {item.title}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
