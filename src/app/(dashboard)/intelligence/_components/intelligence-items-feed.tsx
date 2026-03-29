'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createIntelligenceItemAction } from '../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Item = {
  id: string
  entity_type: string
  entity_id: string
  category: string | null
  title: string
  detail: string | null
  direction: string | null
  sensitivity: string | null
  source_type: string | null
  source_name: string | null
  source_tier: string | null
  confidence: number | null
  occurred_at: string | null
  created_at: string
}

type Option = { id: string; name: string }

const CONFIDENCE_BUCKETS = ['All', 'High (67–100)', 'Medium (34–66)', 'Low (0–33)'] as const
const CATEGORIES = ['All', 'Media', 'Tactical', 'Legal', 'Staff', 'Performance'] as const

function formatItemDate(dateStr: string | null, createdFallback: string): string {
  const raw = dateStr || createdFallback
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function IntelligenceItemsFeed() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [coachFilter, setCoachFilter] = useState<string>('all')
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [coaches, setCoaches] = useState<Option[]>([])
  const [staff, setStaff] = useState<Option[]>([])
  const [clubs, setClubs] = useState<Option[]>([])
  const [mandates, setMandates] = useState<Option[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ entity_type: 'coach' as string, entity_id: '', title: '', detail: '', source_name: '', confidence: '' })
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setItems([])
        setLoading(false)
        return
      }
      const [itemsRes, coachesRes] = await Promise.all([
        supabase
          .from('intelligence_items')
          .select('id, entity_type, entity_id, category, title, detail, direction, sensitivity, source_type, source_name, source_tier, confidence, occurred_at, created_at')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('occurred_at', { ascending: false, nullsFirst: false })
          .limit(100),
        supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
      ])
      setItems((itemsRes.data as Item[]) ?? [])
      setCoaches((coachesRes.data ?? []).map((r) => ({ id: r.id, name: (r as { name: string }).name })))
      setLoading(false)
    }
    load()
  }, [supabase])

  async function loadOptions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [c, s, cl, m] = await Promise.all([
      supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
      supabase.from('staff').select('id, full_name').eq('user_id', user.id).order('full_name'),
      supabase.from('clubs').select('id, name').eq('user_id', user.id).order('name'),
      supabase.from('mandates').select('id').eq('user_id', user.id).limit(200),
    ])
    setCoaches((c.data ?? []).map((r) => ({ id: r.id, name: (r as { name: string }).name })))
    setStaff((s.data ?? []).map((r) => ({ id: r.id, name: (r as { full_name: string }).full_name })))
    setClubs((cl.data ?? []).map((r) => ({ id: r.id, name: (r as { name: string }).name })))
    const mandateIds = (m.data ?? []).map((x) => x.id)
    const mandateNames = mandateIds.length ? await supabase.from('mandates').select('id, custom_club_name, club_id').in('id', mandateIds) : { data: [] }
    const withClubs = mandateNames.data ?? []
    setMandates(withClubs.map((row: { id: string; custom_club_name?: string | null; club_id?: string | null }) => ({ id: row.id, name: (row.custom_club_name as string) || row.id })))
  }

  let filtered = entityFilter === 'all' ? items : items.filter((i) => i.entity_type === entityFilter)
  if (coachFilter !== 'all') filtered = filtered.filter((i) => i.entity_type === 'coach' && i.entity_id === coachFilter)
  if (categoryFilter !== 'all') filtered = filtered.filter((i) => (i.category ?? '') === categoryFilter)
  if (confidenceFilter === 'High (67–100)') filtered = filtered.filter((i) => i.confidence != null && i.confidence >= 67)
  else if (confidenceFilter === 'Medium (34–66)') filtered = filtered.filter((i) => i.confidence != null && i.confidence >= 34 && i.confidence <= 66)
  else if (confidenceFilter === 'Low (0–33)') filtered = filtered.filter((i) => i.confidence != null && i.confidence <= 33)

  // Deep-link: coach entries go directly to the intelligence tab with the entry highlighted.
  // Other entities link to their profile root (or intel tab if available).
  const entityHref = (e: Item) => {
    if (e.entity_type === 'coach') return `/coaches/${e.entity_id}/intelligence?entry=${e.id}`
    if (e.entity_type === 'staff') return `/staff/${e.entity_id}`
    if (e.entity_type === 'club') return `/clubs/${e.entity_id}`
    if (e.entity_type === 'mandate') return `/mandates/${e.entity_id}/workspace`
    return '#'
  }

  const entityTabLabel = (e: Item) => {
    if (e.entity_type === 'coach') return 'Open in Intel tab →'
    if (e.entity_type === 'mandate') return 'Open workspace →'
    return `View ${e.entity_type} →`
  }

  async function handleAdd() {
    const entityId = form.entity_type === 'coach' ? form.entity_id : form.entity_type === 'staff' ? form.entity_id : form.entity_type === 'club' ? form.entity_id : form.entity_id
    if (!form.title.trim() || !entityId) {
      toastError('Title and entity are required')
      return
    }
    setSubmitting(true)
    const { data, error } = await createIntelligenceItemAction({
      entity_type: form.entity_type,
      entity_id: entityId,
      title: form.title.trim(),
      detail: form.detail.trim() || null,
      source_name: form.source_name.trim() || null,
      confidence: form.confidence ? parseInt(form.confidence, 10) : null,
    })
    setSubmitting(false)
    if (error) {
      toastError(error)
      return
    }
    toastSuccess('Evidence item added')
    setModalOpen(false)
    setForm({ entity_type: 'coach', entity_id: '', title: '', detail: '', source_name: '', confidence: '' })
    const newItem: Item = {
      id: data!.id,
      entity_type: form.entity_type,
      entity_id: entityId,
      category: null,
      title: form.title.trim(),
      detail: form.detail.trim() || null,
      direction: null,
      sensitivity: null,
      source_type: null,
      source_name: form.source_name.trim() || null,
      source_tier: null,
      confidence: form.confidence ? parseInt(form.confidence, 10) : null,
      occurred_at: null,
      created_at: new Date().toISOString(),
    }
    setItems((prev) => [newItem, ...prev])
  }

  const options = form.entity_type === 'coach' ? coaches : form.entity_type === 'staff' ? staff : form.entity_type === 'club' ? clubs : mandates

  const openAddModal = () => {
    loadOptions()
    setModalOpen(true)
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Evidence & intelligence</h2>
        <Button variant="outline" onClick={openAddModal} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </div>
      <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-2">
        {['all', 'coach', 'staff', 'club', 'mandate'].map((t) => (
          <button
            key={t}
            onClick={() => setEntityFilter(t)}
            className={cn(
              'px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
              entityFilter === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        {entityFilter === 'coach' && (
          <select
            value={coachFilter}
            onChange={(e) => setCoachFilter(e.target.value)}
            className="h-7 rounded border border-border bg-surface px-2 text-xs text-foreground"
          >
            <option value="all">All coaches</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <select
          value={confidenceFilter}
          onChange={(e) => setConfidenceFilter(e.target.value)}
          className="h-7 rounded border border-border bg-surface px-2 text-xs text-foreground"
        >
          {CONFIDENCE_BUCKETS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-7 rounded border border-border bg-surface px-2 text-xs text-foreground"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No data available.</div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((item) => {
            const dirClass =
              item.direction === 'Positive' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40' :
              item.direction === 'Negative' ? 'bg-red-900/30 text-red-400 border-red-800/40' :
              'bg-slate-800/40 text-slate-400 border-slate-700/40'
            return (
              <div key={item.id} className="px-6 py-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badge row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      {item.direction && (
                        <span className={cn('inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium', dirClass)}>
                          {item.direction}
                        </span>
                      )}
                      {item.category && (
                        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {item.category}
                        </span>
                      )}
                      {item.sensitivity === 'High' && (
                        <span className="inline-flex items-center rounded bg-red-900/20 text-red-400 border border-red-800/30 px-1.5 py-0.5 text-[10px] font-medium">
                          Sensitive
                        </span>
                      )}
                      {item.source_tier && (
                        <span className="inline-flex items-center rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          T{item.source_tier}
                        </span>
                      )}
                      {item.confidence != null && (
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {item.confidence}% conf.
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                        {formatItemDate(item.occurred_at, item.created_at)}
                      </span>
                    </div>

                    {/* Entity label + title */}
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.entity_type}</span>
                    <h3 className="font-medium text-foreground mt-0.5 leading-snug">{item.title}</h3>
                    {item.detail && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.detail}</p>
                    )}

                    {/* Deep link */}
                    <Link href={entityHref(item)} className="text-xs text-primary hover:underline mt-1.5 inline-block">
                      {entityTabLabel(item)}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating Add intelligence button */}
      <button
        type="button"
        onClick={openAddModal}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Add intelligence"
      >
        <Plus className="w-5 h-5" />
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setModalOpen(false)}>
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground">Add evidence item</h3>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Entity type</label>
              <select
                value={form.entity_type}
                onChange={(e) => setForm((f) => ({ ...f, entity_type: e.target.value, entity_id: '' }))}
                className="w-full px-3 py-2 rounded border border-border bg-surface text-sm"
              >
                <option value="coach">Coach</option>
                <option value="staff">Staff</option>
                <option value="club">Club</option>
                <option value="mandate">Mandate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Entity</label>
              <select
                value={form.entity_id}
                onChange={(e) => setForm((f) => ({ ...f, entity_id: e.target.value }))}
                className="w-full px-3 py-2 rounded border border-border bg-surface text-sm"
              >
                <option value="">Select…</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded border border-border bg-surface text-sm"
                placeholder="Short title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Detail</label>
              <textarea value={form.detail} onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm min-h-[60px]" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Source name</label>
              <input value={form.source_name} onChange={(e) => setForm((f) => ({ ...f, source_name: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Confidence (0–100)</label>
              <input type="number" min={0} max={100} value={form.confidence} onChange={(e) => setForm((f) => ({ ...f, confidence: e.target.value }))} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" placeholder="Optional" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd} disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
