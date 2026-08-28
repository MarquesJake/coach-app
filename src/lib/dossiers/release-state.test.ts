import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveControlledRelease } from './release-state.ts'

const now = new Date('2026-08-28T12:00:00Z')

test('a dossier without an order remains preview-only', () => {
  const release = resolveControlledRelease(null, null, now)
  assert.equal(release.state, 'preview')
  assert.equal(release.canViewMaterials, false)
  assert.equal(release.canRelease, false)
})

test('active access requires both an active order and a non-expired active grant', () => {
  const release = resolveControlledRelease(
    { status: 'active', expires_at: '2026-09-30T00:00:00Z' },
    { status: 'active', expires_at: '2026-09-30T00:00:00Z' },
    now
  )
  assert.equal(release.state, 'active')
  assert.equal(release.canViewMaterials, true)
  assert.equal(release.canRelease, false)
})

test('an active order never unlocks files when its grant is missing', () => {
  const release = resolveControlledRelease(
    { status: 'active', expires_at: '2026-09-30T00:00:00Z' },
    null,
    now
  )
  assert.equal(release.state, 'under-review')
  assert.equal(release.canViewMaterials, false)
})

test('an invalid grant expiry fails closed', () => {
  const release = resolveControlledRelease(
    { status: 'active', expires_at: '2026-09-30T00:00:00Z' },
    { status: 'active', expires_at: 'not-a-date' },
    now
  )
  assert.equal(release.state, 'under-review')
  assert.equal(release.canViewMaterials, false)
})

test('time expiry overrides stale active database statuses', () => {
  const release = resolveControlledRelease(
    { status: 'active', expires_at: '2026-08-20T00:00:00Z' },
    { status: 'active', expires_at: '2026-08-20T00:00:00Z' },
    now
  )
  assert.equal(release.state, 'expired')
  assert.equal(release.canViewMaterials, false)
  assert.equal(release.canRelease, true)
})

test('revocation takes priority over future expiry', () => {
  const release = resolveControlledRelease(
    { status: 'active', expires_at: '2026-09-30T00:00:00Z' },
    { status: 'revoked', expires_at: '2026-09-30T00:00:00Z' },
    now
  )
  assert.equal(release.state, 'revoked')
  assert.equal(release.canViewMaterials, false)
})

test('closed and pending orders expose honest non-access states', () => {
  assert.equal(resolveControlledRelease({ status: 'declined' }, null, now).state, 'declined')
  assert.equal(resolveControlledRelease({ status: 'cancelled' }, null, now).state, 'cancelled')
  assert.equal(resolveControlledRelease({ status: 'requested' }, null, now).state, 'requested')
  assert.equal(resolveControlledRelease({ status: 'under_review' }, null, now).state, 'under-review')
})
