'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { SourceConfidenceFields, IntelPill } from '@/components/source-confidence-fields'
import {
  upsertDataProfileAction,
  upsertRecruitmentAction,
  deleteRecruitmentAction,
  upsertMediaEventAction,
  deleteMediaEventAction,
} from '../../actions'

type Profile = {
  id: string
  coach_id: string
  avg_squad_age: number | null
  avg_starting_xi_age: number | null
  minutes_u21: number | null
  minutes_21_24: number | null
  minutes_25_28: number | null
  minutes_29_plus: number | null
  recruitment_avg_age: number | null
  recruitment_repeat_player_count: number | null
  recruitment_repeat_agent_count: number | null
  media_pressure_score: number | null
  media_accountability_score: number | null
  media_confrontation_score: number | null
  social_presence_level: string | null
  narrative_risk_summary: string | null
  confidence_score: number | null
  created_at: string
}

type RecruitmentRow = {
  id: string
  player_name: string | null
  club_name: string | null
  transfer_window: string | null
  player_age_at_signing: number | null
  transfer_fee_band: string | null
  repeated_signing: boolean
  agent_name: string | null
  impact_summary: string | null
  source_type?: string | null
  source_name?: string | null
  confidence?: number | null
  verified?: boolean
}

type MediaEvent = {
  id: string
  category: string | null
  headline: string | null
  summary: string | null
  severity_score: number | null
  occurred_at: string | null
  source: string | null
  confidence: number | null
  source_type?: string | null
  source_name?: string | null
  verified?: boolean
}

type ExternalProfile = {
  id: string
  api_coach_id: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  nationality: string | null
  birth_date: string | null
  birth_place: string | null
  birth_country: string | null
  height: string | null
  weight: string | null
  photo_url: string | null
  current_team_name: string | null
  api_team_id?: string | null
  match_strategy?: string | null
  match_confidence?: number | null
  source_name: string | null
  source_link: string | null
  confidence: number | null
  synced_at: string | null
}

function formatNum(v: number | null | undefined): string {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? '—' : String(n)
}

function confidenceLabel(score: number | null | undefined): { label: string; className: string } {
  if (score == null) return { label: 'Not set', className: 'text-muted-foreground' }
  const n = Number(score)
  if (Number.isNaN(n)) return { label: 'Not set', className: 'text-muted-foreground' }
  if (n <= 40) return { label: 'Low confidence', className: 'text-amber-500' }
  if (n <= 70) return { label: 'Moderate', className: 'text-blue-500' }
  return { label: 'High confidence', className: 'text-emerald-500' }
}

const REPEAT_THRESHOLD = 3

function toStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

