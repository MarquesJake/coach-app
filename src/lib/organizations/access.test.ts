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
    hasActiveCoachAccess: false,
    hasClubIdentity: true,
    hasCoachIdentity: false,
    isClubOnlyIdentity: true,
    isCoachOnlyIdentity: false,
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
  assert.equal(access.hasCoachIdentity, false)
  assert.equal(access.isCoachOnlyIdentity, false)
})

test('active coach-only members are routed away from analyst and club workspaces', () => {
  const access = classifyOrganizationAccess([{ role: 'coach', status: 'active' }])
  assert.deepEqual(access, {
    hasActiveInternalAccess: false,
    hasActiveClubAccess: false,
    hasActiveCoachAccess: true,
    hasClubIdentity: false,
    hasCoachIdentity: true,
    isClubOnlyIdentity: false,
    isCoachOnlyIdentity: true,
  })
})

test('revoked coach membership preserves identity without granting access', () => {
  const access = classifyOrganizationAccess([{ role: 'coach_representative', status: 'revoked' }])
  assert.equal(access.hasCoachIdentity, true)
  assert.equal(access.hasActiveCoachAccess, false)
  assert.equal(access.isCoachOnlyIdentity, true)
})
