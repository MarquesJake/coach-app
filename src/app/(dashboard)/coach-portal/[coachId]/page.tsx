import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/db'
import { addCoachPortalMaterialFormAction, saveCoachPortalProfileFormAction } from '../actions'

type CoachRow = Database['public']['Tables']['coaches']['Row']
type PortalRow = Database['public']['Tables']['coach_portal_profiles']['Row']
type MaterialRow = Database['public']['Tables']['coach_private_materials']['Row']

const inputClass =
  'w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors'

const textAreaClass = `${inputClass} min-h-[92px] resize-y leading-relaxed`

const PROFILE_FIELDS: Array<keyof PortalRow> = [
  'short_bio',
  'personal_statement',
  'football_identity',
  'in_possession_model',
  'out_of_possession_model',
  'training_week',
  'session_design_principles',
  'player_development_proof',
  'staff_network',
  'reference_permissions',
]

function value(profile: PortalRow | null, key: keyof PortalRow) {
  const raw = profile?.[key]
  return typeof raw === 'string' ? raw : ''
}

function readiness(profile: PortalRow | null, materials: MaterialRow[]) {
  const completed = profile
    ? PROFILE_FIELDS.filter((field) => value(profile, field).trim().length > 0).length
    : 0
  return Math.min(100, Math.round(((completed + Math.min(2, materials.length)) / (PROFILE_FIELDS.length + 2)) * 100))
}

function TextField({
  name,
  label,
  profile,
  placeholder,
}: {
  name: keyof PortalRow
  label: string
  profile: PortalRow | null
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </span>
      <input name={name} defaultValue={value(profile, name)} placeholder={placeholder} className={inputClass} />
    </label>
  )
}

function TextAreaField({
  name,
  label,
  profile,
  placeholder,
}: {
  name: keyof PortalRow
  label: string
  profile: PortalRow | null
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </span>
      <textarea name={name} defaultValue={value(profile, name)} placeholder={placeholder} className={textAreaClass} />
    </label>
  )
}