export function CoachDataTab({
  coachId,
  profile,
  externalProfile,
  recruitment,
  mediaEvents,
}: {
  coachId: string
  profile: Profile | null
  externalProfile: ExternalProfile | null
  recruitment: RecruitmentRow[]
  mediaEvents: MediaEvent[]
}) {
  const p = profile
  const repeatPlayerCount = p?.recruitment_repeat_player_count ?? 0
  const repeatAgentCount = p?.recruitment_repeat_agent_count ?? 0
  const repeatSignings = recruitment.filter((r) => r.repeated_signing).length

  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const [recruitmentDrawerOpen, setRecruitmentDrawerOpen] = useState(false)
  const [recruitmentEditing, setRecruitmentEditing] = useState<RecruitmentRow | null>(null)
  const [mediaDrawerOpen, setMediaDrawerOpen] = useState(false)
  const [mediaEditing, setMediaEditing] = useState<MediaEvent | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const openProfileDrawer = () => {
    setSubmitError(null)
    setProfileDrawerOpen(true)
  }
  const openRecruitmentAdd = () => {
    setRecruitmentEditing(null)
    setSubmitError(null)
    setRecruitmentDrawerOpen(true)
  }
  const openRecruitmentEdit = (r: RecruitmentRow) => {
    setRecruitmentEditing(r)
    setSubmitError(null)
    setRecruitmentDrawerOpen(true)
  }
  const openMediaAdd = () => {
    setMediaEditing(null)
    setSubmitError(null)
    setMediaDrawerOpen(true)
  }
  const openMediaEdit = (e: MediaEvent) => {
    setMediaEditing(e)
    setSubmitError(null)
    setMediaDrawerOpen(true)
  }

  const onProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('profile_id', p?.id ?? '')
    const result = await upsertDataProfileAction(coachId, formData)
    if (result.error) {
      setSubmitError(result.error)
      return
    }
    setProfileDrawerOpen(false)
  }
  const onRecruitmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('id', recruitmentEditing?.id ?? '')
    const result = await upsertRecruitmentAction(coachId, formData)
    if (result.error) {
      setSubmitError(result.error)
      return
    }
    setRecruitmentDrawerOpen(false)
    setRecruitmentEditing(null)
  }
  const onRecruitmentDelete = async (id: string) => {
    if (!confirm('Delete this recruitment entry?')) return
    await deleteRecruitmentAction(coachId, id)
    setRecruitmentDrawerOpen(false)
    setRecruitmentEditing(null)
  }
  const onMediaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('id', mediaEditing?.id ?? '')
    const result = await upsertMediaEventAction(coachId, formData)
    if (result.error) {
      setSubmitError(result.error)
      return
    }
    setMediaDrawerOpen(false)
    setMediaEditing(null)
  }
  const onMediaDelete = async (id: string) => {
    if (!confirm('Delete this media event?')) return
    await deleteMediaEventAction(coachId, id)
    setMediaDrawerOpen(false)
    setMediaEditing(null)
  }

  return (
    <div className="space-y-6">
      {/* Section 0 – External Profile */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">
          External profile (API sourced)
        </h2>
        {!externalProfile ? (
          <p className="text-sm text-muted-foreground py-2">No external profile synced yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4">
            <div>
              {externalProfile.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={externalProfile.photo_url}
                  alt={externalProfile.full_name ?? 'Coach photo'}
                  className="w-28 h-28 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-lg border border-border bg-surface flex items-center justify-center text-xs text-muted-foreground">
                  No photo
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Full name</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.full_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Nationality</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.nationality ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">DOB</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.birth_date ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Birth place</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.birth_place ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Height</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.height ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Weight</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.weight ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current team</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.current_team_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">API team ID</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.api_team_id ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Source confidence</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.confidence ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Match confidence</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.match_confidence ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Match method</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.match_strategy?.replaceAll('_', ' ') ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Last sync</p>
                <p className="text-sm font-medium text-foreground">{externalProfile.synced_at ? new Date(externalProfile.synced_at).toLocaleDateString('en-GB') : '—'}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 1 – Squad Age Profile */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">
            Squad age profile
          </h2>
          <Button variant="outline" onClick={openProfileDrawer}>Edit</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg squad age</p>
            <p className="text-lg font-semibold text-foreground">{formatNum(p?.avg_squad_age)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg starting XI age</p>
            <p className="text-lg font-semibold text-foreground">{formatNum(p?.avg_starting_xi_age)}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Age distribution (minutes)</p>
          <div className="space-y-2">
            {[
              { label: 'U21', value: p?.minutes_u21 },
              { label: '21–24', value: p?.minutes_21_24 },
              { label: '25–28', value: p?.minutes_25_28 },
              { label: '29+', value: p?.minutes_29_plus },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-12 text-xs text-muted-foreground">{label}</span>
                <div className="flex-1 h-4 rounded bg-surface border border-border overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded"
                    style={{ width: value != null ? `${Math.min(100, Number(value) / 10)}%` : '0%' }}
                  />
                </div>
                <span className="text-xs tabular-nums w-12 text-right">{formatNum(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2 – Recruitment Footprint */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">
            Recruitment footprint
          </h2>
          <Button variant="outline" onClick={openRecruitmentAdd}>Add</Button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">Repeated signings: {repeatSignings}</p>
        {recruitment.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-muted-foreground">Player</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-muted-foreground">Age at signing</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-muted-foreground">Fee band</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-muted-foreground">Repeated</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-muted-foreground">Agent</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-muted-foreground">Impact</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-muted-foreground">Intel</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-muted-foreground w-20" />
                </tr>
              </thead>
              <tbody>
                {recruitment.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 font-medium">{r.player_name ?? '—'}</td>
                    <td className="py-2 tabular-nums">{formatNum(r.player_age_at_signing)}</td>
                    <td className="py-2 text-muted-foreground">{r.transfer_fee_band ?? '—'}</td>
                    <td className="py-2">{r.repeated_signing ? 'Yes' : 'No'}</td>
                    <td className="py-2 text-muted-foreground">{r.agent_name ?? '—'}</td>
                    <td className="py-2 text-muted-foreground max-w-[180px] truncate">{r.impact_summary ?? '—'}</td>
                    <td className="py-2">
                      <IntelPill confidence={r.confidence} verified={r.verified} sourceType={r.source_type} sourceName={r.source_name} />
                    </td>
                    <td className="py-2">
                      <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => openRecruitmentEdit(r)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 3 – Network Bias */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">
          Network bias indicators
        </h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Repeated agents</p>
            <p className={cn('text-lg font-semibold', repeatAgentCount >= REPEAT_THRESHOLD ? 'text-amber-500' : 'text-foreground')}>
              {repeatAgentCount}
              {repeatAgentCount >= REPEAT_THRESHOLD && ' (above threshold)'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Repeated players</p>
            <p className={cn('text-lg font-semibold', repeatPlayerCount >= REPEAT_THRESHOLD ? 'text-amber-500' : 'text-foreground')}>
              {repeatPlayerCount}
              {repeatPlayerCount >= REPEAT_THRESHOLD && ' (above threshold)'}
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 – Media Profile */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">
            Media profile
          </h2>
          <Button variant="outline" onClick={openMediaAdd}>Add event</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pressure score</p>
            <p className="text-sm font-medium">{formatNum(p?.media_pressure_score)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Accountability score</p>
            <p className="text-sm font-medium">{formatNum(p?.media_accountability_score)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Confrontation score</p>
            <p className="text-sm font-medium">{formatNum(p?.media_confrontation_score)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Social presence</p>
            <p className="text-sm font-medium">{p?.social_presence_level ?? '—'}</p>
          </div>
        </div>
        {p?.narrative_risk_summary && (
          <p className="text-xs text-muted-foreground mb-4">{p.narrative_risk_summary}</p>
        )}
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Media events (by severity)</p>
        {mediaEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No data available.</p>
        ) : (
          <ul className="space-y-2">
            {mediaEvents.map((e) => (
              <li key={e.id} className="border-b border-border/50 pb-2 last:border-0 flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium text-foreground text-sm">{e.headline ?? e.category ?? 'Event'}</p>
                  {e.summary && <p className="text-xs text-muted-foreground mt-0.5">{e.summary}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Severity: {formatNum(e.severity_score)} · {e.occurred_at ? new Date(e.occurred_at).toLocaleDateString('en-GB') : '—'}
                    {e.source && ` · ${e.source}`}
                  </p>
                  <IntelPill confidence={e.confidence} verified={e.verified} sourceType={e.source_type} sourceName={e.source_name} className="mt-1" />
                </div>
                <Button variant="ghost" className="h-7 px-2 text-xs shrink-0" onClick={() => openMediaEdit(e)}>Edit</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Section 5 – Confidence */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">
          Confidence
        </h2>
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-foreground">Data profile confidence: {formatNum(p?.confidence_score)}</p>
          <span className={cn('text-sm font-medium', confidenceLabel(p?.confidence_score).className)}>
            {confidenceLabel(p?.confidence_score).label}
          </span>
        </div>
        <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-surface border border-border overflow-hidden">
          <div
            className={cn('h-full rounded-full', p?.confidence_score != null && Number(p.confidence_score) <= 40 ? 'bg-amber-500' : p?.confidence_score != null && Number(p.confidence_score) <= 70 ? 'bg-blue-500' : 'bg-emerald-500')}
            style={{ width: `${Math.min(100, Math.max(0, Number(p?.confidence_score) ?? 0))}%` }}
          />
        </div>
      </section>

      {/* Profile drawer */}
      <Drawer
        open={profileDrawerOpen}
        onClose={() => { setProfileDrawerOpen(false); setSubmitError(null) }}
        title="Edit data profile"
        footer={
          <>
            <Button variant="outline" onClick={() => setProfileDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" form="profile-form">Save</Button>
          </>
        }
      >
        <form id="profile-form" onSubmit={onProfileSubmit} className="space-y-4">
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Avg squad age</label>
              <input type="number" step="any" name="avg_squad_age" defaultValue={p?.avg_squad_age ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Avg starting XI age</label>
              <input type="number" step="any" name="avg_starting_xi_age" defaultValue={p?.avg_starting_xi_age ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          <p className="text-[10px] uppercase text-muted-foreground">Minutes by band</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-muted-foreground mb-1">U21</label><input type="number" step="any" name="minutes_u21" defaultValue={p?.minutes_u21 ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">21–24</label><input type="number" step="any" name="minutes_21_24" defaultValue={p?.minutes_21_24 ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">25–28</label><input type="number" step="any" name="minutes_25_28" defaultValue={p?.minutes_25_28 ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">29+</label><input type="number" step="any" name="minutes_29_plus" defaultValue={p?.minutes_29_plus ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Recruitment avg age</label>
              <input type="number" step="any" name="recruitment_avg_age" defaultValue={p?.recruitment_avg_age ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Repeat player count</label>
              <input type="number" name="recruitment_repeat_player_count" defaultValue={p?.recruitment_repeat_player_count ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Repeat agent count</label>
              <input type="number" name="recruitment_repeat_agent_count" defaultValue={p?.recruitment_repeat_agent_count ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          <p className="text-[10px] uppercase text-muted-foreground">Media scores (0–100)</p>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-muted-foreground mb-1">Pressure</label><input type="number" min={0} max={100} name="media_pressure_score" defaultValue={p?.media_pressure_score ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Accountability</label><input type="number" min={0} max={100} name="media_accountability_score" defaultValue={p?.media_accountability_score ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Confrontation</label><input type="number" min={0} max={100} name="media_confrontation_score" defaultValue={p?.media_confrontation_score ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Social presence level</label>
            <input name="social_presence_level" defaultValue={p?.social_presence_level ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Narrative risk summary</label>
            <textarea name="narrative_risk_summary" defaultValue={p?.narrative_risk_summary ?? ''} rows={2} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Confidence score (0–100)</label>
            <input type="number" min={0} max={100} name="confidence_score" defaultValue={p?.confidence_score ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
        </form>
      </Drawer>

      {/* Recruitment drawer */}
      <Drawer
        open={recruitmentDrawerOpen}
        onClose={() => { setRecruitmentDrawerOpen(false); setRecruitmentEditing(null); setSubmitError(null) }}
        title={recruitmentEditing ? 'Edit recruitment' : 'Add recruitment'}
        footer={
          <>
            {recruitmentEditing && (
              <Button variant="destructive" className="mr-auto" onClick={() => onRecruitmentDelete(recruitmentEditing.id)}>Delete</Button>
            )}
            <Button variant="outline" onClick={() => setRecruitmentDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" form="recruitment-form">{recruitmentEditing ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <form id="recruitment-form" onSubmit={onRecruitmentSubmit} className="space-y-4">
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Player name</label>
            <input name="player_name" defaultValue={recruitmentEditing?.player_name ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Club name</label>
            <input name="club_name" defaultValue={recruitmentEditing?.club_name ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Transfer window</label>
              <input name="transfer_window" defaultValue={recruitmentEditing?.transfer_window ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Fee band</label>
              <input name="transfer_fee_band" defaultValue={recruitmentEditing?.transfer_fee_band ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Age at signing</label>
            <input type="number" step="any" name="player_age_at_signing" defaultValue={recruitmentEditing?.player_age_at_signing ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="repeated_signing" defaultChecked={recruitmentEditing?.repeated_signing ?? false} className="rounded border-border" />
            <label className="text-xs text-muted-foreground">Repeated signing</label>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Agent name</label>
            <input name="agent_name" defaultValue={recruitmentEditing?.agent_name ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Impact summary</label>
            <textarea name="impact_summary" defaultValue={recruitmentEditing?.impact_summary ?? ''} rows={2} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-none" />
          </div>
          <SourceConfidenceFields
            initial={{
              source_type: recruitmentEditing?.source_type ?? null,
              source_name: recruitmentEditing?.source_name ?? null,
              source_link: (recruitmentEditing as { source_link?: string | null })?.source_link ?? null,
              source_notes: (recruitmentEditing as { source_notes?: string | null })?.source_notes ?? null,
              confidence: (recruitmentEditing as { confidence?: number | null })?.confidence ?? null,
              verified: (recruitmentEditing as { verified?: boolean })?.verified ?? false,
              verified_by: (recruitmentEditing as { verified_by?: string | null })?.verified_by ?? null,
              verified_at: null,
            }}
          />
        </form>
      </Drawer>

      {/* Media event drawer */}
      <Drawer
        open={mediaDrawerOpen}
        onClose={() => { setMediaDrawerOpen(false); setMediaEditing(null); setSubmitError(null) }}
        title={mediaEditing ? 'Edit media event' : 'Add media event'}
        footer={
          <>
            {mediaEditing && (
              <Button variant="destructive" className="mr-auto" onClick={() => onMediaDelete(mediaEditing.id)}>Delete</Button>
            )}
            <Button variant="outline" onClick={() => setMediaDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" form="media-form">{mediaEditing ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <form id="media-form" onSubmit={onMediaSubmit} className="space-y-4">
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
            <input name="category" defaultValue={mediaEditing?.category ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Headline</label>
            <input name="headline" defaultValue={mediaEditing?.headline ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Summary</label>
            <textarea name="summary" defaultValue={mediaEditing?.summary ?? ''} rows={2} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Severity (0–100)</label>
              <input type="number" min={0} max={100} name="severity_score" defaultValue={mediaEditing?.severity_score ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
              <input type="date" name="occurred_at" defaultValue={mediaEditing?.occurred_at ? toStr(mediaEditing.occurred_at).slice(0, 10) : ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Source (legacy)</label>
            <input name="source" defaultValue={mediaEditing?.source ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Confidence (0–100)</label>
            <input type="number" min={0} max={100} name="confidence" defaultValue={mediaEditing?.confidence ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <SourceConfidenceFields
            initial={{
              source_type: mediaEditing?.source_type ?? null,
              source_name: mediaEditing?.source_name ?? null,
              source_link: (mediaEditing as { source_link?: string | null })?.source_link ?? null,
              source_notes: (mediaEditing as { source_notes?: string | null })?.source_notes ?? null,
              confidence: mediaEditing?.confidence ?? null,
              verified: (mediaEditing as { verified?: boolean })?.verified ?? false,
              verified_by: (mediaEditing as { verified_by?: string | null })?.verified_by ?? null,
              verified_at: null,
            }}
          />
        </form>
      </Drawer>
    </div>
  )
}
