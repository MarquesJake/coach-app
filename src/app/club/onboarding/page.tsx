import { redirect } from 'next/navigation'
import { Building2, ClipboardCheck, LockKeyhole } from 'lucide-react'
import { ExternalOnboardingForm } from '@/components/organizations/external-onboarding-form'
import { getClubPortalContext } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { completeClubOnboardingAction } from './actions'

function roleLabel(role: string) {
  if (role === 'club_owner') return 'Club owner'
  if (role === 'club_director') return 'Club director'
  return 'Board viewer'
}

export default async function ClubOnboardingPage() {
  const context = await getClubPortalContext()
  if (!context) redirect('/club/login')
  const supabase = createServerSupabaseClient()
  const { data: identity } = await supabase
    .from('external_identity_profiles')
    .select('id')
    .eq('organization_id', context.organizationId)
    .eq('user_id', context.userId)
    .not('onboarding_completed_at', 'is', null)
    .maybeSingle()
  if (identity) redirect('/club')

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between border-b border-slate-200 px-6 py-8 lg:border-b-0 lg:border-r lg:px-10">
          <p className="text-sm font-semibold text-emerald-950">COACH FIRST</p>
          <div className="max-w-md py-12">
            <p className="text-xs font-semibold uppercase text-emerald-800">Private club access</p>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight">
              Confirm who is entering the decision room.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Your identity and club role sit beside every access decision. This keeps
              confidential coach material with the people authorised to use it.
            </p>
            <div className="mt-8 space-y-4 border-t border-emerald-950/15 pt-5">
              <div className="flex gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-emerald-800" />
                <div>
                  <p className="text-sm font-semibold">{context.organizationName}</p>
                  <p className="text-xs text-slate-500">{roleLabel(context.membershipRole)}</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs leading-5 text-slate-600">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                Club briefs, dossier previews and release requests remain auditable.
              </div>
              <div className="flex gap-3 text-xs leading-5 text-slate-600">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                Access to private material still requires explicit Coach First approval.
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">Invite-only · organisation-scoped · revocable</p>
        </section>

        <section className="flex items-center bg-white px-6 py-10 lg:px-12">
          <div className="w-full max-w-xl">
            <p className="text-xs font-semibold uppercase text-emerald-800">First login</p>
            <h2 className="mt-2 text-2xl font-semibold">Complete your account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This takes under a minute and makes your seat identifiable to the club and Coach First.
            </p>
            <div className="mt-6">
              <ExternalOnboardingForm
                action={completeClubOnboardingAction}
                accountType="club"
                organizationName={context.organizationName}
                defaultTitle={roleLabel(context.membershipRole)}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
