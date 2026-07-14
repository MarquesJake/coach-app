import { createHash } from 'node:crypto'

const RAW_INVITATION_TOKEN = /^[0-9a-f]{64}$/

export function isValidInvitationToken(token: string): boolean {
  return RAW_INVITATION_TOKEN.test(token)
}
export function hashInvitationToken(token: string): string | null {
  if (!isValidInvitationToken(token)) return null
  return createHash('sha256').update(token).digest('hex')
}

export function safeAuthRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard/overview'
  return value
}
