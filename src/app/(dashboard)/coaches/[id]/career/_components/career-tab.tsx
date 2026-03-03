'use client'

import { useState } from 'react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { SourceConfidenceFields, IntelPill } from '@/components/source-confidence-fields'
import { upsertStintAction, deleteStintAction } from '../../actions'

type Stint = {
  id: string
  club_name: string
  role_title: string | null
  started_on: string | null
  ended_on: string | null
  appointment_context: string | null
  exit_context: string | null
  points_per_game: number | null
  win_rate: number | null
  notable_outcomes: string | null
  source_type?: string | null
  source_name?: string | null
  confidence?: number | null
  verified?: boolean
}

function formatDate(s: string | null | undefined): string {
  if (!s) return ''
  try {
    return new Date(s).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function CareerTab({
  coachId,
  stints,
}: {
  coachId: string
  stints: Stint[]
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Stint | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const openAdd = () => {
    setEditing(null)
    setSubmitError(null)
    setDrawerOpen(true)
  }
  const openEdit = (s: Stint) => {
    setEditing(s)
    setSubmitError(null)
    setDrawerOpen(true)
  }
  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditing(null)
    setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('id', editing?.id ?? '')
    const result = await upsertStintAction(coachId, formData)
    if (result.error) {
      setSubmitError(result.error)
      return
    }
    closeDrawer()
  }

  const handleDelete = async (stintId: string) => {
    if (!confirm('Delete this stint?')) return
    setPendingDelete(stintId)
    const result = await deleteStintAction(coachId, stintId)
    setPendingDelete(null)
    if (result.error) {
      setSubmitError(result.error)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">
            Career timeline
          </h2>
          <Button variant="outline" onClick={openAdd}>
            Add stint
          </Button>
        </div>
        {!stints.length ? (
          <p className="text-sm text-muted-foreground py-4">No data available.</p>
        ) : (
          <ul className="space-y-4">
            {stints.map((s) => (
              <li key={s.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-foreground">{s.club_name}</p>
                    <p className="text-xs text-muted-foreground">{s.role_title ?? ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {s.started_on ? new Date(s.started_on).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'} –{' '}
                      {s.ended_on ? new Date(s.ended_on).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Present'}
                    </span>
                    <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEdit(s)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDelete(s.id)}
                      disabled={pendingDelete === s.id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <IntelPill confidence={s.confidence} verified={s.verified} sourceType={s.source_type} sourceName={s.source_name} className="flex items-center gap-1" />
                </div>
                {(s.points_per_game != null || s.win_rate != null) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.points_per_game != null && `PPG: ${Number(s.points_per_game).toFixed(2)}`}
                    {s.points_per_game != null && s.win_rate != null && ' · '}
                    {s.win_rate != null && `Win rate: ${Number(s.win_rate).toFixed(0)}%`}
                  </p>
                )}
                {s.appointment_context && <p className="text-xs text-muted-foreground mt-1">Context: {s.appointment_context}</p>}
                {s.exit_context && <p className="text-xs text-muted-foreground mt-0.5">Exit: {s.exit_context}</p>}
                {s.notable_outcomes && <p className="text-xs text-foreground mt-1">{s.notable_outcomes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? 'Edit stint' : 'Add stint'}
        footer={
          <>
            <Button variant="outline" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button type="submit" form="stint-form">
              {editing ? 'Save' : 'Add'}
            </Button>
          </>
        }
      >
        <form id="stint-form" onSubmit={handleSubmit} className="space-y-4">
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <input type="hidden" name="id" value={editing?.id ?? ''} />
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Club name</label>
            <input
              name="club_name"
              defaultValue={editing?.club_name ?? ''}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
            <input
              name="role_title"
              defaultValue={editing?.role_title ?? ''}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Started</label>
              <input
                type="date"
                name="started_on"
                defaultValue={formatDate(editing?.started_on)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Ended</label>
              <input
                type="date"
                name="ended_on"
                defaultValue={formatDate(editing?.ended_on)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Appointment context</label>
            <input
              name="appointment_context"
              defaultValue={editing?.appointment_context ?? ''}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Exit context</label>
            <input
              name="exit_context"
              defaultValue={editing?.exit_context ?? ''}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Points per game</label>
              <input
                type="number"
                step="any"
                name="points_per_game"
                defaultValue={editing?.points_per_game ?? ''}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Win rate %</label>
              <input
                type="number"
                step="any"
                name="win_rate"
                defaultValue={editing?.win_rate ?? ''}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Notable outcomes</label>
            <textarea
              name="notable_outcomes"
              defaultValue={editing?.notable_outcomes ?? ''}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-none"
            />
          </div>
          <SourceConfidenceFields
            initial={{
              source_type: editing?.source_type ?? null,
              source_name: editing?.source_name ?? null,
              source_link: (editing as { source_link?: string | null })?.source_link ?? null,
              source_notes: (editing as { source_notes?: string | null })?.source_notes ?? null,
              confidence: (editing as { confidence?: number | null })?.confidence ?? null,
              verified: (editing as { verified?: boolean })?.verified ?? false,
              verified_by: (editing as { verified_by?: string | null })?.verified_by ?? null,
              verified_at: null,
            }}
          />
        </form>
      </Drawer>
    </div>
  )
}
