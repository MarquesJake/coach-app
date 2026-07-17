import { redirect } from 'next/navigation'
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  LockKeyhole,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachPortalContext } from '@/lib/organizations/context'
import { MaterialUploadForm } from './_components/material-upload-form'
import { saveOwnCoachProfileAction, signOutCoachAction } from './actions'

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none'
const textAreaClass = `${inputClass} min-h-[108px] resize-y leading-6`

type PortalProfile = Record<string, string | null>

function value(profile: PortalProfile | null, key: string) {
  return profile?.[key] ?? ''
}

function Field({ profile, name, label, type = 'text', placeholder }: {
  profile: PortalProfile | null
  name: string
  label: string
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      <input name={name} type={type} defaultValue={value(profile, name)} placeholder={placeholder} className={inputClass} />
    </label>
  )
}

function TextArea({ profile, name, label, placeholder }: {
  profile: PortalProfile | null
  name: string
  label: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      <textarea name={name} defaultValue={value(profile, name)} placeholder={placeholder} className={textAreaClass} />
    </label>
  )
}

export default async function CoachProfilePage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/coach/login')
  const context = await getCoachPortalContext()
  if (!context) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f4ef] px-6">
        <div className="max-w-md rounded-md border border-slate-200 bg-white p-6 text-slate-950">
          <LockKeyhole className="h-6 w-6 text-slate-500" />
          <h1 className="mt-4 text-lg font-semibold">Coach access is not active</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This account is signed in but is not linked to an active coach invitation.
            Ask Coach First to check the email and access status.
          </p>
          <form action={signOutCoachAction}>
            <button className="mt-5 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </main>
    )
  }

  const [{ data: coach }, { data: profileData }, { data: materialsData }] = await Promise.all([
    supabase.from('coaches').select('id, name, club_current, nationality, role_current').eq('id', context.coachId).single(),
    supabase.from('coach_portal_profiles').select('*').eq('coach_id', context.coachId).maybeSingle(),
    supabase.from('coach_private_materials').select('id, title, material_type, verification_status, created_at, storage_path, external_url').eq('coach_id', context.coachId).order('created_at', { ascending: false }),
  ])
  if (!coach) redirect('/coach/login')
  const profile = profileData as PortalProfile | null
  const materials = materialsData ?? []
  const status = profile?.portal_status ?? 'invited'
  const completionFields = [
    'short_bio', 'football_identity', 'in_possession_model', 'out_of_possession_model',
    'training_week', 'player_development_proof', 'staff_network', 'reference_permissions',
    'salary_expectation', 'availability_timeline', 'family_situation', 'relocation_requirements',
  ]
  const completed = completionFields.filter((field) => value(profile, field).trim()).length
  const readiness = Math.min(100, Math.round(((completed + Math.min(3, materials.length)) / 15) * 100))

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold text-emerald-900">COACH FIRST · PRIVATE COACH PROFILE</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold">{coach.name}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {[coach.club_current, coach.role_current, coach.nationality].filter(Boolean).join(' · ')}
            </p>
          </div>
          <form action={signOutCoachAction}>
            <button title="Sign out" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:text-slate-950">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-600">Profile readiness</p>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-semibold tabular-nums">{readiness}%</p>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] capitalize text-slate-600">
                {status.replaceAll('_', ' ')}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-800" style={{ width: `${readiness}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Readiness reflects depth, not approval. Coach First reviews every declaration and file separately.
            </p>
          </section>
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-800" />
              <p className="text-xs font-semibold text-slate-700">Clear separation</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              You can see your own submissions. Independent references, source identities,
              assessment scoring and club recommendations remain private to Coach First.
            </p>
          </section>
        </aside>

        <div className="space-y-5">
          {searchParams.saved && (
            <p className="rounded-md border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              {searchParams.saved}
            </p>
          )}
          {searchParams.error && (
            <p className="rounded-md border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-900">
              {searchParams.error}
            </p>
          )}

          <form action={saveOwnCoachProfileAction} className="space-y-5">
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-800">Coach-owned information</p>
                  <h2 className="mt-1 text-lg font-semibold">Identity and contact</h2>
                </div>
                <BriefcaseBusiness className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field profile={profile} name="coach_email" label="Coach email" type="email" />
                <Field profile={profile} name="coach_phone" label="Coach phone" />
                <Field profile={profile} name="representative_name" label="Representative" />
                <Field profile={profile} name="representative_email" label="Representative email" type="email" />
                <Field profile={profile} name="base_location" label="Current base" />
                <Field profile={profile} name="preferred_contact_method" label="Preferred contact method" />
                <div className="sm:col-span-2"><TextArea profile={profile} name="short_bio" label="Career summary" placeholder="A concise, factual coaching overview." /></div>
                <div className="sm:col-span-2"><TextArea profile={profile} name="personal_statement" label="What you want a club to understand" placeholder="The appointment context in which you do your best work." /></div>
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold">Football identity</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Describe the work in football language. Use examples, trade-offs and adaptations rather than slogans.
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <TextArea profile={profile} name="football_identity" label="Overall game model" />
                <TextArea profile={profile} name="in_possession_model" label="In possession" />
                <TextArea profile={profile} name="out_of_possession_model" label="Out of possession" />
                <TextArea profile={profile} name="transition_model" label="Transitions" />
                <TextArea profile={profile} name="set_piece_model" label="Set pieces" />
                <TextArea profile={profile} name="media_and_communication" label="Media and communication" />
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold">How you work</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <TextArea profile={profile} name="training_week" label="Typical training week" />
                <TextArea profile={profile} name="session_design_principles" label="Session design principles" />
                <TextArea profile={profile} name="player_development_proof" label="Player-development evidence" />
                <TextArea profile={profile} name="academy_integration" label="Academy integration" />
                <TextArea profile={profile} name="recruitment_preferences" label="Recruitment and squad-building preferences" />
                <TextArea profile={profile} name="reference_permissions" label="Reference permissions" placeholder="Who Coach First may contact, when, and any confidentiality considerations." />
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold">Appointment circumstances</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                These are private declarations for Coach First review. They are not automatically shown to a club.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field profile={profile} name="current_salary" label="Current / most recent salary" />
                <Field profile={profile} name="salary_expectation" label="Expected package" />
                <Field profile={profile} name="contract_expiry" label="Contract expiry" type="date" />
                <Field profile={profile} name="release_compensation" label="Estimated release compensation" />
                <Field profile={profile} name="availability_timeline" label="Availability / notice period" />
                <Field profile={profile} name="staff_cost_expectation" label="Expected staff-package cost" />
                <div className="sm:col-span-2"><TextArea profile={profile} name="family_situation" label="Family and personal context" /></div>
                <div className="sm:col-span-2"><TextArea profile={profile} name="relocation_requirements" label="Relocation requirements" /></div>
                <div className="sm:col-span-2"><TextArea profile={profile} name="staff_network" label="Preferred staff structure" /></div>
                <div className="sm:col-span-2"><TextArea profile={profile} name="key_staff_likely_to_follow" label="Staff likely to follow" /></div>
                <div className="sm:col-span-2"><TextArea profile={profile} name="appointment_conditions" label="Non-negotiables and appointment conditions" /></div>
              </div>
            </section>

            <div className="sticky bottom-4 flex flex-wrap justify-end gap-2 rounded-md border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
              <button name="intent" value="save" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Save private progress
              </button>
              <button name="intent" value="submit" className="inline-flex items-center gap-2 rounded-md bg-emerald-950 px-4 py-2 text-sm font-semibold text-white">
                <CheckCircle2 className="h-4 w-4" />
                Submit for Coach First review
              </button>
            </div>
          </form>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-800" />
              <div>
                <h2 className="text-lg font-semibold">Private football material</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Presentations, methodology, training sessions, match analysis and communication samples.
                </p>
              </div>
            </div>
            <div className="mt-5"><MaterialUploadForm coachId={context.coachId} /></div>
            <div className="mt-5 divide-y divide-slate-100 border-t border-slate-200">
              {materials.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">No private material submitted yet.</p>
              ) : materials.map((material) => (
                <div key={material.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{material.title}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {material.material_type.replaceAll('_', ' ')} · submitted {new Date(material.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <span className={`rounded border px-2 py-1 text-[11px] capitalize ${
                    material.verification_status === 'verified'
                      ? 'border-emerald-700/20 bg-emerald-50 text-emerald-900'
                      : 'border-amber-700/20 bg-amber-50 text-amber-900'
                  }`}>
                    {material.verification_status === 'verified' ? 'Coach First reviewed' : 'Awaiting review'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
