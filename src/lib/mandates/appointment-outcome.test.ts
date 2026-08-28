import assert from 'node:assert/strict'
import test from 'node:test'

import {
  outcomeDecisionNote,
  selectLeadRecommendation,
  validateAppointmentOutcomeInput,
} from './appointment-outcome.ts'

const validInput = {
  status: 'appointed',
  appointedCoachId: 'coach-1',
  appointmentDate: '2026-09-10',
  nextReviewDate: '2026-12-10',
  decisionNote: 'The board approved the appointment after final diligence.',
  shortlistedCoachIds: ['coach-1', 'coach-2'],
}

test('lead recommendation favours a proceed verdict before confidence', () => {
  const lead = selectLeadRecommendation([
    { coach_id: 'coach-2', verdict: 'Monitor', confidence: 95 },
    { coach_id: 'coach-1', verdict: 'Proceed', confidence: 72 },
    { coach_id: 'coach-3', verdict: 'Dismiss', confidence: 99 },
  ])

  assert.equal(lead?.coach_id, 'coach-1')
})

test('lead recommendation falls back to the best available dismissed record', () => {
  const lead = selectLeadRecommendation([
    { coach_id: 'coach-1', verdict: 'Dismiss', confidence: 60 },
    { coach_id: 'coach-2', verdict: 'Dismiss', confidence: 80 },
  ])

  assert.equal(lead?.coach_id, 'coach-2')
})

test('appointment outcome accepts a complete appointment record', () => {
  assert.equal(validateAppointmentOutcomeInput(validInput), null)
})

test('pending decision accepts no appointment while still scheduling a review', () => {
  assert.equal(validateAppointmentOutcomeInput({
    ...validInput,
    status: 'pending',
    appointedCoachId: null,
    appointmentDate: null,
  }), null)
})

test('appointment outcome requires an appointed shortlist coach and appointment date', () => {
  assert.match(
    validateAppointmentOutcomeInput({ ...validInput, appointedCoachId: null }) ?? '',
    /choose the coach/i
  )
  assert.match(
    validateAppointmentOutcomeInput({ ...validInput, appointedCoachId: 'coach-3' }) ?? '',
    /decision set/i
  )
  assert.match(
    validateAppointmentOutcomeInput({ ...validInput, appointmentDate: null }) ?? '',
    /appointment date/i
  )
})

test('appointment outcome requires a meaningful note and future review sequence', () => {
  assert.match(
    validateAppointmentOutcomeInput({ ...validInput, decisionNote: 'Too short' }) ?? '',
    /decision note/i
  )
  assert.match(
    validateAppointmentOutcomeInput({ ...validInput, nextReviewDate: '2026-08-01' }) ?? '',
    /cannot be before/i
  )
  assert.match(
    validateAppointmentOutcomeInput({ ...validInput, nextReviewDate: '2026-99-99' }) ?? '',
    /schedule the next outcome review/i
  )
})

test('closed search rejects stale appointment fields', () => {
  const result = validateAppointmentOutcomeInput({
    ...validInput,
    status: 'not_appointed',
  })

  assert.match(result ?? '', /only record an appointed coach/i)
})

test('decision note is read safely from a stored outcome snapshot', () => {
  assert.equal(outcomeDecisionNote({ decision_note: '  Board chose the lower-risk route.  ' }), 'Board chose the lower-risk route.')
  assert.equal(outcomeDecisionNote([]), null)
  assert.equal(outcomeDecisionNote({ decision_note: 42 }), null)
})
