'use client'

import { cn } from '@/lib/utils'

type CoachRecord = Record<string, unknown>

function formatScore(v: number | null | undefined): string {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? '—' : String(Math.round(n))
}

function scoreColorClass(value: number | null | undefined): string {
  if (value == null) return 'text-muted-foreground'
  const n = Math.max(0, Math.min(100, Number(value)))
  if (n >= 70) return 'text-green-400'
  if (n >= 40) return 'text-amber-400'
  return 'text-red-400'
}

/** Dummy advisory based on scores and flags. Replace with real logic when criteria are defined. */
function getAdvisory(coach: CoachRecord): string {
  const overall = Number(coach.overall_manual_score)
  const tactical = Number(coach.tactical_fit_score)
  const mediaRisk = Number(coach.media_risk_score)
  const legal = (coach.legal_risk_flag as boolean) ?? false
  const integrity = (coach.integrity_risk_flag as boolean) ?? false
  const safeguarding = (coach.safeguarding_risk_flag as boolean) ?? false
  if (legal || integrity || safeguarding) return 'High risk / high ceiling profile. Review due diligence before shortlist.'
  if (!Number.isNaN(tactical) && tactical >= 65 && !Number.isNaN(mediaRisk) && mediaRisk >= 50) return 'Strong tactical alignment but moderate media volatility.'
  if (!Number.isNaN(overall) && overall >= 60) return 'High youth development upside with established track record.'
  if (!Number.isNaN(overall) && overall < 40) return 'Limited profile data. Prioritise intelligence gathering.'
  return 'No advisory notes.'
}

function getRiskFlagLevel(coach: CoachRecord): 'Low' | 'Medium' | 'High' {
  const legal = (coach.legal_risk_flag as boolean) ?? false
  const integrity = (coach.integrity_risk_flag as boolean) ?? false
  const safeguarding = (coach.safeguarding_risk_flag as boolean) ?? false
  if (legal || integrity || safeguarding) return 'High'
  const mediaRisk = Number(coach.media_risk_score)
  if (!Number.isNaN(mediaRisk) && mediaRisk >= 60) return 'Medium'
  return 'Low'
}

export function ExecutiveSummaryCard({
  coach,
  completenessPercent,
  evidenceCount,
  mandateFitScore,
  intelligenceWeightedConfidence,
  intelligenceItemCount,
  hasRecruitmentDensity,
}: {
  coach: CoachRecord
  completenessPercent: number
  evidenceCount: number
  mandateFitScore?: number | null
  intelligenceWeightedConfidence?: number
  intelligenceItemCount?: number
  hasRecruitmentDensity?: boolean
}) {
  const overallScore = coach.overall_manual_score as number | null | undefined
  const intelligenceConf = intelligenceWeightedConfidence ?? (coach.intelligence_confidence as number | null | undefined)
  const displayEvidenceCount = intelligenceItemCount ?? evidenceCount
  const riskLevel = getRiskFlagLevel(coach)
  const advisory = getAdvisory(coach)
  const recruitmentLine = hasRecruitmentDensity
    ? ' Recruitment network density captured. Review Squad DNA for repeated patterns and agent clusters.'
    : ''

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-4">
      <h2 className="text-lg font-medium text-foreground mb-4">Executive Summary</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Overall Profile Score</p>
          <p className={cn('text-2xl font-semibold tabular-nums', scoreColorClass(overallScore))}>
            {formatScore(overallScore)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Mandate Fit Score</p>
          <p className={cn('text-2xl font-semibold tabular-nums', scoreColorClass(mandateFitScore))}>
            {formatScore(mandateFitScore)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Intelligence Confidence</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{formatScore(intelligenceConf)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Evidence Count</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{displayEvidenceCount}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Risk Flag</p>
          <span
            className={cn(
              'inline-block text-xs font-medium px-2 py-0.5 rounded',
              riskLevel === 'High' && 'bg-red-500/15 text-red-400 border border-red-500/30',
              riskLevel === 'Medium' && 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
              riskLevel === 'Low' && 'bg-muted text-muted-foreground border border-border'
            )}
          >
            {riskLevel}
          </span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Profile Completeness</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{completenessPercent}%</p>
        </div>
      </div>
      <div className="pt-3 border-t border-border">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Advisory</p>
        <p className="text-sm text-foreground">{advisory}{recruitmentLine}</p>
      </div>
    </div>
  )
}
