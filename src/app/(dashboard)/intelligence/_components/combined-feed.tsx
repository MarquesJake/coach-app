'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Database, FileText, LockKeyhole, MessageSquare, Plus, Radio, ShieldCheck, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createIntelligenceItemAction } from '../actions'
import { createAgentInteractionAction } from '@/app/(dashboard)/agents/actions'
import { toastError, toastSuccess } from '@/lib/ui/toast'

export type IntelKind =
  | 'intel'
  | 'interaction'
  | 'claim'
  | 'assessment_evidence'
  | 'interview'
  | 'reference'
  | 'material'
  | 'portal_profile'

export type IntelFeedItem = {
  id: string
  kind: IntelKind
  lane: string
  occurred_at: string
  title?: string
  summary?: string
  detail?: string | null
  category?: string | null
  direction?: string | null
  sensitivity?: string | null
  confidence?: number | null
  source_tier?: string | null
  source_name?: string | null
  source_type?: string | null
  verified?: boolean
  verification_status?: string | null
  review_status?: string | null
  used_in_recommendation?: boolean
  criterion?: string | null
  criterion_label?: string | null
  method?: string | null
  method_label?: string | null
  entity_type?: string
  entity_id?: string
  mandate_id?: string | null
  topic?: string | null
  sentiment?: string | null
  interaction_type?: string | null
  channel?: string | null
  reliability_score?: number | null
  influence_score?: number | null
  follow_up_date?: string | null
  agent_id?: string
  coach_id?: string | null
  club_id?: string | null
  entity_name?: string
  agent_name?: string | null
  coach_name?: string | null
  club_name?: string | null
  mandate_label?: string | null
  commercial_surfaces?: string[]
  origin_table?: string
  origin_label?: string
  origin_href?: string
}

type Props = {
  items: IntelFeedItem[]
  criterionCounts: { key: string; label: string; count: number }[]
  coaches: { id: string; name: string }[]
  agents: { id: string; name: string }[]
  clubs: { id: string; name: string }[]
  mandates: { id: string; label: string }[]
}

const LANE_META = [
  {
    lane: 'Agent conversations',
    title: 'Agent conversations',
    description: 'Availability, compensation, staff movement, contract route and relationship temperature.',
    icon: MessageSquare,
  },
  {
    lane: 'Source-backed claims',
    title: 'Private claims',
    description: 'Agent, reference and analyst assertions waiting to be accepted, applied or rejected.',
    icon: ShieldCheck,
  },
  {
    lane: 'References',
    title: 'References',
    description: 'CEO, sporting director, player, staff and agent evidence against the appointment risk.',
    icon: CheckCircle2,
  },
  {
    lane: 'Candidate interviews',
    title: 'Interviews',
    description: 'Structured answers from the investor question bank mapped to the assessment framework.',
    icon: FileText,
  },
  {
    lane: 'Coach-submitted material',
    title: 'Coach material',
    description: 'Presentations, sessions, videos and methodology uploaded into the confidential layer.',
    icon: UploadCloud,
  },
  {
    lane: 'Assessment evidence',
    title: 'Assessment evidence',
    description: 'The 9-criteria evidence base that qualifies the final recommendation.',
    icon: Database,
  },
] as const

const FUTURE_INTAKES = [
  'News and article monitoring',
  'Podcast and video transcription',
  'Social media signal extraction',
  'Data provider imports',
  'Agent CRM conversations',
  'Coach portal uploads',
]

const CATEGORY_OPTIONS = [
  'Media',
  'Tactical',
  'Legal',
  'Staff',
  'Performance',
  'Reputation',
  'Contract',
  'Background',
  'Mandate',
  'Availability',
  'Compensation',
  'Other',
]

const DIRECTION_CLASSES: Record<string, string> = {
  Positive: 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/40',
  Negative: 'bg-red-900/30 text-red-300 border border-red-800/40',
  Neutral: 'bg-slate-800/40 text-slate-300 border border-slate-700/40',
}

