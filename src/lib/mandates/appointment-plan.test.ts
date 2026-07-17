import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateAppointmentGates,
  getNextFootballAction,
  isServiceModel,
  type AppointmentPlanFacts,
} from './appointment-plan.ts'

const completeFacts: AppointmentPlanFacts = {
  serviceModel: 'full_service_search',
  briefComplete: true,
  candidateCount: 6,
  recommendationCount: 3,
  leadCoachId: 'coach-1',
  leadCoachName: 'Example Coach',
  leadCriteriaComplete: 8,
  leadInterviewCount: 2,
  leadReferenceCount: 3,
  leadFeasibilityVerified: true,
  releaseCount: 1,
}

test('service model validation rejects uncontracted values', () => {
  assert.equal(isServiceModel('full_service_search'), true)
  assert.equal(isServiceModel('percentage_fee'), false)
})

test('full service gates expose the first football gap without hard-blocking the process', () => {
  const gates = calculateAppointmentGates({ ...completeFacts, briefComplete: false, candidateCount: 2 })
  assert.equal(gates.find((gate) => gate.key === 'brief')?.status, 'attention')
  assert.equal(gates.find((gate) => gate.key === 'market')?.status, 'attention')
  assert.equal(getNextFootballAction(gates, []).label, 'Club brief')
})

test('succession planning does not require feasibility or dossier release', () => {
  const gates = calculateAppointmentGates({
    ...completeFacts,
    serviceModel: 'succession_intelligence',
    leadFeasibilityVerified: false,
    releaseCount: 0,
  })
  assert.equal(gates.find((gate) => gate.key === 'feasibility')?.status, 'not_required')
  assert.equal(gates.find((gate) => gate.key === 'release')?.status, 'not_required')
})

test('blocked and overdue manual work takes priority over derived gates', () => {
  const gates = calculateAppointmentGates({ ...completeFacts, briefComplete: false })
  const result = getNextFootballAction(gates, [{
    id: 'action-1',
    item: 'Confirm permission to speak',
    status: 'Blocked',
    priority: 'high',
    due_date: '2026-07-20',
    blocked_reason: 'Waiting for agent response.',
  }], new Date('2026-07-17T12:00:00Z'))
  assert.equal(result.label, 'Confirm permission to speak')
  assert.equal(result.detail, 'Waiting for agent response.')
  assert.equal(result.source, 'manual')
})

test('completed manual work never displaces the next incomplete gate', () => {
  const gates = calculateAppointmentGates({ ...completeFacts, releaseCount: 0 })
  const result = getNextFootballAction(gates, [{
    id: 'action-1',
    item: 'Old completed task',
    status: 'Completed',
    priority: 'urgent',
    due_date: '2026-07-01',
  }], new Date('2026-07-17T12:00:00Z'))
  assert.equal(result.label, 'Controlled release')
})
