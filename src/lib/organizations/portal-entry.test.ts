import assert from 'node:assert/strict'
import { test } from 'node:test'
import { authenticatedPortalDestination, isPortalInvitation, PORTAL_ENTRIES, parsePortalRole, passwordUpdateHref, portalDestination, portalLoginHref, portalRecoveryHref } from './portal-entry.ts'
import { classifyOrganizationAccess } from './access.ts'

test('unknown or missing portal requires a choice, never defaults to Club', () => {
  for (const value of [null, undefined, '', 'admin', 'CLUB', '/coach']) assert.equal(parsePortalRole(value), null)
  for (const entry of PORTAL_ENTRIES) {
    assert.equal(parsePortalRole(entry.id), entry.id)
    assert.equal(portalLoginHref(entry.id), entry.login)
    assert.equal(portalDestination(entry.id), entry.home)
  }
})

test('same-role invitation and workspace destinations survive login and recovery encoding', () => {
  for (const [role, next] of [
    ['club', `/club/invite/${'a'.repeat(64)}`], ['coach', '/coach/profile?stage=football#model'],
    ['internal', '/mandates/new?brief_id=brief-1'], ['investor', '/investor?step=3&case=a#notes'],
  ] as const) {
    for (const href of [portalLoginHref(role, next), portalRecoveryHref(role, next), passwordUpdateHref(role, next)]) {
      assert.equal(new URL(href, 'https://gaffa.invalid').searchParams.get('next'), next)
    }
  }
  assert.equal(new URL(portalRecoveryHref('internal'), 'https://gaffa.invalid').searchParams.get('portal'), 'internal')
})

test('redirect targets stay inside the selected role and reject URL parser bypasses', () => {
  for (const role of PORTAL_ENTRIES) {
    for (const next of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/%2f%2fevil.invalid', '/auth/callback', '/api/delete', '/club/../coach', '/club/%2e%2e/coach', '/club\n/brief', '/club/login', '/investor/login']) {
      assert.equal(portalDestination(role.id, next), role.home, `${role.id}: ${next}`)
    }
  }
  assert.equal(portalDestination('club', '/club-briefs'), '/club')
  assert.equal(portalDestination('internal', '/club/brief'), '/dashboard')
  assert.equal(portalDestination('coach', '/investor?step=2'), '/coach/profile')
})

test('post-auth role and next cannot replace verified membership', () => {
  const club = classifyOrganizationAccess([{ role: 'club_director', status: 'active' }])
  assert.equal(authenticatedPortalDestination('club', '/club/brief?version=2', club, false), '/club/brief?version=2')
  for (const role of ['internal', 'coach', 'investor', null] as const) {
    assert.equal(authenticatedPortalDestination(role, '/dashboard?admin=true', club, false), '/club')
  }
  assert.equal(authenticatedPortalDestination('internal', '/dashboard', classifyOrganizationAccess([]), false), '/no-access')
  const revoked = classifyOrganizationAccess([{ role: 'club_director', status: 'revoked' }])
  assert.equal(authenticatedPortalDestination('club', '/club/dossiers/private', revoked, false), '/club')
})

test('investor identity takes precedence even over active internal memberships', () => {
  const internal = classifyOrganizationAccess([{ role: 'analyst', status: 'active' }])
  assert.equal(authenticatedPortalDestination('investor', '/investor?step=4', internal, true), '/investor?step=4')
  assert.equal(authenticatedPortalDestination('internal', '/dashboard', internal, true), '/investor')
  assert.equal(authenticatedPortalDestination('club', `/club/invite/${'a'.repeat(64)}`, internal, true), '/investor')
})

test('a valid public invitation can resume before membership exists, without authorizing a workspace', () => {
  const empty = classifyOrganizationAccess([])
  for (const role of ['club', 'coach'] as const) {
    const next = `/${role}/invite/${'a'.repeat(64)}`
    assert.equal(isPortalInvitation(role, next), true)
    assert.equal(authenticatedPortalDestination(role, next, empty, false), next)
    for (const bad of [`${next}/claim`, `/${role}/invite/not-a-token`, '/club/brief', '/coach/profile']) {
      assert.equal(isPortalInvitation(role, bad), false)
      assert.equal(authenticatedPortalDestination(role, bad, empty, false), '/no-access')
    }
  }
})
