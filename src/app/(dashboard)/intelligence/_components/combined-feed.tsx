'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createIntelligenceItemAction } from '../actions'
import { createAgentInteractionAction } from '@/app/(dashboard)/agents/actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

export type IntelFeedItem = {
  id: string
  kind: 'intel' | 'interaction'
  occurred_at: string
  // Intel fields
  title?: string
  detail?: string | null
  category?: string | null
  direction?: string | null
  sensitivity?: string | null
  confidence?: number | null
  source_tier?: string | null
  source_name?: string | null
  source_type?: string | null
  verified?: boolean
  entity_type?: string
  entity_id?: string
  mandate_id?: string | null
  // Interaction fields
  summary?: string
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
  // Resolved names
  entity_name?: string
  agent_name?: string
  coach_name?: string | null
  club_name?: string | null
  mandate_label?: string | null
}

const DIRECTION_CLASSES: Record<string, string> = {
  Positive: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40',
  Negative: 'bg-red-900/30 text-red-400 border border-red-800/40',
  Neutral: 'bg-slate-800/40 text-slate-400 border border-slate-700/40',
}

const SENTIMENT_CLASSES: Record<string, string> = {
  Positive: 'bg-emerald-900/30 text-emerald-400',
  Negative: 'bg-red-900/30 text-red-400',
  Neutral: 'bg-slate-800/40 text-slate-400',
}

const TIER_LABELS: Record<string, string> = {
  '1': 'T1', '2': 'T2', '3': 'T3', '4': 'T4', '5': 'T5',
}

function formatDate(d: string): string {
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
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
  if (c == null) return 'bg-slate-800/40 text-slate-400'
  if (c >= 67) return 'bg-emerald-900/30 text-emerald-400'
  if (c >= 34) return 'bg-amber-900/30 text-amber-400'
  return 'bg-red-900/30 text-red-400'
}

type Props = {
  items: IntelFeedItem[]
  coaches: { id: string; name: string }[]
  agents: { id: string; name: string }[]
  clubs: { id: string; name: string }[]
  mandates: { id: string; label: string }[]
}

