'use client'

import { useState, useTransition } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FlexibleSelect } from '@/components/ui/flexible-select'
import { createClient } from '@/lib/supabase/client'
import { createIntelligenceSessionAction, type DraftClaimInput } from '../trusted-actions'
import type { EvidenceStrength, ExternalVisibility, FactCheckStatus, MethodologyCriterion, StatementType } from '@/lib/intelligence/trusted-network'

const inputClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary'
const emptyClaim: DraftClaimInput = { claimedValue: '', evidenceSummary: '', statementType: 'opinion', evidenceStrength: 'single_source', factCheckStatus: 'not_applicable', externalVisibility: 'anonymised_external', criteria: [], confidence: null, transcriptExcerpt: null }

export function ConversationCaptureClient({ organizationId, contacts, coaches, defaultCoachId }: { organizationId: string; contacts: Array<{ id: string; full_name: string }>; coaches: Array<{ id: string; name: string }>; defaultCoachId?: string }) {
  const [claims, setClaims] = useState<DraftClaimInput[]>([{ ...emptyClaim }])
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  function updateClaim(index: number, patch: Partial<DraftClaimInput>) { setClaims((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row)) }

  async function submit(formData: FormData) {
    setUploading(Boolean(file))
    let transcriptStoragePath: string | null = null
    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      transcriptStoragePath = `${organizationId}/pending/${crypto.randomUUID()}-${safeName}`
      const { error } = await createClient().storage.from('intelligence-source-files').upload(transcriptStoragePath, file, { upsert: false })
      if (error) { setUploading(false); toast.error(error.message); return }
    }
    setUploading(false)
    startTransition(async () => {
      const criteria = (value: FormDataEntryValue | null) => String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean) as MethodologyCriterion[]
      const result = await createIntelligenceSessionAction({
        title: String(formData.get('title') ?? ''),
        contactId: String(formData.get('contact_id') ?? '') || null,
        coachId: String(formData.get('coach_id') ?? '') || null,
        intakeMethod: String(formData.get('intake_method') ?? 'analyst_notes'),
        occurredAt: String(formData.get('occurred_at') ?? '') || null,
        channel: String(formData.get('channel') ?? '') || null,
        careerContext: String(formData.get('career_context') ?? '') || null,
        consentStatus: String(formData.get('consent_status') ?? 'not_required'),
        transcriptText: String(formData.get('transcript_text') ?? '') || null,
        transcriptStoragePath,
        analystNotes: String(formData.get('analyst_notes') ?? '') || null,
        sensitivity: String(formData.get('sensitivity') ?? 'standard'),
        claims: claims.map((claim, index) => ({ ...claim, criteria: criteria(formData.get(`criteria_${index}`)) })),
      })
      if (!result.ok) { toast.error(result.error); return }
      toast.success('Conversation captured and claim drafts queued for review')
      window.location.reload()
    })
  }

  const defaultCoach = coaches.find((coach) => coach.id === defaultCoachId)
  return <details className="group" open={Boolean(defaultCoach)}><summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-primary"><Plus className="h-4 w-4" />Capture conversation</summary><form action={submit} className="mt-3 space-y-5 border border-border bg-card p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input name="title" required placeholder="Conversation title" className={inputClass} /><select name="contact_id" className={inputClass}><option value="">No source contact linked</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.full_name}</option>)}</select><FlexibleSelect name="coach_id" options={coaches.map((coach) => ({ id: coach.id, label: coach.name }))} defaultValue={defaultCoach?.id} defaultDisplay={defaultCoach?.name} placeholder="Search coach (optional)" noMatchMessage="No coach found" selectionOnly /><select name="intake_method" className={inputClass}><option value="analyst_notes">Analyst notes</option><option value="pasted_transcript">Pasted transcript</option><option value="transcript_document">Transcript document</option></select><input name="occurred_at" type="datetime-local" className={inputClass} /><input name="channel" placeholder="Phone, Zoom, in person…" className={inputClass} /><select name="consent_status" className={inputClass}><option value="not_required">Notes / supplied transcript</option><option value="verbal">Verbal consent recorded</option><option value="written">Written consent recorded</option><option value="pending">Consent pending</option><option value="withdrawn">Consent withdrawn</option></select><select name="sensitivity" className={inputClass}><option value="standard">Standard</option><option value="high">High</option><option value="confidential">Confidential</option><option value="legal_review">Legal review</option></select><input name="career_context" placeholder="Club / career-period context" className="sm:col-span-2 lg:col-span-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /><textarea name="transcript_text" rows={6} placeholder="Paste transcript here" className="sm:col-span-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /><textarea name="analyst_notes" rows={6} placeholder="Analyst notes, follow-ups and context" className="sm:col-span-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /><label className="sm:col-span-2 lg:col-span-4 flex cursor-pointer items-center gap-3 border border-dashed border-border p-3 text-sm text-muted-foreground"><FileText className="h-4 w-4" /><span>{file ? file.name : 'Attach transcript document (PDF, DOC, DOCX or TXT; max 10 MB)'}</span><input type="file" accept=".pdf,.doc,.docx,.txt" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label></div><div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Claim drafts</h3><Button type="button" variant="outline" onClick={() => setClaims((rows) => [...rows, { ...emptyClaim }])}><Plus className="mr-2 h-4 w-4" />Add claim</Button></div>{claims.map((claim, index) => <div key={index} className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4"><textarea required value={claim.claimedValue} onChange={(event) => updateClaim(index, { claimedValue: event.target.value })} placeholder="Structured assertion" className="sm:col-span-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /><textarea required value={claim.evidenceSummary} onChange={(event) => updateClaim(index, { evidenceSummary: event.target.value })} placeholder="Evidence summary and context" className="sm:col-span-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /><select value={claim.statementType} onChange={(event) => updateClaim(index, { statementType: event.target.value as StatementType })} className={inputClass}><option value="fact">Fact</option><option value="opinion">Opinion</option><option value="analyst_inference">Analyst inference</option><option value="allegation">Allegation</option></select><select value={claim.evidenceStrength} onChange={(event) => updateClaim(index, { evidenceStrength: event.target.value as EvidenceStrength })} className={inputClass}><option value="single_source">Single source</option><option value="corroborated">Corroborated</option><option value="disputed">Disputed</option></select><select value={claim.factCheckStatus} onChange={(event) => updateClaim(index, { factCheckStatus: event.target.value as FactCheckStatus })} className={inputClass}><option value="not_applicable">Fact check N/A</option><option value="unverified">Unverified fact</option><option value="verified_fact">Verified fact</option><option value="requires_legal">Requires legal review</option></select><select value={claim.externalVisibility} onChange={(event) => updateClaim(index, { externalVisibility: event.target.value as ExternalVisibility })} className={inputClass}><option value="internal_only">Internal only</option><option value="anonymised_external">Anonymised external</option><option value="attributed_external">Attribution approved</option></select><input name={`criteria_${index}`} placeholder="Criteria keys, comma separated" className="sm:col-span-2 lg:col-span-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /><Button type="button" variant="ghost" disabled={claims.length === 1} onClick={() => setClaims((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="mr-2 h-4 w-4" />Remove</Button></div>)}</div><div className="flex justify-end"><Button disabled={pending || uploading}>{uploading ? 'Uploading…' : pending ? 'Saving…' : 'Save conversation and drafts'}</Button></div></form></details>
}