export default async function CoachPortalDetailPage({
  params,
}: {
  params: { coachId: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const coachId = params.coachId
  const [coachRes, profileRes, materialsRes] = await Promise.all([
    supabase
      .from('coaches')
      .select('*')
      .eq('id', coachId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('coach_portal_profiles')
      .select('*')
      .eq('coach_id', coachId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('coach_private_materials')
      .select('*')
      .eq('coach_id', coachId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (coachRes.error || !coachRes.data) notFound()

  const coach = coachRes.data as CoachRow
  const profile = (profileRes.data ?? null) as PortalRow | null
  const materials = (materialsRes.data ?? []) as MaterialRow[]
  const score = readiness(profile, materials)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/coach-portal" className="text-xs text-muted-foreground hover:text-foreground">
            ← Coach Portal
          </Link>
          <h2 className="mt-1 text-xl font-semibold text-foreground">{coach.name}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {[coach.club_current, coach.nationality, coach.availability_status ?? coach.available_status].filter(Boolean).join(' · ') || 'Coach profile'}
          </p>
        </div>
        <Link
          href={`/coaches/${coach.id}`}
          className="rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
        >
          Internal coach record →
        </Link>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Coach-facing profile
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This is the information a coach, agent or representative would provide directly. It does not replace
            analyst judgement; it gives Coach First private depth to verify, challenge and package for clubs.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold text-foreground tabular-nums">{score}%</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Portal readiness
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{materials.length} private material{materials.length === 1 ? '' : 's'}</p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-surface overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
          </div>
        </div>
      </section>

      <form action={saveCoachPortalProfileFormAction} className="space-y-5">
        <input type="hidden" name="coach_id" value={coach.id} />

        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Portal controls</h3>
              <p className="text-2xs text-muted-foreground mt-0.5">
                Control how complete and shareable the coach-submitted profile is.
              </p>
            </div>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Save portal profile
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                Portal status
              </span>
              <select name="portal_status" defaultValue={profile?.portal_status ?? 'in_progress'} className={inputClass}>
                <option value="not_invited">Not invited</option>
                <option value="invited">Invited</option>
                <option value="in_progress">In progress</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In review</option>
                <option value="approved">Approved</option>
                <option value="needs_update">Needs update</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                Visibility
              </span>
              <select name="visibility_status" defaultValue={profile?.visibility_status ?? 'coach_first_only'} className={inputClass}>
                <option value="private">Private</option>
                <option value="coach_first_only">Coach First only</option>
                <option value="clubs_on_request">Clubs on request</option>
                <option value="shareable">Shareable</option>
              </select>
            </label>
            <TextField name="coach_email" label="Coach email" profile={profile} />
            <TextField name="base_location" label="Base location" profile={profile} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <TextField name="coach_phone" label="Coach phone" profile={profile} />
            <TextField name="preferred_contact_method" label="Contact method" profile={profile} />
            <TextField name="representative_name" label="Representative" profile={profile} />
            <TextField name="representative_email" label="Representative email" profile={profile} />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Identity and football model</h3>
            <TextAreaField name="short_bio" label="Short bio" profile={profile} placeholder="Current situation, career headline, what the coach wants clubs to understand quickly..." />
            <TextAreaField name="personal_statement" label="Personal statement" profile={profile} placeholder="Why this coach, what they stand for, what environments they suit..." />
            <TextAreaField name="football_identity" label="Football identity" profile={profile} placeholder="Core football beliefs, game model, non-negotiables..." />
            <TextAreaField name="in_possession_model" label="In-possession model" profile={profile} placeholder="Build-up, progression, chance creation, player profiles..." />
            <TextAreaField name="out_of_possession_model" label="Out-of-possession model" profile={profile} placeholder="Pressing, block, compactness, pressing triggers..." />
            <TextAreaField name="transition_model" label="Transition model" profile={profile} placeholder="Rest defence, counter-pressing, counter-attack principles..." />
            <TextAreaField name="set_piece_model" label="Set-piece model" profile={profile} placeholder="Attacking/defending set-piece responsibility, principles, specialist staff..." />
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Training, people and proof</h3>
            <TextAreaField name="training_week" label="Training week" profile={profile} placeholder="Typical match-week rhythm, load, tactical day, unit work, individual development..." />
            <TextAreaField name="session_design_principles" label="Session design principles" profile={profile} placeholder="How sessions are built, constraints, coaching interventions, detail on the grass..." />
            <TextAreaField name="player_development_proof" label="Player-development proof" profile={profile} placeholder="Players improved, academy integrations, value created, role changes..." />
            <TextAreaField name="academy_integration" label="Academy integration" profile={profile} placeholder="How academy players are assessed, trained, exposed and protected..." />
            <TextAreaField name="recruitment_preferences" label="Recruitment preferences" profile={profile} placeholder="Preferred player profiles, market model, ages, staff/recruitment collaboration..." />
            <TextAreaField name="staff_network" label="Staff network" profile={profile} placeholder="Trusted assistants, analysts, coaches, S&C, goalkeeper coaches..." />
            <TextAreaField name="key_staff_likely_to_follow" label="Likely staff to follow" profile={profile} placeholder="Who may follow, who is essential, likely cost/availability..." />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Media, presentations and release</h3>
            <TextAreaField name="presentation_summary" label="Presentation summary" profile={profile} placeholder="What is in the coach presentation/PDF/PPT and where it helps a club decision..." />
            <TextAreaField name="video_summary" label="Video summary" profile={profile} placeholder="Uploaded sessions, match clips, interviews, tactical walkthroughs..." />
            <TextAreaField name="media_and_communication" label="Media and communication" profile={profile} placeholder="Press style, dressing-room communication, board communication, public risk..." />
            <TextAreaField name="release_notes" label="Release notes" profile={profile} placeholder="What can be shared, with whom, and at what process stage..." />
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">References and sensitive context</h3>
            <TextAreaField name="reference_permissions" label="Reference permissions" profile={profile} placeholder="Who can be contacted, who should not be contacted yet, sensitivities..." />
            <TextAreaField name="sensitive_notes" label="Sensitive notes" profile={profile} placeholder="Contract, family, relocation, ownership/staff sensitivities, anything not for a broad club audience..." />
          </div>
        </section>
      </form>

      <section className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-5">
        <form action={addCoachPortalMaterialFormAction} className="rounded-lg border border-border bg-card p-5 space-y-3">
          <input type="hidden" name="coach_id" value={coach.id} />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Add private material</h3>
            <p className="text-2xs text-muted-foreground mt-0.5">
              Log videos, PowerPoints, PDFs, methodology files and media links. Full upload storage can sit behind this next.
            </p>
          </div>
          <div className="grid grid-cols-[1fr_160px] gap-3">
            <input name="title" required placeholder="e.g. Promotion interview deck" className={inputClass} />
            <select name="material_type" defaultValue="presentation" className={inputClass}>
              <option value="presentation">Presentation</option>
              <option value="training_video">Training video</option>
              <option value="match_video">Match video</option>
              <option value="methodology">Methodology</option>
              <option value="analysis">Analysis</option>
              <option value="media">Media / interview</option>
              <option value="reference_pack">Reference pack</option>
              <option value="other">Other</option>
            </select>
          </div>
          <textarea name="description" rows={4} placeholder="What is inside it, who supplied it, and what football judgement it supports..." className={textAreaClass} />
          <div className="grid grid-cols-2 gap-3">
            <input name="external_url" placeholder="Secure link / file URL" className={inputClass} />
            <input name="source_label" placeholder="Source / owner" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select name="uploaded_by" defaultValue="coach" className={inputClass}>
              <option value="coach">Coach supplied</option>
              <option value="agent">Agent supplied</option>
              <option value="analyst">Analyst supplied</option>
              <option value="club">Club supplied</option>
              <option value="unknown">Unknown</option>
            </select>
            <select name="confidentiality_status" defaultValue="available" className={inputClass}>
              <option value="available">Available for controlled access</option>
              <option value="requested">Requested</option>
              <option value="missing">Missing</option>
              <option value="withheld">Withheld</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
          >
            Add material
          </button>
        </form>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Private material library</h3>
          <div className="mt-3 space-y-2">
            {materials.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No private material logged yet. Add the coach’s presentation, training videos, methodology and media links here.
              </p>
            ) : (
              materials.map((item) => (
                <div id={`material-${item.id}`} key={item.id} className="rounded-md border border-border/60 bg-surface/40 p-3 scroll-mt-24">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-2xs text-muted-foreground">
                        {item.material_type.replaceAll('_', ' ')}
                        {item.source_label ? ` · ${item.source_label}` : ''}
                        {item.uploaded_by ? ` · ${item.uploaded_by}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {item.confidentiality_status}
                    </span>
                  </div>
                  {item.description && <p className="mt-2 text-2xs text-muted-foreground leading-relaxed">{item.description}</p>}
                  {item.external_url && (
                    <a href={item.external_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-2xs font-medium text-primary hover:underline">
                      Open linked material →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
