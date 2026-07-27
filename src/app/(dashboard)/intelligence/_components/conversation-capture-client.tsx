'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Check, ChevronLeft, ChevronRight, FileText, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FlexibleSelect } from '@/components/ui/flexible-select'
import { ASSESSMENT_CRITERIA } from '@/lib/assessment/criteria'
import { createClient } from '@/lib/supabase/client'
import {
  createIntelligenceSessionAction,
  type DraftClaimInput,
} from '../trusted-actions'
import type {
  EvidenceStrength,
  ExternalVisibility,
  FactCheckStatus,
  MethodologyCriterion,
  StatementType,
} from '@/lib/intelligence/trusted-network'

const inputClass =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary'
const textareaClass =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary'

type CaptureStep = 1 | 2 | 3

type DraftFinding = DraftClaimInput & { localId: string }

type ConversationDraft = {
  title: string
  contactId: string
  coachId: string
  intakeMethod: string
  occurredAt: string
  channel: string
  careerContext: string
  consentStatus: string
  transcriptText: string
  analystNotes: string
  sensitivity: string
  claims: DraftFinding[]
  step: CaptureStep
}

function newFinding(): DraftFinding {
  return {
    localId: crypto.randomUUID(),
    claimedValue: '',
    evidenceSummary: '',
    statementType: 'opinion',
    evidenceStrength: 'single_source',
    factCheckStatus: 'not_applicable',
    externalVisibility: 'anonymised_external',
    criteria: [],
    confidence: null,
    transcriptExcerpt: null,
  }
}

function initialDraft(defaultCoachId?: string, defaultContactId?: string): ConversationDraft {
  return {
    title: '',
    contactId: defaultContactId ?? '',
    coachId: defaultCoachId ?? '',
    intakeMethod: 'analyst_notes',
    occurredAt: '',
    channel: '',
    careerContext: '',
    consentStatus: 'not_required',
    transcriptText: '',
    analystNotes: '',
    sensitivity: 'standard',
    claims: [],
    step: 1,
  }
}

const STEP_LABELS: Array<{ step: CaptureStep; label: string }> = [
  { step: 1, label: 'Conversation' },
  { step: 2, label: 'Notes' },
  { step: 3, label: 'Findings' },
]

