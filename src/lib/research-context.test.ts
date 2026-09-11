import test from 'node:test'
import assert from 'node:assert/strict'
import { readResearchContext, captureResearchContext, researchHref, researchResumeHref, safeResearchReturn, questionsForScope, NEUTRAL_CAPTURE_DEFAULTS, researchContextNote, contextFromResearchNote } from './research-context.ts'

test('appointment, brief, coach, question and return survive capture, review and profile navigation', () => {
  const context = { coach: 'coach-1', mandate: 'appointment-1', briefVersion: '3', question: 'question-1', returnTo: '/mandates/appointment-1/assessment/coach-1' }
  let next = context
  for (const path of ['/intelligence/inbox', '/intelligence/review?claim=claim-1', '/coaches/coach-1/career']) {
    const url = new URL(researchHref(path, next), 'https://internal.invalid')
    next = readResearchContext(url.searchParams) as typeof context
    assert.deepEqual(next, context)
  }
  const resume = new URL(researchResumeHref(next)!, 'https://internal.invalid')
  assert.equal(resume.pathname, '/coaches/coach-1/research')
  assert.equal(resume.hash, '#question-question-1')
  assert.equal(resume.searchParams.get('mandate'), 'appointment-1')
})

test('return links allow workflow routes and reject external, encoded and traversal destinations', () => {
  for (const link of ['https://evil.example', '//evil.example', '/\\evil.example', '/coaches/../../auth/logout', '/coaches/%2f%2fevil.example', '/coaches/%255cevil', '/coaches/a\n', 'javascript:alert(1)', '/api/delete']) assert.equal(safeResearchReturn(link), undefined, link)
  assert.equal(safeResearchReturn('/mandates/a/candidates?coach=b#candidate-b'), '/mandates/a/candidates?coach=b#candidate-b')
  assert.equal(readResearchContext({ returnTo: '//evil.example' }).returnTo, undefined)
})

test('legacy mandate/coach/brief query aliases normalize without retaining arbitrary query parameters', () => {
  assert.deepEqual(readResearchContext(new URLSearchParams('coachId=c&mandateId=m&brief_version=2&question=q&token=secret')), { coach: 'c', mandate: 'm', briefVersion: '2', question: 'q', returnTo: undefined })
})

test('explicit target appointment is never overwritten by an inherited appointment', () => {
  const link = new URL(researchHref('/coaches/c/fit?mandate=new', { mandate: 'old' }), 'https://internal.invalid')
  assert.equal(link.searchParams.get('mandate'), 'new')
})

test('general and other appointment questions are separate from this appointment', () => {
  const rows = [{ id: 'a', mandate_id: 'one' }, { id: 'b', mandate_id: 'two' }, { id: 'c', mandate_id: null }]
  assert.deepEqual(questionsForScope(rows, 'one').map(row => row.id), ['a'])
  assert.deepEqual(questionsForScope(rows, 'one', true).map(row => row.id), ['c'])
  assert.deepEqual(questionsForScope(rows).map(row => row.id), ['c'])
})

test('saved source notes recover only safe research context, including an encoded return destination', () => {
  const context = { coach: 'c', mandate: 'm', briefVersion: '2', question: 'q', returnTo: '/mandates/m/assessment/c' }
  assert.deepEqual(contextFromResearchNote(`Unverified notes\n${researchContextNote(context)}`), context)
  assert.deepEqual(contextFromResearchNote('Research context: https://evil.example'), {})
})

test('capture defaults do not invent an agent, trusted tier or verified status', () => {
  assert.deepEqual(NEUTRAL_CAPTURE_DEFAULTS, { intake_type: 'other', source_type: 'other', source_tier: '', verification_status: 'unverified', review_status: 'captured', board_visibility: 'internal_only' })
})

test('switching appointment or coach never carries another candidate question into the new scope', () => {
  const context = { coach: 'c', mandate: 'old', question: 'q', briefVersion: '3', returnTo: '/mandates/old/candidates' }
  const appointment = new URL(researchHref('/mandates/new-appointment/candidates', context), 'https://internal.invalid')
  assert.equal(appointment.searchParams.get('mandate'), 'new-appointment')
  for (const key of ['question', 'briefVersion', 'returnTo']) assert.equal(appointment.searchParams.get(key), null)
  const coach = new URL(researchHref('/coaches/other/research', context), 'https://internal.invalid')
  assert.equal(coach.searchParams.get('coach'), 'other')
  assert.equal(coach.searchParams.get('question'), null)
  assert.equal(coach.searchParams.get('mandate'), 'old')
})

test('explicit general research scope survives profile navigation and the question return', () => {
  const context = readResearchContext(new URLSearchParams('coach=c&mandate=m&scope=general&question=q'))
  const profile = new URL(researchHref('/coaches/c/career', context), 'https://internal.invalid')
  const resume = new URL(researchResumeHref(readResearchContext(profile.searchParams))!, 'https://internal.invalid')
  assert.equal(resume.searchParams.get('scope'), 'general')
  assert.equal(resume.hash, '#question-q')
})

test('capturing from the separate general view cannot silently assign the appointment', () => {
  const context = captureResearchContext({ coach: 'c', mandate: 'm', question: 'q', scope: 'general', briefVersion: '2' })
  assert.equal(context.mandate, undefined)
  assert.equal(context.briefVersion, undefined)
  assert.equal(context.question, 'q')
  assert.equal(new URL(context.returnTo!, 'https://internal.invalid').searchParams.get('mandate'), 'm')
})

test('Candidates directory mandate query reaches the chosen profile and Fit', () => {
  const directory = readResearchContext(new URLSearchParams('mandate=appointment'))
  const profile = new URL(researchHref('/coaches/selected-coach', directory), 'https://internal.invalid')
  assert.equal(profile.searchParams.get('mandate'), 'appointment')
  assert.equal(profile.searchParams.get('coach'), 'selected-coach')
  const fit = new URL(researchHref('/coaches/selected-coach/fit', readResearchContext(profile.searchParams)), 'https://internal.invalid')
  assert.equal(fit.searchParams.get('mandate'), 'appointment')
  assert.equal(fit.searchParams.get('coach'), 'selected-coach')
})
