'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { upsertAgentClubRelationshipAction, deleteAgentClubRelationshipAction } from '@/app/(dashboard)/agents/actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

type LinkRow = {
  id: string
  agent_id: string
  relationship_type: string
  relationship_strength: number | null
  last_active_on: string | null
  agents?: { id: string; full_name: string | null; agency_name: string | null } | null
}

export function ClubAgentsSection({ clubId }: { clubId: string }) {
  const router = useRouter()
  const [links, setLinks] = useState<LinkRow[]>([])
  const [agentsOptions, setAgentsOptions] = useState<Array<{ id: string; full_name: string | null; agency_name: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ agent_id: '', relationship_type: 'Intermediary', relationship_strength: 60, last_active_on: '', notes: '' })

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const [linksRes, agentsRes] = await Promise.all([
        supabase
          .from('agent_club_relationships')
          .select('id, agent_id, relationship_type, relationship_strength, last_active_on, agents(id, full_name, agency_name)')
          .eq('club_id', clubId)
          .eq('user_id', user.id),
        supabase.from('agents').select('id, full_name, agency_name').eq('user_id', user.id).order('full_name'),
      ])
      setLinks(((linksRes.data ?? []) as unknown) as LinkRow[])
      setAgentsOptions((agentsRes.data ?? []).map((a) => ({ id: a.id, full_name: a.full_name ?? null, agency_name: a.agency_name ?? null })))
      setLoading(false)
    }
    load()
  }, [clubId])

  const linkedAgentIds = links.map((l) => l.agent_id)
  const availableAgents = agentsOptions.filter((a) => !linkedAgentIds.includes(a.id))

  async function handleAdd() {
    if (!form.agent_id.trim()) {
      toastError('Select an agent')
      return
    }
    setSubmitting(true)
    const result = await upsertAgentClubRelationshipAction({
      agent_id: form.agent_id,
      club_id: clubId,
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
    setForm({ agent_id: '', relationship_type: 'Intermediary', relationship_strength: 60, last_active_on: '', notes: '' })
    router.refresh()
  }

  async function handleDelete(linkId: string, agentId: string) {
    if (!confirm('Remove this agent relationship?')) return
    const result = await deleteAgentClubRelationshipAction(linkId, agentId, clubId)
    if (!result.ok) toastError(result.error)
    else {
      toastSuccess('Relationship removed')
      router.refresh()
    }
  }

  if (loading) return <section className="rounded-lg border border-border bg-card p-6"><p className="text-sm text-muted-foreground">Loading agents…</p></section>

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-foreground">Linked agents</h2>
        <Button variant="outline" className="text-xs" onClick={() => setDrawerOpen(true)}>
          Manage agents
        </Button>
      </div>
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">No agents linked. Click Manage agents to add.</p>
      ) : (
        <ul className="space-y-2">
          {links.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
              <div>
                <Link href={`/agents/${row.agent_id}`} className="font-medium text-primary hover:underline">
                  {row.agents?.full_name ?? row.agent_id}
                </Link>
                {row.agents?.agency_name && <span className="text-xs text-muted-foreground ml-1">({row.agents.agency_name})</span>}
                {row.relationship_strength != null && <span className="text-xs text-muted-foreground ml-1">· {row.relationship_strength}%</span>}
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
    </section>
  )
}
