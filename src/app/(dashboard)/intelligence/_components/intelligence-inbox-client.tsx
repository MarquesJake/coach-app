'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, ClipboardList, FileInput, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toastError, toastSuccess } from '@/lib/ui/toast'
import {
  COMMERCIAL_SURFACES,
  DESTINATIONS,
  INBOX_CRITERIA_OPTIONS,
  INBOX_EVIDENCE_METHOD_OPTIONS,
  INBOX_REVIEW_STATUSES,
  INTAKE_TYPES,
  SENSITIVITY_LEVELS,
  SOURCE_TIERS,
  SOURCE_TYPES,
  VERIFICATION_STATUSES,
  optionLabel,
} from '@/lib/intelligence/inbox'
import {
  createIntelligenceInboxItemAction,
  promoteIntelligenceInboxItemAction,
  updateIntelligenceInboxStatusAction,
} from '../actions'

export type IntelligenceInboxItem = {
  id: string
  intake_type: string
  headline: string
  raw_detail: string | null
  extracted_signal: string | null
  source_type: string
  source_name: string | null
  source_tier: string | null
  source_link: string | null
  source_recorded_at: string | null
  source_expires_at: string | null
  source_proximity: string | null
  board_visibility: string
  contradiction_status: string
  channel: string | null
  sensitivity: string
  verification_status: string
  review_status: string
  confidence: number | null
  direction: string | null
  methodology_criteria: string[]
  evidence_methods: string[]
  entity_type: string | null
  entity_id: string | null
  coach_id: string | null
  club_id: string | null
  mandate_id: string | null
  agent_id: string | null
  coach_name?: string | null
  club_name?: string | null
  mandate_label?: string | null
  agent_name?: string | null
  suggested_destination: string
  destination_record_type: string | null
  destination_record_id: string | null
  commercial_surface: string
  analyst_notes: string | null
  next_action: string | null
  due_date: string | null
  promoted_at: string | null
  created_at: string
}

type Option = { id: string; name: string }
type Props = {
  items: IntelligenceInboxItem[]
  coaches: Option[]
  clubs: Option[]
  agents: Option[]
  mandates: { id: string; label: string }[]
}

const STATUS_CLASS: Record<string, string> = {
  captured: 'border-slate-500/25 bg-slate-500/10 text-slate-200',
  triage: 'border-sky-500/25 bg-sky-500/10 text-sky-200',
  needs_verification: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
  ready_to_promote: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
  promoted: 'border-primary/25 bg-primary/10 text-primary',
  archived: 'border-muted bg-muted/30 text-muted-foreground',
}

const DESTINATION_HELP: Record<string, string> = {
  intelligence_item: 'Turns messy notes into a clean searchable intelligence signal.',
  profile_claim: 'Should become a source-backed profile claim before touching the coach record.',
  assessment_evidence: 'Should support one of the 9 assessment criteria for a live mandate.',
  private_material: 'Should live in the confidential coach material layer.',
  agent_interaction: 'Should be logged as a relationship/conversation record.',
  reference_answer: 'Should be captured through the structured reference process.',
  interview_answer: 'Should be captured through the structured interview process.',
  watch_only: 'Useful context, but not enough to affect recommendation or profile.',
}

const DESTINATION_ACTION_LABEL: Record<string, string> = {
  intelligence_item: 'Promote to feed',
  profile_claim: 'Create profile claim',
  assessment_evidence: 'Create assessment evidence',
  private_material: 'Create confidential material',
  agent_interaction: 'Create agent interaction',
  reference_answer: 'Use reference form',
  interview_answer: 'Use interview form',
  watch_only: 'Keep as watch item',
}

const ONE_CLICK_DESTINATIONS = new Set([
  'intelligence_item',
  'profile_claim',
  'assessment_evidence',
  'private_material',
  'agent_interaction',
])

