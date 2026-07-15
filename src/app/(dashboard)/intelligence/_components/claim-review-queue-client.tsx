'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { Check, GitBranch, Scissors, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { evidenceStrengthLabel, externalVisibilityLabel, factCheckStatusLabel, reviewStatusLabel, statementTypeLabel } from '@/lib/intelligence/display'
import {
  createClaimRelationshipAction,
  mergeTrustedClaimsAction,
  reviewTrustedClaimAction,
  splitTrustedClaimAction,
} from '../trusted-actions'

type ClaimRow = Record<string, any>
const inputClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary'

export function ClaimReviewQueueClient({ claims, contacts, coaches, sessions, relationships }: {
  claims: ClaimRow[]
  contacts: ClaimRow[]
  coaches: ClaimRow[]
  sessions: ClaimRow[]
  relationships: ClaimRow[]
}) {
  const [filter, setFilter] = useState('pending')
  const [pending, startTransition] = useTransition()
  const contactMap = useMemo(() => new Map(contacts.map((row) => [row.id, row])), [contacts])
  const coachMap = useMemo(() => new Map(coaches.map((row) => [row.id, row.name])), [coaches])
  const sessionMap = useMemo(() => new Map(sessions.map((row) => [row.id, row])), [sessions])
  const filtered = filter === 'all' ? claims : claims.filter((claim) => claim.review_status === filter)

  function review(claim: ClaimRow, reviewStatus: string) {
    startTransition(async () => {
      const result = await reviewTrustedClaimAction({ claimId: claim.id, reviewStatus })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(reviewStatus === 'accepted' ? 'Finding reviewed' : 'Finding rejected')
      window.location.reload()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['pending', 'accepted', 'rejected', 'applied', 'all'].map((value) => (
          <button key={value} onClick={() => setFilter(value)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${filter === value ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}>
            {value === 'all' ? 'All' : reviewStatusLabel(value)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((claim) => {
          const source = contactMap.get(claim.contact_id)
          const session = sessionMap.get(claim.session_id)
          const linked = relationships.filter((row) => row.source_claim_id === claim.id || row.target_claim_id === claim.id)
          const mergeTargets = claims.filter((row) => row.id !== claim.id && row.coach_id === claim.coach_id)
          return (
            <article key={claim.id} className="border border-border bg-card p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={claim.statement_type === 'allegation' ? 'danger' : claim.review_status === 'accepted' ? 'success' : 'outline'}>{statementTypeLabel(claim.statement_type)}</Badge>
                    <Badge variant="outline">{evidenceStrengthLabel(claim.evidence_strength)}</Badge>
                    <Badge variant="outline">{externalVisibilityLabel(claim.external_visibility)}</Badge>
                    {claim.fact_check_status === 'requires_legal' && <Badge variant="danger">{factCheckStatusLabel(claim.fact_check_status)}</Badge>}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{claim.claimed_value}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{claim.evidence_summary}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Coach: <Link href={`/coaches/${claim.coach_id}/intelligence`} className="hover:text-primary">{coachMap.get(claim.coach_id) || 'Unlinked'}</Link></span>
                    <span>Source: {source ? <Link href={`/network/${source.id}`} className="hover:text-primary">{source.full_name}</Link> : 'not linked'}</span>
                    <span>Conversation: {session ? <Link href={`/intelligence/conversations?session=${session.id}`} className="hover:text-primary">{session.title}</Link> : 'legacy finding'}</span>
                  </div>
                  {claim.transcript_excerpt && <blockquote className="mt-3 border-l-2 border-border pl-3 text-xs text-muted-foreground">{claim.transcript_excerpt}</blockquote>}
                  {linked.length > 0 && <p className="mt-2 text-xs text-muted-foreground"><GitBranch className="mr-1 inline h-3 w-3" />{linked.length} reviewed finding relationship{linked.length === 1 ? '' : 's'}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {claim.review_status === 'pending' && <>
                    <Button disabled={pending} onClick={() => review(claim, 'accepted')}><Check className="mr-2 h-4 w-4" />Mark reviewed</Button>
                    <Button disabled={pending} variant="outline" onClick={() => review(claim, 'rejected')}><X className="mr-2 h-4 w-4" />Reject</Button>
                  </>}
                </div>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-primary">Edit review fields</summary>
                <form className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" action={(formData) => startTransition(async () => {
                  const result = await reviewTrustedClaimAction({
                    claimId: claim.id,
                    reviewStatus: String(formData.get('review_status')),
                    claimedValue: String(formData.get('claimed_value')),
                    evidenceSummary: String(formData.get('evidence_summary')),
                    statementType: String(formData.get('statement_type')),
                    evidenceStrength: String(formData.get('evidence_strength')),
                    factCheckStatus: String(formData.get('fact_check_status')),
                    externalVisibility: String(formData.get('external_visibility')),
                    criteria: String(formData.get('criteria')).split(',').map((item) => item.trim()).filter(Boolean),
                  })
                  if (!result.ok) { toast.error(result.error); return }
                  toast.success('Finding review saved')
                  window.location.reload()
                })}>
                  <textarea name="claimed_value" defaultValue={claim.claimed_value} className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm" />
                  <textarea name="evidence_summary" defaultValue={claim.evidence_summary} className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm" />
                  <select name="review_status" defaultValue={claim.review_status} className={inputClass}><option value="pending">Pending</option><option value="accepted">Reviewed</option><option value="rejected">Rejected</option><option value="applied">Used in assessment</option></select>
                  <select name="statement_type" defaultValue={claim.statement_type} className={inputClass}><option value="fact">Fact</option><option value="opinion">Opinion</option><option value="analyst_inference">Analyst inference</option><option value="allegation">Allegation</option></select>
                  <select name="evidence_strength" defaultValue={claim.evidence_strength} className={inputClass}><option value="single_source">Single source</option><option value="corroborated">Corroborated</option><option value="disputed">Disputed</option></select>
                  <select name="fact_check_status" defaultValue={claim.fact_check_status} className={inputClass}><option value="not_applicable">N/A</option><option value="unverified">Unverified</option><option value="verified_fact">Verified fact</option><option value="requires_legal">Legal review</option></select>
                  <select name="external_visibility" defaultValue={claim.external_visibility} className={inputClass}><option value="internal_only">Internal only</option><option value="anonymised_external">Anonymised external</option><option value="attributed_external">Attribution approved</option></select>
                  <input name="criteria" defaultValue={(claim.methodology_criteria ?? []).join(', ')} placeholder="Methodology criteria" className="lg:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm" />
                  <div className="lg:col-span-4"><Button disabled={pending}>Save review</Button></div>
                </form>
              </details>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-primary">Split this finding</summary>
                <form className="mt-3 grid gap-3 sm:grid-cols-2" action={(formData) => startTransition(async () => {
                  const result = await splitTrustedClaimAction({ claimId: claim.id, parts: [
                    { claimedValue: String(formData.get('claim_a')), evidenceSummary: String(formData.get('summary_a')) },
                    { claimedValue: String(formData.get('claim_b')), evidenceSummary: String(formData.get('summary_b')) },
                  ] })
                  if (!result.ok) { toast.error(result.error); return }
                  toast.success('Finding split into two review drafts')
                  window.location.reload()
                })}>
                  <input name="claim_a" required placeholder="First narrower finding" className={inputClass} />
                  <input name="summary_a" required placeholder="First evidence summary" className={inputClass} />
                  <input name="claim_b" required placeholder="Second narrower finding" className={inputClass} />
                  <input name="summary_b" required placeholder="Second evidence summary" className={inputClass} />
                  <div className="sm:col-span-2"><Button variant="outline" disabled={pending}><Scissors className="mr-2 h-4 w-4" />Split finding</Button></div>
                </form>
              </details>

              {mergeTargets.length > 0 && <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-primary">Merge overlapping findings</summary>
                <form className="mt-3 grid gap-3 sm:grid-cols-2" action={(formData) => startTransition(async () => {
                  const result = await mergeTrustedClaimsAction({
                    sourceClaimId: claim.id,
                    targetClaimId: String(formData.get('target_claim_id')),
                    claimedValue: String(formData.get('merged_claim')),
                    evidenceSummary: String(formData.get('merged_summary')),
                  })
                  if (!result.ok) { toast.error(result.error); return }
                  toast.success('Findings merged into a new review draft')
                  window.location.reload()
                })}>
                  <select name="target_claim_id" required className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="">Select overlapping finding</option>{mergeTargets.map((row) => <option key={row.id} value={row.id}>{row.claimed_value.slice(0, 100)}</option>)}</select>
                  <input name="merged_claim" required placeholder="Merged assertion" className={inputClass} />
                  <input name="merged_summary" required placeholder="Merged evidence summary" className={inputClass} />
                  <div className="sm:col-span-2"><Button variant="outline" disabled={pending}>Merge findings</Button></div>
                </form>
              </details>}

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-primary">Link corroboration or contradiction</summary>
                <form action={(formData) => startTransition(async () => {
                  const result = await createClaimRelationshipAction(formData)
                  if (!result.ok) { toast.error(result.error); return }
                  toast.success('Finding relationship recorded')
                  window.location.reload()
                })} className="mt-3 grid gap-3 sm:grid-cols-4">
                  <input type="hidden" name="source_claim_id" value={claim.id} />
                  <select name="target_claim_id" required className={`${inputClass} sm:col-span-2`}><option value="">Select another finding</option>{claims.filter((row) => row.id !== claim.id).map((row) => <option key={row.id} value={row.id}>{row.claimed_value.slice(0, 80)}</option>)}</select>
                  <select name="relationship_type" className={inputClass}><option value="corroborates">Corroborates</option><option value="contradicts">Contradicts</option><option value="qualifies">Qualifies</option><option value="supersedes">Supersedes</option><option value="duplicates">Duplicates</option></select>
                  <input name="rationale" required placeholder="Analyst rationale" className={inputClass} />
                  <div className="sm:col-span-4"><Button variant="outline" disabled={pending}>Link findings</Button></div>
                </form>
              </details>
            </article>
          )
        })}
        {!filtered.length && <div className="border border-border bg-card p-10 text-center text-sm text-muted-foreground">No findings in this review state.</div>}
      </div>
    </div>
  )
}
