'use server'

import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hashInvitationToken } from '@/lib/organizations/invitations'

export type CompleteCoachInvitationResult = {
  ok: boolean
  error?: string
  checkEmail?: boolean
}

function siteOrigin() {
  const headerStore = headers()
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000'
  return `${protocol}://${host}`
}

async function claimInvitation(tokenHash: string): Promise<CompleteCoachInvitationResult> {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.rpc('claim_coach_invitation', {
    invitation_token_hash: tokenHash,
  })
  if (error) {
    await supabase.auth.signOut()
    return { ok: false, error: error.message }
  }
  await supabase.rpc('record_coach_first_login')
  return { ok: true }
}

export async function completeCoachInvitationAction(
  formData: FormData
): Promise<CompleteCoachInvitationResult> {
  const rawToken = String(formData.get('token') ?? '')
  const tokenHash = hashInvitationToken(rawToken)
  if (!tokenHash) return { ok: false, error: 'This invitation link is invalid.' }

  const mode = String(formData.get('mode') ?? 'claim')
  const supabase = createServerSupabaseClient()
  if (mode === 'claim') return claimInvitation(tokenHash)

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || password.length < 10) {
    return { ok: false, error: 'Use the invited email and a password of at least 10 characters.' }
  }

  const { data: emailMatches, error: matchError } = await supabase.rpc(
    'coach_invitation_email_matches',
    {
      invitation_token_hash: tokenHash,
      candidate_email: email,
    }
  )
  if (matchError || !emailMatches) {
    return { ok: false, error: 'Use the exact email address this invitation was sent to.' }
  }

  if (mode === 'sign_up') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteOrigin()}/auth/callback?next=${encodeURIComponent(`/coach/invite/${rawToken}`)}`,
      },
    })
    if (error) return { ok: false, error: error.message }
    if (!data.session) return { ok: true, checkEmail: true }
    return claimInvitation(tokenHash)
  }

  if (mode === 'sign_in') {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return claimInvitation(tokenHash)
  }

  return { ok: false, error: 'Unsupported invitation action.' }
}

export async function signOutFromCoachInvitationAction() {
  await createServerSupabaseClient().auth.signOut()
  return { ok: true }
}
