'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const REASON_OPTIONS = [
  'Mutual consent',
  'Sacked',
  'Resigned',
  'Contract expired',
  'Promoted internally',
  'Left for another club',
  'Interim — end of tenure',
  'Other',
]

const STYLE_TAG_OPTIONS = [
  'High press',
  'Low block',
  'Possession',
  'Counter-attack',
  'Direct',
  'Build from back',
  'High line',
  'Compact',
  'Gegenpressing',
  'Tiki-taka',
  'Set-piece focus',
  'Youth developer',
]

type HistoryRow = {
  id: string
  club_id: string
  coach_name: string
  start_date: string | null
  end_date: string | null
  reason_for_exit: string | null
  style_tags: string[]
  created_at: string
  data_source?: string | null
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function tenure(start: string | null, end: string | null) {
  if (!start && !end) return '—'
  return `${formatDate(start)} – ${end ? formatDate(end) : 'Present'}`
}

export default function ClubCoachesPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    coach_name: '',
    start_date: '',
    end_date: '',
    reason_for_exit: '',
    style_tags: [] as string[],
  })

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('club_coaching_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .order('start_date', { ascending: false })
    setRows(((data ?? []) as unknown) as HistoryRow[])
    setLoading(false)
  }

  useEffect(() => { load() }, [clubId]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      style_tags: f.style_tags.includes(tag)
        ? f.style_tags.filter((t) => t !== tag)
        : [...f.style_tags, tag],
    }))
  }

  async function handleAdd() {
    if (!form.coach_name.trim()) {
      toastError('Coach name is required')
      return
    }
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const { error } = await supabase.from('club_coaching_history').insert({
      user_id: user.id,
      club_id: clubId,
      coach_name: form.coach_name.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      reason_for_exit: form.reason_for_exit || null,
      style_tags: form.style_tags,
    })
    setSubmitting(false)
    if (error) {
      toastError(error.message)
      return
    }
    toastSuccess('Entry added')
    setDrawerOpen(false)
    setForm({ coach_name: '', start_date: '', end_date: '', reason_for_exit: '', style_tags: [] })
    await load()
    router.refresh()
  }

  async function handleDelete(entryId: string) {
    if (!confirm('Remove this coaching history entry?')) return
    const supabase = createClient()
    const { error } = await supabase.from('club_coaching_history').delete().eq('id', entryId)
    if (error) {
      toastError(error.message)
      return
    }
    toastSuccess('Entry removed')
    await load()
    router.refresh()
  }

  if (loading) {
    return (
      <section className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Coaching history</h2>
          <Button variant="outline" className="text-xs gap-1.5" onClick={() => setDrawerOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add entry
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">No coaching history yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add entries to build a picture of this club&apos;s managerial past.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Coach</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tenure</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Exit reason</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Style</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Source</th>
                  <th className="w-16 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-surface-overlay/30">
                    <td className="px-5 py-3 font-medium text-foreground">{row.coach_name}</td>
                    <td className="px-5 py-3 text-muted-foreground tabular-nums whitespace-nowrap">
                      {tenure(row.start_date, row.end_date)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{row.reason_for_exit ?? '—'}</td>
                    <td className="px-5 py-3">
                      {row.style_tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.style_tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {row.data_source === 'api-football' ? (
                        <span className="text-[9px] text-blue-400/70">API-Football</span>
                      ) : row.data_source === 'thesportsdb' ? (
                        <span className="text-[9px] text-emerald-400/70">TheSportsDB</span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground/50">Manual</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add coaching entry"
        footer={
          <Button onClick={handleAdd} disabled={submitting}>
            {submitting ? 'Saving…' : 'Add entry'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Coach name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.coach_name}
              onChange={(e) => setForm((f) => ({ ...f, coach_name: e.target.value }))}
              placeholder="e.g. Jürgen Klopp"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Start date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">End date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Reason for exit</label>
            <select
              value={form.reason_for_exit}
              onChange={(e) => setForm((f) => ({ ...f, reason_for_exit: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {REASON_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Style tags</label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_TAG_OPTIONS.map((tag) => {
                const selected = form.style_tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                      selected
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
