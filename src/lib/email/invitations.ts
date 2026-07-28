import 'server-only'

import { Resend } from 'resend'

type InvitationAudience = 'club' | 'coach'

type InvitationEmailInput = {
  audience: InvitationAudience
  recipientEmail: string
  inviteLink: string
  invitedRole: string
  organizationName: string
  idempotencyKey: string
}

export type InvitationEmailResult =
  | { status: 'sent'; messageId: string }
  | { status: 'not_configured' }
  | { status: 'failed' }

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendInvitationEmail(
  input: InvitationEmailInput
): Promise<InvitationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.INVITATION_FROM_EMAIL?.trim()
  if (!apiKey || !from) return { status: 'not_configured' }

  const destination =
    input.audience === 'club' ? 'club decision room' : 'private coach profile'
  const organizationName = escapeHtml(input.organizationName)
  const invitedRole = escapeHtml(input.invitedRole.replaceAll('_', ' '))
  const inviteLink = escapeHtml(input.inviteLink)

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send(
      {
        from,
        to: input.recipientEmail,
        subject: `Your Coach First ${destination} invitation`,
        html: `
          <div style="background:#f6f7f5;padding:32px 16px;font-family:Arial,sans-serif;color:#17201c">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dfe5e1;padding:32px">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#486055">Coach First</p>
              <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;line-height:1.25">Secure invitation</h1>
              <p style="font-size:15px;line-height:1.65">You have been invited to the Coach First ${destination} for <strong>${organizationName}</strong> with <strong>${invitedRole}</strong> access.</p>
              <p style="margin:24px 0"><a href="${inviteLink}" style="display:inline-block;background:#123e32;color:#ffffff;text-decoration:none;padding:12px 18px;font-size:14px;font-weight:700">Accept invitation</a></p>
              <p style="font-size:13px;line-height:1.6;color:#617068">This link is single-use, tied to this email address and expires after seven days. Do not forward it.</p>
              <p style="font-size:12px;line-height:1.6;color:#7b8982">If you were not expecting this invitation, ignore this email or contact Coach First directly.</p>
            </div>
          </div>
        `,
      },
      { idempotencyKey: input.idempotencyKey }
    )
    if (error || !data?.id) return { status: 'failed' }
    return { status: 'sent', messageId: data.id }
  } catch {
    return { status: 'failed' }
  }
}
