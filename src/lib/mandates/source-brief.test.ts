import test from 'node:test'
import assert from 'node:assert/strict'
import { sourceDecisionBrief } from './source-brief.ts'

test('prefill preserves direct wording without inferring authority or salary', () => {
  const result = sourceDecisionBrief({ squad_context: 'Retain the young centre-back pairing.', availability_timeline: 'After the season', budget_parameters: 'Confidential', contact_permission: 'Formal approach approved' })
  assert.equal(result.squad_problem.value, 'Retain the young centre-back pairing.')
  assert.equal(result.start_date.value, 'After the season')
  assert.equal(result.contact_permission.value, 'Research only')
  assert.equal(result.salary, undefined)
  assert.equal(result.squad_problem.priority, 'Preferred')
})

test('long source text is not silently truncated into a requirement', () => {
  assert.equal(sourceDecisionBrief({ squad_context: 'x'.repeat(2501) }).squad_problem, undefined)
  assert.equal(sourceDecisionBrief({ squad_context: '  ' }).squad_problem, undefined)
})