const CAPTURE_PLAYBOOK = [
  {
    title: 'Agent route',
    detail: 'Availability, appetite, compensation range, release clause, staff likely to follow.',
    destination: 'Profile claim or agent interaction',
  },
  {
    title: 'Football reference',
    detail: 'What the coach is like on the grass, dressing-room credibility, pressure behaviour.',
    destination: 'Reference form, then assessment evidence',
  },
  {
    title: 'Coach material',
    detail: 'Game model deck, training week, session clips, player-development examples.',
    destination: 'Confidential material',
  },
  {
    title: 'Public signal',
    detail: 'Interview, podcast, press conference, journalist note, social/media sentiment.',
    destination: 'Intelligence feed or profile claim',
  },
] as const

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function entityLabel(item: IntelligenceInboxItem) {
  if (item.coach_name) return item.coach_name
  if (item.club_name) return item.club_name
  if (item.mandate_label) return item.mandate_label
  if (item.agent_name) return item.agent_name
  return 'Unlinked'
}

function destinationHref(item: IntelligenceInboxItem) {
  if (item.destination_record_type === 'intelligence_items' && item.destination_record_id) {
    if (item.entity_type === 'coach' && item.entity_id) return `/coaches/${item.entity_id}/intelligence?entry=${item.destination_record_id}`
    return `/intelligence?entry=${item.destination_record_id}`
  }
  if (item.destination_record_type === 'profile_claims' && item.destination_record_id && item.coach_id) return `/coaches/${item.coach_id}#claim-${item.destination_record_id}`
  if (item.destination_record_type === 'assessment_evidence' && item.destination_record_id && item.coach_id && item.mandate_id) {
    const criterion = item.methodology_criteria[0] ?? 'coach_profile'
    return `/mandates/${item.mandate_id}/assessment/${item.coach_id}?criterion=${criterion}&evidence=${item.destination_record_id}`
  }
  if (item.destination_record_type === 'coach_private_materials' && item.destination_record_id && item.coach_id) return `/coach-portal/${item.coach_id}#material-${item.destination_record_id}`
  if (item.destination_record_type === 'agent_interactions' && item.destination_record_id && item.agent_id) return `/agents/${item.agent_id}/interactions?entry=${item.destination_record_id}`
  if (item.coach_id) return `/coaches/${item.coach_id}`
  if (item.club_id) return `/clubs/${item.club_id}`
  if (item.mandate_id) return `/mandates/${item.mandate_id}`
  if (item.agent_id) return `/agents/${item.agent_id}/interactions`
  return null
}

