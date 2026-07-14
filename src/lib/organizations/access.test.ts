import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ANALYST_ROUTE_PREFIXES,
  classifyOrganizationAccess,
  isAnalystApiRoute,
  isAnalystRoute,
} from './access.ts'

test('active club-only members are identified and kept out of analyst routes', () => {
  const access = classifyOrganizationAccess([{ role: 'club_director', status: 'active' }])
  assert.deepEqual(access, {
    hasActiveInternalAccess: false,
    hasActiveClubAccess: true,
    hasClubIdentity: true,
    isClubOnlyIdentity: true,
  })
  for (const route of ANALYST_ROUTE_PREFIXES) assert.equal(isAnalystRoute(route), true)
  assert.equal(isAnalystRoute('/club'), false)
  assert.equal(isAnalystRoute('/club/dossiers/example'), false)
  assert.equal(isAnalystApiRoute('/api/integrations/coaches/sync-english'), true)
  assert.equal(isAnalystApiRoute('/auth/callback'), false)
})

test('revoked club membership remains a club identity but loses active access', () => {
  const access = classifyOrganizationAccess([{ role: 'club_viewer', status: 'revoked' }])
  assert.equal(access.hasClubIdentity, true)
  assert.equal(access.hasActiveClubAccess, false)
  assert.equal(access.isClubOnlyIdentity, true)
})

test('internal users retain the analyst workspace when they also preview a club', () => {
  const access = classifyOrganizationAccess([
    { role: 'owner', status: 'active' },
    { role: 'club_owner', status: 'active' },
  ])
  assert.equal(access.hasActiveInternalAccess, true)
  assert.equal(access.hasActiveClubAccess, true)
  assert.equal(access.isClubOnlyIdentity, false)
})

test('fresh accounts without memberships are not misclassified as club users', () => {
  const access = classifyOrganizationAccess([])
  assert.equal(access.hasClubIdentity, false)
  assert.equal(access.isClubOnlyIdentity, false)
})
