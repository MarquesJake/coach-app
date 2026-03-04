'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import { SourceConfidenceFields, IntelPill } from '@/components/source-confidence-fields'
import { upsertStaffHistoryAction, deleteStaffHistoryAction, getStaffLinkAutofillAction } from '../../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

type StaffLinkDefaults = {
  existingLink?: boolean
  club_name: string
  role_title: string
  started_on: string | null
  ended_on: string | null
  times_worked_together: number
  relationship_strength: number | null
  confidence: number | null
  impact_summary?: string | null
  before_after_observation?: string | null
}

type StaffRow = { id: string; full_name: string }
type HistoryRow = {
  id: string
  staff_id: string
  club_name: string
  role_title: string
  started_on: string | null
  ended_on: string | null
  times_worked_together: number
  followed_from_previous: boolean
  relationship_strength: number | null
  impact_summary: string | null
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

function monthsBetween(start: string | null, end: string | null): number {
  if (!start || !end) return 0
  try {
    const a = new Date(start).getTime()
    const b = new Date(end).getTime()
    if (Number.isNaN(a) || Number.isNaN(b)) return 0
    return Math.max(0, Math.round((b - a) / (30.44 * 24 * 60 * 60 * 1000)))
  } catch {
    return 0
  }
}

export function StaffNetworkSection({
  coachId,
  history,
  staffMap,
  allStaff,
}: {
  coachId: string
  history: HistoryRow[]
  staffMap: Map<string, string>
  allStaff: StaffRow[]
}) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<HistoryRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [linkDefaults, setLinkDefaults] = useState<StaffLinkDefaults | null>(null)

  const openAdd = () => {
    setEditing(null)
    setError(null)
    setSelectedStaffId('')
    setLinkDefaults(null)
    setDrawerOpen(true)
  }
  const openEdit = (row: HistoryRow) => {
    setEditing(row)
    setError(null)
    setSelectedStaffId('')
    setLinkDefaults(null)
    setDrawerOpen(true)
  }
  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditing(null)
    setSelectedStaffId('')
    setLinkDefaults(null)
    setError(null)
  }

  const onStaffSelect = useCallback(async (staffId: string) => {
    setSelectedStaffId(staffId)
    if (!staffId) {
      setLinkDefaults(null)
      return
    }
    const defaults = await getStaffLinkAutofillAction(coachId, staffId)
    setLinkDefaults(defaults ?? null)
  }, [coachId])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('id', editing?.id ?? '')
    const result = await upsertStaffHistoryAction(coachId, formData)
    if (result.error) {
      setError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess(editing ? 'Updated' : 'Added')
    closeDrawer()
    router.refresh()
  }
  const onDelete = async (id: string) => {
    if (!confirm('Remove this link?')) return
    const result = await deleteStaffHistoryAction(coachId, id)
    if (result.error) toastError(result.error)
    else {
      toastSuccess('Removed')
      closeDrawer()
      router.refresh()
    }
  }

  const networkMetrics = useMemo(() => {
    const repeatCollaborationsCount = history.filter((h) => h.times_worked_together >= 2).length
    const totalMonthsTogether = history.reduce((sum, h) => sum + monthsBetween(h.started_on, h.ended_on), 0)
    const followedToNewClubs = history.some((h) => h.followed_from_previous)
    const strengthSum = history.reduce((s, h) => s + (h.relationship_strength ?? 0), 0)
    const strengthCount = history.filter((h) => h.relationship_strength != null).length
    const networkStrengthScore = strengthCount > 0 ? Math.round(strengthSum / strengthCount) : null
    const coreStaffGroup = repeatCollaborationsCount > 2
    // TODO: Performance delta together can later be derived from match/outcome data when integrated.
    return {
      networkStrengthScore: networkStrengthScore ?? 0,
      repeatCollaborationsCount,
      totalMonthsTogether,
      followedToNewClubs,
      performanceDeltaTogether: null as number | null,
      coreStaffGroup,
    }
  }, [history])

  return (
    <div className="space-y-4">
      {/* Network metrics */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Network intelligence</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Network strength</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{networkMetrics.networkStrengthScore}%</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Repeat collaborations</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{networkMetrics.repeatCollaborationsCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Total months together</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{networkMetrics.totalMonthsTogether}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Followed to new clubs</p>
            <p className="text-lg font-semibold text-foreground">{networkMetrics.followedToNewClubs ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Performance delta</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{networkMetrics.performanceDeltaTogether != null ? `${networkMetrics.performanceDeltaTogether}%` : '—'}</p>
          </div>
        </div>
        {networkMetrics.coreStaffGroup && (
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Core Staff Group
          </span>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Staff network</h2>
          <Button variant="outline" onClick={openAdd}>Add link</Button>
        </div>
        {!history.length ? (
          <p className="text-sm text-muted-foreground py-4">No data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Staff</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Club</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Times together</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Followed</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Strength</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Impact</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Intel</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-20" />
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-border/50">
                    <td className="py-2">
                      <Link href={`/staff/${h.staff_id}`} className="text-primary hover:underline font-medium">
                        {staffMap.get(h.staff_id) ?? h.staff_id}
                      </Link>
                    </td>
                    <td className="py-2 text-muted-foreground">{h.role_title}</td>
                    <td className="py-2 text-muted-foreground">{h.club_name}</td>
                    <td className="py-2 tabular-nums">{h.times_worked_together}</td>
                    <td className="py-2">{h.followed_from_previous ? 'Yes' : 'No'}</td>
                    <td className="py-2 tabular-nums">{h.relationship_strength != null ? `${h.relationship_strength}%` : '—'}</td>
                    <td className="py-2 text-muted-foreground max-w-[200px] truncate">{h.impact_summary ?? '—'}</td>
                    <td className="py-2">
                      <IntelPill confidence={h.confidence} verified={h.verified} sourceType={h.source_type} sourceName={h.source_name} />
                    </td>
                    <td className="py-2">
                      <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEdit(h)}>Edit</Button>
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
        onClose={closeDrawer}
        title={editing ? 'Edit staff link' : 'Add staff link'}
        footer={
          <>
            {editing && <Button variant="destructive" className="mr-auto" onClick={() => onDelete(editing.id)}>Delete</Button>}
            <Button variant="outline" onClick={closeDrawer}>Cancel</Button>
            <Button type="submit" form="staff-history-form">{editing ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <form id="staff-history-form" key={editing ? editing.id : `add-${selectedStaffId}-${linkDefaults ? '1' : '0'}`} onSubmit={onSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <input type="hidden" name="id" value={editing?.id ?? ''} />
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Staff</label>
            <select
              name="staff_id"
              required
              defaultValue={editing?.staff_id ?? selectedStaffId}
              onChange={(e) => { if (!editing) onStaffSelect(e.target.value) }}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              <option value="">Select</option>
              {allStaff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Club name</label>
            <input name="club_name" defaultValue={editing?.club_name ?? linkDefaults?.club_name ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Role title</label>
            <input name="role_title" defaultValue={editing?.role_title ?? linkDefaults?.role_title ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Started</label>
              <input type="date" name="started_on" defaultValue={editing ? formatDate(editing.started_on) : formatDate(linkDefaults?.started_on)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Ended</label>
              <input type="date" name="ended_on" defaultValue={editing ? formatDate(editing.ended_on) : formatDate(linkDefaults?.ended_on)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="followed_from_previous" defaultChecked={editing?.followed_from_previous ?? false} className="rounded border-border" />
            <label className="text-xs text-muted-foreground">Followed from previous</label>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Times worked together</label>
            <input type="number" min={1} name="times_worked_together" defaultValue={editing?.times_worked_together ?? linkDefaults?.times_worked_together ?? 1} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Relationship strength (0–100)</label>
            <input type="number" min={0} max={100} name="relationship_strength" defaultValue={editing?.relationship_strength ?? linkDefaults?.relationship_strength ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          {linkDefaults?.existingLink && !editing && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              This coach already has a link with this staff member. You are adding another collaboration period; or edit the existing one from the table.
            </p>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Impact summary</label>
            <textarea name="impact_summary" rows={2} defaultValue={editing?.impact_summary ?? linkDefaults?.impact_summary ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Before/after observation</label>
            <textarea name="before_after_observation" rows={2} defaultValue={(editing as { before_after_observation?: string | null })?.before_after_observation ?? linkDefaults?.before_after_observation ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-none" />
          </div>
          <SourceConfidenceFields
            initial={{
              source_type: editing?.source_type ?? null,
              source_name: editing?.source_name ?? null,
              source_link: (editing as { source_link?: string | null })?.source_link ?? null,
              source_notes: (editing as { source_notes?: string | null })?.source_notes ?? null,
              confidence: editing?.confidence ?? linkDefaults?.confidence ?? null,
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