export function IntelligenceInboxClient({ items, coaches, clubs, agents, mandates }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEntity = searchParams.get('entity')
  const initialSourceType = searchParams.get('sourceType')
  const initialSourceTier = searchParams.get('sourceTier')
  const initialSensitivity = searchParams.get('sensitivity')
  const [showForm, setShowForm] = useState(Boolean(searchParams.get('headline') || searchParams.get('clubId') || searchParams.get('coachId')))
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('open')
  const [typeFilter, setTypeFilter] = useState('')
  const [entityMode, setEntityMode] = useState<'coach' | 'club' | 'mandate' | 'agent' | 'none'>(
    initialEntity === 'club' || initialEntity === 'mandate' || initialEntity === 'agent' || initialEntity === 'none'
      ? initialEntity
      : 'coach'
  )
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([])
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  const [form, setForm] = useState({
    intake_type: searchParams.get('intake') || 'agent_call',
    headline: searchParams.get('headline') || '',
    raw_detail: '',
    extracted_signal: '',
    source_type: initialSourceType && SOURCE_TYPES.some((type) => type.key === initialSourceType) ? initialSourceType : 'agent',
    source_name: '',
    source_tier: initialSourceTier && SOURCE_TIERS.some((tier) => tier.key === initialSourceTier) ? initialSourceTier : '2',
    source_link: '',
    source_recorded_at: new Date().toISOString().slice(0, 16),
    source_expires_at: '',
    source_proximity: '',
    board_visibility: 'internal_only',
    contradiction_status: 'none',
    channel: '',
    sensitivity: initialSensitivity && SENSITIVITY_LEVELS.some((level) => level.key === initialSensitivity) ? initialSensitivity : 'standard',
    verification_status: 'single_source',
    review_status: 'triage',
    confidence: '',
    direction: '',
    coach_id: searchParams.get('coachId') || '',
    club_id: searchParams.get('clubId') || '',
    mandate_id: searchParams.get('mandateId') || '',
    agent_id: searchParams.get('agentId') || '',
    suggested_destination: searchParams.get('destination') || 'intelligence_item',
    commercial_surface: 'subscription_intelligence',
    analyst_notes: '',
    next_action: '',
    due_date: '',
  })

  const filtered = useMemo(() => {
    let output = items
    if (statusFilter === 'open') output = output.filter((item) => !['promoted', 'archived'].includes(item.review_status))
    else if (statusFilter) output = output.filter((item) => item.review_status === statusFilter)
    if (typeFilter) output = output.filter((item) => item.intake_type === typeFilter)
    return output
  }, [items, statusFilter, typeFilter])

  const openCount = items.filter((item) => !['promoted', 'archived'].includes(item.review_status)).length
  const readyCount = items.filter((item) => item.review_status === 'ready_to_promote').length
  const promotedCount = items.filter((item) => item.review_status === 'promoted').length
  const confidentialCount = items.filter((item) => ['high', 'confidential', 'legal_review'].includes(item.sensitivity)).length

  const entityOptions = entityMode === 'coach' ? coaches
    : entityMode === 'club' ? clubs
      : entityMode === 'agent' ? agents
        : entityMode === 'mandate' ? mandates.map((mandate) => ({ id: mandate.id, name: mandate.label }))
          : []

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggle(value: string, setter: (values: string[]) => void, current: string[]) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  async function createInboxItem() {
    if (!form.headline.trim()) {
      toastError('Headline is required')
      return
    }
    setSubmitting(true)
    const result = await createIntelligenceInboxItemAction({
      ...form,
      confidence: form.confidence ? Number.parseInt(form.confidence, 10) : null,
      methodology_criteria: selectedCriteria,
      evidence_methods: selectedMethods,
      coach_id: entityMode === 'coach' ? form.coach_id : null,
      club_id: entityMode === 'club' ? form.club_id : null,
      mandate_id: entityMode === 'mandate' ? form.mandate_id : null,
      agent_id: entityMode === 'agent' ? form.agent_id : null,
      source_recorded_at: form.source_recorded_at ? new Date(form.source_recorded_at).toISOString() : null,
      source_expires_at: form.source_expires_at ? new Date(form.source_expires_at).toISOString() : null,
    })
    setSubmitting(false)
    if (result.error) {
      toastError(result.error)
      return
    }
    toastSuccess('Intelligence captured')
    setShowForm(false)
    setSelectedCriteria([])
    setSelectedMethods([])
    setForm((current) => ({ ...current, headline: '', raw_detail: '', extracted_signal: '', analyst_notes: '', next_action: '' }))
    router.refresh()
  }

  async function updateStatus(id: string, review_status: string) {
    const result = await updateIntelligenceInboxStatusAction({ id, review_status })
    if (!result.ok) {
      toastError(result.error ?? 'Failed to update inbox status')
      return
    }
    toastSuccess('Inbox status updated')
    router.refresh()
  }

  async function promote(id: string, destination: string) {
    const result = await promoteIntelligenceInboxItemAction({ id, destination })
    if (!result.ok) {
      toastError(result.error ?? 'Failed to promote inbox item')
      return
    }
    toastSuccess('Inbox item promoted')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-card px-5 py-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <FileInput className="h-3 w-3" />
              Capture once, route everywhere
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Intelligence Inbox</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Drop in agent calls, reference notes, meeting transcripts, coach uploads, media clips and future data imports. Review the source, map it to the methodology, then promote only what strengthens or qualifies the appointment recommendation.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Open items" value={openCount} />
              <Metric label="Ready to promote" value={readyCount} />
              <Metric label="Promoted" value={promotedCount} />
              <Metric label="Sensitive" value={confidentialCount} />
            </div>
          </div>
          <div className="rounded-md border border-border bg-background/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Why this matters</p>
            <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
              <p>Public data gets a club to a shortlist. Private football intelligence explains whether the coach can actually work in that environment.</p>
              <p>The inbox keeps that judgement auditable: who said it, how close they are, how sensitive it is, and where it should surface.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {INTAKE_TYPES.slice(0, 8).map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() => {
              update('intake_type', type.key)
              setShowForm(true)
            }}
            className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
          >
            <p className="text-sm font-semibold text-foreground">{type.label}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{type.description}</p>
          </button>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Review queue</p>
              <h2 className="mt-1 text-base font-semibold text-foreground">{filtered.length} intelligence items</h2>
            </div>
            <Button onClick={() => setShowForm(true)} className="text-xs">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
              Capture intelligence
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
              <option value="open">Open queue</option>
              <option value="">All statuses</option>
              {INBOX_REVIEW_STATUSES.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
              <option value="">All intake types</option>
              {INTAKE_TYPES.map((type) => <option key={type.key} value={type.key}>{type.label}</option>)}
            </select>
            {(statusFilter !== 'open' || typeFilter) && (
              <button type="button" onClick={() => { setStatusFilter('open'); setTypeFilter('') }} className="text-xs text-muted-foreground hover:text-foreground">
                Reset
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No inbox items in this view</p>
            <p className="mt-1 text-xs text-muted-foreground">Capture a call note, transcript, upload or analyst observation.</p>
            <div className="mx-auto mt-6 grid max-w-5xl gap-3 px-5 text-left md:grid-cols-2 xl:grid-cols-4">
              {CAPTURE_PLAYBOOK.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    const type = item.title === 'Agent route'
                      ? 'agent_call'
                      : item.title === 'Football reference'
                        ? 'reference_call'
                        : item.title === 'Coach material'
                          ? 'coach_upload'
                          : 'media_transcript'
                    update('intake_type', type)
                    setShowForm(true)
                  }}
                  className="rounded-md border border-border bg-background/40 p-3 text-left transition-colors hover:border-primary/35 hover:bg-background/60"
                >
                  <p className="text-xs font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{item.detail}</p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-primary">{item.destination}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const href = destinationHref(item)
              return (
                <article key={item.id} className={cn('px-5 py-4', item.sensitivity === 'legal_review' && 'border-l-2 border-amber-300/60 bg-amber-950/10')}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{formatDate(item.source_recorded_at ?? item.created_at)}</span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{optionLabel(INTAKE_TYPES, item.intake_type)}</span>
                        <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-medium', STATUS_CLASS[item.review_status] ?? STATUS_CLASS.captured)}>
                          {optionLabel(INBOX_REVIEW_STATUSES, item.review_status)}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{optionLabel(SOURCE_TYPES, item.source_type)}</span>
                        {item.source_tier && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">T{item.source_tier.replace(/^T/i, '')}</span>}
                        {item.confidence != null && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.confidence}%</span>}
                        {item.sensitivity !== 'standard' && <span className="rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-200">{optionLabel(SENSITIVITY_LEVELS, item.sensitivity)}</span>}
                        {item.verification_status === 'verified' && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-foreground">{item.headline}</p>
                      {item.extracted_signal && <p className="mt-1 max-w-4xl text-sm leading-6 text-muted-foreground">{item.extracted_signal}</p>}
                      {item.raw_detail && <p className="mt-2 line-clamp-2 max-w-4xl text-xs leading-5 text-muted-foreground/80">{item.raw_detail}</p>}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.methodology_criteria.map((criterion) => (
                          <span key={criterion} className="rounded border border-sky-500/25 bg-sky-500/10 px-2 py-1 text-[10px] text-sky-200">
                            {optionLabel(INBOX_CRITERIA_OPTIONS, criterion)}
                          </span>
                        ))}
                        {item.evidence_methods.map((method) => (
                          <span key={method} className="rounded border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[10px] text-violet-200">
                            {optionLabel(INBOX_EVIDENCE_METHOD_OPTIONS, method)}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                        <span>Linked to: {entityLabel(item)}</span>
                        <span>Destination: {optionLabel(DESTINATIONS, item.suggested_destination)}</span>
                        <span>{optionLabel(COMMERCIAL_SURFACES, item.commercial_surface)}</span>
                        {item.source_name && <span>Source: {item.source_name}</span>}
                        {item.next_action && <span className="text-amber-200">Next: {item.next_action}</span>}
                        {item.due_date && <span>Due: {formatDate(item.due_date)}</span>}
                        {item.source_link && <Link href={item.source_link} className="text-primary hover:underline" target="_blank">Open source</Link>}
                        {href && <Link href={href} className="text-primary hover:underline">Open record</Link>}
                      </div>
                    </div>
                    <div className="flex min-w-[220px] flex-col gap-2">
                      <p className="rounded border border-border bg-background/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
                        {DESTINATION_HELP[item.suggested_destination] ?? DESTINATION_HELP.intelligence_item}
                      </p>
                      {item.review_status !== 'promoted' && ONE_CLICK_DESTINATIONS.has(item.suggested_destination) && (
                        <Button onClick={() => promote(item.id, item.suggested_destination)} className="justify-center px-3 py-1.5 text-xs">
                          {DESTINATION_ACTION_LABEL[item.suggested_destination] ?? 'Promote'}
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      )}
                      {item.review_status !== 'promoted' && !ONE_CLICK_DESTINATIONS.has(item.suggested_destination) && (
                        <p className="rounded border border-border bg-background/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
                          {item.suggested_destination === 'watch_only'
                            ? 'Kept in the inbox as context until it is corroborated.'
                            : 'Use the structured assessment workspace to capture this evidence.'}
                        </p>
                      )}
                      {item.review_status !== 'ready_to_promote' && item.review_status !== 'promoted' && (
                        <Button variant="outline" onClick={() => updateStatus(item.id, 'ready_to_promote')} className="justify-center px-3 py-1.5 text-xs">
                          Mark ready
                        </Button>
                      )}
                      {item.review_status !== 'archived' && item.review_status !== 'promoted' && (
                        <Button variant="outline" onClick={() => updateStatus(item.id, 'archived')} className="justify-center px-3 py-1.5 text-xs">
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowForm(false)}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Capture raw intelligence</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Get the football information down first. You can verify and promote it after review.</p>
              </div>
              <Button variant="outline" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs">Close</Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Field label="Intake type">
                <select value={form.intake_type} onChange={(event) => update('intake_type', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  {INTAKE_TYPES.map((type) => <option key={type.key} value={type.key}>{type.label}</option>)}
                </select>
              </Field>
              <Field label="Source type">
                <select value={form.source_type} onChange={(event) => update('source_type', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  {SOURCE_TYPES.map((type) => <option key={type.key} value={type.key}>{type.label}</option>)}
                </select>
              </Field>
              <Field label="Source tier">
                <select value={form.source_tier} onChange={(event) => update('source_tier', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">Unknown</option>
                  {SOURCE_TIERS.map((tier) => <option key={tier.key} value={tier.key}>{tier.label}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
              <Field label="Linked record">
                <select value={entityMode} onChange={(event) => setEntityMode(event.target.value as typeof entityMode)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="coach">Coach</option>
                  <option value="club">Club</option>
                  <option value="mandate">Mandate</option>
                  <option value="agent">Agent</option>
                  <option value="none">Unlinked</option>
                </select>
              </Field>
              <Field label="Record">
                <select
                  value={entityMode === 'coach' ? form.coach_id : entityMode === 'club' ? form.club_id : entityMode === 'mandate' ? form.mandate_id : entityMode === 'agent' ? form.agent_id : ''}
                  onChange={(event) => {
                    if (entityMode === 'coach') update('coach_id', event.target.value)
                    if (entityMode === 'club') update('club_id', event.target.value)
                    if (entityMode === 'mandate') update('mandate_id', event.target.value)
                    if (entityMode === 'agent') update('agent_id', event.target.value)
                  }}
                  disabled={entityMode === 'none'}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-60"
                >
                  <option value="">Select...</option>
                  {entityOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Headline *" className="mt-3">
              <input value={form.headline} onChange={(event) => update('headline', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="e.g. Agent says coach would move with two staff if project is right" />
            </Field>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="Raw notes / transcript">
                <textarea value={form.raw_detail} onChange={(event) => update('raw_detail', event.target.value)} className="min-h-[140px] w-full resize-y rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="Paste call notes, transcript, source extract or rough observation." />
              </Field>
              <Field label="Extracted football signal">
                <textarea value={form.extracted_signal} onChange={(event) => update('extracted_signal', event.target.value)} className="min-h-[140px] w-full resize-y rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="What matters? Contract, staff, dressing room, training detail, pressure behaviour, family, relocation, tactical fit..." />
              </Field>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <Field label="Sensitivity">
                <select value={form.sensitivity} onChange={(event) => update('sensitivity', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  {SENSITIVITY_LEVELS.map((level) => <option key={level.key} value={level.key}>{level.label}</option>)}
                </select>
              </Field>
              <Field label="Verification">
                <select value={form.verification_status} onChange={(event) => update('verification_status', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  {VERIFICATION_STATUSES.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}
                </select>
              </Field>
              <Field label="Confidence">
                <input type="number" min={0} max={100} value={form.confidence} onChange={(event) => update('confidence', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="0-100" />
              </Field>
              <Field label="Direction">
                <select value={form.direction} onChange={(event) => update('direction', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">Unknown</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </Field>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Field label="Source name">
                <input value={form.source_name} onChange={(event) => update('source_name', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="Person, publication, provider..." />
              </Field>
              <Field label="Source link">
                <input value={form.source_link} onChange={(event) => update('source_link', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="https://..." />
              </Field>
              <Field label="Recorded at">
                <input type="datetime-local" value={form.source_recorded_at} onChange={(event) => update('source_recorded_at', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
              </Field>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <Field label="Source expires">
                <input type="date" value={form.source_expires_at} onChange={(event) => update('source_expires_at', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
              </Field>
              <Field label="Source proximity">
                <input value={form.source_proximity} onChange={(event) => update('source_proximity', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="e.g. board direct, agent close, media" />
              </Field>
              <Field label="Board visibility">
                <select value={form.board_visibility} onChange={(event) => update('board_visibility', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="internal_only">Internal only</option>
                  <option value="anonymised">Anonymised</option>
                  <option value="board_ready">Board-ready</option>
                  <option value="legal_review">Legal review</option>
                </select>
              </Field>
              <Field label="Contradiction">
                <select value={form.contradiction_status} onChange={(event) => update('contradiction_status', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="none">None</option>
                  <option value="supports_existing">Supports existing</option>
                  <option value="contradicts_existing">Contradicts existing</option>
                  <option value="needs_resolution">Needs resolution</option>
                </select>
              </Field>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <Checklist title="Methodology criteria" values={selectedCriteria} options={INBOX_CRITERIA_OPTIONS} onToggle={(key) => toggle(key, setSelectedCriteria, selectedCriteria)} />
              <Checklist title="Evidence methods" values={selectedMethods} options={INBOX_EVIDENCE_METHOD_OPTIONS} onToggle={(key) => toggle(key, setSelectedMethods, selectedMethods)} />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Field label="Suggested destination">
                <select value={form.suggested_destination} onChange={(event) => update('suggested_destination', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  {DESTINATIONS.map((destination) => <option key={destination.key} value={destination.key}>{destination.label}</option>)}
                </select>
              </Field>
              <Field label="Commercial surface">
                <select value={form.commercial_surface} onChange={(event) => update('commercial_surface', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  {COMMERCIAL_SURFACES.map((surface) => <option key={surface.key} value={surface.key}>{surface.label}</option>)}
                </select>
              </Field>
              <Field label="Due date">
                <input type="date" value={form.due_date} onChange={(event) => update('due_date', event.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
              </Field>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="Analyst notes">
                <textarea value={form.analyst_notes} onChange={(event) => update('analyst_notes', event.target.value)} className="min-h-[84px] w-full resize-y rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="Internal judgement, doubts, corroboration needed." />
              </Field>
              <Field label="Next action">
                <textarea value={form.next_action} onChange={(event) => update('next_action', event.target.value)} className="min-h-[84px] w-full resize-y rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="Who to call, what to verify, which pack/profile it should support." />
              </Field>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={createInboxItem} disabled={submitting}>{submitting ? 'Capturing...' : 'Capture intelligence'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function Checklist({
  title,
  options,
  values,
  onToggle,
}: {
  title: string
  options: readonly { key: string; label: string }[]
  values: string[]
  onToggle: (key: string) => void
}) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.key} className="flex items-center gap-2 rounded border border-border bg-surface/60 px-2 py-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={values.includes(option.key)} onChange={() => onToggle(option.key)} className="h-3.5 w-3.5 accent-primary" />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
