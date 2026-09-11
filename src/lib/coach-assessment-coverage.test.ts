import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assessmentCoverage, validateResearchClassification, type CoverageQuestion } from './coach-assessment-coverage.ts'

const now = Date.parse('2026-09-09T12:00:00Z')
const q: CoverageQuestion = { id:'q', assessment_area:'training_management', evidence_methods:['training_observation'], mandate_id:null, status:'answered', answer:'A recorded provisional assessment.', question:'How does the coach train?', counter_evidence:'', decision_impact:'Assess delivery.', evidence_claim_ids:['f'], updated_at:'2026-09-09' }
const f = {id:'f', claimed_value:'Observed training session.', source_name:'Observer', verification_status:'verified', occurred_at:'2026-09-08'}
const training = (rows: CoverageQuestion[], findings = [f]) => assessmentCoverage(rows,findings,now).find(a=>a.key==='training_management')!

test('assessment coverage isolates areas and general research from appointment context', () => {
  const rows = [q, {...q,id:'club',mandate_id:'m'}, {...q,id:'unclassified',assessment_area:null}, {...q,id:'tactics',assessment_area:'tactical_proposal'}]
  const area = training(rows)
  assert.deepEqual(area.answers.map(a=>a.id),['q'])
  assert.equal(area.missingMethods.includes('training_observation'),false)
  assert.equal(area.missingMethods.includes('references'),true)
  assert.equal(area.answers[0].needsReview,false)
})

test('examples and unavailable findings cannot produce promoted answers or method coverage', () => {
  for (const findings of [[], [{...f, source_name:'Illustrative fixture'}]]) {
    const area = training([q],findings)
    assert.equal(area.answers.length,0)
    assert.equal(area.held,1)
    assert.ok(area.missingMethods.includes('training_observation'))
  }
  assert.equal(training([{...q,answer:'Illustrative assessment for a demonstration.'}]).answers.length,0)
})

test('draft methods do not count; stale and conflicting supported answers remain labelled provisional', () => {
  assert.deepEqual(training([{...q,status:'in_progress'}]).methods,[])
  const area = training([{...q,counter_evidence:'Another observer disagreed.'}],[{...f,occurred_at:'2025-01-01'}])
  assert.equal(area.answers.length,1)
  assert.equal(area.answers[0].needsReview,true)
  assert.equal(area.answers[0].disputed,true)
  const missing = training([{...q,evidence_claim_ids:['f','missing']}])
  assert.equal(missing.answers[0].needsReview,true)
})

test('classification rejects unknown methods and unsupported evidence-method claims', () => {
  assert.equal(validateResearchClassification(null,[],[]),null)
  assert.equal(validateResearchClassification('training_management',['training_observation'],['f']),null)
  assert.ok(validateResearchClassification('invented',[],[]))
  assert.ok(validateResearchClassification('training_management',['invented'],['f']))
  assert.ok(validateResearchClassification('training_management',['training_observation'],[]))
})
