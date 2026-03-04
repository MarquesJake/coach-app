'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { upsertAgentClubRelationshipAction, deleteAgentClubRelationshipAction } from '../../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

type LinkRow = {
  id: string
  club_id: string
  relationship_type: string
  relationship_strength: number | null
  last_active_on: string | null
  notes: string | null
  clubs?: { id: string; name: string; league: string | null } | null
}

export function AgentClubsClient({
  agentId,
  links,
  clubsOptions,
}: {
  agentId: string
  links: LinkRow[]
  clubsOptions: { id: string; name: string; league: string | null }[]
}) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ club_id: '', relationship_type: 'Intermediary', relationship_strength: 60, last_active_on: '', notes: '' })

  const linkedClubIds = links.map((l) => l.club_id)
  const availableClubs = clubsOptions.filter((c) => !linkedClubIds.includes(c.id))

  async function handleAdd() {
    if (!form.club_id.trim()) {
      toastError('Select a club')
      return
    }
    setSubmitting(true)
    const result = await upsertAgentClubRelationshipAction({
      agent_id: agentId,
      club_id: form.club_id,
      relationship_type: form.relationship_type,
      relationship_strength: form.relationship_strength,
      last_active_on: form.last_active_on.trim() || null,
      notes: form.notes.trim() || null,
    })
    setSubmitting(false)
    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess('Relationship saved')
    setDrawerOpen(false)
    setForm({ club_id: '', relationship_type: 'Intermediary', relationship_strength: 60, last_active_on: '', notes: '' })
    router.refresh()
  }

  async function handleDelete(linkId: string, clubId: string) {
    if (!confirm('Remove this club relationship?')) return
    const result = await deleteAgentClubRelationshipAction(linkId, agentId, clubId)
    if (!result.ok) toastError(result.error)
    else {
      toastSuccess('Relationship removed')
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" className="text-xs" onClick={() => setDrawerOpen(true)} disabled={availableClubs.length === 0}>
          <Plus className="w-4 h-4 mr-1" />
          Add club link
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {links.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No clubs linked. Add a club relationship above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Club</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">League</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Type</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Strength</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Last active</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {links.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-overlay/30">
                    <td className="py-3 px-4">
                      <Link href={`/clubs/${row.club_id}`} className="font-medium text-primary hover:underline">
                        {row.clubs?.name ?? row.club_id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{row.clubs?.league ?? '—'}</td>
                    <td className="py-3 px-4">{row.relationship_type}</td>
                    <td className="py-3 px-4 tabular-nums">{row.relationship_strength != null ? `${row.relationship_strength}%` : '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.last_active_on ? new Date(row.last_active_on).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4">
                      <button type="button" onClick={() => handleDelete(row.id, row.club_id)} className="text-xs text-red-600 dark:text-red-400 hover:underline">
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

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add club relationship" footer={
        <Button onClick={handleAdd} disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Club</label>
            <select value={form.club_id} onChange={(e) => setForm((f) => ({ ...f, club_id: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="">Select…</option>
              {availableClubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.league ? `(${c.league})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Relationship type</label>
            <select value={form.relationship_type} onChange={(e) => setForm((f) => ({ ...f, relationship_type: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="Intermediary">Intermediary</option>
              <option value="Preferred">Preferred</option>
              <option value="Ad-hoc">Ad-hoc</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Strength (0–100)</label>
            <input type="range" min={0} max={100} value={form.relationship_strength} onChange={(e) => setForm((f) => ({ ...f, relationship_strength: parseInt(e.target.value, 10) }))} className="w-full" />
            <span className="text-xs text-muted-foreground">{form.relationship_strength}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Last active (date)</label>
            <input type="date" value={form.last_active_on} onChange={(e) => setForm((f) => ({ ...f, last_active_on: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
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
