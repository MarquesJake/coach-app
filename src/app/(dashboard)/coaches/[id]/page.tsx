'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Shield,
  Brain,
  Users,
  Wallet,
  FileText,
  Clock,
  Flag,
  ChevronLeft,
  AlertCircle,
  Briefcase,
  Globe,
} from 'lucide-react'

const AVAILABILITY_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  'Available': 'success',
  'Open to offers': 'warning',
  'Under contract - interested': 'warning',
  'Under contract': 'danger',
  'Not available': 'secondary',
}

const REPUTATION_VARIANT: Record<string, 'purple' | 'info' | 'default' | 'secondary'> = {
  'Elite': 'purple',
  'Established': 'info',
  'Proven': 'default',
  'Emerging': 'secondary',
  'Rising': 'secondary',
}

const UPDATE_TYPE_COLOR: Record<string, string> = {
  'general': 'bg-zinc-400',
  'performance': 'bg-emerald-500',
  'tactical': 'bg-sky-500',
  'transfer': 'bg-amber-500',
  'injury': 'bg-red-500',
  'contract': 'bg-purple-500',
  'scouting': 'bg-teal-500',
  'rumour': 'bg-orange-400',
}

const UPDATE_TYPE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'secondary'> = {
  'general': 'secondary',
  'performance': 'success',
  'tactical': 'info',
  'transfer': 'warning',
  'injury': 'danger',
  'contract': 'purple',
  'scouting': 'default',
  'rumour': 'warning',
}

const LEADERSHIP_CONTEXT: Record<string, string> = {
  'Demanding': 'Sets high standards, expects total commitment from players and staff. Best suited to squads with experienced, mentally resilient players.',
  'Collaborative': 'Builds consensus, values player input in tactical decisions. Creates strong dressing room unity but may slow decision-making under pressure.',
  'Authoritarian': 'Top-down command structure with minimal player autonomy. Delivers fast results but can create friction with senior players.',
  'Player-focused': 'Prioritises individual player development and well-being. Strong at youth integration but may lack tactical rigidity.',
  'Motivational': 'Excels at man-management and getting the best from underperforming squads. Strong in relegation battles and turnaround situations.',
  'Disciplinarian': 'Enforces strict code of conduct on and off the pitch. Reduces squad indiscipline but may clash with high-profile personalities.',
  'Innovative': 'Pushes tactical boundaries and embraces data-driven methods. Appeals to modern ownership models but may need time to implement systems.',
}

const PRESSING_BAR: Record<string, number> = {
  'Low': 25, 'Medium-Low': 38, 'Medium': 50, 'Medium-High': 70, 'High': 85, 'Extreme': 100,
}

const BUILD_BAR: Record<string, number> = {
  'Direct': 20, 'Mixed': 50, 'Possession': 80, 'Short passing': 90, 'Long ball': 15,
}

const STYLE_BAR: Record<string, number> = {
  'Possession': 85, 'Counter-attacking': 60, 'High press': 90, 'Defensive': 30,
  'Transitional': 65, 'Tiki-taka': 95, 'Direct': 40, 'Gegenpressing': 92, 'Balanced': 55,
}

const SOURCE_TIER_VARIANT: Record<string, 'success' | 'info' | 'secondary'> = {
  'Tier 1': 'success',
  'Tier 2': 'info',
  'Tier 3': 'secondary',
}

const CONFIDENCE_VARIANT: Record<string, 'success' | 'warning' | 'secondary'> = {
  High: 'success',
  Medium: 'warning',
  Low: 'secondary',
}

type CoachUpdateRow = {
  id: string
  coach_id: string
  update_note: string
  update_type: string
  occurred_at: string | null
  confidence: string | null
  source_tier: string | null
  source_note: string | null
}

type CoachProfileRow = {
  id: string
  user_id: string
  name: string
  age: number | null
  nationality: string | null
  role_current: string | null
  club_current: string | null
  preferred_style: string
  pressing_intensity: string
  build_preference: string
  leadership_style: string
  wage_expectation: string
  staff_cost_estimate: string
  available_status: string
  reputation_tier: string | null
  league_experience: string[]
  last_updated: string
}