export function CombinedFeed({ items, coaches, agents, clubs, mandates }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const highlightedId = searchParams.get('entry')
  const highlightRef = useRef<HTMLDivElement>(null)

  const [kindFilter, setKindFilter] = useState<'all' | 'intel' | 'interaction'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [directionFilter, setDirectionFilter] = useState<string>('')
  const [coachFilter, setCoachFilter] = useState<string>('')
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

  let filtered = items
  if (kindFilter !== 'all') filtered = filtered.filter((i) => i.kind === kindFilter)
  if (categoryFilter) filtered = filtered.filter((i) => i.category === categoryFilter || i.topic === categoryFilter)
  if (directionFilter) filtered = filtered.filter((i) => i.direction === directionFilter || i.sentiment === directionFilter)
  if (coachFilter) filtered = filtered.filter((i) => {
    if (i.kind === 'intel') return i.entity_type === 'coach' && i.entity_id === coachFilter
    return i.coach_id === coachFilter
  })

  const categories = ['Media', 'Tactical', 'Legal', 'Staff', 'Performance', 'Reputation', 'Contract', 'Background', 'Mandate', 'Availability', 'Compensation', 'Other']

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
      confidence: intelForm.confidence ? parseInt(intelForm.confidence, 10) : null,
      occurred_at: intelForm.occurred_at || null,
      mandate_id: intelForm.mandate_id || null,
    })
    setSubmitting(false)
    if (result.error) { toastError(result.error); return }
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
      confidence: interForm.confidence ? parseInt(interForm.confidence, 10) : null,
      reliability_score: interForm.reliability_score ? parseInt(interForm.reliability_score, 10) : null,
      influence_score: interForm.influence_score ? parseInt(interForm.influence_score, 10) : null,
      follow_up_date: interForm.follow_up_date || null,
      occurred_at: new Date(interForm.occurred_at).toISOString(),
      coach_id: interForm.coach_id || null,
      club_id: interForm.club_id || null,
    })
    setSubmitting(false)
    if (!result.ok) { toastError(result.error); return }
    toastSuccess('Interaction added')
    setAddMode(null)
    router.refresh()
  }

  const entityOptions = intelForm.entity_type === 'coach' ? coaches
    : intelForm.entity_type === 'club' ? clubs
    : intelForm.entity_type === 'mandate' ? mandates.map((m) => ({ id: m.id, name: m.label }))
    : []

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'intel', 'interaction'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                kindFilter === k ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {k === 'all' ? 'All' : k === 'intel' ? 'Intelligence' : 'Agent calls'}
            </button>
          ))}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded border border-border bg-surface px-2 text-xs"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="h-8 rounded border border-border bg-surface px-2 text-xs"
          >
            <option value="">All sentiment</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
          {coaches.length > 0 && (
            <select
              value={coachFilter}
              onChange={(e) => setCoachFilter(e.target.value)}
              className="h-8 rounded border border-border bg-surface px-2 text-xs"
            >
              <option value="">All coaches</option>
              {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-xs" onClick={() => setAddMode('intel')}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Intelligence
          </Button>
          {agents.length > 0 && (
            <Button variant="outline" className="text-xs" onClick={() => setAddMode('interaction')}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Agent call
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card-surface rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-semibold">{items.length}</p>
        </div>
        <div className="card-surface rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Intelligence</p>
          <p className="text-2xl font-semibold">{items.filter((i) => i.kind === 'intel').length}</p>
        </div>
        <div className="card-surface rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Agent calls</p>
          <p className="text-2xl font-semibold">{items.filter((i) => i.kind === 'interaction').length}</p>
        </div>
        <div className="card-surface rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Positive</p>
          <p className="text-2xl font-semibold text-emerald-400">{items.filter((i) => i.direction === 'Positive' || i.sentiment === 'Positive').length}</p>
        </div>
      </div>

      {/* Feed */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-medium text-foreground">Intelligence feed</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Radio className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No entries match the current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const isHighlighted = item.id === highlightedId
              const isIntel = item.kind === 'intel'
              const primaryText = isIntel ? item.title! : item.summary!
              const bodyText = isIntel ? item.detail : item.detail
              const dirVal = isIntel ? item.direction : item.sentiment
              const dateStr = formatDate(item.occurred_at)

              return (
                <div
                  key={item.id}
                  id={`entry-${item.id}`}
                  ref={isHighlighted ? highlightRef : undefined}
                  className={cn(
                    'px-6 py-4 hover:bg-muted/20 transition-colors',
                    isHighlighted && 'bg-primary/5 ring-1 ring-inset ring-primary/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Kind indicator */}
                    <div className={cn(
                      'mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full',
                      isIntel ? 'bg-sky-400' : 'bg-amber-400'
                    )} />

                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                        <span className={cn(
                          'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                          isIntel ? 'bg-sky-900/30 text-sky-400' : 'bg-amber-900/30 text-amber-400'
                        )}>
                          {isIntel ? 'Intel' : 'Agent call'}
                        </span>
                        {(item.category ?? item.topic) && (
                          <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {item.category ?? item.topic}
                          </span>
                        )}
                        {dirVal && (
                          <span className={cn('inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium',
                            isIntel ? (DIRECTION_CLASSES[dirVal] ?? 'bg-muted text-muted-foreground') : (SENTIMENT_CLASSES[dirVal] ?? 'bg-muted text-muted-foreground')
                          )}>
                            {dirVal}
                          </span>
                        )}
                        {item.sensitivity === 'High' && (
                          <span className="inline-flex rounded bg-red-900/20 text-red-400 border border-red-800/30 px-1.5 py-0.5 text-[10px] font-medium">Sensitive</span>
                        )}
                        {item.confidence != null && (
                          <span className={cn('inline-flex rounded px-1.5 py-0.5 text-[10px]', confidenceClasses(item.confidence))}>
                            {item.confidence}%
                          </span>
                        )}
                        {item.source_tier && (
                          <span className="inline-flex rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {TIER_LABELS[item.source_tier] ?? `T${item.source_tier}`}
                          </span>
                        )}
                        {item.interaction_type && (
                          <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.interaction_type}</span>
                        )}
                      </div>

                      {/* Primary text */}
                      <p className="font-medium text-foreground">{primaryText}</p>
                      {bodyText && <p className="text-sm text-muted-foreground mt-1">{bodyText}</p>}

                      {/* Footer links */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                        {isIntel && item.entity_name && item.entity_id && (
                          <Link
                            href={`/${item.entity_type}s/${item.entity_id}${item.entity_type === 'coach' ? '/intelligence' : ''}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {item.entity_name}
                          </Link>
                        )}
                        {!isIntel && item.agent_name && item.agent_id && (
                          <Link href={`/agents/${item.agent_id}/interactions?entry=${item.id}`} className="text-primary hover:underline font-medium">
                            {item.agent_name}
                          </Link>
                        )}
                        {item.coach_name && item.coach_id && (
                          <Link href={`/coaches/${item.coach_id}/intelligence`} className="hover:underline">
                            Coach: {item.coach_name}
                          </Link>
                        )}
                        {item.club_name && item.club_id && (
                          <Link href={`/clubs/${item.club_id}`} className="hover:underline">
                            Club: {item.club_name}
                          </Link>
                        )}
                        {item.mandate_label && item.mandate_id && (
                          <Link href={`/mandates/${item.mandate_id}`} className="hover:underline">
                            Mandate: {item.mandate_label}
                          </Link>
                        )}
                        {item.reliability_score != null && <span>Reliability: {item.reliability_score}/100</span>}
                        {item.influence_score != null && <span>Influence: {item.influence_score}/100</span>}
                        {item.follow_up_date && (
                          <span className="text-amber-400">Follow up: {new Date(item.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        )}
                        {item.source_name && <span>Source: {item.source_name}</span>}
                        {item.verified && <span className="text-emerald-400">✓ Verified</span>}
                        {/* Deep link to coach intelligence tab */}
                        {isIntel && item.entity_type === 'coach' && item.entity_id && (
                          <Link
                            href={`/coaches/${item.entity_id}/intelligence?entry=${item.id}`}
                            className="hover:underline"
                          >
                            View in context →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Intel modal */}
      {addMode === 'intel' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setAddMode(null)}>
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground">Add intelligence</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Entity type</label>
                <select value={intelForm.entity_type} onChange={(e) => setIntelForm((f) => ({ ...f, entity_type: e.target.value, entity_id: '' }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                  <option value="coach">Coach</option>
                  <option value="club">Club</option>
                  <option value="mandate">Mandate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Entity *</label>
                <select value={intelForm.entity_id} onChange={(e) => setIntelForm((f) => ({ ...f, entity_id: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                  <option value="">Select…</option>
                  {entityOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                <select value={intelForm.category} onChange={(e) => setIntelForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                  <option value="">—</option>
                  {['Media', 'Tactical', 'Legal', 'Staff', 'Performance', 'Reputation', 'Contract', 'Background', 'Other'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Direction</label>
                <select value={intelForm.direction} onChange={(e) => setIntelForm((f) => ({ ...f, direction: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                  <option value="">—</option>
                  {['Positive', 'Negative', 'Neutral'].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
              <input value={intelForm.title} onChange={(e) => setIntelForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" placeholder="Short intelligence note" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Detail</label>
              <textarea value={intelForm.detail} onChange={(e) => setIntelForm((f) => ({ ...f, detail: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm min-h-[60px] resize-none" placeholder="Optional" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Source tier</label>
                <select value={intelForm.source_tier} onChange={(e) => setIntelForm((f) => ({ ...f, source_tier: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                  <option value="">—</option>
                  {[1,2,3,4,5].map((t) => <option key={t} value={String(t)}>T{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Confidence</label>
                <input type="number" min={0} max={100} value={intelForm.confidence} onChange={(e) => setIntelForm((f) => ({ ...f, confidence: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" placeholder="0–100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                <input type="date" value={intelForm.occurred_at} onChange={(e) => setIntelForm((f) => ({ ...f, occurred_at: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleAddIntel} disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
              <Button variant="outline" onClick={() => setAddMode(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Interaction modal */}
      {addMode === 'interaction' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setAddMode(null)}>
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground">Add agent interaction</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Agent *</label>
                <select value={interForm.agent_id} onChange={(e) => setInterForm((f) => ({ ...f, agent_id: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                  <option value="">Select…</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                <select value={interForm.interaction_type} onChange={(e) => setInterForm((f) => ({ ...f, interaction_type: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                  <option value="">—</option>
                  {['Call', 'Meeting', 'Message', 'Email', 'Other'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Summary *</label>
              <input value={interForm.summary} onChange={(e) => setInterForm((f) => ({ ...f, summary: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" placeholder="Brief summary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Detail</label>
              <textarea value={interForm.detail} onChange={(e) => setInterForm((f) => ({ ...f, detail: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm min-h-[60px] resize-none" placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Topic</label>
                <select value={interForm.topic} onChange={(e) => setInterForm((f) => ({ ...f, topic: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                  <option value="">—</option>
                  {['Mandate', 'Availability', 'Compensation', 'Staff', 'Reputation', 'Other'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Sentiment</label>
                <select value={interForm.sentiment} onChange={(e) => setInterForm((f) => ({ ...f, sentiment: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                  <option value="">—</option>
                  {['Positive', 'Neutral', 'Negative'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Confidence</label>
                <input type="number" min={0} max={100} value={interForm.confidence} onChange={(e) => setInterForm((f) => ({ ...f, confidence: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" placeholder="0–100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Date & time</label>
                <input type="datetime-local" value={interForm.occurred_at} onChange={(e) => setInterForm((f) => ({ ...f, occurred_at: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Coach</label>
                <select value={interForm.coach_id} onChange={(e) => setInterForm((f) => ({ ...f, coach_id: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                  <option value="">None</option>
                  {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Follow-up date</label>
                <input type="date" value={interForm.follow_up_date} onChange={(e) => setInterForm((f) => ({ ...f, follow_up_date: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleAddInteraction} disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
              <Button variant="outline" onClick={() => setAddMode(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
