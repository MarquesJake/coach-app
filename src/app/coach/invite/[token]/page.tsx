import Link from 'next/link'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hashInvitationToken } from '@/lib/organizations/invitations'
import { CoachInvitationForm } from './_components/coach-invitation-form'

export default async function CoachInvitationPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const tokenHash = hashInvitationToken(params.token)
  const [{ data: { user } }, previewResult] = await Promise.all([
    supabase.auth.getUser(),
    tokenHash
      ? supabase.rpc('preview_coach_invitation', { invitation_token_hash: tokenHash })
      : Promise.resolve({ data: null, error: null }),
  ])
  if (previewResult.error) throw new Error('The invitation could not be loaded. Retry to confirm its status.')
  const preview = Array.isArray(previewResult.data) ? previewResult.data[0] : null
  const isAvailable = preview?.invitation_status === 'pending'
    && new Date(preview.expires_at).getTime() > Date.now()

  return (
    <main className="grid min-h-screen bg-[#f6f4ef] text-slate-950 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex flex-col justify-between border-r border-slate-200 px-8 py-8 lg:px-14">
        <Link href="/" className="text-sm font-semibold text-emerald-950">GAFFA</Link>
        <div className="max-w-xl py-14">
          <p className="text-xs font-semibold uppercase text-emerald-800">Private coach invitation</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] text-slate-950">
            Build the profile behind your next opportunity.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
            Submit your football identity, training work, presentation, staff plan and career
            circumstances in one controlled place. Gaffa reviews the material before
            anything is used in a club process.
          </p>
          <div className="mt-8 flex gap-3 border-t border-emerald-950/20 pt-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-800" />
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Your self-submitted work remains clearly separated from independent references,
              public research and Gaffa&apos;s appointment recommendation.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500">Invite-only coach and representative access.</p>
      </section>

      <section className="flex items-center bg-white px-8 py-10 lg:px-14">
        <div className="w-full max-w-md">
          {isAvailable ? (
            <>
              <div className="mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-950 text-white">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{preview.coach_name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Invitation for {preview.email_hint} · {preview.invited_role === 'coach' ? 'Coach' : 'Representative'}
                </p>
              </div>
              <CoachInvitationForm token={params.token} hasSession={Boolean(user)} currentEmail={user?.email ?? null} />
              <p className="mt-5 text-[11px] leading-5 text-slate-500">
                Once you accept, you’ll confirm who you are and agree how the profile is used before opening it.
              </p>
            </>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-6">
              <LockKeyhole className="h-6 w-6 text-slate-500" />
              <h2 className="mt-4 text-lg font-semibold">Invitation unavailable</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This link has expired or already been used. Ask Gaffa for a new invitation.
              </p>
              <Link href="/coach/login" className="mt-5 inline-flex rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">
                Coach sign in
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