export function ConversationCaptureClient({
  organizationId,
  contacts,
  coaches,
  defaultCoachId,
  defaultContactId,
}: {
  organizationId: string
  contacts: Array<{ id: string; full_name: string }>
  coaches: Array<{ id: string; name: string }>
  defaultCoachId?: string
  defaultContactId?: string
}) {
  const draftKey = `coach-first:conversation-draft:${organizationId}`
  const [draft, setDraft] = useState<ConversationDraft>(() =>
    initialDraft(defaultCoachId, defaultContactId)
  )
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ConversationDraft
        setDraft({
          ...initialDraft(defaultCoachId, defaultContactId),
          ...parsed,
          coachId: defaultCoachId ?? parsed.coachId ?? '',
          contactId: defaultContactId ?? parsed.contactId ?? '',
          claims: (parsed.claims ?? []).map((claim) => ({
            ...claim,
            localId: claim.localId || crypto.randomUUID(),
          })),
        })
      } catch {
        window.localStorage.removeItem(draftKey)
      }
    }
    setDraftLoaded(true)
  }, [defaultCoachId, defaultContactId, draftKey])

  useEffect(() => {
    if (!draftLoaded) return
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(draftKey, JSON.stringify(draft))
      setDraftSavedAt(
        new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date())
      )
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [draft, draftKey, draftLoaded])

  const canContinueFromConversation = Boolean(
    draft.title.trim() && draft.occurredAt && draft.contactId
  )
  const hasSourceMaterial = Boolean(
    draft.transcriptText.trim() || draft.analystNotes.trim() || file
  )
  const completeClaims = draft.claims.filter(
    (claim) => claim.claimedValue.trim() && claim.evidenceSummary.trim()
  )
  const incompleteClaim = draft.claims.some(
    (claim) =>
      Boolean(claim.claimedValue.trim()) !== Boolean(claim.evidenceSummary.trim())
  )

  const coachLabel = useMemo(
    () => coaches.find((coach) => coach.id === draft.coachId)?.name,
    [coaches, draft.coachId]
  )

  function patchDraft(patch: Partial<ConversationDraft>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function updateClaim(localId: string, patch: Partial<DraftFinding>) {
    setDraft((current) => ({
      ...current,
      claims: current.claims.map((claim) =>
        claim.localId === localId ? { ...claim, ...patch } : claim
      ),
    }))
  }

  function goToStep(step: CaptureStep) {
    if (step > 1 && !canContinueFromConversation) {
      toast.error('Add a title, source contact and conversation date first.')
      return
    }
    patchDraft({ step })
  }

  function clearDraft() {
    window.localStorage.removeItem(draftKey)
    setDraft(initialDraft(defaultCoachId, defaultContactId))
    setFile(null)
    setDraftSavedAt(null)
  }

  async function submit() {
    if (!canContinueFromConversation) {
      goToStep(1)
      return
    }
    if (!hasSourceMaterial) {
      goToStep(2)
      toast.error('Add analyst notes, a transcript or a transcript document.')
      return
    }
    if (incompleteClaim) {
      toast.error('Complete or remove the unfinished finding.')
      return
    }
    if (completeClaims.length > 0 && !draft.coachId) {
      goToStep(1)
      toast.error('Link a coach before creating findings.')
      return
    }

    setUploading(Boolean(file))
    let transcriptStoragePath: string | null = null
    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      transcriptStoragePath = `${organizationId}/pending/${crypto.randomUUID()}-${safeName}`
      const { error } = await createClient()
        .storage
        .from('intelligence-source-files')
        .upload(transcriptStoragePath, file, { upsert: false })
      if (error) {
        setUploading(false)
        toast.error(error.message)
        return
      }
    }
    setUploading(false)

    startTransition(async () => {
      const result = await createIntelligenceSessionAction({
        title: draft.title,
        contactId: draft.contactId || null,
        coachId: draft.coachId || null,
        intakeMethod: draft.intakeMethod,
        occurredAt: draft.occurredAt || null,
        channel: draft.channel || null,
        careerContext: draft.careerContext || null,
        consentStatus: draft.consentStatus,
        transcriptText: draft.transcriptText || null,
        transcriptStoragePath,
        analystNotes: draft.analystNotes || null,
        sensitivity: draft.sensitivity,
        claims: completeClaims.map((claim) => ({
          claimedValue: claim.claimedValue,
          evidenceSummary: claim.evidenceSummary,
          statementType: claim.statementType,
          evidenceStrength: claim.evidenceStrength,
          factCheckStatus: claim.factCheckStatus,
          externalVisibility: claim.externalVisibility,
          criteria: claim.criteria,
          confidence: claim.confidence,
          transcriptExcerpt: claim.transcriptExcerpt,
        })),
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      window.localStorage.removeItem(draftKey)
      toast.success(
        completeClaims.length
          ? 'Conversation saved and findings sent to review'
          : 'Conversation saved. Findings can be added during review.'
      )
      window.location.reload()
    })
  }

  return (
    <details
      className="group"
      open={Boolean(defaultCoachId || defaultContactId)}
    >
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-primary">
        <Plus className="h-4 w-4" />
        Log conversation
      </summary>
      <div className="mt-3 border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {STEP_LABELS.map(({ step, label }) => (
              <button
                key={step}
                type="button"
                onClick={() => goToStep(step)}
                className={`inline-flex h-8 shrink-0 items-center gap-2 rounded px-3 text-xs font-medium ${
                  draft.step === step
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="tabular-nums">{step}</span>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground sm:justify-end">
            <span>{draftSavedAt ? `Draft saved ${draftSavedAt}` : 'Draft saves on this device'}</span>
            <button type="button" onClick={clearDraft} className="hover:text-foreground">
              Clear draft
            </button>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          className="space-y-5 p-4"
        >
          {draft.step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold">Who did we speak to?</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Record the source and football context before interpreting what was said.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium">Conversation title</span>
                  <input
                    required
                    value={draft.title}
                    onChange={(event) => patchDraft({ title: event.target.value })}
                    placeholder="Agent call: availability and staff plan"
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium">Source contact</span>
                  <select
                    required
                    value={draft.contactId}
                    onChange={(event) => patchDraft({ contactId: event.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select trusted source…</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.full_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium">Coach discussed</span>
                  <FlexibleSelect
                    options={coaches.map((coach) => ({ id: coach.id, label: coach.name }))}
                    value={draft.coachId}
                    onChange={(coachId) => patchDraft({ coachId })}
                    placeholder="Search coach (optional)"
                    noMatchMessage="No coach found"
                    selectionOnly
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium">Date and time</span>
                  <input
                    required
                    type="datetime-local"
                    value={draft.occurredAt}
                    onChange={(event) => patchDraft({ occurredAt: event.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium">Channel</span>
                  <input
                    value={draft.channel}
                    onChange={(event) => patchDraft({ channel: event.target.value })}
                    placeholder="Phone, Zoom, in person"
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium">Intake method</span>
                  <select
                    value={draft.intakeMethod}
                    onChange={(event) => patchDraft({ intakeMethod: event.target.value })}
                    className={inputClass}
                  >
                    <option value="analyst_notes">Analyst notes</option>
                    <option value="pasted_transcript">Pasted transcript</option>
                    <option value="transcript_document">Transcript document</option>
                  </select>
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-medium">Career-period context</span>
                  <input
                    value={draft.careerContext}
                    onChange={(event) => patchDraft({ careerContext: event.target.value })}
                    placeholder="Club, role and period the source knows first-hand"
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          )}

          {draft.step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold">What was said?</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Keep raw source material separate from the findings you will review.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <textarea
                  rows={8}
                  value={draft.transcriptText}
                  onChange={(event) => patchDraft({ transcriptText: event.target.value })}
                  placeholder="Paste the supplied transcript or relevant source notes"
                  className={textareaClass}
                />
                <textarea
                  rows={8}
                  value={draft.analystNotes}
                  onChange={(event) => patchDraft({ analystNotes: event.target.value })}
                  placeholder="Analyst context, follow-ups and points to test"
                  className={textareaClass}
                />
                <label className="flex cursor-pointer items-center gap-3 border border-dashed border-border p-3 text-sm text-muted-foreground sm:col-span-2">
                  <FileText className="h-4 w-4" />
                  <span>
                    {file
                      ? file.name
                      : 'Attach transcript document (PDF, DOC, DOCX or TXT; max 10 MB)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="sr-only"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <details className="border-t border-border pt-3">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                  Consent and sensitivity
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-medium">Consent record</span>
                    <select
                      value={draft.consentStatus}
                      onChange={(event) => patchDraft({ consentStatus: event.target.value })}
                      className={inputClass}
                    >
                      <option value="not_required">Notes / supplied transcript</option>
                      <option value="verbal">Verbal consent recorded</option>
                      <option value="written">Written consent recorded</option>
                      <option value="pending">Consent pending</option>
                      <option value="withdrawn">Consent withdrawn</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium">Sensitivity</span>
                    <select
                      value={draft.sensitivity}
                      onChange={(event) => patchDraft({ sensitivity: event.target.value })}
                      className={inputClass}
                    >
                      <option value="standard">Standard</option>
                      <option value="high">High</option>
                      <option value="confidential">Confidential</option>
                      <option value="legal_review">Legal review</option>
                    </select>
                  </label>
                </div>
              </details>
            </div>
          )}

          {draft.step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Draft findings</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Optional at capture. Every finding remains pending until an analyst reviews it.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    patchDraft({ claims: [...draft.claims, newFinding()] })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add finding
                </Button>
              </div>

              {draft.claims.length === 0 && (
                <div className="border border-dashed border-border px-4 py-8 text-center">
                  <p className="text-sm font-medium">No findings drafted yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Save the conversation now and extract findings from the Review screen later.
                  </p>
                </div>
              )}

              {draft.claims.map((claim, index) => (
                <section
                  key={claim.localId}
                  className="space-y-3 border border-border bg-background p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold">Finding {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        patchDraft({
                          claims: draft.claims.filter(
                            (row) => row.localId !== claim.localId
                          ),
                        })
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <textarea
                      value={claim.claimedValue}
                      onChange={(event) =>
                        updateClaim(claim.localId, {
                          claimedValue: event.target.value,
                        })
                      }
                      placeholder="What did we learn?"
                      className={textareaClass}
                    />
                    <textarea
                      value={claim.evidenceSummary}
                      onChange={(event) =>
                        updateClaim(claim.localId, {
                          evidenceSummary: event.target.value,
                        })
                      }
                      placeholder="Why does the source believe this? Add context."
                      className={textareaClass}
                    />
                  </div>
                  <fieldset>
                    <legend className="mb-2 text-xs font-medium">
                      Assessment areas
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {ASSESSMENT_CRITERIA.map((criterion) => {
                        const checked = claim.criteria.includes(
                          criterion.key as MethodologyCriterion
                        )
                        return (
                          <label
                            key={criterion.key}
                            className={`inline-flex cursor-pointer items-center gap-2 rounded border px-2.5 py-1.5 text-xs ${
                              checked
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() =>
                                updateClaim(claim.localId, {
                                  criteria: checked
                                    ? claim.criteria.filter(
                                        (key) => key !== criterion.key
                                      )
                                    : [
                                        ...claim.criteria,
                                        criterion.key as MethodologyCriterion,
                                      ],
                                })
                              }
                            />
                            {checked && <Check className="h-3 w-3" />}
                            {criterion.label}
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                  <details className="border-t border-border pt-3">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                      Finding safeguards and provenance
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <select
                        value={claim.statementType}
                        onChange={(event) =>
                          updateClaim(claim.localId, {
                            statementType: event.target.value as StatementType,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="fact">Fact</option>
                        <option value="opinion">Opinion</option>
                        <option value="analyst_inference">Analyst inference</option>
                        <option value="allegation">Allegation</option>
                      </select>
                      <select
                        value={claim.evidenceStrength}
                        onChange={(event) =>
                          updateClaim(claim.localId, {
                            evidenceStrength: event.target.value as EvidenceStrength,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="single_source">Single source</option>
                        <option value="corroborated">Corroborated</option>
                        <option value="disputed">Disputed</option>
                      </select>
                      <select
                        value={claim.factCheckStatus}
                        onChange={(event) =>
                          updateClaim(claim.localId, {
                            factCheckStatus: event.target.value as FactCheckStatus,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="not_applicable">Fact check N/A</option>
                        <option value="unverified">Unverified fact</option>
                        <option value="verified_fact">Verified fact</option>
                        <option value="requires_legal">Requires legal review</option>
                      </select>
                      <select
                        value={claim.externalVisibility}
                        onChange={(event) =>
                          updateClaim(claim.localId, {
                            externalVisibility: event.target.value as ExternalVisibility,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="internal_only">Internal only</option>
                        <option value="anonymised_external">Anonymised external</option>
                        <option value="attributed_external">Attribution approved</option>
                      </select>
                    </div>
                  </details>
                </section>
              ))}
            </div>
          )}

          <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-border bg-card px-4 py-3 sm:static sm:mx-0 sm:mb-0 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="text-xs text-muted-foreground">
              {draft.step === 3
                ? `${coachLabel ?? 'No coach linked'} · ${completeClaims.length} finding${completeClaims.length === 1 ? '' : 's'} ready`
                : 'Raw material stays internal until findings are reviewed.'}
            </div>
            <div className="flex items-center justify-end gap-2">
              {draft.step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToStep((draft.step - 1) as CaptureStep)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {draft.step < 3 ? (
                <Button
                  type="button"
                  onClick={() => goToStep((draft.step + 1) as CaptureStep)}
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={pending || uploading}>
                  {uploading
                    ? 'Uploading…'
                    : pending
                      ? 'Saving…'
                      : 'Save conversation'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </details>
  )
}
