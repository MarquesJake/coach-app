import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildVerifiedCoachUpdate,
  calculateCareerCircumstancesReadiness,
  canStaffMemberAppearInPack,
} from './coach-appointment.ts'

test('career circumstances readiness measures decision-useful coverage', () => {
  const result = calculateCareerCircumstancesReadiness({
    current_salary: '£900k gross plus bonuses',
    salary_expectation: '£1.1m gross',
    contract_expiry: '2027-06-30',
    release_compensation: 'Estimated £750k',
    availability_timeline: 'Permission to speak required',
    family_situation: 'Partner and two school-age children',
    relocation_requirements: 'Family move after the season',
    appointment_conditions: 'Requires control of first-team staff appointments',
  }, [{
    full_name: 'A. Example',
    role_title: 'Assistant coach',
    essentiality: 'essential',
    likely_to_follow: 'yes',
  }])

  assert.equal(result.percent, 100)
  assert.deepEqual(result.missing, [])
})

test('verified coach update maps declarations to the canonical feasibility fields', () => {
  assert.deepEqual(buildVerifiedCoachUpdate({
    current_salary: '€1m gross',
    salary_expectation: '€1.2m gross',
    contract_expiry: '2028-06-30',
    release_compensation: 'Fixed €2m clause',
    availability_timeline: 'Available after current season',
    family_situation: 'Family based in Spain',
    relocation_requirements: 'Would relocate alone initially',
    staff_cost_expectation: '€350k total',
    appointment_conditions: 'Assistant and performance coach are essential',
  }), {
    current_salary: '€1m gross',
    wage_expectation: '€1.2m gross',
    contract_expiry: '2028-06-30',
    compensation_expectation: 'Fixed €2m clause',
    availability_timeline: 'Available after current season',
    family_context: 'Family based in Spain',
    relocation_flexibility: 'Would relocate alone initially',
    staff_cost_estimate: '€350k total',
    appointment_conditions: 'Assistant and performance coach are essential',
  })
})

test('staff details require verification and club-approved visibility before pack use', () => {
  assert.equal(canStaffMemberAppearInPack({
    review_status: 'unreviewed',
    confidentiality_status: 'shareable',
  }), false)
  assert.equal(canStaffMemberAppearInPack({
    review_status: 'verified',
    confidentiality_status: 'coach_first_only',
  }), false)
  assert.equal(canStaffMemberAppearInPack({
    review_status: 'verified',
    confidentiality_status: 'clubs_on_request',
  }), true)
})
