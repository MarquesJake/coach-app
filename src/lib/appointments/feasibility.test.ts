import test from 'node:test'
import assert from 'node:assert/strict'
import { appointmentFeasibility, APPOINTMENT_DECISIONS, TOTTENHAM_CLUB_ID, TOTTENHAM_MANDATE_ID, type AppointmentDecision } from './feasibility.ts'
const maresca = { apiId: 12629, name: 'Enzo Maresca', aliases: ['E. Maresca'] }

test('Maresca decision applies by explicit Tottenham club or mandate identity, never globally', () => {
  for (const context of [{ clubId: TOTTENHAM_CLUB_ID }, { mandateId: TOTTENHAM_MANDATE_ID }]) {
    const result = appointmentFeasibility(maresca, context)
    assert.equal(result.status, 'not-pursuing')
    assert.equal(result.excluded, true)
    assert.equal(result.decision?.checkedAt, '2026-09-14')
    assert.equal(result.decision?.decidedBy, 'user')
    assert.match(result.decision!.source.url, /^https:\/\/www.mancity.com\//)
  }
  assert.equal(appointmentFeasibility(maresca, { clubId: 'unlinked-duplicate-record' }).status, 'unknown')
  assert.equal(appointmentFeasibility({ ...maresca, apiId: 999 }, { clubId: TOTTENHAM_CLUB_ID }).excluded, false)
})

test('a sourced mandate-specific route can supersede club policy without claiming attainability', () => {
  const route: AppointmentDecision = { ...APPOINTMENT_DECISIONS[0], scope: { mandateId: 'new-review' }, status: 'route-to-verify', decidedBy: 'analyst', reason: 'Fixture evidence: release route reviewed; salary, conditions and willingness remain unresolved.', source: { title: 'Test fixture evidence, not a real clause', url: 'https://example.com/test-evidence' } }
  const result = appointmentFeasibility(maresca, { clubId: TOTTENHAM_CLUB_ID, mandateId: 'new-review' }, [...APPOINTMENT_DECISIONS, route])
  assert.equal(result.status, 'route-to-verify')
  assert.equal(result.excluded, false)
  assert.equal(appointmentFeasibility(maresca, { clubId: TOTTENHAM_CLUB_ID, mandateId: 'other' }, [...APPOINTMENT_DECISIONS, route]).excluded, true)
  assert.equal(appointmentFeasibility(maresca, { clubId: TOTTENHAM_CLUB_ID, mandateId: 'new-review' }, [...APPOINTMENT_DECISIONS, { ...route, source: { title: '', url: '' } }]).excluded, true)
})

test('incumbents remain excluded even with a route; unknown feasibility is not an employment exclusion', () => {
  assert.equal(appointmentFeasibility(maresca, { incumbentName: 'E. Maresca' }, []).status, 'incumbent')
  assert.equal(appointmentFeasibility({ apiId: 2424, name: 'Roberto De Zerbi', aliases: [] }, { clubId: TOTTENHAM_CLUB_ID }, []).status, 'incumbent')
  assert.deepEqual(appointmentFeasibility(maresca, {}, []), { status: 'unknown', excluded: false, reason: 'Appointment feasibility unknown: willingness, terms and any release route still need verification.' })
})
