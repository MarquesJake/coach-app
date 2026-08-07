import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ANALYST_ROUTE_PREFIXES,
  canEnterAnalystApplication,
  classifyOrganizationAccess,
  isAnalystApiRoute,
  isAnalystRoute,
  isPublicApplicationPath,
  resolveWorkspaceHome,
  NO_WORKSPACE_PATH,
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
    hasNoWorkspaceIdentity: false,
  })
  for (const route of ANALYST_ROUTE_PREFIXES) assert.equal(isAnalystRoute(route), true)
  assert.equal(isAnalystRoute('/club'), false)
  assert.equal(isAnalystRoute('/club/dossiers/example'), false)
  assert.equal(isAnalystApiRoute('/api/integrations/coaches/sync-english'), true)
  assert.equal(isAnalystApiRoute('/api/health'), false)
  assert.equal(isPublicApplicationPath('/api/health'), true)
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

test('an account with no membership is denied the analyst application', () => {
  const access = classifyOrganizationAccess([])
  // Being neither a club nor a coach identity must not admit the account:
  // analyst entry is granted by internal membership only.
  assert.equal(access.isClubOnlyIdentity, false)
  assert.equal(access.isCoachOnlyIdentity, false)
  assert.equal(access.hasNoWorkspaceIdentity, true)
  assert.equal(canEnterAnalystApplication(access), false)
  assert.equal(resolveWorkspaceHome(access), NO_WORKSPACE_PATH)
})

test('a revoked internal membership loses analyst entry', () => {
  const access = classifyOrganizationAccess([{ role: 'analyst', status: 'revoked' }])
  assert.equal(access.hasActiveInternalAccess, false)
  assert.equal(canEnterAnalystApplication(access), false)
  // A revoked internal account holds no club or coach identity to fall back on.
  assert.equal(access.hasNoWorkspaceIdentity, true)
  assert.equal(resolveWorkspaceHome(access), NO_WORKSPACE_PATH)
})

test('active internal membership is the sole grant of analyst entry', () => {
  for (const role of ['owner', 'admin', 'analyst']) {
    const access = classifyOrganizationAccess([{ role, status: 'active' }])
    assert.equal(canEnterAnalystApplication(access), true, `${role} should enter`)
    assert.equal(access.hasNoWorkspaceIdentity, false)
    assert.equal(resolveWorkspaceHome(access), '/dashboard/overview')
  }
})

test('external identities resolve to their own workspace, never to analyst', () => {
  const club = classifyOrganizationAccess([{ role: 'club_owner', status: 'active' }])
  assert.equal(canEnterAnalystApplication(club), false)
  assert.equal(resolveWorkspaceHome(club), '/club')

  const coach = classifyOrganizationAccess([{ role: 'coach', status: 'active' }])
  assert.equal(canEnterAnalystApplication(coach), false)
  assert.equal(resolveWorkspaceHome(coach), '/coach/profile')

  // A revoked club identity still belongs to the club surface, which renders
  // its own inactive state, rather than being sent to the no-workspace page.
  const revokedClub = classifyOrganizationAccess([{ role: 'club_viewer', status: 'revoked' }])
  assert.equal(resolveWorkspaceHome(revokedClub), '/club')
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
    hasNoWorkspaceIdentity: false,
  })
})

test('revoked coach membership preserves identity without granting access', () => {
  const access = classifyOrganizationAccess([{ role: 'coach_representative', status: 'revoked' }])
  assert.equal(access.hasCoachIdentity, true)
  assert.equal(access.hasActiveCoachAccess, false)
  assert.equal(access.isCoachOnlyIdentity, true)
})
