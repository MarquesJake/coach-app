'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { upsertCoachAgentAction, deleteCoachAgentAction } from '@/app/(dashboard)/agents/actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

type LinkRow = {
  id: string
  agent_id: string
  relationship_type: string
  relationship_strength: number | null
  confidence: number | null
  notes: string | null
  agents?: { id: string; full_name: string | null; agency_name: string | null } | null
}

export function CoachAgentsSection({
  coachId,
  links,
  agentsOptions,
}: {
  coachId: string
  links: LinkRow[]
  agentsOptions: { id: string; full_name: string | null; agency_name: string | null }[]
}) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ agent_id: '', relationship_type: 'Primary', relationship_strength: 70, confidence: 70, notes: '' })

  const linkedAgentIds = links.map((l) => l.agent_id)
  const availableAgents = agentsOptions.filter((a) => !linkedAgentIds.includes(a.id))

  const primaryFirst = [...links].sort((a, b) => (a.relationship_type === 'Primary' ? -1 : b.relationship_type === 'Primary' ? 1 : 0))

  async function handleAdd() {
    if (!form.agent_id.trim()) {
      toastError('Select an agent')
      return
    }
    setSubmitting(true)
    const result = await upsertCoachAgentAction({
      coach_id: coachId,
      agent_id: form.agent_id,
      relationship_type: form.relationship_type,
      relationship_strength: form.relationship_strength,
      confidence: form.confidence,
      notes: form.notes.trim() || null,
    })
    setSubmitting(false)
    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess('Agent link saved')
    setDrawerOpen(false)
    setForm({ agent_id: '', relationship_type: 'Primary', relationship_strength: 70, confidence: 70, notes: '' })
    router.refresh()
  }

  async function handleDelete(linkId: string, agentId: string) {
    if (!confirm('Remove this agent link?')) return
    const result = await deleteCoachAgentAction(linkId, agentId, coachId)
    if (!result.ok) toastError(result.error)
    else {
      toastSuccess('Link removed')
      router.refresh()
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-foreground">Agents</h2>
        <Button variant="outline" className="text-xs" onClick={() => setDrawerOpen(true)}>
          Manage agents
        </Button>
      </div>
      {primaryFirst.length === 0 ? (
        <p className="text-sm text-muted-foreground">No agents linked. Click Manage agents to add.</p>
      ) : (
        <ul className="space-y-2">
          {primaryFirst.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
              <div>
                <Link href={`/agents/${row.agent_id}`} className="font-medium text-primary hover:underline">
                  {row.agents?.full_name ?? row.agent_id}
                </Link>
                {row.agents?.agency_name && <span className="text-xs text-muted-foreground ml-1">({row.agents.agency_name})</span>}
                {row.relationship_type !== 'Primary' && <span className="text-xs text-muted-foreground ml-1">· {row.relationship_type}</span>}
              </div>
              <button type="button" onClick={() => handleDelete(row.id, row.agent_id)} className="text-xs text-red-600 dark:text-red-400 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Manage agents" footer={
        <Button onClick={handleAdd} disabled={submitting || availableAgents.length === 0}>{submitting ? 'Saving…' : 'Add link'}</Button>
      }>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Add an agent link to this coach. Existing links are shown above.</p>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Agent</label>
            <select value={form.agent_id} onChange={(e) => setForm((f) => ({ ...f, agent_id: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="">Select…</option>
              {availableAgents.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name ?? a.id} {a.agency_name ? `(${a.agency_name})` : ''}</option>
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
            <input type="range" min={0} max={100} value={form.relationship_strength} onChange={(e) => setForm((f) => ({ ...f, relationship_strength: parseInt(e.target.value, 10) }))} className="w-full" />
            <span className="text-xs text-muted-foreground">{form.relationship_strength}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Confidence (0–100)</label>
            <input type="range" min={0} max={100} value={form.confidence} onChange={(e) => setForm((f) => ({ ...f, confidence: parseInt(e.target.value, 10) }))} className="w-full" />
            <span className="text-xs text-muted-foreground">{form.confidence}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm min-h-[60px]" placeholder="Optional" />
          </div>
        </div>
      </Drawer>
    </section>
  )
}
