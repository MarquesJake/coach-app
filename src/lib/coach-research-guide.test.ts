import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COACH_RESEARCH_GUIDE, coachResearchTemplate } from './coach-research-guide.ts'
import { ASSESSMENT_CRITERIA } from './assessment/criteria.ts'
import { INTERVIEW_QUESTIONS, REFERENCE_QUESTIONS } from './assessment/question-banks.ts'
import { RESEARCH_DOMAINS, validateResearchQuestion } from './decision-workflow.ts'

test('all supplied assessment areas and question banks produce valid open research drafts', () => {
  assert.deepEqual(COACH_RESEARCH_GUIDE.map(a => a.criterion), ASSESSMENT_CRITERIA.map(a => a.key))
  const keys = [...COACH_RESEARCH_GUIDE, ...INTERVIEW_QUESTIONS, ...REFERENCE_QUESTIONS].map(q => q.key)
  assert.equal(new Set(keys).size, keys.length)
  for (const key of keys) {
    const draft = coachResearchTemplate(key)!
    assert.ok(draft, key)
    assert.ok(RESEARCH_DOMAINS.includes(draft.domain), key)
    assert.ok(draft.sourcePlan.length > 0 && draft.sourcePlan.length <= 4000)
    assert.equal(validateResearchQuestion({ question: draft.question, decision_impact: draft.impact, status: 'open', answer: '', evidence_claim_ids: [] }), null, key)
    assert.ok(validateResearchQuestion({ question: draft.question, decision_impact: draft.impact, status: 'answered', answer: '', evidence_claim_ids: [] }), 'A template must not satisfy answered-evidence requirements')
  }
})

test('interview and reference drafts retain source wording and identify the source type', () => {
  for (const question of INTERVIEW_QUESTIONS) {
    const draft = coachResearchTemplate(question.key)!
    assert.equal(draft.question, `${question.question}\n${question.followUp}`)
    assert.match(draft.sourcePlan, /Candidate interview/)
  }
  for (const question of REFERENCE_QUESTIONS) {
    const draft = coachResearchTemplate(question.key)!
    assert.equal(draft.question, question.question)
    assert.match(draft.sourcePlan, /Reference conversation/)
  }
  assert.equal(coachResearchTemplate('unknown-template'), undefined)
  assert.equal(coachResearchTemplate(undefined), undefined)
})
