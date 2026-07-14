'use server'

import { createHash, randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { CLUB_ORGANIZATION_ROLES } from '@/lib/organizations/access'

export type InviteClubUserResult = {
  ok: boolean
  error?: string
  inviteLink?: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function requireInternalUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!await getInternalOrganizationId(user.id)) redirect('/dashboard')
  const { data: isOperator } = await supabase.rpc('is_internal_operator')
  if (!isOperator) redirect('/dashboard')
  return { supabase, user }
}

export async function createClubOrganizationAction(formData: FormData) {
  const { supabase, user } = await requireInternalUser()
  const clubId = String(formData.get('club_id') ?? '')
  const { data: club } = await supabase.from('clubs').select('id, name').eq('id', clubId).maybeSingle()
  if (!club) redirect(`/clubs/${clubId}?error=club_access`)

  const { error } = await supabase.from('organizations').insert({
    name: club.name,
    slug: `${slugify(club.name)}-${club.id.slice(0, 8)}`,
    organization_type: 'club',
    club_id: club.id,
    status: 'active',
    created_by: user.id,
  })
  if (error && error.code !== '23505') redirect(`/clubs/${clubId}/access?error=create`)
  revalidatePath(`/clubs/${clubId}/access`)
  redirect(`/clubs/${clubId}/access?created=1`)
}

export async function issueClubInvitationAction(formData: FormData): Promise<InviteClubUserResult> {
  const { supabase } = await requireInternalUser()
  const clubId = String(formData.get('club_id') ?? '')
  const organizationId = String(formData.get('organization_id') ?? '')
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const role = String(formData.get('role') ?? '')
  if (!clubId || !organizationId || !email || !(CLUB_ORGANIZATION_ROLES as readonly string[]).includes(role)) {
    return { ok: false, error: 'Enter an email address and choose a valid club role.' }
  }

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.rpc('issue_club_invitation', {
    target_organization_id: organizationId,
    intended_email: email,
    invited_role: role,
    invitation_token_hash: tokenHash,
    invitation_expires_at: expiresAt,
  })
  if (error) return { ok: false, error: error.message }

  const headerStore = headers()
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000'
  const inviteLink = `${protocol}://${host}/club/invite/${rawToken}`
  return { ok: true, inviteLink }
}

export async function revokeClubInvitationAction(formData: FormData) {
  const { supabase } = await requireInternalUser()
  const clubId = String(formData.get('club_id') ?? '')
  const invitationId = String(formData.get('invitation_id') ?? '')
  const { error } = await supabase.rpc('revoke_club_invitation', {
    target_invitation_id: invitationId,
  })
  if (error) redirect(`/clubs/${clubId}/access?error=revoke_invite`)
  revalidatePath(`/clubs/${clubId}/access`)
  redirect(`/clubs/${clubId}/access?revoked=invite`)
}

export async function revokeClubMembershipAction(formData: FormData) {
  const { supabase } = await requireInternalUser()
  const clubId = String(formData.get('club_id') ?? '')
  const membershipId = String(formData.get('membership_id') ?? '')
  const { error } = await supabase.rpc('revoke_club_membership', {
    target_membership_id: membershipId,
  })
  if (error) redirect(`/clubs/${clubId}/access?error=revoke_member`)
  revalidatePath(`/clubs/${clubId}/access`)
  redirect(`/clubs/${clubId}/access?revoked=member`)
}
