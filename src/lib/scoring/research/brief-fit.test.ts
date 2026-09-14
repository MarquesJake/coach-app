import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateResearchFit, normalizeCoachName, type ResearchProfile } from './brief-fit.ts'

const possession: ResearchProfile = { name: 'Possession example', apiId: 1, aliases: [], style: 'Possession', pressing: 'Medium', build: 'Short', trackRecord: ['Promotion'], summary: '', limitation: '', sources: [] }
const pressing: ResearchProfile = { ...possession, name: 'Pressing example', apiId: 2, style: 'Pressing', pressing: 'High', build: 'Mixed' }
const brief = { tactical_model_required: 'Possession / build-out', pressing_intensity_required: 'High', build_preference_required: 'Short build', strategic_objective: 'Promotion' }

test('changing the football brief changes the order rather than preserving predetermined winners', () => {
  assert.ok(calculateResearchFit(brief, possession).score! > calculateResearchFit(brief, pressing).score!)
  const changed = { ...brief, tactical_model_required: 'High press / dominant', build_preference_required: 'Mixed' }
  assert.ok(calculateResearchFit(changed, pressing).score! > calculateResearchFit(changed, possession).score!)
})

test('the displayed contributions reproduce the final score and weights total 100', () => {
  const result = calculateResearchFit(brief, possession)
  assert.equal(result.score, Math.round(result.dimensions.reduce((sum, row) => sum + row.contribution, 0)))
  assert.ok(Math.abs(result.dimensions.reduce((sum, row) => sum + row.weight, 0) - 100) < 0.00001)
})

test('structured answers override broad football fields and priorities change weighting', () => {
  const result = calculateResearchFit({ ...brief, decision_brief: {
    in_possession: { value: 'Direct play', priority: 'Essential' },
    out_of_possession: { value: 'High press', priority: 'Flexible' },
  } }, possession)
  const build = result.dimensions.find(row => row.key === 'build')!
  const press = result.dimensions.find(row => row.key === 'pressing')!
  assert.equal(build.required, 'Direct')
  assert.equal(build.score, 25)
  assert.equal(build.weight, press.weight * 3)
})

test('unknown requirements produce no invented score and appointment constraints remain visible', () => {
  assert.equal(calculateResearchFit({}, possession).score, null)
  assert.equal(calculateResearchFit({ tactical_model_required: 'Possession / build-out' }, possession).score, null)
  const result = calculateResearchFit({ ...brief, decision_brief: { salary: { value: 'Maximum £2m gross', priority: 'Essential' } } }, possession)
  assert.ok(result.manualChecks.some(value => value.includes('Maximum £2m gross')))
  assert.equal(result.dimensions.some(row => row.key === 'salary'), false)
})

test('opponent-dependent defending is not silently scored as a high press', () => {
  const result = calculateResearchFit({ ...brief, decision_brief: { out_of_possession: { value: 'Opponent-dependent', priority: 'Preferred' } } }, possession)
  assert.equal(result.dimensions.some(row => row.key === 'pressing'), false)
})

test('research identity handles accents without merging different people', () => {
  assert.equal(normalizeCoachName('Sebastian Hoeneß'), normalizeCoachName('Sebastian Hoeness'))
  assert.notEqual(normalizeCoachName('Will Still'), normalizeCoachName('Edward Still'))
})
