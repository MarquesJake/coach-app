'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { createAgentDealAction, deleteAgentDealAction } from '../../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import type { AgentDealRow } from '@/lib/db/agents'

const DEAL_TYPES = ['Appointment', 'Extension', 'Termination', 'Settlement', 'Advisory']

export function AgentDealsClient({ agentId, deals }: { agentId: string; deals: AgentDealRow[] }) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    deal_type: 'Appointment',
    season: '',
    value_band: '',
    notes: '',
    occurred_on: '',
    coach_id: '',
    club_id: '',
  })

  async function handleAdd() {
    setSubmitting(true)
    const result = await createAgentDealAction({
      agent_id: agentId,
      deal_type: form.deal_type,
      season: form.season.trim() || null,
      value_band: form.value_band.trim() || null,
      notes: form.notes.trim() || null,
      occurred_on: form.occurred_on.trim() || null,
      coach_id: form.coach_id.trim() || null,
      club_id: form.club_id.trim() || null,
    })
    setSubmitting(false)
    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess('Deal added')
    setDrawerOpen(false)
    setForm({ deal_type: 'Appointment', season: '', value_band: '', notes: '', occurred_on: '', coach_id: '', club_id: '' })
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this deal?')) return
    const result = await deleteAgentDealAction(id, agentId)
    if (!result.ok) toastError(result.error)
    else {
      toastSuccess('Deal deleted')
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" className="text-xs" onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add deal
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {deals.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No deals. Add one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Type</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Season</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Value band</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Occurred</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Notes</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {deals.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-overlay/30">
                    <td className="py-3 px-4 font-medium">{row.deal_type}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.season ?? '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.value_band ?? '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.occurred_on ? new Date(row.occurred_on).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{row.notes ?? '—'}</td>
                    <td className="py-3 px-4">
                      <button type="button" onClick={() => handleDelete(row.id)} className="text-xs text-red-600 dark:text-red-400 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add deal" footer={
        <Button onClick={handleAdd} disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Deal type</label>
            <select value={form.deal_type} onChange={(e) => setForm((f) => ({ ...f, deal_type: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              {DEAL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Season</label>
            <input type="text" value={form.season} onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="e.g. 2024/25" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Value band</label>
            <input type="text" value={form.value_band} onChange={(e) => setForm((f) => ({ ...f, value_band: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Occurred on (date)</label>
            <input type="date" value={form.occurred_on} onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
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
