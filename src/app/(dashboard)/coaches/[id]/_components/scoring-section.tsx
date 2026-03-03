'use client'

import { cn } from '@/lib/utils'
import { EditCoachDrawer, type EditCoachField } from './edit-coach-drawer'
import { updateCoachCoreAction } from '@/app/(dashboard)/coaches/[id]/actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { useRouter } from 'next/navigation'

function formatScore(v: number | null | undefined): string {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? '—' : String(Math.round(n))
}

function scoreBarClass(value: number | null | undefined): string {
  if (value == null) return 'bg-red-500/70'
  const n = Math.max(0, Math.min(100, Number(value)))
  if (n >= 70) return 'bg-green-500'
  if (n >= 40) return 'bg-amber-500'
  return 'bg-red-500/70'
}

function ScoreRow({ label, value }: { label: string; value: number | null | undefined }) {
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
    </div>
  )
}

type VersionedScores = {
  overall_score: number | null
  tactical_score: number | null
  leadership_score: number | null
  recruitment_score: number | null
  risk_score: number | null
  media_score: number | null
  confidence_score: number | null
  computed_at?: string
}

const SCORING_FIELDS: EditCoachField[] = [
  { key: 'tactical_fit_score', label: 'Tactical fit score', type: 'number', min: 0, max: 100, helperText: '0–100' },
  { key: 'leadership_score', label: 'Leadership score', type: 'number', min: 0, max: 100, helperText: '0–100' },
  { key: 'recruitment_fit_score', label: 'Recruitment fit score', type: 'number', min: 0, max: 100, helperText: '0–100' },
  { key: 'media_risk_score', label: 'Media risk score', type: 'number', min: 0, max: 100, helperText: '0–100' },
  { key: 'overall_manual_score', label: 'Overall manual score', type: 'number', min: 0, max: 100, helperText: '0–100' },
  { key: 'intelligence_confidence', label: 'Intelligence confidence', type: 'number', min: 0, max: 100, helperText: '0–100' },
  { key: 'board_compatibility', label: 'Board compatibility score', type: 'number', min: 0, max: 100, helperText: '0–100, optional' },
  { key: 'ownership_fit', label: 'Ownership fit score', type: 'number', min: 0, max: 100, helperText: '0–100, optional' },
  { key: 'cultural_risk', label: 'Cultural risk score', type: 'number', min: 0, max: 100, helperText: '0–100, optional' },
  { key: 'agent_relationship', label: 'Agent relationship score', type: 'number', min: 0, max: 100, helperText: '0–100, optional' },
  { key: 'financial_feasibility', label: 'Financial feasibility score', type: 'number', min: 0, max: 100, helperText: '0–100, optional' },
]

type CoachRecord = Record<string, unknown>

export function ScoringSection({
  coachId,
  coach,
  evidenceCount = 0,
  completenessPercent = 0,
  evidenceCoverage = 0,
  verifiedCoverage = 0,
  intelligenceWeightedConfidence,
  versionedScores,
}: {
  coachId: string
  coach: CoachRecord
  evidenceCount?: number
  completenessPercent?: number
  evidenceCoverage?: number
  verifiedCoverage?: number
  intelligenceWeightedConfidence?: number
  versionedScores?: VersionedScores | null
}) {
  const router = useRouter()
  const useVersioned = versionedScores != null
  const tacticalFitScore = useVersioned ? versionedScores.tactical_score : (coach.tactical_fit_score as number | null | undefined)
  const leadershipScore = useVersioned ? versionedScores.leadership_score : (coach.leadership_score as number | null | undefined)
  const recruitmentFitScore = useVersioned ? versionedScores.recruitment_score : (coach.recruitment_fit_score as number | null | undefined)
  const mediaRiskScore = useVersioned ? versionedScores.media_score : (coach.media_risk_score as number | null | undefined)
  const overallManualScore = useVersioned ? versionedScores.overall_score : (coach.overall_manual_score as number | null | undefined)
  const intelligenceConfidence = useVersioned && versionedScores.confidence_score != null
    ? versionedScores.confidence_score
    : (intelligenceWeightedConfidence ?? (coach.intelligence_confidence as number | null | undefined))

  const initialValues: Record<string, unknown> = {
    tactical_fit_score: coach.tactical_fit_score ?? '',
    leadership_score: coach.leadership_score ?? '',
    recruitment_fit_score: coach.recruitment_fit_score ?? '',
    media_risk_score: coach.media_risk_score ?? '',
    overall_manual_score: coach.overall_manual_score ?? '',
    intelligence_confidence: coach.intelligence_confidence ?? '',
    board_compatibility: coach.board_compatibility ?? '',
    ownership_fit: coach.ownership_fit ?? '',
    cultural_risk: coach.cultural_risk ?? '',
    agent_relationship: coach.agent_relationship ?? '',
    financial_feasibility: coach.financial_feasibility ?? '',
  }

  const handleSave = async (payload: Record<string, unknown>) => {
    const result = await updateCoachCoreAction(coachId, payload)
    if (!result.ok) {
      toastError(result.error)
      return result
    }
    toastSuccess('Scoring updated')
    return result
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <EditCoachDrawer
          title="Edit scoring"
          triggerLabel="Edit"
          fields={SCORING_FIELDS}
          initialValues={initialValues}
          onSave={handleSave}
          onSuccess={() => router.refresh()}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground">Score Breakdown</p>
            {useVersioned && (
              <span className="text-xs text-muted-foreground">From versioned model</span>
            )}
          </div>
          <div className="space-y-0">
            <ScoreRow label="Tactical" value={tacticalFitScore} />
            <ScoreRow label="Leadership" value={leadershipScore} />
            <ScoreRow label="Recruitment" value={recruitmentFitScore} />
            <ScoreRow label="Media Risk" value={mediaRiskScore} />
            <ScoreRow label="Overall Manual" value={overallManualScore} />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium text-foreground mb-4">System Insight</p>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Intelligence confidence</span>
              <span className="tabular-nums text-foreground">{formatScore(intelligenceConfidence)}</span>
            </div>
            <div className="flex justify-between">
              <span>Evidence count</span>
              <span className="tabular-nums text-foreground">{evidenceCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Evidence coverage</span>
              <span className="tabular-nums text-foreground" title="Linked records with confidence set">{evidenceCoverage}</span>
            </div>
            <div className="flex justify-between">
              <span>Verified coverage</span>
              <span className="tabular-nums text-foreground" title="Linked records verified">{verifiedCoverage}</span>
            </div>
            <div className="flex justify-between">
              <span>Profile completeness</span>
              <span className="tabular-nums text-foreground">{completenessPercent}%</span>
            </div>
            <div className="pt-2 border-t border-border/50 text-sm text-muted-foreground">
              {completenessPercent < 40 && (
                <p>Low profile completeness may reduce ranking accuracy.</p>
              )}
              {evidenceCount < 3 && (
                <p className={completenessPercent < 40 ? 'mt-1' : ''}>Limited intelligence coverage.</p>
              )}
              {completenessPercent >= 40 && evidenceCount >= 3 && (
                <p>No advisory notes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic">Weighting system will be added later.</p>
    </div>
  )
}
