'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowDownToLine, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ASSESSMENT_CRITERIA } from '@/lib/assessment/criteria'
import { promoteClaimToAssessmentAction } from '@/app/(dashboard)/intelligence/trusted-actions'
import { evidenceStrengthLabel } from '@/lib/intelligence/display'

export function AssessmentClaimPromotion({ mandateId, coachId, claims, promotedClaimIds }: { mandateId: string; coachId: string; claims: Array<Record<string, any>>; promotedClaimIds: string[] }) {
  const [pending, startTransition] = useTransition()
  const [criterionByClaim, setCriterionByClaim] = useState<Record<string, string>>({})
  const promoted = new Set(promotedClaimIds)
  return (
    <section className="mt-6 border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><h2 className="text-sm font-semibold">Pre-mandate trusted intelligence</h2><p className="text-xs text-muted-foreground">Choose which reviewed findings to use in this assessment. The pack receives an anonymised frozen snapshot.</p></div><Link href={`/coaches/${coachId}/intelligence`} className="text-xs font-medium text-primary">Coach intelligence</Link></div>
      <div className="divide-y divide-border">
        {claims.map((claim) => {
          const isPromoted = promoted.has(claim.id)
          const selectedCriterion = criterionByClaim[claim.id] || claim.methodology_criteria?.[0] || 'coach_profile'
          return <div key={claim.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_220px_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{claim.claimed_value}</p><Badge variant={claim.evidence_strength === 'corroborated' ? 'success' : claim.evidence_strength === 'disputed' ? 'danger' : 'outline'}>{evidenceStrengthLabel(claim.evidence_strength)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{claim.evidence_summary}</p></div><select value={selectedCriterion} disabled={isPromoted} onChange={(event) => setCriterionByClaim((values) => ({ ...values, [claim.id]: event.target.value }))} className="rounded-md border border-border bg-background px-3 py-2 text-sm">{ASSESSMENT_CRITERIA.map((criterion) => <option key={criterion.key} value={criterion.key}>{criterion.label}</option>)}</select><Button variant={isPromoted ? 'outline' : 'default'} disabled={pending || isPromoted} onClick={() => startTransition(async () => { const result = await promoteClaimToAssessmentAction({ claimId: claim.id, mandateId, coachId, criterion: selectedCriterion }); if (!result.ok) { toast.error(result.error); return } toast.success(result.message || 'Finding added to assessment'); window.location.reload() })}>{isPromoted ? <><Check className="mr-2 h-4 w-4" />In assessment</> : <><ArrowDownToLine className="mr-2 h-4 w-4" />Use in assessment</>}</Button></div>
        })}
        {!claims.length && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No reviewed external-use findings are available.</p>}
      </div>
    </section>
  )
}