function isCoachProfileRow(value: unknown): value is CoachProfileRow {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return (
    typeof row.id === 'string' &&
    typeof row.user_id === 'string' &&
    typeof row.name === 'string' &&
    (typeof row.age === 'number' || row.age === null) &&
    (typeof row.nationality === 'string' || row.nationality === null) &&
    (typeof row.role_current === 'string' || row.role_current === null) &&
    (typeof row.club_current === 'string' || row.club_current === null) &&
    typeof row.preferred_style === 'string' &&
    typeof row.pressing_intensity === 'string' &&
    typeof row.build_preference === 'string' &&
    typeof row.leadership_style === 'string' &&
    typeof row.wage_expectation === 'string' &&
    typeof row.staff_cost_estimate === 'string' &&
    typeof row.available_status === 'string' &&
    (typeof row.reputation_tier === 'string' || row.reputation_tier === null) &&
    Array.isArray(row.league_experience) &&
    typeof row.last_updated === 'string'
  )
}

const COACH_PROFILE_SELECT = `
  id,
  user_id,
  name,
  age,
  nationality,
  role_current,
  club_current,
  preferred_style,
  pressing_intensity,
  build_preference,
  leadership_style,
  wage_expectation,
  staff_cost_estimate,
  available_status,
  reputation_tier,
  league_experience,
  last_updated
`

function stripNullValues<T extends Record<string, unknown>>(obj: T, keepNullKeys: Array<keyof T> = []): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => value !== null || keepNullKeys.includes(key as keyof T))
  ) as Partial<T>
}

function DossierInput({
  value,
  onChange,
  placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-surface rounded-md text-sm text-foreground placeholder-muted-foreground/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
    />
  )
}

