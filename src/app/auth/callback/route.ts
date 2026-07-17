import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hashInvitationToken, safeAuthRedirectPath } from '@/lib/organizations/invitations'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeAuthRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const invitationMatch = next.match(/^\/club\/invite\/([0-9a-f]{64})$/)
      if (invitationMatch) {
        const tokenHash = hashInvitationToken(invitationMatch[1])
        if (tokenHash) {
          const { error: claimError } = await supabase.rpc('claim_club_invitation', {
            invitation_token_hash: tokenHash,
          })
          if (!claimError) {
            await supabase.rpc('record_club_first_login')
            return NextResponse.redirect(`${origin}/club`)
          }
        }
      }
      const coachInvitationMatch = next.match(/^\/coach\/invite\/([0-9a-f]{64})$/)
      if (coachInvitationMatch) {
        const tokenHash = hashInvitationToken(coachInvitationMatch[1])
        if (tokenHash) {
          const { error: claimError } = await supabase.rpc('claim_coach_invitation', {
            invitation_token_hash: tokenHash,
          })
          if (!claimError) {
            await supabase.rpc('record_coach_first_login')
            return NextResponse.redirect(`${origin}/coach/profile`)
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
