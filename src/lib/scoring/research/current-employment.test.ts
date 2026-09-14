import assert from 'node:assert/strict'
import test from 'node:test'
import { currentEmploymentForApiId, employmentLabel } from './current-employment.ts'

test('current Maresca employment is City, independently of historical Chelsea tactical evidence', () => {
  const role = currentEmploymentForApiId(12629)
  assert.ok(role)
  assert.equal(role.club, 'Manchester City')
  assert.equal(role.checkedAt, '2026-09-14')
  assert.match(role.sourceUrl ?? '', /mancity\.com/)
})

test('unknown employment never promotes a last club to current employment', () => {
  assert.equal(employmentLabel({ apiId: 1, name: 'Example', club: 'Old club', role: 'Head coach', status: 'unknown', checkedAt: '2026-09-14', sourceUrl: null, sourceTitle: null, note: 'Departure verified, current role unknown' }), 'Current employment not verified')
  assert.equal(currentEmploymentForApiId(-1), undefined)
})
