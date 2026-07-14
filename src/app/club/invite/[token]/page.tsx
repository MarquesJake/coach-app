import Link from 'next/link'
import { Building2, ShieldCheck } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hashInvitationToken } from '@/lib/organizations/invitations'
import { ClubInvitationForm } from './_components/club-invitation-form'

function roleLabel(role: string) {
  if (role === 'club_owner') return 'Club owner'
  if (role === 'club_director') return 'Club director'
  return 'Board viewer'
}
export default async function ClubInvitationPage({ params }: { params: { token: string } }) {
  const tokenHash = hashInvitationToken(params.token)
  const supabase = createServerSupabaseClient()
  const [{ data: previewRows }, { data: { user } }] = await Promise.all([
    tokenHash
      ? supabase.rpc('preview_club_invitation', { invitation_token_hash: tokenHash })
      : Promise.resolve({ data: null }),
    supabase.auth.getUser(),
  ])
  const preview = previewRows?.[0]
  const isAvailable = preview?.invitation_status === 'pending' && new Date(preview.expires_at).getTime() > Date.now()

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex flex-col justify-between border-r border-border px-8 py-8 lg:px-14">
        <Link href="/" className="text-sm font-semibold text-primary">COACH FIRST</Link>
        <div className="max-w-xl py-14"><p className="text-xs font-semibold uppercase text-primary">Private club invitation</p><h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] text-foreground">Join the appointment decision room.</h1><p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">One controlled place for the club brief, evidence-led coach dossiers and approved confidential material.</p><div className="mt-8 flex gap-3 border-t border-primary/20 pt-4"><ShieldCheck className="mt-0.5 h-5 w-5 text-primary" /><p className="max-w-md text-sm leading-6 text-muted-foreground">Your account is tied to one organisation and role. Access can be revoked without circulating or recalling files.</p></div></div>
        <p className="text-xs text-muted-foreground">Invite-only. Single use. Organisation scoped.</p>
      </section>
      <section className="flex items-center bg-card px-8 py-10 lg:px-14">
        <div className="w-full max-w-md">
          {!preview || !isAvailable ? (
            <div className="rounded-md border border-border bg-background p-6"><Building2 className="h-6 w-6 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold text-foreground">Invitation unavailable</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This link is invalid, expired, already claimed or revoked. Ask Coach First for a new invitation.</p><Link href="/club/login" className="mt-5 inline-flex rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground">Club sign in</Link></div>
          ) : (
            <div>
              <div className="mb-6 flex items-start gap-3 border-b border-border pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-foreground">{preview.organization_name}</h2><p className="mt-1 text-sm text-muted-foreground">{roleLabel(preview.invited_role)} · {preview.email_hint}</p></div></div>
              <ClubInvitationForm token={params.token} hasSession={Boolean(user)} currentEmail={user?.email ?? null} />
              <p className="mt-5 text-[11px] leading-5 text-muted-foreground">By accepting, you agree to handle club and coach information as confidential and only for the appointment process shown in the room.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