export default function CoachProfilePage({ params }: { params: { id: string } }) {
  const [coach, setCoach] = useState<CoachProfileRow | null>(null)
  const [updates, setUpdates] = useState<CoachUpdateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<CoachProfileRow> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddUpdate, setShowAddUpdate] = useState(false)
  const [updateFormError, setUpdateFormError] = useState<string | null>(null)
  const [savingUpdate, setSavingUpdate] = useState(false)
  const [newUpdate, setNewUpdate] = useState({
    update_type: 'general',
    confidence: '',
    source_tier: '',
    source_note: '',
    occurred_at: '',
    update_note: '',
  })
  const supabase = createClient()

  const loadUpdates = useCallback(async () => {
    const { data } = await supabase
      .from('coach_updates')
      .select('id, coach_id, update_note, update_type, occurred_at, confidence, source_tier, source_note')
      .eq('coach_id', params.id)
      .order('occurred_at', { ascending: false, nullsFirst: false })
    setUpdates((data || []) as CoachUpdateRow[])
  }, [params.id, supabase])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setCoach(null)
        setLoading(false)
        return
      }

      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select(COACH_PROFILE_SELECT)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (coachError) {
        setError(coachError.message)
        setLoading(false)
        return
      }

      if (coachData && isCoachProfileRow(coachData)) {
        setCoach(coachData)
        setDraft(coachData)
        await loadUpdates()
      } else if (coachData) {
        setError('Coach profile data shape mismatch.')
      }
      setLoading(false)
    }
    load()
  }, [loadUpdates, params.id, supabase])

  async function handleSave() {
    if (!coach || !draft) return
    setSaving(true)
    setError(null)
    const payload = {
      name: (draft.name ?? coach.name).trim() || coach.name,
      age: draft.age !== undefined ? draft.age : coach.age,
      nationality: draft.nationality ?? coach.nationality,
      role_current: (draft.role_current ?? coach.role_current) ?? undefined,
      club_current: (draft.club_current ?? coach.club_current) ?? undefined,
      preferred_style: draft.preferred_style ?? coach.preferred_style,
      pressing_intensity: draft.pressing_intensity ?? coach.pressing_intensity,
      build_preference: draft.build_preference ?? coach.build_preference,
      leadership_style: draft.leadership_style ?? coach.leadership_style,
      wage_expectation: draft.wage_expectation ?? coach.wage_expectation,
      staff_cost_estimate: draft.staff_cost_estimate ?? coach.staff_cost_estimate,
      available_status: draft.available_status ?? coach.available_status,
      reputation_tier: (draft.reputation_tier ?? coach.reputation_tier) ?? undefined,
      league_experience: draft.league_experience ?? coach.league_experience,
      last_updated: new Date().toISOString(),
    }
    const sanitizedPayload = stripNullValues(payload, ['age', 'nationality'])
    const { data, error: updateError } = await supabase
      .from('coaches')
      .update(sanitizedPayload)
      .eq('id', params.id)
      .select(COACH_PROFILE_SELECT)
      .single()
    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }
    if (!data || !isCoachProfileRow(data)) {
      setError('Failed to load updated coach profile.')
      setSaving(false)
      return
    }
    setCoach(data)
    setDraft(data)
    setIsEditing(false)
    setSaving(false)
  }

  function handleCancel() {
    if (coach) setDraft(coach)
    setIsEditing(false)
    setError(null)
  }

  async function handleAddUpdateSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUpdateFormError(null)
    setSavingUpdate(true)
    const note = newUpdate.update_note.trim()
    if (!note) {
      setUpdateFormError('Update note is required.')
      setSavingUpdate(false)
      return
    }
    let occurredAt = new Date().toISOString()
    if (newUpdate.occurred_at) {
      const [year, month, day] = newUpdate.occurred_at.split('-').map(Number)
      occurredAt = new Date(year, month - 1, day, 12, 0, 0, 0).toISOString()
    }
    const { error: insertError } = await supabase
      .from('coach_updates')
      .insert({
        coach_id: params.id,
        update_type: newUpdate.update_type,
        update_note: note,
        confidence: newUpdate.confidence || null,
        source_tier: newUpdate.source_tier || null,
        source_note: newUpdate.source_note.trim() || null,
        occurred_at: occurredAt,
      })
    if (insertError) {
      setUpdateFormError(insertError.message)
      setSavingUpdate(false)
      return
    }
    await loadUpdates()
    setNewUpdate({
      update_type: 'general',
      confidence: '',
      source_tier: '',
      source_note: '',
      occurred_at: '',
      update_note: '',
    })
    setShowAddUpdate(false)
    setSavingUpdate(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-primary" />
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Coach not found.</p>
        <Link href="/coaches" className="text-primary hover:text-primary/80 text-sm mt-2 inline-block">
          &larr; Back to database
        </Link>
      </div>
    )
  }

  const leadershipNote = LEADERSHIP_CONTEXT[(draft?.leadership_style ?? coach.leadership_style)] || null
  const reputationKey = (draft?.reputation_tier ?? coach.reputation_tier) || 'Unrated'

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Back link */}
      <Link
        href="/coaches"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Coach Database
      </Link>

      {error && (
        <div className="mt-4 rounded-lg border border-border bg-surface-overlay/30 px-4 py-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* ── Header / Dossier Banner (Dark Surface) ── */}
      <div className="card-surface rounded-xl px-6 py-5 mt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {!isEditing ? (
              <>
                <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">
                  {coach.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {coach.role_current && (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      {coach.role_current}
                    </span>
                  )}
                  {coach.club_current && (
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3 w-3 shrink-0" />
                      {coach.club_current}
                    </span>
                  )}
                  {coach.nationality && (
                    <span className="inline-flex items-center gap-1">
                      <Flag className="h-3 w-3 shrink-0" />
                      {coach.nationality}
                    </span>
                  )}
                  {coach.age != null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      Age {coach.age}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Name</label>
                  <DossierInput value={draft?.name ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, name: v } : null))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Current role</label>
                    <DossierInput value={draft?.role_current ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, role_current: v } : null))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Current club</label>
                    <DossierInput value={draft?.club_current ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, club_current: v } : null))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Nationality</label>
                    <DossierInput value={draft?.nationality ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, nationality: v } : null))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Age</label>
                    <DossierInput
                      value={draft?.age != null ? String(draft.age) : ''}
                      onChange={(v) => setDraft((d) => (d ? { ...d, age: v === '' ? null : Number(v) } : null))}
                      placeholder="e.g. 47"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {!isEditing ? (
              <>
                <Badge variant={AVAILABILITY_VARIANT[coach.available_status] || 'secondary'}>
                  {coach.available_status}
                </Badge>
                {coach.reputation_tier && (
                  <Badge variant={REPUTATION_VARIANT[coach.reputation_tier] || 'secondary'} className="opacity-70">
                    {coach.reputation_tier}
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-1 inline-flex items-center gap-2 px-4 h-9 bg-surface border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30 transition-colors"
                >
                  Edit profile
                </button>
              </>
            ) : (
              <>
                <Badge variant={AVAILABILITY_VARIANT[(draft?.available_status ?? coach.available_status)] || 'secondary'}>
                  {draft?.available_status ?? coach.available_status}
                </Badge>
                {(draft?.reputation_tier ?? coach.reputation_tier) && (
                  <Badge variant={REPUTATION_VARIANT[reputationKey] || 'secondary'} className="opacity-70">
                    {draft?.reputation_tier ?? coach.reputation_tier}
                  </Badge>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 h-9 bg-surface border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column dossier grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8">
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tactical Identity (card-light) */}
          <DossierCard
            title="Tactical Identity"
            icon={<Brain className="h-3.5 w-3.5 text-light-muted/50" />}
          >
            {!isEditing ? (
              <>
                <div className="space-y-0">
                  <LightRow label="Preferred Style" value={coach.preferred_style} />
                  <LightRow label="Pressing Intensity" value={coach.pressing_intensity} />
                  <LightRow label="Build Preference" value={coach.build_preference} />
                </div>
                <div className="mt-5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-light-muted/60 mb-3 block">
                    Tactical Signature
                  </span>
                  <div className="bg-light-hover rounded-lg p-4 space-y-3 border border-border-light/50">
                    <TacticalBar
                      label="Style"
                      value={coach.preferred_style}
                      width={STYLE_BAR[coach.preferred_style] ?? 50}
                      color="bg-emerald-500/50"
                    />
                    <TacticalBar
                      label="Pressing"
                      value={coach.pressing_intensity}
                      width={PRESSING_BAR[coach.pressing_intensity] ?? 50}
                      color="bg-sky-500/50"
                    />
                    <TacticalBar
                      label="Build-up"
                      value={coach.build_preference}
                      width={BUILD_BAR[coach.build_preference] ?? 50}
                      color="bg-purple-500/50"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Preferred style</label>
                  <DossierInput value={draft?.preferred_style ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, preferred_style: v } : null))} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Pressing intensity</label>
                  <DossierInput value={draft?.pressing_intensity ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, pressing_intensity: v } : null))} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Build preference</label>
                  <DossierInput value={draft?.build_preference ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, build_preference: v } : null))} />
                </div>
              </div>
            )}
          </DossierCard>

          {/* Leadership & Culture (card-light) */}
          <DossierCard
            title="Leadership & Culture"
            icon={<Users className="h-3.5 w-3.5 text-light-muted/50" />}
          >
            {!isEditing ? (
              <>
                <LightRow label="Leadership Style" value={coach.leadership_style} />
                {leadershipNote && (
                  <div className="mt-4 bg-light-hover rounded-lg p-4 border border-border-light/50">
                    <p className="text-[11px] leading-relaxed text-light-muted italic">
                      {leadershipNote}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Leadership style</label>
                <DossierInput value={draft?.leadership_style ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, leadership_style: v } : null))} />
              </div>
            )}
          </DossierCard>

          {/* Staff Ecosystem (card-light) */}
          <DossierCard
            title="Staff Ecosystem"
            icon={<Briefcase className="h-3.5 w-3.5 text-light-muted/50" />}
          >
            {!isEditing ? (
              <>
                <LightRow label="Staff Cost Estimate" value={coach.staff_cost_estimate} />
                <div className="mt-4 bg-light-hover rounded-lg p-4 border border-border-light/50">
                  <p className="text-[11px] leading-relaxed text-light-muted italic">
                    {getStaffNote(coach.staff_cost_estimate)}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Staff cost estimate</label>
                <DossierInput value={draft?.staff_cost_estimate ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, staff_cost_estimate: v } : null))} />
              </div>
            )}
          </DossierCard>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-5">
          {/* Career Snapshot (card-light) */}
          <DossierCard
            title="Career Snapshot"
            icon={<Globe className="h-3.5 w-3.5 text-light-muted/50" />}
          >
            {!isEditing ? (
              (coach.league_experience && coach.league_experience.length > 0) ? (
                <div className="flex flex-wrap gap-1.5">
                  {coach.league_experience.map((league) => (
                    <span
                      key={league}
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-medium text-light-muted bg-light-hover border border-border-light/60"
                    >
                      {league}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-light-muted">No league experience recorded.</p>
              )
            ) : (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">League experience (comma-separated)</label>
                <DossierInput
                  value={Array.isArray(draft?.league_experience) ? draft.league_experience.join(', ') : ''}
                  onChange={(v) => setDraft((d) => (d ? { ...d, league_experience: v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [] } : null))}
                  placeholder="e.g. Premier League, La Liga"
                />
              </div>
            )}
          </DossierCard>

          {/* Compensation & Contract (card-light) */}
          <DossierCard
            title="Compensation & Contract"
            icon={<Wallet className="h-3.5 w-3.5 text-light-muted/50" />}
          >
            {!isEditing ? (
              <>
                <div className="space-y-0">
                  <LightRow label="Wage Expectation" value={coach.wage_expectation} />
                  <LightRow label="Staff Costs" value={coach.staff_cost_estimate} />
                </div>
                <div className="mt-4 bg-light-hover rounded-lg p-4 border border-border-light/50">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-light-muted/60 mb-2 block">
                    Total Package Estimate
                  </span>
                  <p className="text-sm font-semibold text-light-fg">
                    {computePackageEstimate(coach.wage_expectation, coach.staff_cost_estimate)}
                  </p>
                  <div className="mt-2">
                    <FeasibilityIndicator wage={coach.wage_expectation} />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Wage expectation</label>
                  <DossierInput value={draft?.wage_expectation ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, wage_expectation: v } : null))} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Staff cost estimate</label>
                  <DossierInput value={draft?.staff_cost_estimate ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, staff_cost_estimate: v } : null))} />
                </div>
              </div>
            )}
          </DossierCard>

          {/* Risk Assessment (card-light) — visual grouping of existing data */}
          <DossierCard
            title="Risk Assessment"
            icon={<AlertCircle className="h-3.5 w-3.5 text-light-muted/50" />}
          >
            {!isEditing ? (
              <div className="space-y-0">
                <LightRow label="Availability" value={coach.available_status} />
                {coach.reputation_tier && (
                  <LightRow label="Reputation Tier" value={coach.reputation_tier} />
                )}
                <LightRow
                  label="Contract Risk"
                  value={getContractRisk(coach.available_status)}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Availability status</label>
                  <DossierInput value={draft?.available_status ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, available_status: v } : null))} placeholder="Available / Open to offers / Under contract" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Reputation tier</label>
                  <DossierInput value={draft?.reputation_tier ?? ''} onChange={(v) => setDraft((d) => (d ? { ...d, reputation_tier: v } : null))} placeholder="Elite / Established / Emerging" />
                </div>
              </div>
            )}
          </DossierCard>
        </div>
      </div>

      {/* ── Intelligence Notes (Full Width, card-light) ── */}
      <div className="card-light overflow-hidden mt-8">
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-light">
          <div className="flex items-center gap-2.5">
            <FileText className="h-3.5 w-3.5 text-light-muted/50" />
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-light-muted/60">
              Intelligence Notes
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {updates.length > 0 && (
              <span className="text-[10px] text-light-muted/40 tabular-nums">
                {updates.length} {updates.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setShowAddUpdate((v) => !v)
                setUpdateFormError(null)
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30 transition-colors"
            >
              Add update
            </button>
          </div>
        </div>

        {showAddUpdate && (
          <div className="px-6 py-4 border-b border-border bg-surface-overlay/30">
            <form onSubmit={handleAddUpdateSubmit} className="space-y-3 max-w-xl">
              {updateFormError && (
                <p className="text-xs text-destructive">{updateFormError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Update type</label>
                  <select
                    value={newUpdate.update_type}
                    onChange={(e) => setNewUpdate((u) => ({ ...u, update_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface rounded-md text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
                  >
                    {Object.keys(UPDATE_TYPE_VARIANT).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Confidence</label>
                  <select
                    value={newUpdate.confidence}
                    onChange={(e) => setNewUpdate((u) => ({ ...u, confidence: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface rounded-md text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
                  >
                    <option value="">Not set</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Source tier</label>
                  <select
                    value={newUpdate.source_tier}
                    onChange={(e) => setNewUpdate((u) => ({ ...u, source_tier: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface rounded-md text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
                  >
                    <option value="">Not set</option>
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Tier 3">Tier 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Occurred at</label>
                  <input
                    type="date"
                    value={newUpdate.occurred_at}
                    onChange={(e) => setNewUpdate((u) => ({ ...u, occurred_at: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface rounded-md text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Source note</label>
                <input
                  value={newUpdate.source_note}
                  onChange={(e) => setNewUpdate((u) => ({ ...u, source_note: e.target.value }))}
                  placeholder="Optional source context"
                  className="w-full px-3 py-2 bg-surface rounded-md text-sm text-foreground placeholder-muted-foreground/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 block">Update note</label>
                <textarea
                  value={newUpdate.update_note}
                  onChange={(e) => setNewUpdate((u) => ({ ...u, update_note: e.target.value }))}
                  placeholder="Enter the intelligence update..."
                  rows={3}
                  className="w-full px-3 py-2 bg-surface rounded-md text-sm text-foreground placeholder-muted-foreground/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors resize-y"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={savingUpdate}
                  className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {savingUpdate ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUpdate(false)
                    setUpdateFormError(null)
                  }}
                  disabled={savingUpdate}
                  className="inline-flex items-center gap-2 px-4 h-9 bg-surface border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {updates.length > 0 ? (
          <div className="divide-y divide-border-light/70">
            {updates.map((update) => {
              const dotColor = UPDATE_TYPE_COLOR[update.update_type] || 'bg-zinc-400'
              const typeVariant = UPDATE_TYPE_VARIANT[update.update_type] || 'secondary'
              const occurredDateLabel = update.occurred_at
                ? new Date(update.occurred_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
                : 'Created unknown'

              return (
                <div key={update.id} className="px-6 py-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={cn('h-2 w-2 rounded-full shrink-0', dotColor)} />
                    <span className="text-[10px] text-light-muted tabular-nums">
                      {occurredDateLabel}
                    </span>
                    <Badge variant={typeVariant}>{update.update_type}</Badge>
                    {update.source_tier && (
                      <Badge variant={SOURCE_TIER_VARIANT[update.source_tier] || 'secondary'}>
                        {update.source_tier}
                      </Badge>
                    )}
                    {update.confidence && (
                      <Badge variant={CONFIDENCE_VARIANT[update.confidence] || 'secondary'}>
                        {update.confidence}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-light-fg/90 leading-relaxed pl-[18px]">
                    {update.update_note}
                  </p>

                  {update.source_note && (
                    <p className="text-[11px] text-light-muted mt-2 pl-[18px]">
                      Source: {update.source_note}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-xs text-light-muted">No intelligence updates available.</p>
          </div>
        )}
      </div>

      {/* Bottom timestamp */}
      <div className="text-[10px] text-muted-foreground/50 text-right pb-4 pt-6 tabular-nums">
        Dossier last refreshed: {new Date(coach.last_updated).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Light card components (local to this page)
   ═══════════════════════════════════════════════ */

function DossierCard({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="card-light overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-3.5 border-b border-light">
        {icon}
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-light-muted/60">
          {title}
        </h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function LightRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-light/50 last:border-0">
      <span className="text-xs text-light-muted">{label}</span>
      <span className="text-xs font-medium text-light-fg">{value}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Tactical bar (light background variant)
   ═══════════════════════════════════════════════ */

function TacticalBar({ label, value, width, color }: { label: string; value: string; width: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-light-muted/60 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] text-light-muted font-medium">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border-light/80 overflow-hidden">
        <div
          className={cn('h-full rounded-full score-bar-track', color)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Data helpers (logic unchanged)
   ═══════════════════════════════════════════════ */

function computePackageEstimate(wage: string, staff: string): string {
  const parseRange = (s: string): [number, number] | null => {
    const nums = s.match(/[\d.]+/g)
    if (!nums || nums.length === 0) return null
    const values = nums.map(Number)
    if (values.length === 1) return [values[0], values[0]]
    return [values[0], values[values.length - 1]]
  }

  const wageRange = parseRange(wage)
  const staffRange = parseRange(staff)

  if (!wageRange && !staffRange) return 'Unable to estimate'
  if (!wageRange) return staff
  if (!staffRange) return wage

  const low = wageRange[0] + staffRange[0]
  const high = wageRange[1] + staffRange[1]

  const isMillions = wage.toLowerCase().includes('m') || staff.toLowerCase().includes('m')
  const suffix = isMillions ? 'M' : 'K'
  const prefix = wage.includes('\u00a3') || wage.includes('£') ? '£' : wage.includes('$') ? '$' : '€'

  if (low === high) return `${prefix}${low}${suffix} p/a`
  return `${prefix}${low}${suffix} - ${prefix}${high}${suffix} p/a`
}

function FeasibilityIndicator({ wage }: { wage: string }) {
  const lower = wage.toLowerCase()
  let level: 'low' | 'mid' | 'high' = 'mid'
  let label = 'Moderate outlay'

  if (lower.includes('low') || lower.includes('<1') || lower.includes('0.5')) {
    level = 'low'
    label = 'Low financial commitment'
  } else if (lower.includes('high') || lower.includes('premium') || lower.includes('5') || lower.includes('6') || lower.includes('7') || lower.includes('8')) {
    level = 'high'
    label = 'Significant investment required'
  }

  const colors = {
    low: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
    mid: 'text-amber-600 bg-amber-50 border-amber-200/60',
    high: 'text-red-600 bg-red-50 border-red-200/60',
  }

  return (
    <div className={cn('text-[10px] font-medium px-2.5 py-1.5 rounded-md border', colors[level])}>
      {label}
    </div>
  )
}

function getStaffNote(estimate: string): string {
  const lower = estimate.toLowerCase()
  if (lower.includes('large') || lower.includes('high') || lower.includes('premium')) {
    return 'Typically brings a full backroom staff of 8-12, including dedicated analysts, specialist coaches, and a personal fitness team. Expect significant support infrastructure costs.'
  }
  if (lower.includes('medium') || lower.includes('moderate') || lower.includes('mid')) {
    return 'Usually requires a core team of 4-6 support staff including an assistant manager, a set-piece coach, and fitness personnel. Moderate infrastructure overhead.'
  }
  return 'Tends to work with a lean backroom setup of 2-3 staff, often adapting to the existing coaching infrastructure at the club.'
}

function getContractRisk(status: string): string {
  switch (status) {
    case 'Available': return 'Low — no buyout required'
    case 'Open to offers': return 'Low-Medium — negotiable exit'
    case 'Under contract - interested': return 'Medium — willing but contracted'
    case 'Under contract': return 'High — full buyout expected'
    case 'Not available': return 'Very High — not seeking move'
    default: return 'Unknown'
  }
}
