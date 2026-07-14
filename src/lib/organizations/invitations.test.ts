import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  hashInvitationToken,
  isValidInvitationToken,
  safeAuthRedirectPath,
} from './invitations.ts'

test('invitation tokens are fixed-length hex and stored only as SHA-256 digests', () => {
  const raw = 'a'.repeat(64)
  assert.equal(isValidInvitationToken(raw), true)
  assert.equal(hashInvitationToken(raw), 'ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb')
  assert.equal(hashInvitationToken('short'), null)
  assert.equal(hashInvitationToken('G'.repeat(64)), null)
})
test('auth callback redirects cannot leave the application origin', () => {
  assert.equal(safeAuthRedirectPath('/club/invite/token'), '/club/invite/token')
  assert.equal(safeAuthRedirectPath('https://attacker.example'), '/dashboard/overview')
  assert.equal(safeAuthRedirectPath('//attacker.example'), '/dashboard/overview')
  assert.equal(safeAuthRedirectPath(null), '/dashboard/overview')
})
