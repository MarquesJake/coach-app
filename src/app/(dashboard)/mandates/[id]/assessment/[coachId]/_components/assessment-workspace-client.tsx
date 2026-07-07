'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ASSESSMENT_CRITERIA,
  EVIDENCE_METHODS,
  RECOMMENDATION_VERDICTS,
  methodLabel,
  type CriterionKey,
} from '@/lib/assessment/criteria'
import type { DerivedEvidence } from '@/lib/assessment/derived-evidence'
import type { GbeResult } from '@/lib/analysis/gbe'
import {
  saveAssessmentAction,
  addEvidenceAction,
  setEvidenceVerificationAction,
  setEvidenceRecommendationUseAction,
  deleteEvidenceAction,
  saveRecommendationAction,
} from '../../actions'

export type AssessmentRow = {
  criterion: string
  score: number | null
  summary: string | null
  status: string
}

export type EvidenceRow = {
  id: string
  criterion: string
  method: string
  title: string
  detail: string | null
  source: string | null
  confidence: number | null
  verification_status: string
  used_in_recommendation: boolean
  created_at: string
}

export type RecommendationRow = {
  verdict: string | null
  confidence: number | null
  summary: string | null
  key_strengths: string | null
  key_risks: string | null
  mitigation: string | null
}

const inputClass =
  'w-full px-2.5 py-1.5 bg-surface border border-border rounded-md text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors'

