'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { createAgentInteractionAction, deleteAgentInteractionAction } from '../../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { cn } from '@/lib/utils'
import type { InteractionRow } from '@/lib/db/agentInteractions'

const CHANNELS = ['Phone', 'WhatsApp', 'Email', 'In person', 'Video call']
const DIRECTIONS = ['Inbound', 'Outbound']
const TOPICS = ['Mandate', 'Availability', 'Compensation', 'Staff', 'Reputation', 'Other']
const SENTIMENTS = ['Positive', 'Neutral', 'Negative']
const INTERACTION_TYPES = ['Call', 'Meeting', 'Message', 'Email', 'Other']

const SENTIMENT_CLASSES: Record<string, string> = {
  Positive: 'bg-emerald-900/30 text-emerald-400',
  Negative: 'bg-red-900/30 text-red-400',
  Neutral: 'bg-slate-800/40 text-slate-400',
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatFollowUp(d: string | null): string {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  const base = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (days < 0) return `${base} (overdue)`
  if (days === 0) return `${base} (today)`
  if (days === 1) return `${base} (tomorrow)`
  return `${base} (in ${days}d)`
}

type Props = {
  agentId: string
  interactions: InteractionRow[]
  coaches: { id: string; name: string }[]
  clubs: { id: string; name: string }[]
}

export function AgentInteractionsClient({ agentId, interactions, coaches, clubs }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightedId = searchParams.get('entry')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [channelFilter, setChannelFilter] = useState<string>('')
  const [directionFilter, setDirectionFilter] = useState<string>('')
  const [topicFilter, setTopicFilter] = useState<string>('')
  const [form, setForm] = useState({
    occurred_at: new Date().toISOString().slice(0, 16),
    interaction_type: '',
    channel: '',
    direction: '',
    topic: '',
    summary: '',
    detail: '',
    sentiment: '',
    confidence: '',
    reliability_score: '',
    influence_score: '',
    follow_up_date: '',
    coach_id: '',
    club_id: '',
  })

  let filtered = interactions
  if (channelFilter) filtered = filtered.filter((i) => i.channel === channelFilter)
  if (directionFilter) filtered = filtered.filter((i) => i.direction === directionFilter)
  if (topicFilter) filtered = filtered.filter((i) => i.topic === topicFilter)

  async function handleAdd() {
    const summary = form.summary.trim()
    if (!summary) {
      toastError('Summary is required')
      return
    }
    setSubmitting(true)
    const result = await createAgentInteractionAction({
      agent_id: agentId,
      occurred_at: new Date(form.occurred_at).toISOString(),
      interaction_type: form.interaction_type || null,
      channel: form.channel || null,
      direction: form.direction || null,
      topic: form.topic || null,
      summary,
      detail: form.detail.trim() || null,
      sentiment: form.sentiment || null,
      confidence: form.confidence ? parseInt(form.confidence, 10) : null,
      reliability_score: form.reliability_score ? parseInt(form.reliability_score, 10) : null,
      influence_score: form.influence_score ? parseInt(form.influence_score, 10) : null,
      follow_up_date: form.follow_up_date || null,
      coach_id: form.coach_id || null,
      club_id: form.club_id || null,
    })
    setSubmitting(false)
    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess('Interaction added')
    setDrawerOpen(false)
    setForm({
      occurred_at: new Date().toISOString().slice(0, 16),
      interaction_type: '', channel: '', direction: '', topic: '',
      summary: '', detail: '', sentiment: '', confidence: '',
      reliability_score: '', influence_score: '', follow_up_date: '',
      coach_id: '', club_id: '',
    })
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this interaction?')) return
    const result = await deleteAgentInteractionAction(id, agentId)
    if (!result.ok) toastError(result.error)
    else {
      toastSuccess('Interaction deleted')
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground text-xs">Channel:</span>
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
            <option value="">All</option>
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-muted-foreground text-xs ml-2">Direction:</span>
          <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
            <option value="">All</option>
            {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="text-muted-foreground text-xs ml-2">Topic:</span>
          <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
            <option value="">All</option>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Button variant="outline" className="text-xs" onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add interaction
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No interactions. Add one above.</div>
        ) : (
          filtered.map((item) => {
            const isHighlighted = item.id === highlightedId
            const coachName = item.coach_id ? coaches.find((c) => c.id === item.coach_id)?.name : null
            const clubName = item.club_id ? clubs.find((c) => c.id === item.club_id)?.name : null
            const followUpText = formatFollowUp(item.follow_up_date)
            const isOverdue = followUpText.includes('overdue')

            return (
              <div
                key={item.id}
                id={`entry-${item.id}`}
                className={cn(
                  'px-6 py-4 hover:bg-muted/20 transition-colors',
                  isHighlighted && 'bg-primary/5 ring-1 ring-inset ring-primary/20'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(item.occurred_at)}
                      </span>
                      {item.interaction_type && (
                        <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{item.interaction_type}</span>
                      )}
                      {item.channel && (
                        <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{item.channel}</span>
                      )}
                      {item.direction && (
                        <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{item.direction}</span>
                      )}
                      {item.topic && (
                        <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{item.topic}</span>
                      )}
                      {item.sentiment && (
                        <span className={cn('inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium', SENTIMENT_CLASSES[item.sentiment] ?? 'bg-muted text-muted-foreground')}>{item.sentiment}</span>
                      )}
                      {item.confidence != null && (
                        <span className="text-[10px] tabular-nums text-muted-foreground">{item.confidence}%</span>
                      )}
                    </div>

                    <p className="font-medium text-foreground">{item.summary}</p>
                    {item.detail && <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>}

                    {/* Enhanced fields */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                      {item.reliability_score != null && (
                        <span>Reliability: {item.reliability_score}/100</span>
                      )}
                      {item.influence_score != null && (
                        <span>Influence: {item.influence_score}/100</span>
                      )}
                      {coachName && (
                        <Link href={`/coaches/${item.coach_id}`} className="text-primary hover:underline">
                          Coach: {coachName}
                        </Link>
                      )}
                      {clubName && (
                        <Link href={`/clubs/${item.club_id}`} className="text-primary hover:underline">
                          Club: {clubName}
                        </Link>
                      )}
                      {followUpText && (
                        <span className={cn('font-medium', isOverdue ? 'text-red-400' : 'text-amber-400')}>
                          Follow up: {followUpText}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline shrink-0"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add interaction" footer={
        <Button onClick={handleAdd} disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Date & time</label>
              <input type="datetime-local" value={form.occurred_at} onChange={(e) => setForm((f) => ({ ...f, occurred_at: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Type</label>
              <select value={form.interaction_type} onChange={(e) => setForm((f) => ({ ...f, interaction_type: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="">—</option>
                {INTERACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Channel</label>
              <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="">—</option>
                {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Direction</label>
              <select value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="">—</option>
                {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Topic</label>
            <select value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="">—</option>
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Summary *</label>
            <input type="text" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Brief summary" required />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Detail</label>
            <textarea value={form.detail} onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm min-h-[80px] resize-none" placeholder="Optional" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Sentiment</label>
              <select value={form.sentiment} onChange={(e) => setForm((f) => ({ ...f, sentiment: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="">—</option>
                {SENTIMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Confidence (0–100)</label>
              <input type="number" min={0} max={100} value={form.confidence} onChange={(e) => setForm((f) => ({ ...f, confidence: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Reliability (0–100)</label>
              <input type="number" min={0} max={100} value={form.reliability_score} onChange={(e) => setForm((f) => ({ ...f, reliability_score: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Influence (0–100)</label>
              <input type="number" min={0} max={100} value={form.influence_score} onChange={(e) => setForm((f) => ({ ...f, influence_score: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Optional" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Follow-up date</label>
            <input type="date" value={form.follow_up_date} onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>

          {coaches.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Link to coach</label>
              <select value={form.coach_id} onChange={(e) => setForm((f) => ({ ...f, coach_id: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="">None</option>
                {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {clubs.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Link to club</label>
              <select value={form.club_id} onChange={(e) => setForm((f) => ({ ...f, club_id: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="">None</option>
                {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  )
}
