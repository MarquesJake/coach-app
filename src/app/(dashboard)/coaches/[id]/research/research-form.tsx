'use client'

import { researchAreaLabel, evidenceLabel } from '@/lib/display-copy'
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { readResearchContext, researchHref } from '@/lib/research-context'
import { RESEARCH_DOMAINS, RESEARCH_PROMPTS, evidenceStatus } from '@/lib/decision-workflow'
import type { Database } from '@/lib/types/database'
import { saveResearchQuestion } from './actions'
import type { ResearchTemplate } from '@/lib/coach-research-guide'
import { COACH_RESEARCH_GUIDE } from '@/lib/coach-research-guide'
import { EVIDENCE_METHODS } from '@/lib/assessment/criteria'

type Question = Database['public']['Tables']['coach_research_questions']['Row']
export type FindingOption = { id: string; claimed_value: string; source_name: string | null; verification_status: string; occurred_at: string | null; evidence_summary: string | null }
const control = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm'

export function ResearchForm({ coachId, row, findings, mandates, initialDomain, initialMandate, initialTemplate }: { coachId: string; row?: Question; findings: FindingOption[]; mandates: { id: string; name: string }[]; initialDomain?: string; initialMandate?: string; initialTemplate?: ResearchTemplate }) {
  const router = useRouter()
  const context = readResearchContext(useSearchParams())
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<{ error?: string; success?: string }>({})
  const domain = (RESEARCH_DOMAINS as readonly string[]).includes(initialDomain ?? '') ? initialDomain : RESEARCH_DOMAINS[0]
  return <form className="space-y-4" onSubmit={event => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form)
    start(async () => {
      try {
        const result = await saveResearchQuestion(data); setMessage(result)
        if (result.success) {
          if (!row) form.reset()
          router.replace(researchHref(`/coaches/${coachId}/research${result.mandateId ? '' : '?scope=general'}#question-${result.id}`, {
            ...context, coach: coachId, mandate: result.mandateId ?? undefined, question: result.id,
            scope: result.mandateId ? undefined : 'general',
            briefVersion: result.mandateId === context.mandate ? context.briefVersion : undefined,
          }))
          router.refresh()
        }
      } catch { setMessage({ error: 'The save could not be confirmed. Your entries are kept; reload research before retrying.' }) }
    })
  }}>
    <input type="hidden" name="coach_id" value={coachId} /><input type="hidden" name="id" value={row?.id ?? ''} /><input type="hidden" name="version" value={row?.version ?? 1} />
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm">Assessment area<select name="assessment_area" defaultValue={row ? row.assessment_area ?? '' : initialTemplate?.criterion ?? ''} className={control}><option value="">Not assigned yet</option>{COACH_RESEARCH_GUIDE.map(a => <option key={a.criterion} value={a.criterion}>{a.title}</option>)}</select><span className="mt-1 block text-xs text-muted-foreground">Places the answer in the relevant part of the coach profile. Choose the main area this question addresses.</span></label>
      <label className="text-sm">Research theme<select name="domain" defaultValue={row?.domain ?? initialTemplate?.domain ?? domain} className={control}>{RESEARCH_DOMAINS.map(d => <option key={d} value={d}>{researchAreaLabel(d)}</option>)}</select></label>
      <label className="text-sm">Appointment<select name="mandate_id" defaultValue={row?.mandate_id ?? initialMandate ?? ''} className={control}><option value="">General coach research</option>{mandates.map(m => <option value={m.id} key={m.id}>{m.name}</option>)}</select></label>
    </div>
    <label className="block text-sm">Question<textarea required minLength={8} maxLength={2000} name="question" defaultValue={row?.question ?? initialTemplate?.question ?? (initialDomain ? RESEARCH_PROMPTS[domain as keyof typeof RESEARCH_PROMPTS] : '')} placeholder="What could change our view of this appointment?" rows={2} className={control} /></label>
    <label className="block text-sm">Why this matters<textarea required maxLength={4000} name="decision_impact" defaultValue={row?.decision_impact ?? initialTemplate?.impact} placeholder="Which requirement, concern or appointment condition depends on this answer?" rows={2} className={control} /></label>
    <label className="block text-sm">How we’ll check<textarea maxLength={4000} name="source_plan" defaultValue={row?.source_plan ?? initialTemplate?.sourcePlan} placeholder="Who has first-hand knowledge? What independent account or dated material would challenge it?" rows={2} className={control} /></label>
    <div className="grid gap-4 sm:grid-cols-3"><label className="text-sm">Owner<input name="owner" maxLength={200} defaultValue={row?.owner} className={control} placeholder="Responsible researcher" /></label><label className="text-sm">Review due<input type="date" name="due_on" defaultValue={row?.due_on ?? ''} className={control} /></label><label className="text-sm">Progress<select name="status" defaultValue={row?.status ?? 'open'} className={control}><option value="open">Open question</option><option value="in_progress">Research in progress</option><option value="answered">Answer recorded</option></select></label></div>
    <details open={Boolean(row?.answer)} className="rounded-lg border border-border p-4"><summary className="cursor-pointer text-sm font-medium">Assessment and sources</summary><div className="mt-4 space-y-4">
      <fieldset><legend className="text-sm font-medium">Evidence methods used</legend><p className="mt-1 text-xs text-muted-foreground">Select only methods represented by the findings you link below. Planned interviews and observations belong in “How we’ll check”.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{EVIDENCE_METHODS.map(m => <label key={m.key} className="flex gap-2 text-sm"><input type="checkbox" name="evidence_methods" value={m.key} defaultChecked={row?.evidence_methods?.includes(m.key) ?? false}/>{m.key === 'ai_generated' ? 'AI-assisted synthesis (requires source review)' : m.label}</label>)}</div></fieldset>
      <label className="block text-sm">Current assessment<textarea name="answer" maxLength={12000} defaultValue={row?.answer} rows={4} className={control} placeholder="What does the evidence support? In which context? What would change this conclusion?" /></label>
      <label className="block text-sm">Conflicting accounts and coach response<textarea name="counter_evidence" maxLength={8000} defaultValue={row?.counter_evidence} rows={3} className={control} placeholder="Preserve the strongest counterargument and unresolved differences." /></label>
      <fieldset><legend className="text-sm font-medium">Linked findings</legend><p className="mb-2 text-xs text-muted-foreground">Link findings that support or challenge your assessment. Saving an answer does not approve it for sharing.</p>{findings.length ? findings.map(f => <label key={f.id} className="my-2 flex gap-3 rounded border border-border p-3 text-sm"><input type="checkbox" name="evidence_claim_ids" value={f.id} defaultChecked={row?.evidence_claim_ids.includes(f.id)} /><span>{f.claimed_value}<small className="mt-1 block text-muted-foreground">{f.source_name || 'Source missing'} · {evidenceLabel(evidenceStatus(f))} · {f.occurred_at?.slice(0,10) || 'Undated'}</small></span></label>) : <p className="text-sm text-muted-foreground">No findings yet. Save the question, then capture a conversation or source in Intelligence.</p>}</fieldset>
    </div></details>
    {message.error && <p role="alert" className="text-sm text-destructive">{message.error}</p>}{message.success && <p role="status" className="text-sm text-primary">{message.success}</p>}
    <button disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? 'Saving…' : row ? 'Save changes' : 'Add research question'}</button>
  </form>
}
