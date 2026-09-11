'use client'

import { useState } from 'react'
import { captureAgentResult } from '@/lib/agents/forms'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { upsertCoachAgentAction, deleteCoachAgentAction } from '../../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

type LinkRow = {
  id: string
  coach_id: string
  relationship_type: string
  started_on: string | null
  ended_on: string | null
  relationship_strength: number | null
  notes: string | null
  coaches?: { id: string; name: string; role_current: string | null; club_current: string | null } | null
}

export function AgentCoachesClient({
  agentId,
  links,
  coachesOptions,
}: {
  agentId: string
  links: LinkRow[]
  coachesOptions: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState({ coach_id: '', relationship_type: 'Primary', relationship_strength: '', notes: '' })

  const linkedCoachIds = links.map((l) => l.coach_id)
  const availableCoaches = coachesOptions.filter((c) => !linkedCoachIds.includes(c.id))

  async function handleAdd() {
    if (submitting) return
    if (!form.coach_id.trim()) {
      toastError('Select a coach')
      return
    }
    setSubmitting(true)
    setSaveError(null)
    const result = await captureAgentResult(() => upsertCoachAgentAction({
      coach_id: form.coach_id,
      agent_id: agentId,
      relationship_type: form.relationship_type,
      relationship_strength: form.relationship_strength === '' ? null : Number(form.relationship_strength),
      notes: form.notes.trim() || null,
    }))
    setSubmitting(false)
    if (!result.ok) {
      setSaveError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess('Link saved')
    setDrawerOpen(false)
    setForm({ coach_id: '', relationship_type: 'Primary', relationship_strength: '', notes: '' })
    router.refresh()
  }

  async function handleDelete(linkId: string, coachId: string) {
    if (!confirm('Remove this coach link?')) return
    const result = await captureAgentResult(() => deleteCoachAgentAction(linkId, agentId, coachId))
    setSaveError(result.ok ? null : result.error)
    if (!result.ok) toastError(result.error)
    else {
      toastSuccess('Link removed')
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
      <div className="flex justify-end">
        <Button variant="outline" className="text-xs" onClick={() => setDrawerOpen(true)} disabled={availableCoaches.length === 0}>
          <Plus className="w-4 h-4 mr-1" />
          Add coach link
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <p className="p-3 text-xs text-muted-foreground">Ratings are our analysts’ estimates, not confirmed facts. Manage records in the <Link className="text-primary underline" href="/coaches">directory</Link>.</p>
        {links.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No coaches linked. Add a coach link above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Coach</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Role</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Club</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Type</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Strength</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Dates</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {links.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-overlay/30">
                    <td className="py-3 px-4">
                      <Link href={`/coaches/${row.coach_id}`} className="font-medium text-primary hover:underline">
                        {row.coaches?.name ?? row.coach_id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{row.coaches?.role_current ?? '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.coaches?.club_current ?? '—'}</td>
                    <td className="py-3 px-4">{row.relationship_type}</td>
                    <td className="py-3 px-4 tabular-nums">{row.relationship_strength != null ? `${row.relationship_strength}%` : '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {row.started_on ? new Date(row.started_on).toLocaleDateString() : '—'}
                      {row.ended_on ? ` – ${new Date(row.ended_on).toLocaleDateString()}` : ''}
                    </td>
                    <td className="py-3 px-4">
                      <button type="button" onClick={() => handleDelete(row.id, row.coach_id)} className="text-xs text-red-600 dark:text-red-400 hover:underline">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add coach link" footer={
        <Button onClick={handleAdd} disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
      }>
        <div className="space-y-4">
          {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Coach</label>
            <select value={form.coach_id} onChange={(e) => setForm((f) => ({ ...f, coach_id: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="">Select…</option>
              {availableCoaches.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Relationship type</label>
            <select value={form.relationship_type} onChange={(e) => setForm((f) => ({ ...f, relationship_type: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
              <option value="Historical">Historical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Strength (0–100)</label>
            <input aria-label="Recorded relationship strength, optional" type="number" min={0} max={100} value={form.relationship_strength} onChange={(e) => setForm((f) => ({ ...f, relationship_strength: e.target.value }))} placeholder="Not recorded" className="w-full rounded border border-border bg-background px-3 py-2" />
            <span className="text-xs text-muted-foreground">{form.relationship_strength}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm min-h-[60px]" placeholder="Optional" />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