export function AssessmentWorkspaceClient({
  mandateId,
  coachId,
  coachName,
  assessments,
  evidence,
  derived,
  recommendation,
  gbe,
  coachingLicence,
}: {
  mandateId: string
  coachId: string
  coachName: string
  assessments: AssessmentRow[]
  evidence: EvidenceRow[]
  derived: DerivedEvidence[]
  recommendation: RecommendationRow | null
  gbe: GbeResult
  coachingLicence: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<CriterionKey>('coach_profile')
  const [error, setError] = useState<string | null>(null)

  const assessmentByCriterion = useMemo(
    () => new Map(assessments.map((a) => [a.criterion, a])),
    [assessments]
  )

  const cellCounts = useMemo(() => {
    const counts = new Map<string, { manual: number; verified: number; auto: number }>()
    const bump = (criterion: string, method: string, kind: 'manual' | 'verified' | 'auto') => {
      const key = `${criterion}:${method}`
      const cell = counts.get(key) ?? { manual: 0, verified: 0, auto: 0 }
      cell[kind] += 1
      counts.set(key, cell)
    }
    for (const item of evidence) {
      bump(item.criterion, item.method, 'manual')
      if (item.verification_status === 'verified') bump(item.criterion, item.method, 'verified')
    }
    for (const item of derived) bump(item.criterion, item.method, 'auto')
    return counts
  }, [evidence, derived])

  const coveredCriteria = useMemo(() => {
    const covered = new Set<string>()
    for (const item of evidence) covered.add(item.criterion)
    for (const item of derived) covered.add(item.criterion)
    return covered
  }, [evidence, derived])

  const submit = (action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>) =>
    (formData: FormData) => {
      setError(null)
      startTransition(async () => {
        const result = await action(formData)
        if (!result.ok) setError(result.error ?? 'Something went wrong')
        else router.refresh()
      })
    }

  // Board-readable summary: what the evidence supports, where the gaps are,
  // and where the decision stands — legible in ten seconds.
  const strongCriteria = ASSESSMENT_CRITERIA.filter((c) => {
    const a = assessmentByCriterion.get(c.key)
    return a?.status === 'complete' && a.score !== null && a.score >= 70 && coveredCriteria.has(c.key)
  })
  const gapCriteria = ASSESSMENT_CRITERIA.filter((c) => !coveredCriteria.has(c.key))

  const selectedAssessment = assessmentByCriterion.get(selected)
  const selectedEvidence = evidence.filter((e) => e.criterion === selected)
  const selectedDerived = derived.filter((d) => d.criterion === selected)
  const selectedMeta = ASSESSMENT_CRITERIA.find((c) => c.key === selected)!

  return (
    <div className="mt-5 space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-surface rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Evidence coverage</p>
          <p className="text-lg font-semibold text-foreground mt-0.5 tabular-nums">
            {coveredCriteria.size}<span className="text-muted-foreground text-sm">/9 criteria</span>
          </p>
        </div>
        <div className="card-surface rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Assessed</p>
          <p className="text-lg font-semibold text-foreground mt-0.5 tabular-nums">
            {assessments.filter((a) => a.status === 'complete').length}
            <span className="text-muted-foreground text-sm">/9 complete</span>
          </p>
        </div>
        <div className="card-surface rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Work-permit note</p>
          <p
            className={cn(
              'text-sm font-medium mt-1',
              gbe.status === 'Pass' ? 'text-emerald-400/90' : 'text-muted-foreground'
            )}
          >
            {gbe.status === 'Pass'
              ? 'GBE auto-pass indicated on recorded data'
              : gbe.status === 'Fail'
                ? 'GBE auto-pass not confirmed on recorded data'
                : 'Requires legal / work-permit confirmation'}
          </p>
          <p className="text-2xs text-muted-foreground mt-0.5">
            {gbe.passRoute ?? (coachingLicence ? `Licence: ${coachingLicence}` : 'Licence not recorded')}
          </p>
        </div>
      </div>

      {/* Board summary — the ten-second read */}
      <div className="card-surface rounded-lg px-5 py-3.5 border-l-2 border-primary/60">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-x-8 gap-y-1.5 items-start">
          <p className="text-2xs text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/90 mr-2">Strong evidence</span>
            {strongCriteria.length > 0 ? strongCriteria.map((c) => c.label).join(', ') : 'None assessed yet'}
          </p>
          <p className="text-2xs text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/90 mr-2">Evidence gaps</span>
            {gapCriteria.length > 0 ? gapCriteria.map((c) => c.label).join(', ') : 'Full coverage'}
          </p>
          <p className="text-2xs text-muted-foreground lg:text-right">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mr-2">Decision confidence</span>
            <span className="text-foreground font-semibold tabular-nums">
              {recommendation?.confidence !== null && recommendation?.confidence !== undefined ? `${recommendation.confidence}%` : '—'}
            </span>
          </p>
        </div>
        <p className="text-2xs text-muted-foreground mt-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mr-2">Recommendation</span>
          {recommendation?.verdict
            ? `${recommendation.verdict}${recommendation.summary ? ` — ${recommendation.summary}` : ''}`
            : 'Not yet decided'}
        </p>
      </div>

      {/* Coverage matrix */}
      <div className="card-surface rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Assessment matrix</h2>
          <p className="text-2xs text-muted-foreground mt-0.5">
            Evidence coverage across 9 criteria and 8 methods. Green = verified, amber = unverified, grey = auto-derived from platform data.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-2xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-2 font-semibold text-muted-foreground/60 uppercase tracking-widest text-[9px]">Criterion</th>
                {EVIDENCE_METHODS.map((m) => (
                  <th key={m.key} className="px-1.5 py-2 font-semibold text-muted-foreground/60 uppercase tracking-widest text-[9px]">
                    {m.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASSESSMENT_CRITERIA.map((criterion) => {
                const rowAssessment = assessmentByCriterion.get(criterion.key)
                return (
                  <tr
                    key={criterion.key}
                    onClick={() => setSelected(criterion.key)}
                    className={cn(
                      'border-b border-border/30 cursor-pointer transition-colors',
                      selected === criterion.key ? 'bg-primary/5' : 'hover:bg-surface/60'
                    )}
                  >
                    <td className="px-4 py-2">
                      <span className={cn('font-medium', selected === criterion.key ? 'text-primary' : 'text-foreground')}>
                        {criterion.num}. {criterion.label}
                      </span>
                      {rowAssessment?.score !== null && rowAssessment?.score !== undefined && (
                        <span className="ml-2 tabular-nums text-muted-foreground">{rowAssessment.score}</span>
                      )}
                    </td>
                    {EVIDENCE_METHODS.map((m) => {
                      const cell = cellCounts.get(`${criterion.key}:${m.key}`)
                      const total = (cell?.manual ?? 0) + (cell?.auto ?? 0)
                      return (
                        <td key={m.key} className="px-1.5 py-2 text-center">
                          {total === 0 ? (
                            <span className="inline-block w-5 h-5 rounded bg-surface/80 border border-border/40" />
                          ) : (
                            <span
                              className={cn(
                                'inline-flex items-center justify-center w-5 h-5 rounded font-semibold tabular-nums',
                                cell && cell.verified > 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : cell && cell.manual > 0
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                                    : 'bg-muted/40 text-muted-foreground border border-border/60'
                              )}
                            >
                              {total}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Selected criterion detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-surface rounded-lg p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {selectedMeta.num}. {selectedMeta.label}
            </h3>
            <p className="text-2xs text-muted-foreground mt-0.5">{selectedMeta.question}</p>
          </div>
          <form action={submit(saveAssessmentAction)} className="space-y-3">
            <input type="hidden" name="mandate_id" value={mandateId} />
            <input type="hidden" name="coach_id" value={coachId} />
            <input type="hidden" name="criterion" value={selected} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Status</label>
                <select name="status" defaultValue={selectedAssessment?.status ?? 'not_started'} className={inputClass} key={`status-${selected}`}>
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Score (0–100)</label>
                <input
                  key={`score-${selected}`}
                  type="number"
                  name="score"
                  min={0}
                  max={100}
                  defaultValue={selectedAssessment?.score ?? ''}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Conclusive findings</label>
              <textarea
                key={`summary-${selected}`}
                name="summary"
                rows={4}
                defaultValue={selectedAssessment?.summary ?? ''}
                placeholder={`Summary of ${coachName}'s ${selectedMeta.label.toLowerCase()} assessment…`}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Save assessment
            </button>
          </form>

          {/* GBE breakdown shown within Coach Profile criterion */}
          {selected === 'coach_profile' && (
            <div className="border-t border-border/50 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                Work-permit note (GBE, indicative)
              </p>
              <p className="text-2xs text-muted-foreground">
                Band 1: {gbe.monthsBand1}m · Band 1–2: {gbe.monthsBand1to2}m · Band 1–5: {gbe.monthsBand1to5}m (last 5 years)
              </p>
              {gbe.notes.map((note, i) => (
                <p key={i} className="text-2xs text-amber-300/80 mt-1">{note}</p>
              ))}
            </div>
          )}
        </div>

        <div className="card-surface rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Evidence — {selectedMeta.label}</h3>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {selectedEvidence.length === 0 && selectedDerived.length === 0 && (
              <p className="text-2xs text-muted-foreground">No evidence captured for this criterion yet.</p>
            )}
            {selectedEvidence.map((item) => (
              <div key={item.id} className="border border-border/50 rounded-md px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5">
                      {methodLabel(item.method)}
                      {item.confidence !== null && ` · confidence ${item.confidence}`}
                      {item.source && ` · ${item.source}`}
                      {!item.used_in_recommendation && (
                        <span className="ml-1.5 text-amber-300/80">· excluded from recommendation</span>
                      )}
                    </p>
                    {item.detail && <p className="text-2xs text-muted-foreground mt-1">{item.detail}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <form action={submit(setEvidenceRecommendationUseAction)}>
                      <input type="hidden" name="evidence_id" value={item.id} />
                      <input type="hidden" name="mandate_id" value={mandateId} />
                      <input type="hidden" name="coach_id" value={coachId} />
                      <select
                        name="used_in_recommendation"
                        defaultValue={item.used_in_recommendation ? 'true' : 'false'}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        title="Whether this evidence feeds the final recommendation"
                        className={cn(
                          'text-2xs bg-surface border border-border rounded px-1.5 py-1',
                          item.used_in_recommendation ? 'text-foreground' : 'text-amber-300'
                        )}
                      >
                        <option value="true">Counts</option>
                        <option value="false">Background</option>
                      </select>
                    </form>
                    <form action={submit(setEvidenceVerificationAction)}>
                      <input type="hidden" name="evidence_id" value={item.id} />
                      <input type="hidden" name="mandate_id" value={mandateId} />
                      <input type="hidden" name="coach_id" value={coachId} />
                      <select
                        name="verification_status"
                        defaultValue={item.verification_status}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className={cn(
                          'text-2xs bg-surface border border-border rounded px-1.5 py-1',
                          item.verification_status === 'verified' && 'text-emerald-300',
                          item.verification_status === 'disputed' && 'text-red-300'
                        )}
                      >
                        <option value="unverified">Unverified</option>
                        <option value="verified">Verified</option>
                        <option value="disputed">Disputed</option>
                      </select>
                    </form>
                    <form action={submit(deleteEvidenceAction)}>
                      <input type="hidden" name="evidence_id" value={item.id} />
                      <input type="hidden" name="mandate_id" value={mandateId} />
                      <input type="hidden" name="coach_id" value={coachId} />
                      <button type="submit" className="text-2xs text-muted-foreground hover:text-red-400 px-1" title="Delete evidence">
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
            {selectedDerived.map((item, i) => (
              <div key={`derived-${i}`} className="border border-dashed border-border/40 rounded-md px-3 py-2 bg-surface/40">
                <p className="text-xs text-foreground/80">{item.title}</p>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  Auto-derived · {methodLabel(item.method)}
                  {item.detail && ` · ${item.detail}`}
                </p>
              </div>
            ))}
          </div>

          <form action={submit(addEvidenceAction)} className="border-t border-border/50 pt-3 space-y-2">
            <input type="hidden" name="mandate_id" value={mandateId} />
            <input type="hidden" name="coach_id" value={coachId} />
            <input type="hidden" name="criterion" value={selected} />
            <div className="grid grid-cols-[1fr_130px] gap-2">
              <input name="title" required placeholder="Add evidence — what did you learn?" className={inputClass} key={`ev-title-${selected}`} />
              <select name="method" className={inputClass} defaultValue="desktop_research">
                {EVIDENCE_METHODS.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-[1fr_130px_90px] gap-2">
              <input name="source" placeholder="Source (person, publication, dataset…)" className={inputClass} key={`ev-source-${selected}`} />
              <input name="detail" placeholder="Detail (optional)" className={inputClass} key={`ev-detail-${selected}`} />
              <input name="confidence" type="number" min={0} max={100} placeholder="Conf." className={inputClass} key={`ev-conf-${selected}`} />
            </div>
            <select name="used_in_recommendation" defaultValue="true" className={inputClass}>
              <option value="true">Counts toward recommendation</option>
              <option value="false">Background only — exclude from recommendation</option>
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-1.5 bg-surface border border-border text-xs font-medium text-foreground rounded-md hover:border-primary/40 transition-colors disabled:opacity-50"
            >
              Add evidence
            </button>
          </form>
        </div>
      </div>

      {/* Final recommendation */}
      <div className="card-surface rounded-lg p-5">
        <h3 className="text-sm font-semibold text-foreground">Final recommendation</h3>
        <p className="text-2xs text-muted-foreground mt-0.5 mb-3">
          Analyst conclusion — structured by the 9-criteria methodology and supported by the evidence above. This is what the board pack is built around.
        </p>
        <form action={submit(saveRecommendationAction)} className="space-y-3">
          <input type="hidden" name="mandate_id" value={mandateId} />
          <input type="hidden" name="coach_id" value={coachId} />
          <div className="grid grid-cols-[180px_120px_1fr] gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Verdict</label>
              <select name="verdict" defaultValue={recommendation?.verdict ?? ''} className={inputClass}>
                <option value="">— Not decided —</option>
                {RECOMMENDATION_VERDICTS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Confidence</label>
              <input name="confidence" type="number" min={0} max={100} defaultValue={recommendation?.confidence ?? ''} className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Summary</label>
              <input name="summary" defaultValue={recommendation?.summary ?? ''} placeholder="Overall assessment in one or two sentences" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Key strengths</label>
              <textarea name="key_strengths" rows={2} defaultValue={recommendation?.key_strengths ?? ''} className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Key risks</label>
              <textarea name="key_risks" rows={2} defaultValue={recommendation?.key_risks ?? ''} className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Mitigation</label>
              <textarea name="mitigation" rows={2} defaultValue={recommendation?.mitigation ?? ''} className={inputClass} />
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Save recommendation
          </button>
        </form>
      </div>
    </div>
  )
}
