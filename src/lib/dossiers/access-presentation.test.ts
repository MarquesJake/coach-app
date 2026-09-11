import assert from 'node:assert/strict'
import { test } from 'node:test'
import { confidenceLabel, presentDossierAccess } from './access-presentation.ts'
import { resolveControlledRelease } from './release-state.ts'

const now = new Date('2026-09-10T12:00:00Z')
const order = { status: 'active', expires_at: '2027-01-01' }

test('access presentation follows the release authority for every grant state', () => {
  for (const grant of [null, { status: 'active', expires_at: '2027-01-01' }, { status: 'active', expires_at: now.toISOString() }, { status: 'revoked', expires_at: '2027-01-01' }, { status: 'active', expires_at: 'invalid' }]) {
    const { nextAction, ...release } = presentDossierAccess(order, grant, now)
    assert.deepEqual(release, resolveControlledRelease(order, grant, now))
    assert.ok(nextAction.length > 0)
  }
  assert.equal(presentDossierAccess(null, null, now).canViewMaterials, false)
  assert.equal(presentDossierAccess(order, null, now).label, 'Release under review')
})

test('unknown confidence is distinct from a recorded zero', () => {
  assert.equal(confidenceLabel(null), 'Not recorded')
  assert.equal(confidenceLabel(undefined), 'Not recorded')
  assert.equal(confidenceLabel(NaN), 'Not recorded')
  assert.equal(confidenceLabel(0), '0%')
  assert.equal(confidenceLabel(83), '83%')
})