function formatDate(d: string): string {
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '-'
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function confidenceClasses(c: number | null | undefined): string {
  if (c == null) return 'bg-slate-800/40 text-slate-300'
  if (c >= 67) return 'bg-emerald-900/30 text-emerald-300'
  if (c >= 34) return 'bg-amber-900/30 text-amber-300'
  return 'bg-red-900/30 text-red-300'
}

function normaliseSensitivity(value: string | null | undefined) {
  return (value ?? '').toLowerCase()
}

function numericTier(value: string | null | undefined) {
  if (!value) return null
  const parsed = Number.parseInt(value.replace(/^T/i, ''), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function isVerified(item: IntelFeedItem) {
  return item.verified || item.verification_status === 'verified' || item.review_status === 'accepted' || item.review_status === 'applied'
}

function isHighSignal(item: IntelFeedItem) {
  const tier = numericTier(item.source_tier)
  const trusted = tier != null && tier <= 2
  const confidential = ['high', 'confidential', 'confidential_room'].includes(normaliseSensitivity(item.sensitivity))
  return (trusted && (item.confidence ?? 0) >= 70) || confidential || item.used_in_recommendation === true
}

function isRiskSignal(item: IntelFeedItem) {
  return item.direction === 'Negative' || item.sentiment === 'Negative' || normaliseSensitivity(item.sensitivity) === 'high'
}

function surfaceClass(surface: string) {
  if (/confidential/i.test(surface)) return 'border-amber-500/25 bg-amber-500/10 text-amber-200'
  if (/pack|appendix|recommendation|board/i.test(surface)) return 'border-sky-500/25 bg-sky-500/10 text-sky-200'
  if (/profile|portal/i.test(surface)) return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
  return 'border-border bg-muted/40 text-muted-foreground'
}

function linkSet(item: IntelFeedItem) {
  const links: { label: string; href: string }[] = []
  if (item.origin_href) links.push({ label: item.origin_label ? `Source: ${item.origin_label}` : 'Open source record', href: item.origin_href })
  if (item.coach_id) links.push({ label: item.coach_name ? `Coach: ${item.coach_name}` : 'Coach profile', href: `/coaches/${item.coach_id}` })
  if (item.kind === 'intel' && item.entity_type && item.entity_id && item.entity_type !== 'coach') links.push({ label: item.entity_name ?? item.entity_type, href: `/${item.entity_type}s/${item.entity_id}` })
  if (item.agent_id) links.push({ label: item.agent_name ? `Agent: ${item.agent_name}` : 'Agent', href: `/agents/${item.agent_id}/interactions?entry=${item.id}` })
  if (item.club_id) links.push({ label: item.club_name ? `Club: ${item.club_name}` : 'Club', href: `/clubs/${item.club_id}` })
  if (item.mandate_id) links.push({ label: item.mandate_label ? `Mandate: ${item.mandate_label}` : 'Mandate', href: `/mandates/${item.mandate_id}` })
  if (item.coach_id && item.mandate_id) links.push({ label: 'Assessment', href: `/mandates/${item.mandate_id}/assessment/${item.coach_id}` })
  if (item.coach_id && item.mandate_id) links.push({ label: 'Head Coach Assessment Pack', href: `/mandates/${item.mandate_id}/assessment/${item.coach_id}/board-pack` })
  if (item.kind === 'material' || item.kind === 'portal_profile') links.push({ label: 'Coach portal', href: `/coach-portal/${item.coach_id}` })
  if (item.kind === 'intel' && item.entity_type === 'coach' && item.entity_id) links.push({ label: 'View intelligence tab', href: `/coaches/${item.entity_id}/intelligence?entry=${item.id}` })
  return links.filter((link, index, all) => all.findIndex((l) => l.href === link.href) === index)
}

export function CombinedFeed({ items, criterionCounts, coaches, agents, clubs, mandates }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const highlightedId = searchParams.get('entry')
  const highlightRef = useRef<HTMLDivElement>(null)

  const [laneFilter, setLaneFilter] = useState<string>('all')
  const [criterionFilter, setCriterionFilter] = useState<string>('all')
  const [directionFilter, setDirectionFilter] = useState<string>('')
  const [coachFilter, setCoachFilter] = useState<string>('')
  const [quickFilter, setQuickFilter] = useState<'high_signal' | 'risk_flags' | 'unverified' | 'confidential' | null>(null)
  const [addMode, setAddMode] = useState<'intel' | 'interaction' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [intelForm, setIntelForm] = useState({
    category: '', title: '', detail: '', direction: '', sensitivity: 'Standard',
    source_tier: '', source_name: '', confidence: '', occurred_at: new Date().toISOString().slice(0, 10),
    entity_type: 'coach', entity_id: '', mandate_id: '',
  })
  const [interForm, setInterForm] = useState({
    agent_id: '', summary: '', detail: '', topic: '', interaction_type: '',
    channel: '', direction: '', sentiment: '', confidence: '',
    reliability_score: '', influence_score: '', follow_up_date: '',
    occurred_at: new Date().toISOString().slice(0, 16),
    coach_id: '', club_id: '',
  })

  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedId])

  const laneCounts = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach((item) => counts.set(item.lane, (counts.get(item.lane) ?? 0) + 1))
    return counts
  }, [items])

  const filtered = useMemo(() => {
    let output = items
    if (laneFilter !== 'all') output = output.filter((item) => item.lane === laneFilter)
    if (criterionFilter !== 'all') output = output.filter((item) => item.criterion === criterionFilter || item.category === criterionFilter)
    if (directionFilter) output = output.filter((item) => item.direction === directionFilter || item.sentiment === directionFilter)
    if (coachFilter) output = output.filter((item) => item.coach_id === coachFilter || (item.entity_type === 'coach' && item.entity_id === coachFilter))
    if (quickFilter === 'high_signal') output = output.filter(isHighSignal)
    if (quickFilter === 'risk_flags') output = output.filter(isRiskSignal)
    if (quickFilter === 'unverified') output = output.filter((item) => !isVerified(item))
    if (quickFilter === 'confidential') output = output.filter((item) => ['high', 'confidential', 'confidential_room'].includes(normaliseSensitivity(item.sensitivity)))
    return output
  }, [coachFilter, criterionFilter, directionFilter, items, laneFilter, quickFilter])

  const verifiedCount = items.filter(isVerified).length
  const recommendationCount = items.filter((item) => item.used_in_recommendation).length
  const confidentialCount = items.filter((item) => ['high', 'confidential', 'confidential_room'].includes(normaliseSensitivity(item.sensitivity))).length
  const criteriaTouched = criterionCounts.filter((criterion) => criterion.count > 0).length

  const entityOptions = intelForm.entity_type === 'coach' ? coaches
    : intelForm.entity_type === 'club' ? clubs
      : intelForm.entity_type === 'mandate' ? mandates.map((m) => ({ id: m.id, name: m.label }))
        : []

  async function handleAddIntel() {
    if (!intelForm.title.trim() || !intelForm.entity_id) {
      toastError('Title and entity are required')
      return
    }
    setSubmitting(true)
    const result = await createIntelligenceItemAction({
      entity_type: intelForm.entity_type,
      entity_id: intelForm.entity_id,
      title: intelForm.title.trim(),
      detail: intelForm.detail.trim() || null,
      category: intelForm.category || null,
      direction: intelForm.direction || null,
      sensitivity: intelForm.sensitivity || 'Standard',
      source_tier: intelForm.source_tier || null,
      source_name: intelForm.source_name.trim() || null,
      confidence: intelForm.confidence ? Number.parseInt(intelForm.confidence, 10) : null,
      occurred_at: intelForm.occurred_at || null,
      mandate_id: intelForm.mandate_id || null,
    })
    setSubmitting(false)
    if (result.error) {
      toastError(result.error)
      return
    }
    toastSuccess('Intelligence added')
    setAddMode(null)
    router.refresh()
  }

  async function handleAddInteraction() {
    if (!interForm.agent_id || !interForm.summary.trim()) {
      toastError('Agent and summary are required')
      return
    }
    setSubmitting(true)
    const result = await createAgentInteractionAction({
      agent_id: interForm.agent_id,
      summary: interForm.summary.trim(),
      detail: interForm.detail.trim() || null,
      topic: interForm.topic || null,
      interaction_type: interForm.interaction_type || null,
      channel: interForm.channel || null,
      direction: interForm.direction || null,
      sentiment: interForm.sentiment || null,
      confidence: interForm.confidence ? Number.parseInt(interForm.confidence, 10) : null,
      reliability_score: interForm.reliability_score ? Number.parseInt(interForm.reliability_score, 10) : null,
      influence_score: interForm.influence_score ? Number.parseInt(interForm.influence_score, 10) : null,
      follow_up_date: interForm.follow_up_date || null,
      occurred_at: new Date(interForm.occurred_at).toISOString(),
      coach_id: interForm.coach_id || null,
      club_id: interForm.club_id || null,
    })
    setSubmitting(false)
    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess('Interaction added')
    setAddMode(null)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-card px-5 py-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-200">
              <LockKeyhole className="h-3 w-3" />
              Confidential football intelligence
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Football Intelligence Feed</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Every agent call, reference, coach upload, interview answer, analyst note and future media/data signal becomes source-backed intelligence against a coach. The data narrows the shortlist; private football intelligence tells you whether to appoint.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total signals" value={items.length} />
              <Metric label="Verified / accepted" value={verifiedCount} />
              <Metric label="Used in recommendations" value={recommendationCount} />
              <Metric label="Confidential signals" value={confidentialCount} />
            </div>
          </div>
          <div className="rounded-md border border-border bg-background/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Commercial model it supports</p>
            <div className="mt-3 space-y-2 text-sm">
              <CommercialLine label="Full service search" text="Identify, assess, reference, package and support appointment decisions." />
              <CommercialLine label="Assessment Pack" text="Clubs bring names; the platform turns knowledge into a board-ready dossier." />
              <CommercialLine label="Subscription intelligence" text="Continuous monitoring of coaches, market movement and private signals." />
              <CommercialLine label="Coach portal" text="Coaches upload sessions, presentations, video and methodology into the depth layer." />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {LANE_META.map((lane) => {
          const Icon = lane.icon
          const count = laneCounts.get(lane.lane) ?? 0
          return (
            <button
              key={lane.lane}
              type="button"
              onClick={() => setLaneFilter(laneFilter === lane.lane ? 'all' : lane.lane)}
              className={cn(
                'rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40',
                laneFilter === lane.lane ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background/60">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{lane.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{count} signal{count === 1 ? '' : 's'}</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{lane.description}</p>
            </button>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Assessment methodology coverage</p>
              <h2 className="mt-1 text-base font-semibold text-foreground">{criteriaTouched}/9 criteria touched by live intelligence</h2>
            </div>
            <Button variant="outline" className="text-xs" onClick={() => setCriterionFilter('all')}>Reset</Button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {criterionCounts.map((criterion) => (
              <button
                key={criterion.key}
                type="button"
                onClick={() => setCriterionFilter(criterionFilter === criterion.key ? 'all' : criterion.key)}
                className={cn(
                  'rounded-md border px-3 py-2 text-left transition-colors',
                  criterionFilter === criterion.key ? 'border-primary/50 bg-primary/10' : 'border-border bg-background/40 hover:border-primary/30'
                )}
              >
                <p className="text-xs font-medium text-foreground">{criterion.label}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{criterion.count} signal{criterion.count === 1 ? '' : 's'}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Future intake map</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">Built to absorb more sources</h2>
          <div className="mt-4 space-y-2">
            {FUTURE_INTAKES.map((intake) => (
              <div key={intake} className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                <Radio className="h-3.5 w-3.5 text-primary" />
                {intake}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live feed</p>
              <h2 className="mt-1 text-base font-semibold text-foreground">{filtered.length} visible signals</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="text-xs" onClick={() => setAddMode('intel')}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Intelligence
              </Button>
              {agents.length > 0 && (
                <Button variant="outline" className="text-xs" onClick={() => setAddMode('interaction')}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Agent call
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(
              [
                { key: 'high_signal', label: 'High signal' },
                { key: 'risk_flags', label: 'Risk flags' },
                { key: 'unverified', label: 'Needs verification' },
                { key: 'confidential', label: 'Confidential' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setQuickFilter(quickFilter === key ? null : key)}
                className={cn(
                  'rounded border px-3 py-1.5 text-xs font-medium transition-colors',
                  quickFilter === key ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-background/40 text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
            <select value={laneFilter} onChange={(e) => setLaneFilter(e.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
              <option value="all">All lanes</option>
              {Array.from(new Set(items.map((item) => item.lane))).map((lane) => <option key={lane} value={lane}>{lane}</option>)}
            </select>
            <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
              <option value="">All sentiment</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
            </select>
            {coaches.length > 0 && (
              <select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
                <option value="">All coaches</option>
                {coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.name}</option>)}
              </select>
            )}
            {(quickFilter || laneFilter !== 'all' || criterionFilter !== 'all' || directionFilter || coachFilter) && (
              <button
                type="button"
                onClick={() => {
                  setQuickFilter(null)
                  setLaneFilter('all')
                  setCriterionFilter('all')
                  setDirectionFilter('')
                  setCoachFilter('')
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Radio className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No intelligence in this view</p>
            <p className="mt-1 text-xs text-muted-foreground">Change the filters or add a new signal.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const isHighlighted = item.id === highlightedId
              const title = item.title ?? item.summary ?? 'Untitled intelligence'
              const dirVal = item.direction ?? item.sentiment
              const links = linkSet(item)
              const highSignal = isHighSignal(item)
              const riskSignal = isRiskSignal(item)

              return (
                <article
                  key={`${item.kind}-${item.id}`}
                  id={`entry-${item.id}`}
                  ref={isHighlighted ? highlightRef : undefined}
                  className={cn(
                    'px-5 py-4 transition-colors hover:bg-muted/20',
                    isHighlighted && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
                    riskSignal && !isHighlighted && 'border-l-2 border-red-400/40 bg-red-950/10'
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', riskSignal ? 'bg-red-300' : highSignal ? 'bg-amber-300' : 'bg-primary')} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{formatDate(item.occurred_at)}</span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{item.lane}</span>
                        {highSignal && <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-200">High signal</span>}
                        {item.category && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.category}</span>}
                        {item.criterion_label && <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-200">{item.criterion_label}</span>}
                        {item.method_label && <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-200">{item.method_label}</span>}
                        {dirVal && <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', DIRECTION_CLASSES[dirVal] ?? 'bg-muted text-muted-foreground')}>{dirVal}</span>}
                        {item.sensitivity && normaliseSensitivity(item.sensitivity) !== 'standard' && (
                          <span className="rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">{item.sensitivity}</span>
                        )}
                        {item.confidence != null && <span className={cn('rounded px-1.5 py-0.5 text-[10px]', confidenceClasses(item.confidence))}>{item.confidence}%</span>}
                        {item.source_tier && <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.source_tier}</span>}
                        {isVerified(item) && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                        {item.used_in_recommendation && <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-200">Recommendation evidence</span>}
                      </div>

                      <p className="font-medium text-foreground">{title}</p>
                      {item.detail && <p className="mt-1 max-w-4xl text-sm leading-6 text-muted-foreground">{item.detail}</p>}

                      {item.commercial_surfaces && item.commercial_surfaces.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {item.commercial_surfaces.map((surface) => (
                            <span key={surface} className={cn('rounded border px-2 py-1 text-[10px] font-medium', surfaceClass(surface))}>{surface}</span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                        {item.source_name && <span>Source: {item.source_name}</span>}
                        {item.source_type && <span>Type: {item.source_type}</span>}
                        {item.review_status && <span>Review: {item.review_status}</span>}
                        {item.verification_status && <span>Status: {item.verification_status}</span>}
                        {item.reliability_score != null && <span>Reliability: {item.reliability_score}/100</span>}
                        {item.influence_score != null && <span>Influence: {item.influence_score}/100</span>}
                        {item.follow_up_date && <span className="text-amber-300">Follow up: {new Date(item.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                        {item.origin_table && <span>Record: {item.origin_table}</span>}
                        {links.map((link) => (
                          <Link key={link.href} href={link.href} className="font-medium text-primary hover:underline">
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {addMode === 'intel' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setAddMode(null)}>
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground">Add intelligence</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Entity type">
                <select value={intelForm.entity_type} onChange={(e) => setIntelForm((f) => ({ ...f, entity_type: e.target.value, entity_id: '' }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="coach">Coach</option>
                  <option value="club">Club</option>
                  <option value="mandate">Mandate</option>
                </select>
              </Field>
              <Field label="Entity *">
                <select value={intelForm.entity_id} onChange={(e) => setIntelForm((f) => ({ ...f, entity_id: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {entityOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Category">
                <select value={intelForm.category} onChange={(e) => setIntelForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">-</option>
                  {CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </Field>
              <Field label="Direction">
                <select value={intelForm.direction} onChange={(e) => setIntelForm((f) => ({ ...f, direction: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">-</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </Field>
            </div>
            <Field label="Title *" className="mt-3">
              <input value={intelForm.title} onChange={(e) => setIntelForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="Short intelligence note" />
            </Field>
            <Field label="Detail" className="mt-3">
              <textarea value={intelForm.detail} onChange={(e) => setIntelForm((f) => ({ ...f, detail: e.target.value }))} className="min-h-[72px] w-full resize-none rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="What was said, by whom, and why it matters" />
            </Field>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Field label="Source tier">
                <select value={intelForm.source_tier} onChange={(e) => setIntelForm((f) => ({ ...f, source_tier: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">-</option>
                  {[1, 2, 3, 4, 5].map((tier) => <option key={tier} value={String(tier)}>T{tier}</option>)}
                </select>
              </Field>
              <Field label="Confidence">
                <input type="number" min={0} max={100} value={intelForm.confidence} onChange={(e) => setIntelForm((f) => ({ ...f, confidence: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="0-100" />
              </Field>
              <Field label="Date">
                <input type="date" value={intelForm.occurred_at} onChange={(e) => setIntelForm((f) => ({ ...f, occurred_at: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
              </Field>
            </div>
            <Field label="Source name" className="mt-3">
              <input value={intelForm.source_name} onChange={(e) => setIntelForm((f) => ({ ...f, source_name: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="Agent, journalist, sporting director, internal analyst..." />
            </Field>
            <div className="mt-5 flex gap-2">
              <Button onClick={handleAddIntel} disabled={submitting}>{submitting ? 'Adding...' : 'Add'}</Button>
              <Button variant="outline" onClick={() => setAddMode(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {addMode === 'interaction' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setAddMode(null)}>
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground">Add agent interaction</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Agent *">
                <select value={interForm.agent_id} onChange={(e) => setInterForm((f) => ({ ...f, agent_id: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <select value={interForm.interaction_type} onChange={(e) => setInterForm((f) => ({ ...f, interaction_type: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">-</option>
                  {['Call', 'Meeting', 'Message', 'Email', 'Other'].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Summary *" className="mt-3">
              <input value={interForm.summary} onChange={(e) => setInterForm((f) => ({ ...f, summary: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="Brief summary" />
            </Field>
            <Field label="Detail" className="mt-3">
              <textarea value={interForm.detail} onChange={(e) => setInterForm((f) => ({ ...f, detail: e.target.value }))} className="min-h-[72px] w-full resize-none rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="Availability, appetite, concerns, deal context, staff situation" />
            </Field>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Topic">
                <select value={interForm.topic} onChange={(e) => setInterForm((f) => ({ ...f, topic: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">-</option>
                  {['Mandate', 'Availability', 'Compensation', 'Staff', 'Reputation', 'Other'].map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                </select>
              </Field>
              <Field label="Sentiment">
                <select value={interForm.sentiment} onChange={(e) => setInterForm((f) => ({ ...f, sentiment: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">-</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </Field>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Confidence">
                <input type="number" min={0} max={100} value={interForm.confidence} onChange={(e) => setInterForm((f) => ({ ...f, confidence: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="0-100" />
              </Field>
              <Field label="Date and time">
                <input type="datetime-local" value={interForm.occurred_at} onChange={(e) => setInterForm((f) => ({ ...f, occurred_at: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
              </Field>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Coach">
                <select value={interForm.coach_id} onChange={(e) => setInterForm((f) => ({ ...f, coach_id: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">None</option>
                  {coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.name}</option>)}
                </select>
              </Field>
              <Field label="Follow-up date">
                <input type="date" value={interForm.follow_up_date} onChange={(e) => setInterForm((f) => ({ ...f, follow_up_date: e.target.value }))} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
              </Field>
            </div>
            <div className="mt-5 flex gap-2">
              <Button onClick={handleAddInteraction} disabled={submitting}>{submitting ? 'Adding...' : 'Add'}</Button>
              <Button variant="outline" onClick={() => setAddMode(null)}>Cancel</Button>
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

function CommercialLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-2">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
