import { redirect } from 'next/navigation'
import { FileCheck2, LockKeyhole, UserRoundCheck } from 'lucide-react'
import { ExternalOnboardingForm } from '@/components/organizations/external-onboarding-form'
import { getCoachPortalContext } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { completeCoachOnboardingAction } from './actions'

export default async function CoachOnboardingPage() {
  const context = await getCoachPortalContext()
  if (!context) redirect('/coach/login')
  const supabase = await createServerSupabaseClient()
  const [{ data: identity }, { data: coach }] = await Promise.all([
    supabase
      .from('external_identity_profiles')
      .select('id')
      .eq('organization_id', context.organizationId)
      .eq('user_id', context.userId)
      .not('onboarding_completed_at', 'is', null)
      .maybeSingle(),
    supabase.from('coaches').select('name').eq('id', context.coachId).single(),
  ])
  if (identity) redirect('/coach/profile')
  if (!coach) redirect('/coach/login')

  const defaultTitle = context.membershipRole === 'coach' ? 'Head Coach' : 'Coach representative'

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between border-b border-slate-200 px-6 py-8 lg:border-b-0 lg:border-r lg:px-10">
          <p className="text-sm font-semibold text-emerald-950">COACH FIRST</p>
          <div className="max-w-md py-12">
            <p className="text-xs font-semibold uppercase text-emerald-800">Private coach access</p>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight">
              Put a trusted identity behind the coach&apos;s work.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              This account controls coach-supplied information for {coach.name}. It does
              not reveal independent references, source identities or club conclusions.
            </p>
            <div className="mt-8 space-y-4 border-t border-emerald-950/15 pt-5">
              <div className="flex gap-3 text-xs leading-5 text-slate-600">
                <UserRoundCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                Coach and representative accounts are separately identified.
              </div>
              <div className="flex gap-3 text-xs leading-5 text-slate-600">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                Every submitted file remains marked as coach-supplied until reviewed.
              </div>
              <div className="flex gap-3 text-xs leading-5 text-slate-600">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                Private material is not released automatically to a club.
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">Invite-only · coach-controlled · reviewed by Coach First</p>
        </section>

        <section className="flex items-center bg-white px-6 py-10 lg:px-12">
          <div className="w-full max-w-xl">
            <p className="text-xs font-semibold uppercase text-emerald-800">First login</p>
            <h2 className="mt-2 text-2xl font-semibold">Complete your account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confirm whether you are the coach or an authorised representative before adding private work.
            </p>
            <div className="mt-6">
              <ExternalOnboardingForm
                action={completeCoachOnboardingAction}
                accountType="coach"
                organizationName={coach.name}
                defaultTitle={defaultTitle}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
