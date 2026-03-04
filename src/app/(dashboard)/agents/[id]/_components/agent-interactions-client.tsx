'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { createAgentInteractionAction, deleteAgentInteractionAction } from '../../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import type { InteractionRow } from '@/lib/db/agentInteractions'

const CHANNELS = ['Phone', 'WhatsApp', 'Email', 'In person', 'Video call']
const DIRECTIONS = ['Inbound', 'Outbound']
const TOPICS = ['Mandate', 'Availability', 'Compensation', 'Staff', 'Reputation', 'Other']
const SENTIMENTS = ['Positive', 'Neutral', 'Negative']

export function AgentInteractionsClient({ agentId, interactions }: { agentId: string; interactions: InteractionRow[] }) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [channelFilter, setChannelFilter] = useState<string>('')
  const [directionFilter, setDirectionFilter] = useState<string>('')
  const [topicFilter, setTopicFilter] = useState<string>('')
  const [form, setForm] = useState({
    occurred_at: new Date().toISOString().slice(0, 16),
    channel: '',
    direction: '',
    topic: '',
    summary: '',
    detail: '',
    sentiment: '',
    confidence: '',
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
      channel: form.channel.trim() || null,
      direction: form.direction.trim() || null,
      topic: form.topic.trim() || null,
      summary,
      detail: form.detail.trim() || null,
      sentiment: form.sentiment.trim() || null,
      confidence: form.confidence ? parseInt(form.confidence, 10) : null,
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
      channel: '',
      direction: '',
      topic: '',
      summary: '',
      detail: '',
      sentiment: '',
      confidence: '',
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
          <span className="text-muted-foreground">Channel:</span>
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
            <option value="">All</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="text-muted-foreground ml-2">Direction:</span>
          <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
            <option value="">All</option>
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <span className="text-muted-foreground ml-2">Topic:</span>
          <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
            <option value="">All</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
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
          filtered.map((item) => (
            <div key={item.id} className="px-6 py-4 hover:bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.occurred_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {item.channel && <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{item.channel}</span>}
                    {item.direction && <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{item.direction}</span>}
                    {item.topic && <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{item.topic}</span>}
                    {item.sentiment && <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{item.sentiment}</span>}
                    {item.confidence != null && <span className="text-[10px] tabular-nums">{item.confidence}%</span>}
                  </div>
                  <p className="font-medium text-foreground">{item.summary}</p>
                  {item.detail && <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>}
                </div>
                <button type="button" onClick={() => handleDelete(item.id)} className="text-xs text-red-600 dark:text-red-400 hover:underline shrink-0">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add interaction" footer={
        <Button onClick={handleAdd} disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Date & time</label>
            <input type="datetime-local" value={form.occurred_at} onChange={(e) => setForm((f) => ({ ...f, occurred_at: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Channel</label>
            <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="">—</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Direction</label>
            <select value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="">—</option>
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Topic</label>
            <select value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="">—</option>
              {TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Summary *</label>
            <input type="text" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Brief summary" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Detail</label>
            <textarea value={form.detail} onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm min-h-[80px]" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Sentiment</label>
            <select value={form.sentiment} onChange={(e) => setForm((f) => ({ ...f, sentiment: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="">—</option>
              {SENTIMENTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Confidence (0–100)</label>
            <input type="number" min={0} max={100} value={form.confidence} onChange={(e) => setForm((f) => ({ ...f, confidence: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Optional" />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
