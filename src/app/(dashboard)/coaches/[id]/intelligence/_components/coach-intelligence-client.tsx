'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, List, GitBranch, Link as LinkIcon } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/types/db'
import { findPotentialDuplicate } from '@/lib/intelligence/coach-intel-signals'

type IntelRow = Database['public']['Tables']['intelligence_items']['Row']

const CATEGORIES = ['Media', 'Tactical', 'Legal', 'Staff', 'Performance', 'Reputation', 'Contract', 'Background', 'Other'] as const
const DIRECTIONS = ['Positive', 'Negative', 'Neutral'] as const
const SENSITIVITIES = ['Standard', 'High'] as const
const SOURCE_TIERS = [1, 2, 3, 4, 5] as const
const SOURCE_TIER_LABELS: Record<number, string> = {
  1: 'T1 — First-hand',
  2: 'T2 — Trusted intermediary',
  3: 'T3 — Industry / press',
  4: 'T4 — Social / rumour',
  5: 'T5 — Anonymous',
}

const DIRECTION_CLASSES: Record<string, string> = {
  Positive: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40',
  Negative: 'bg-red-900/30 text-red-400 border-red-800/40',
  Neutral: 'bg-slate-800/40 text-slate-400 border-slate-700/40',
}

function confidenceLabel(c: number | null): string {
  if (c == null) return ''
  if (c >= 67) return 'High'
  if (c >= 34) return 'Medium'
  return 'Low'
}

function confidenceClasses(c: number | null): string {
  if (c == null) return 'bg-slate-800/40 text-slate-400'
  if (c >= 67) return 'bg-emerald-900/30 text-emerald-400'
  if (c >= 34) return 'bg-amber-900/30 text-amber-400'
  return 'bg-red-900/30 text-red-400'
}

