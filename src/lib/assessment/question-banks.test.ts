import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INTERVIEW_QUESTIONS, REFERENCE_QUESTIONS, resolveCapturedQuestion } from './question-banks.ts'

test('supplied interview pack covers all 20 questions including five club-specific prompts', () => {
  assert.equal(INTERVIEW_QUESTIONS.length, 20)
  assert.equal(INTERVIEW_QUESTIONS.filter(q => q.focus === 'club_specific').length, 5)
  assert.equal(INTERVIEW_QUESTIONS.filter(q => q.focus === 'three_revealing').length, 3)
  assert.equal(new Set(INTERVIEW_QUESTIONS.map(q => q.key)).size, 20)
})

test('supplied reference pack has 15 prompts per stakeholder group and five general prompts', () => {
  for (const group of ['owners_ceos', 'coaching_staff', 'players', 'industry_network', 'journalists']) {
    assert.equal(REFERENCE_QUESTIONS.filter(q => q.stakeholderGroup === group).length, 15, group)
  }
  assert.equal(REFERENCE_QUESTIONS.filter(q => q.stakeholderGroup === 'general').length, 5)
  assert.equal(new Set(REFERENCE_QUESTIONS.map(q => q.key)).size, 80)
})

test('bespoke question is bounded and preserves template fallback', () => {
  assert.equal(resolveCapturedQuestion('Template', ' Specific question? '), 'Specific question?')
  assert.equal(resolveCapturedQuestion('Template', ' '), 'Template')
  assert.throws(() => resolveCapturedQuestion('Template', 'x'.repeat(1001)))
})

test('interview and reference saves require explicit review before recommendation inclusion', () => {
  const actions = readFileSync('src/app/(dashboard)/mandates/[id]/assessment/actions.ts', 'utf8')
  for (const name of ['addInterviewAnswerAction', 'addReferenceAnswerAction']) {
    const section = actions.split(`export async function ${name}`)[1].split('export async function ')[0]
    assert.match(section, /review_confirmed/)
    assert.match(section, /verificationStatus === 'verified' &&/)
    assert.doesNotMatch(section, /verification_status: 'verified'/)
    assert.match(section, /question: capturedQuestion/)
  }
})
