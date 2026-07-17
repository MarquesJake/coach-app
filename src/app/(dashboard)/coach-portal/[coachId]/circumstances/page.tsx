import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CirclePoundSterling,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/db'
import { calculateCareerCircumstancesReadiness } from '@/lib/coach-appointment'
import {
  deleteCoachPortalStaffMemberFormAction,
  saveCoachCareerCircumstancesFormAction,
  saveCoachPortalStaffMemberFormAction,
  verifyCoachCareerCircumstancesFormAction,
} from '../../actions'

type PortalProfile = Database['public']['Tables']['coach_portal_profiles']['Row']
type StaffMember = Database['public']['Tables']['coach_portal_staff_members']['Row']

const inputClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/45 focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/10'
const textAreaClass = `${inputClass} min-h-[92px] resize-y leading-relaxed`
const labelClass = 'mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'

function profileValue(profile: PortalProfile | null, key: keyof PortalProfile) {
  const value = profile?.[key]
  return typeof value === 'string' ? value : ''
}

function statusLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function TextField({
  name,
  label,
  profile,
  placeholder,
  type = 'text',
}: {
  name: keyof PortalProfile
  label: string
  profile: PortalProfile | null
  placeholder?: string
  type?: 'text' | 'date'
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={profileValue(profile, name)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  )
}

function TextAreaField({
  name,
  label,
  profile,
  placeholder,
}: {
  name: keyof PortalProfile
  label: string
  profile: PortalProfile | null
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea
        name={name}
        defaultValue={profileValue(profile, name)}
        placeholder={placeholder}
        className={textAreaClass}
      />
    </label>
  )
}

function StaffMemberForm({
  coachId,
  member,
}: {
  coachId: string
  member?: StaffMember
}) {
  return (
    <form action={saveCoachPortalStaffMemberFormAction} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <input type="hidden" name="coach_id" value={coachId} />
      {member && <input type="hidden" name="staff_member_id" value={member.id} />}
      <label>
        <span className={labelClass}>Name</span>
        <input name="full_name" required defaultValue={member?.full_name ?? ''} className={inputClass} />
      </label>
      <label>
        <span className={labelClass}>Role</span>
        <input name="role_title" required defaultValue={member?.role_title ?? ''} placeholder="Assistant coach" className={inputClass} />
      </label>
      <label>
        <span className={labelClass}>Current club</span>
        <input name="current_club" defaultValue={member?.current_club ?? ''} className={inputClass} />
      </label>
      <label>
        <span className={labelClass}>Importance to appointment</span>
        <select name="essentiality" defaultValue={member?.essentiality ?? 'preferred'} className={inputClass}>
          <option value="essential">Essential</option>
          <option value="preferred">Preferred</option>
          <option value="optional">Optional</option>
        </select>
      </label>
      <label>
        <span className={labelClass}>Likely to follow</span>
        <select name="likely_to_follow" defaultValue={member?.likely_to_follow ?? 'unknown'} className={inputClass}>
          <option value="yes">Yes</option>
          <option value="no">No</option>
          <option value="unknown">Not confirmed</option>
        </select>
      </label>
      <label>
        <span className={labelClass}>Availability</span>
        <input name="availability" defaultValue={member?.availability ?? ''} placeholder="Permission required / available now" className={inputClass} />
      </label>
      <label>
        <span className={labelClass}>Current / last salary</span>
        <input name="current_salary" defaultValue={member?.current_salary ?? ''} placeholder="Currency, gross/net, base and bonus" className={inputClass} />
      </label>
      <label>
        <span className={labelClass}>Expected salary</span>
        <input name="expected_salary" defaultValue={member?.expected_salary ?? ''} placeholder="Currency, gross/net, base and bonus" className={inputClass} />
      </label>
      <label>
        <span className={labelClass}>Compensation / release terms</span>
        <input name="compensation_terms" defaultValue={member?.compensation_terms ?? ''} className={inputClass} />
      </label>
      <label>
        <span className={labelClass}>Release visibility</span>
        <select name="confidentiality_status" defaultValue={member?.confidentiality_status ?? 'coach_first_only'} className={inputClass}>
          <option value="coach_first_only">Coach First only</option>
          <option value="clubs_on_request">Clubs on request</option>
          <option value="shareable">Shareable</option>
        </select>
      </label>
      <label className="lg:col-span-2">
        <span className={labelClass}>Working relationship and relocation context</span>
        <textarea
          name="relationship_context"
          defaultValue={member?.relationship_context ?? ''}
          placeholder="How they work together, previous clubs, responsibilities and any appointment dependency"
          className={textAreaClass}
        />
      </label>
      <label className="lg:col-span-2">
        <span className={labelClass}>Relocation notes</span>
        <textarea name="relocation_notes" defaultValue={member?.relocation_notes ?? ''} className={textAreaClass} />
      </label>
      <label>
        <span className={labelClass}>Analyst review</span>
        <select name="review_status" defaultValue={member?.review_status ?? 'unreviewed'} className={inputClass}>
          <option value="unreviewed">Unreviewed</option>
          <option value="verified">Verified</option>
          <option value="disputed">Disputed</option>
        </select>
      </label>
      <div className="flex items-end justify-end">
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {member ? 'Save staff member' : 'Add staff member'}
        </button>
      </div>
    </form>
  )
}

export default async function CoachCareerCircumstancesPage({
  params,
  searchParams,
}: {
  params: { coachId: string }
  searchParams: { saved?: string; error?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [coachRes, profileRes, staffRes] = await Promise.all([
    supabase
      .from('coaches')
      .select('id, name, club_current, availability_status, current_salary, wage_expectation, contract_expiry, compensation_expectation, feasibility_reviewed_at')
      .eq('id', params.coachId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('coach_portal_profiles')
      .select('*')
      .eq('coach_id', params.coachId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('coach_portal_staff_members')
      .select('*')
      .eq('coach_id', params.coachId)
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  if (!coachRes.data) notFound()

  const coach = coachRes.data
  const profile = profileRes.data as PortalProfile | null
  const staff = (staffRes.data ?? []) as StaffMember[]
  const readiness = calculateCareerCircumstancesReadiness(profile, staff)
  const verifiedStaff = staff.filter((member) => member.review_status === 'verified').length
  const isVerified = profile?.feasibility_review_status === 'verified'

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/coach-portal/${params.coachId}`} className="text-xs text-muted-foreground hover:text-foreground">
            ← Coach Workspace
          </Link>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Career circumstances
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground">{coach.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[coach.club_current, coach.availability_status].filter(Boolean).join(' · ') || 'Appointment context'}
          </p>
        </div>
        <Link
          href={`/coaches/${coach.id}`}
          className="self-start rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:border-primary/40 sm:self-auto"
        >
          Internal coach record
        </Link>
      </header>

      {searchParams.saved && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-600/25 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{searchParams.saved}</span>
        </div>
      )}
      {searchParams.error && (
        <div className="rounded-md border border-red-600/25 bg-red-500/8 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {searchParams.error}
        </div>
      )}

      <section className="grid grid-cols-2 border-y border-border bg-card sm:grid-cols-4">
        <div className="border-b border-r border-border p-4 sm:border-b-0">
          <p className="text-2xl font-semibold tabular-nums text-foreground">{readiness.percent}%</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Details complete</p>
        </div>
        <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
          <p className="text-2xl font-semibold tabular-nums text-foreground">{staff.length}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Proposed staff</p>
        </div>
        <div className="border-r border-border p-4">
          <p className="text-2xl font-semibold tabular-nums text-foreground">{verifiedStaff}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Staff verified</p>
        </div>
        <div className="p-4">
          <p className="text-sm font-semibold text-foreground">{statusLabel(profile?.feasibility_review_status ?? 'draft')}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Review state</p>
        </div>
      </section>

      <form action={saveCoachCareerCircumstancesFormAction} className="space-y-6">
        <input type="hidden" name="coach_id" value={coach.id} />

        <section className="border-b border-border pb-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Contract and availability</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Coach or representative declaration, pending Coach First review.</p>
            </div>
            <button type="submit" className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Save circumstances
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField name="current_salary" label="Current / last salary" profile={profile} placeholder="Currency, gross/net, base, bonus and benefits" />
            <TextField name="salary_expectation" label="Expected salary" profile={profile} placeholder="Currency, gross/net, base, bonus and benefits" />
            <TextField name="contract_expiry" label="Contract expiry" profile={profile} type="date" />
            <TextField name="release_compensation" label="Release clause / estimated club compensation" profile={profile} placeholder="Clause, estimate, notice period or permission route" />
            <TextAreaField name="availability_timeline" label="Availability and permission-to-speak timeline" profile={profile} placeholder="Earliest start date, notice, current-club permission and process sensitivities" />
            <TextAreaField name="staff_cost_expectation" label="Estimated staff package cost" profile={profile} placeholder="Combined annual cost, currencies, bonuses and any club compensation" />
          </div>
        </section>

        <section className="border-b border-border pb-6">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Family, relocation and appointment conditions</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextAreaField name="family_situation" label="Family situation" profile={profile} placeholder="Only appointment-relevant context supplied with permission" />
            <TextAreaField name="relocation_requirements" label="Relocation requirements" profile={profile} placeholder="Timing, geography, schooling, travel pattern or living arrangement" />
            <div className="md:col-span-2">
              <TextAreaField name="appointment_conditions" label="Appointment conditions and practical obstacles" profile={profile} placeholder="Staff dependencies, facilities, reporting line, recruitment input or other non-negotiables" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label>
            <span className={labelClass}>Coach submission status</span>
            <select name="feasibility_review_status" defaultValue={isVerified ? 'in_review' : profile?.feasibility_review_status ?? 'draft'} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted for review</option>
              <option value="in_review">In review</option>
              <option value="needs_update">Needs update</option>
            </select>
          </label>
          <label>
            <span className={labelClass}>Circumstances visibility</span>
            <select name="circumstances_visibility" defaultValue={profile?.circumstances_visibility ?? 'coach_first_only'} className={inputClass}>
              <option value="coach_first_only">Coach First only</option>
              <option value="clubs_on_request">Clubs on request</option>
              <option value="shareable">Shareable</option>
            </select>
          </label>
        </section>
      </form>

      <section className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Proposed staff package</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Kept separate from independently researched staff history.</p>
          </div>
          <details className="group self-start">
            <summary className="cursor-pointer list-none rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:border-primary/40">
              Add staff member
            </summary>
            <div className="mt-4 rounded-md border border-border bg-card p-4 sm:min-w-[640px]">
              <StaffMemberForm coachId={coach.id} />
            </div>
          </details>
        </div>

        {staff.length === 0 ? (
          <div className="border-y border-dashed border-border py-8 text-center">
            <p className="text-sm font-medium text-foreground">No proposed staff recorded</p>
            <p className="mt-1 text-xs text-muted-foreground">The appointment can still proceed without a staff package.</p>
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {staff.map((member) => (
              <div key={member.id} className="py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{member.full_name}</p>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {statusLabel(member.essentiality)}
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {member.review_status === 'verified' ? 'Verified' : statusLabel(member.review_status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {member.role_title}
                      {member.current_club ? ` · ${member.current_club}` : ''}
                      {` · Likely to follow: ${member.likely_to_follow === 'unknown' ? 'not confirmed' : member.likely_to_follow}`}
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-xs text-muted-foreground sm:grid-cols-3">
                      <p><span className="font-medium text-foreground">Availability:</span> {member.availability || 'Not recorded'}</p>
                      <p><span className="font-medium text-foreground">Expected salary:</span> {member.expected_salary || 'Not recorded'}</p>
                      <p><span className="font-medium text-foreground">Compensation:</span> {member.compensation_terms || 'Not recorded'}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <details>
                      <summary className="cursor-pointer list-none rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground">
                        Edit
                      </summary>
                      <div className="mt-3 rounded-md border border-border bg-card p-4 lg:absolute lg:right-8 lg:z-20 lg:w-[720px] lg:shadow-xl">
                        <StaffMemberForm coachId={coach.id} member={member} />
                      </div>
                    </details>
                    <form action={deleteCoachPortalStaffMemberFormAction}>
                      <input type="hidden" name="coach_id" value={coach.id} />
                      <input type="hidden" name="staff_member_id" value={member.id} />
                      <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-red-700 hover:border-red-300">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 border border-border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex items-start gap-3">
          {isVerified ? (
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          ) : (
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {isVerified ? 'Career circumstances verified' : 'Coach First verification required'}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Verified details update the internal coach record used by appointment assessments. Unreviewed coach declarations remain outside club-facing packs.
            </p>
            {coach.feasibility_reviewed_at && (
              <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                Last verified {new Date(coach.feasibility_reviewed_at).toLocaleDateString('en-GB')}
              </p>
            )}
          </div>
        </div>
        <form action={verifyCoachCareerCircumstancesFormAction}>
          <input type="hidden" name="coach_id" value={coach.id} />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 lg:w-auto"
          >
            <CirclePoundSterling className="h-4 w-4" />
            Verify and use internally
          </button>
        </form>
      </section>
    </div>
  )
}