function weightedScore(item: IntelRow): number {
  const conf = item.confidence ?? 50
  const tierStr = item.source_tier
  const tier = tierStr ? parseInt(tierStr, 10) : 3
  const tierWeight = isNaN(tier) ? 3 : Math.max(1, Math.min(5, tier))
  return Math.round(conf * (6 - tierWeight))
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Props = {
  coachId: string
  initialItems: IntelRow[]
  mandates: { id: string; label: string }[]
}

export function CoachIntelligenceClient({ coachId, initialItems, mandates }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<IntelRow[]>(initialItems)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [directionFilter, setDirectionFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')
  const highlightedId = searchParams.get('entry')
  const highlightRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    category: '',
    title: '',
    detail: '',
    direction: '',
    sensitivity: 'Standard',
    source_type: '',
    source_name: '',
    source_tier: '',
    source_notes: '',
    source_link: '',
    confidence: '',
    occurred_at: new Date().toISOString().slice(0, 10),
    verified: false,
    mandate_id: '',
  })

  // Scroll to highlighted entry on load
  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setExpandedId(highlightedId)
    }
  }, [highlightedId])

  const active = useMemo(() => items.filter((i) => !i.is_deleted), [items])

  let filtered = active
  if (categoryFilter) filtered = filtered.filter((i) => i.category === categoryFilter)
  if (directionFilter) filtered = filtered.filter((i) => i.direction === directionFilter)

  // Sort by occurred_at desc, then created_at desc
  filtered = [...filtered].sort((a, b) => {
    const da = new Date(a.occurred_at ?? a.created_at).getTime()
    const db = new Date(b.occurred_at ?? b.created_at).getTime()
    return db - da
  })

  // Category groups for pattern detection
  const categoryGroups = useMemo(() => {
    const map: Record<string, { count: number; negCount: number }> = {}
    for (const item of active) {
      const cat = item.category ?? 'Uncategorised'
      if (!map[cat]) map[cat] = { count: 0, negCount: 0 }
      map[cat].count++
      if (item.direction === 'Negative') map[cat].negCount++
    }
    return map
  }, [active])

  const patterns = Object.entries(categoryGroups)
    .filter(([, v]) => v.count >= 3)
    .sort((a, b) => b[1].count - a[1].count)

  // Mandate label lookup for inline context display
  const mandateMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const m of mandates) map[m.id] = m.label
    return map
  }, [mandates])

  // Timeline groups: filtered items grouped by year–month (newest first)
  const timelineGroups = useMemo(() => {
    type Group = { yearLabel: string; monthLabel: string; sortKey: string; items: IntelRow[] }
    const map: Record<string, Group> = {}
    for (const item of filtered) {
      const d = new Date(item.occurred_at ?? item.created_at)
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map[sortKey]) {
        map[sortKey] = {
          yearLabel: d.getFullYear().toString(),
          monthLabel: d.toLocaleString('en-GB', { month: 'long' }),
          sortKey,
          items: [],
        }
      }
      map[sortKey].items.push(item)
    }
    return Object.values(map).sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  }, [filtered])

  // Form quality warnings
  const dupWarning = useMemo(() => {
    if (!form.title.trim()) return null
    const intelItems = active.map((i) => ({
      id: i.id,
      direction: i.direction,
      confidence: i.confidence,
      source_tier: i.source_tier,
      category: i.category,
      title: i.title,
      sensitivity: i.sensitivity ?? 'Standard',
      occurred_at: i.occurred_at,
      created_at: i.created_at,
    }))
    return findPotentialDuplicate(intelItems, form.title, form.category || null, form.occurred_at || null)
  }, [form.title, form.category, form.occurred_at, active])

  const tier = form.source_tier ? parseInt(form.source_tier, 10) : null
  const conf = form.confidence ? parseInt(form.confidence, 10) : null
  const warnT1NoName = tier === 1 && !form.source_name.trim()
  const warnHighConfWeakTier = conf !== null && conf >= 67 && tier !== null && tier >= 4

  async function handleAdd() {
    if (!form.title.trim()) {
      toastError('Title is required')
      return
    }
    setSubmitting(true)
    const { createIntelligenceItemAction } = await import('@/app/(dashboard)/intelligence/actions')
    const result = await createIntelligenceItemAction({
      entity_type: 'coach',
      entity_id: coachId,
      title: form.title.trim(),
      detail: form.detail.trim() || null,
      category: form.category || null,
      direction: (form.direction as 'Positive' | 'Negative' | 'Neutral' | '') || undefined,
      sensitivity: form.sensitivity || 'Standard',
      source_type: form.source_type.trim() || null,
      source_name: form.source_name.trim() || null,
      source_tier: form.source_tier || null,
      source_notes: form.source_notes.trim() || null,
      source_link: form.source_link.trim() || null,
      confidence: form.confidence ? parseInt(form.confidence, 10) : null,
      occurred_at: form.occurred_at || null,
      verified: form.verified,
      mandate_id: form.mandate_id || null,
    })
    setSubmitting(false)
    if (result.error) {
      toastError(result.error)
      return
    }
    toastSuccess('Intelligence added')
    setDrawerOpen(false)
    setForm({
      category: '', title: '', detail: '', direction: '', sensitivity: 'Standard',
      source_type: '', source_name: '', source_tier: '', source_notes: '', source_link: '',
      confidence: '', occurred_at: new Date().toISOString().slice(0, 10),
      verified: false, mandate_id: '',
    })
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Soft-delete this intelligence entry?')) return
    const { softDeleteIntelligenceItemAction } = await import('../../_actions/intelligence-actions')
    const result = await softDeleteIntelligenceItemAction(id, coachId)
    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess('Entry removed')
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_deleted: true } : i))
  }

  return (
    <div className="space-y-4">
      {/* Filters + View toggle + Add */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded border border-border bg-surface px-2 text-xs"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="h-8 rounded border border-border bg-surface px-2 text-xs"
          >
            <option value="">All directions</option>
            {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 rounded border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="List view"
              className={cn(
                'flex items-center gap-1 h-6 px-2 rounded text-[10px] transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="w-3 h-3" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              title="Timeline view"
              className={cn(
                'flex items-center gap-1 h-6 px-2 rounded text-[10px] transition-colors',
                viewMode === 'timeline' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <GitBranch className="w-3 h-3" />
              Timeline
            </button>
          </div>
        </div>
        <Button variant="outline" className="text-xs" onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add intelligence
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {(['Positive', 'Neutral', 'Negative'] as const).map((dir) => {
          const count = items.filter((i) => !i.is_deleted && i.direction === dir).length
          return (
            <div key={dir} className="rounded-lg border border-border bg-card px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{dir}</p>
              <p className="text-2xl font-semibold text-foreground">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Pattern detection */}
      {patterns.length > 0 && !categoryFilter && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
            <TrendingUp className="w-3.5 h-3.5" />
            Patterns detected
          </div>
          <div className="flex flex-wrap gap-2">
            {patterns.map(([cat, { count, negCount }]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className="flex items-center gap-1.5 rounded border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-400/20 transition-colors"
              >
                <span className="font-medium">{cat}</span>
                <span className="text-amber-400/70">·</span>
                <span>{count} entries</span>
                {negCount > 0 && (
                  <span className="ml-0.5 text-red-400">{negCount} negative</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── List / Timeline rendering ── */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          No intelligence entries. Add one above.
        </div>
      ) : viewMode === 'list' ? (
        /* ── List view ── */
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {filtered.map((item) => {
            const isHighlighted = item.id === highlightedId
            const isExpanded = expandedId === item.id
            const ws = weightedScore(item)
            const itemTier = item.source_tier ? parseInt(item.source_tier, 10) : null
            const isLowSignal = itemTier !== null && itemTier >= 4 && (item.confidence ?? 100) <= 33
            const isPattern = item.category !== null && (categoryGroups[item.category]?.count ?? 0) >= 3
            const mandateLabel = item.mandate_id ? mandateMap[item.mandate_id] : null
            return (
              <div
                key={item.id}
                ref={isHighlighted ? highlightRef : undefined}
                className={cn(
                  'px-5 py-4 transition-colors',
                  isHighlighted ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/20',
                  isLowSignal && 'opacity-50'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {item.direction && (
                        <span className={cn('inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium', DIRECTION_CLASSES[item.direction] ?? 'bg-muted text-muted-foreground')}>
                          {item.direction}
                        </span>
                      )}
                      {item.category && (
                        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {item.category}
                        </span>
                      )}
                      {isPattern && (
                        <span className="inline-flex items-center gap-0.5 rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                          <TrendingUp className="w-2.5 h-2.5" />
                          Pattern
                        </span>
                      )}
                      {item.sensitivity === 'High' && (
                        <span className="inline-flex items-center rounded bg-red-900/20 text-red-400 border border-red-800/30 px-1.5 py-0.5 text-[10px] font-medium">
                          Sensitive
                        </span>
                      )}
                      {item.confidence != null && (
                        <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium', confidenceClasses(item.confidence))}>
                          {confidenceLabel(item.confidence)} · {item.confidence}%
                        </span>
                      )}
                      {item.source_tier && (
                        <span className="inline-flex items-center rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {SOURCE_TIER_LABELS[parseInt(item.source_tier, 10)] ?? `T${item.source_tier}`}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
                        {formatDate(item.occurred_at ?? item.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="font-medium text-foreground">{item.title}</p>

                    {/* Detail (collapsible) */}
                    {item.detail && (
                      <>
                        {isExpanded && (
                          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.detail}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'Less' : 'More'}
                        </button>
                      </>
                    )}

                    {/* Footer: source + mandate context + weighted score */}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {item.source_name && (
                        <span className="text-[10px] text-muted-foreground">
                          {item.source_type ? `${item.source_type}: ` : 'Source: '}{item.source_name}
                        </span>
                      )}
                      {mandateLabel && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary/70">
                          <LinkIcon className="w-2.5 h-2.5" />
                          {mandateLabel}
                        </span>
                      )}
                      {item.verified && (
                        <span className="text-[10px] text-emerald-400">✓ Verified</span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                        Weight: {ws}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="shrink-0 text-muted-foreground hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Timeline view ── */
        <div className="space-y-6">
          {timelineGroups.map((group, gi) => {
            return (
              <div key={group.sortKey}>
                {/* Year separator */}
                {(gi === 0 || timelineGroups[gi - 1]?.yearLabel !== group.yearLabel) && (
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-foreground tabular-nums">{group.yearLabel}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                {/* Month label */}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 ml-7">
                  {group.monthLabel}
                </p>

                {/* Entries with timeline spine */}
                <div className="relative">
                  {/* Vertical spine */}
                  <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />

                  <div className="space-y-3">
                    {group.items.map((item) => {
                      const isHighlighted = item.id === highlightedId
                      const isExpanded = expandedId === item.id
                      const ws = weightedScore(item)
                      const itemTier = item.source_tier ? parseInt(item.source_tier, 10) : null
                      const isLowSignal = itemTier !== null && itemTier >= 4 && (item.confidence ?? 100) <= 33
                      const isPattern = item.category !== null && (categoryGroups[item.category]?.count ?? 0) >= 3
                      const mandateLabel = item.mandate_id ? mandateMap[item.mandate_id] : null
                      const dotColor =
                        item.direction === 'Positive' ? 'bg-emerald-400' :
                        item.direction === 'Negative' ? 'bg-red-400' :
                        'bg-muted-foreground/40'

                      return (
                        <div
                          key={item.id}
                          ref={isHighlighted ? highlightRef : undefined}
                          className={cn(
                            'flex items-start gap-3',
                            isLowSignal && 'opacity-50'
                          )}
                        >
                          {/* Timeline dot */}
                          <div className={cn('w-5 h-5 rounded-full border-2 border-background shrink-0 mt-1 z-10', dotColor)} />

                          {/* Entry card */}
                          <div className={cn(
                            'flex-1 rounded-lg border bg-card px-4 py-3 transition-colors',
                            isHighlighted ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/20',
                          )}>
                            {/* Badges + date */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              {item.direction && (
                                <span className={cn('inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium', DIRECTION_CLASSES[item.direction] ?? 'bg-muted text-muted-foreground')}>
                                  {item.direction}
                                </span>
                              )}
                              {item.category && (
                                <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  {item.category}
                                </span>
                              )}
                              {isPattern && (
                                <span className="inline-flex items-center gap-0.5 rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                                  <TrendingUp className="w-2.5 h-2.5" />
                                  Pattern
                                </span>
                              )}
                              {item.sensitivity === 'High' && (
                                <span className="inline-flex items-center rounded bg-red-900/20 text-red-400 border border-red-800/30 px-1.5 py-0.5 text-[10px] font-medium">
                                  Sensitive
                                </span>
                              )}
                              {item.confidence != null && (
                                <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium', confidenceClasses(item.confidence))}>
                                  {confidenceLabel(item.confidence)} · {item.confidence}%
                                </span>
                              )}
                              {item.source_tier && (
                                <span className="inline-flex items-center rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  {SOURCE_TIER_LABELS[parseInt(item.source_tier, 10)] ?? `T${item.source_tier}`}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
                                {formatDate(item.occurred_at ?? item.created_at)}
                              </span>
                            </div>

                            {/* Title */}
                            <p className="font-medium text-foreground text-sm">{item.title}</p>

                            {/* Detail (collapsible) */}
                            {item.detail && (
                              <>
                                {isExpanded && (
                                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.detail}</p>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                  className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  {isExpanded ? 'Less' : 'More'}
                                </button>
                              </>
                            )}

                            {/* Footer: source + mandate context + weight */}
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              {item.source_name && (
                                <span className="text-[10px] text-muted-foreground">
                                  {item.source_type ? `${item.source_type}: ` : 'Source: '}{item.source_name}
                                </span>
                              )}
                              {mandateLabel && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-primary/70">
                                  <LinkIcon className="w-2.5 h-2.5" />
                                  {mandateLabel}
                                </span>
                              )}
                              {item.verified && (
                                <span className="text-[10px] text-emerald-400">✓ Verified</span>
                              )}
                              <div className="ml-auto flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                  Weight: {ws}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  className="text-muted-foreground hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add intelligence"
        footer={
          <Button onClick={handleAdd} disabled={submitting}>
            {submitting ? 'Adding…' : 'Add'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="">—</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
            <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Brief intelligence note"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Detail</label>
            <textarea
              value={form.detail}
              onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm min-h-[80px] resize-none"
              placeholder="Optional full detail"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Date</label>
              <input type="date" value={form.occurred_at} onChange={(e) => setForm((f) => ({ ...f, occurred_at: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Sensitivity</label>
              <select value={form.sensitivity} onChange={(e) => setForm((f) => ({ ...f, sensitivity: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                {SENSITIVITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Source tier</label>
              <select value={form.source_tier} onChange={(e) => setForm((f) => ({ ...f, source_tier: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="">—</option>
                {SOURCE_TIERS.map((t) => <option key={t} value={String(t)}>{SOURCE_TIER_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Confidence (0–100)</label>
              <input type="number" min={0} max={100} value={form.confidence} onChange={(e) => setForm((f) => ({ ...f, confidence: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Optional" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Source name</label>
            <input type="text" value={form.source_name} onChange={(e) => setForm((f) => ({ ...f, source_name: e.target.value }))} className={cn('w-full rounded-lg border bg-surface px-3 py-2 text-sm', warnT1NoName ? 'border-amber-400/60' : 'border-border')} placeholder="Optional" />
            {warnT1NoName && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-400">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                T1 source requires a source name for traceability.
              </p>
            )}
          </div>

          {warnHighConfWeakTier && (
            <div className="flex items-start gap-2 rounded border border-amber-400/30 bg-amber-400/5 px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
              <p className="text-[11px] text-amber-300">High confidence on a weak-tier source (T4–T5). Consider lowering confidence or upgrading the source tier.</p>
            </div>
          )}

          {dupWarning && (
            <div className="flex items-start gap-2 rounded border border-amber-400/30 bg-amber-400/5 px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
              <p className="text-[11px] text-amber-300">Possible duplicate: &ldquo;<span className="font-medium">{dupWarning.title}</span>&rdquo; was logged in the past 30 days in this category.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Source notes</label>
            <textarea value={form.source_notes} onChange={(e) => setForm((f) => ({ ...f, source_notes: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="Optional" />
          </div>

          {mandates.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Link to mandate</label>
              <select value={form.mandate_id} onChange={(e) => setForm((f) => ({ ...f, mandate_id: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="">None</option>
                {mandates.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="verified" checked={form.verified} onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))} className="rounded border-border" />
            <label htmlFor="verified" className="text-xs text-foreground">Mark as verified</label>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
