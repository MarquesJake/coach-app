import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock3, KeyRound, ShieldCheck, UserMinus, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { InviteClubUserForm } from './_components/invite-club-user-form'
import {
  createClubOrganizationAction,
  revokeClubInvitationAction,
  revokeClubMembershipAction,
} from './actions'

function roleLabel(role: string) {
  return role.replace('club_', '').replaceAll('_', ' ')
}

export default async function ClubAccessPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await getInternalOrganizationId(user.id)) notFound()
  const { data: isOperator } = await supabase.rpc('is_internal_operator')
  if (!isOperator) notFound()

  const [{ data: club }, { data: organization }] = await Promise.all([
    supabase.from('clubs').select('id, name, league, country').eq('id', params.id).maybeSingle(),
    supabase.from('organizations').select('id, name, slug, status').eq('club_id', params.id).eq('organization_type', 'club').maybeSingle(),
  ])
  if (!club) notFound()

  if (!organization) {
    return (
      <div className="mx-auto max-w-[900px]">
        <Link href={`/clubs/${club.id}`} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to {club.name}</Link>
        <div className="mt-6 rounded-md border border-border bg-card p-7">
          <KeyRound className="h-6 w-6 text-primary" />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">Open a private club room</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Create the organisation boundary before inviting a club owner, sporting director or board viewer. This does not publish a dossier or grant confidential material.</p>
          <form action={createClubOrganizationAction} className="mt-5">
            <input type="hidden" name="club_id" value={club.id} />
            <button className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Create club decision room</button>
          </form>
        </div>
      </div>
    )
  }

  const [{ data: invitations }, { data: memberships }, { data: events }] = await Promise.all([
    supabase.from('club_invitations').select('id, email, role, status, expires_at, claimed_by, claimed_at, created_at').eq('organization_id', organization.id).order('created_at', { ascending: false }),
    supabase.from('organization_memberships').select('id, user_id, role, status, accepted_at, created_at').eq('organization_id', organization.id).order('created_at'),
    supabase.from('organization_access_events').select('id, event_type, metadata, occurred_at, target_user_id').eq('organization_id', organization.id).order('occurred_at', { ascending: false }).limit(12),
  ])
  const emailByUser = new Map((invitations ?? []).filter((invite) => invite.claimed_by).map((invite) => [invite.claimed_by as string, invite.email]))

  return (
    <div className="mx-auto max-w-[1080px]">
      <Link href={`/clubs/${club.id}`} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to {club.name}</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Identity and access</p><h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">{organization.name} club room</h1><p className="mt-2 text-sm text-muted-foreground">Invite-only accounts, role assignment and a traceable access history.</p></div>
        <span className="inline-flex items-center gap-2 rounded border border-emerald-700/20 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-900"><ShieldCheck className="h-4 w-4" />{organization.status}</span>
      </div>

      <section className="mt-6 rounded-md border border-border bg-card p-5">
        <div className="mb-4"><h2 className="text-sm font-semibold text-foreground">Invite a club user</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">The recipient can create or connect an account only through the generated single-use link.</p></div>
        <InviteClubUserForm clubId={club.id} organizationId={organization.id} />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3"><Users className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-foreground">Active seats</h2></div>
          <div className="divide-y divide-border/60">
            {(memberships ?? []).map((membership) => (
              <div key={membership.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-5 py-4">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{emailByUser.get(membership.user_id) ?? (membership.user_id === user.id ? user.email : 'Club account')}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{roleLabel(membership.role)} · {membership.status}</p></div>
                {membership.status === 'active' && membership.user_id !== user.id && <form action={revokeClubMembershipAction}><input type="hidden" name="club_id" value={club.id} /><input type="hidden" name="membership_id" value={membership.id} /><button title="Revoke club access" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-red-700"><UserMinus className="h-4 w-4" /></button></form>}
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3"><Clock3 className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-foreground">Invitations</h2></div>
          <div className="divide-y divide-border/60">
            {(invitations ?? []).length === 0 && <p className="px-5 py-5 text-xs text-muted-foreground">No invitations issued yet.</p>}
            {(invitations ?? []).map((invitation) => {
              const expired = invitation.status === 'pending' && new Date(invitation.expires_at).getTime() <= Date.now()
              return <div key={invitation.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{invitation.email}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{roleLabel(invitation.role)} · {expired ? 'expired' : invitation.status}</p></div>{invitation.status === 'pending' && !expired && <form action={revokeClubInvitationAction}><input type="hidden" name="club_id" value={club.id} /><input type="hidden" name="invitation_id" value={invitation.id} /><button className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-red-700">Revoke</button></form>}</div>
            })}
          </div>
        </section>
      </div>

      <section className="mt-5 overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border px-5 py-3"><h2 className="text-sm font-semibold text-foreground">Access audit</h2></div>
        <div className="divide-y divide-border/60">{(events ?? []).length === 0 && <p className="px-5 py-5 text-xs text-muted-foreground">Audit events will appear as invitations are issued and claimed.</p>}{(events ?? []).map((event) => <div key={event.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_minmax(0,1fr)_150px] sm:items-center"><span className="text-xs font-medium capitalize text-foreground">{event.event_type.replaceAll('_', ' ')}</span><span className="truncate text-xs text-muted-foreground">{typeof event.metadata === 'object' && event.metadata && 'email' in event.metadata ? String(event.metadata.email) : 'Organisation access event'}</span><time className="text-xs text-muted-foreground">{new Date(event.occurred_at).toLocaleString('en-GB')}</time></div>)}</div>
      </section>
    </div>
  )
}
