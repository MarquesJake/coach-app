import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateResearchFit, type ResearchProfile } from './brief-fit.ts'
import { englishCareerClubs, isSurvivalObjective } from './survival-fit.ts'

const base: ResearchProfile = { name: 'Example', apiId: 1, aliases: [], style: 'Possession', pressing: 'High', build: 'Short', trackRecord: ['Top-flight experience'], summary: '', limitation: '', sources: [{ title: 'Research', url: 'https://example.com', period: '2024/25' }] }
const pragmatic: ResearchProfile = { ...base, name: 'Pragmatic', apiId: 2, style: 'Counter-attacking', pressing: 'Medium', build: 'Mixed', trackRecord: ['Promotion', 'Top-flight experience'], apiRecord: { retrievedAt: '2026-09-14', career: [{ club: 'Burnley', start: '2024-07-01', end: null }, { club: 'Tottenham Hotspur U18', start: '2017-07-01', end: '2018-07-01' }] } }
const survival = { tactical_model_required: 'Hybrid / flexible', pressing_intensity_required: 'Medium', build_preference_required: 'Mixed', strategic_objective: 'Avoid relegation / stabilise', decision_brief: { out_of_possession: { value: 'Mid-block', priority: 'Essential' } } }
const evidence = (xgAgainst: number, xgFor: number) => ({ apiId: 1, latestSeason: { club: 'Club', season: 2025, matches: 38, pointsPerMatch: 1.2 }, style: { club: 'Club', season: 2025, matches: 38, possession: 60, xgFor, xgAgainst }, recentMatches: 76 })

test('a survival objective selects the survival model and possession earns nothing on its own', () => {
  assert.ok(isSurvivalObjective('Avoid relegation / stabilise'))
  assert.ok(!isSurvivalObjective('Win trophies / Champions League'))
  const possession = calculateResearchFit(survival, base, evidence(1.3, 1.3))
  const counter = calculateResearchFit(survival, pragmatic, evidence(1.3, 1.3))
  assert.equal(possession.model, 'survival')
  assert.ok(counter.score! > possession.score!)
  assert.equal(possession.dimensions.some(row => row.key === 'front-foot'), false)
})

test('weights total 100, contributions reproduce the score, and every line carries its requirement source and evidence kind', () => {
  const result = calculateResearchFit(survival, pragmatic, evidence(0.9, 1.6))
  assert.ok(Math.abs(result.dimensions.reduce((sum, row) => sum + row.weight, 0) - 100) < 0.00001)
  assert.equal(result.score, Math.round(result.dimensions.reduce((sum, row) => sum + row.contribution, 0) * 10) / 10)
  for (const row of result.dimensions) {
    assert.match(row.requirementSource, /Analyst demonstration brief/)
    assert.ok(['verified', 'calculated', 'researched', 'unavailable'].includes(row.evidenceKind))
    assert.ok(row.period.length > 0)
  }
  assert.deepEqual(result.coverage.unavailable, ['Player development', 'Working to a controlled budget', 'Leadership in a relegation fight'])
  assert.ok(result.coverage.evidencedWeight > 80)
})

test('an Essential defending requirement weighs more than a Flexible one and missing match data is half credit, never zero', () => {
  const essential = calculateResearchFit(survival, pragmatic, evidence(1.0, 1.0)).dimensions.find(row => row.key === 'defence')!
  const flexible = calculateResearchFit({ ...survival, decision_brief: { out_of_possession: { value: 'Mid-block', priority: 'Flexible' } } }, pragmatic, evidence(1.0, 1.0)).dimensions.find(row => row.key === 'defence')!
  assert.ok(essential.weight > flexible.weight * 2)
  const missing = calculateResearchFit(survival, pragmatic, null)
  const defence = missing.dimensions.find(row => row.key === 'defence')!
  assert.equal(defence.recorded, 'Not available from the current source')
  assert.equal(defence.score, 50)
  assert.equal(defence.evidenceKind, 'unavailable')
})

test('English experience reads senior clubs from the provider career record and ignores youth spells', () => {
  assert.deepEqual(englishCareerClubs(pragmatic), ['Burnley'])
  assert.deepEqual(englishCareerClubs(base), [])
  const english = calculateResearchFit(survival, pragmatic, null).dimensions.find(row => row.key === 'english')!
  assert.equal(english.score, 100)
  assert.equal(calculateResearchFit(survival, base, null).dimensions.find(row => row.key === 'english')!.score, 50)
})

test('changing the objective back to trophies restores the standard model for the same coach', () => {
  const trophies = calculateResearchFit({ ...survival, strategic_objective: 'Win trophies / Champions League', tactical_model_required: 'Possession / build-out' }, base, evidence(1.0, 1.8))
  assert.equal(trophies.model, 'trophies')
  assert.ok(trophies.dimensions.some(row => row.key === 'record'))
})

test('build-up and the defensive block are scored from the brief, so a long-ball low-block brief prefers a direct, deeper-sitting coach', () => {
  const direct: ResearchProfile = { ...pragmatic, name: 'Direct', apiId: 3, style: 'Direct', pressing: 'Low', build: 'Direct' }
  const shortBuild: ResearchProfile = { ...pragmatic, name: 'Short', apiId: 4, style: 'Possession', pressing: 'High', build: 'Short' }
  const longBall = { ...survival, build_preference_required: 'Long ball / direct', decision_brief: { in_possession: { value: 'Adaptable', priority: 'Preferred' }, out_of_possession: { value: 'Low block', priority: 'Preferred' } } }
  const a = calculateResearchFit(longBall, direct, evidence(1.3, 1.3)), b = calculateResearchFit(longBall, shortBuild, evidence(1.3, 1.3))
  assert.equal(a.dimensions.find(row => row.key === 'build')!.required, 'Direct — long ball or quick forward play')
  assert.equal(a.dimensions.find(row => row.key === 'build')!.score, 100)
  assert.equal(b.dimensions.find(row => row.key === 'build')!.score, 25)
  assert.equal(a.dimensions.find(row => row.key === 'block')!.score, 100)
  assert.equal(b.dimensions.find(row => row.key === 'block')!.score, 30)
  assert.ok(a.score! > b.score!)
})
