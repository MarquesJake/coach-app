import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateResearchFit, type CodedEvidence, type ResearchProfile } from './brief-fit.ts'
import { profileFor, WEIGHTING_PROFILES } from './weighting-profiles.ts'
import { eligibilityFor } from '../../appointments/eligibility.ts'
import { fieldsWithoutEffect, briefUsage, MANDATE_FIELD_EFFECTS } from '../../mandates/brief-usage.ts'
import { BRIEF_FIELDS } from '../../mandates/decision-brief.ts'

const coach = (over: Partial<ResearchProfile>): ResearchProfile => ({ name: 'Coach', apiId: 1, aliases: [], style: 'Possession', pressing: 'High', build: 'Short', trackRecord: ['Top-flight experience'], summary: '', limitation: '', sources: [{ title: 'Research', url: 'https://example.com', period: '2024/25' }], ...over })
const evidence = (xgAgainst = 1.2, xgFor = 1.5, matches = 76) => ({ apiId: 1, latestSeason: { club: 'Club', season: 2025, matches: 38, pointsPerMatch: 1.5 }, style: { club: 'Club', season: 2025, matches: 38, possession: 55, xgFor, xgAgainst }, recentMatches: matches })
const base = { tactical_model_required: 'Possession / build-out', pressing_intensity_required: 'High', build_preference_required: 'Short build', board_risk_appetite: 'Moderate', decision_brief: { in_possession: { value: 'Build through pressure', priority: 'Preferred' }, out_of_possession: { value: 'High press', priority: 'Preferred' }, adaptation: { value: 'Gradual evolution', priority: 'Preferred' } } }
const keys = (brief: object, c = coach({})) => calculateResearchFit(brief, c, evidence()).dimensions.map(row => row.key)

test('the starting point picks the weighting profile for every objective on the form', () => {
  assert.equal(profileFor('Win trophies / Champions League').key, 'trophies')
  assert.equal(profileFor('Achieve promotion').key, 'promotion')
  assert.equal(profileFor('Avoid relegation / stabilise').key, 'survival')
  assert.equal(profileFor('Mid-table stability').key, 'stabilisation')
  assert.equal(profileFor('Develop youth / academy focus').key, 'development')
  assert.equal(profileFor('Rebuild / new identity').key, 'rebuild')
  assert.equal(profileFor(null).key, 'trophies')
  for (const profile of Object.values(WEIGHTING_PROFILES)) {
    assert.ok(Object.values(profile.weights).every(weight => weight > 0))
    assert.match(profile.summary, /Starting weights/)
  }
})

test('each profile scores the lines it says it does, and the lines a brief does not ask for are absent', () => {
  assert.deepEqual(keys({ ...base, strategic_objective: 'Win trophies / Champions League' }).filter(key => ['record', 'front-foot', 'survival', 'underdog', 'english', 'pragmatism'].includes(key)), ['record', 'front-foot'])
  assert.deepEqual(keys({ ...base, strategic_objective: 'Achieve promotion' }).filter(key => ['record', 'underdog', 'english', 'survival'].includes(key)), ['record', 'underdog', 'english'])
  assert.deepEqual(keys({ ...base, strategic_objective: 'Avoid relegation / stabilise' }).filter(key => ['survival', 'defence', 'attack', 'pragmatism', 'english', 'budget', 'record'].includes(key)), ['survival', 'defence', 'underdog', 'attack', 'pragmatism', 'english', 'budget'].filter(key => key !== 'underdog'))
  const development = calculateResearchFit({ ...base, strategic_objective: 'Develop youth / academy focus', decision_brief: { ...base.decision_brief, development_focus: { value: 'Academy first', priority: 'Essential' } } }, coach({}), evidence())
  const dev = development.dimensions.find(row => row.key === 'development')!
  assert.equal(dev.score, null)
  assert.equal(dev.recorded, 'Not scored — development evidence required')
  assert.ok(dev.intendedWeight >= 25)
  assert.notEqual(development.coverage.reliability, 'strong')
  assert.ok(development.coverage.evidencedWeight <= 70)
  assert.ok(keys({ ...base, strategic_objective: 'Rebuild / new identity' }).includes('recent'))
  assert.ok(!keys({ ...base }).includes('transitions'))
  assert.ok(keys({ ...base, decision_brief: { ...base.decision_brief, transition_style: { value: 'Keep the ball', priority: 'Preferred' } } }).includes('transitions'))
})

test('changing one requirement moves the matching component and the score, for every profile', () => {
  const possession = coach({}), counter = coach({ apiId: 2, style: 'Counter-attacking', pressing: 'Low', build: 'Direct', trackRecord: ['Promotion', 'Top-flight experience'] })
  for (const objective of ['Win trophies / Champions League', 'Achieve promotion', 'Avoid relegation / stabilise', 'Mid-table stability', 'Develop youth / academy focus', 'Rebuild / new identity']) {
    const before = calculateResearchFit({ ...base, strategic_objective: objective }, counter, evidence())
    const after = calculateResearchFit({ ...base, strategic_objective: objective, tactical_model_required: 'Counter-attack / compact', build_preference_required: 'Long ball / direct', decision_brief: { ...base.decision_brief, in_possession: { value: 'Direct play', priority: 'Essential' }, out_of_possession: { value: 'Low block', priority: 'Essential' } } }, counter, evidence())
    assert.ok(after.score! > before.score!, objective)
    assert.ok(after.dimensions.find(row => row.key === 'build')!.score! > before.dimensions.find(row => row.key === 'build')!.score!, objective)
    assert.ok(after.dimensions.find(row => row.key === 'pressing')!.score! > before.dimensions.find(row => row.key === 'pressing')!.score!, objective)
    const possessionBefore = calculateResearchFit({ ...base, strategic_objective: objective }, possession, evidence())
    assert.ok(possessionBefore.score! > before.score! || objective.includes('relegation') || objective.includes('Mid-table'), objective)
  }
  const keep = calculateResearchFit({ ...base, strategic_objective: 'Win trophies / Champions League', decision_brief: { ...base.decision_brief, transition_style: { value: 'Keep the ball', priority: 'Essential' } } }, possession, evidence())
  const press = calculateResearchFit({ ...base, strategic_objective: 'Win trophies / Champions League', decision_brief: { ...base.decision_brief, transition_style: { value: 'Break quickly', priority: 'Essential' } } }, possession, evidence())
  assert.ok(keep.dimensions.find(row => row.key === 'transitions')!.score! > press.dimensions.find(row => row.key === 'transitions')!.score!)
})

test('preserve / rebuild and board risk appetite alter the weights openly and are named on the result', () => {
  const plain = calculateResearchFit({ ...base, strategic_objective: 'Achieve promotion' }, coach({}), evidence())
  const preserve = calculateResearchFit({ ...base, strategic_objective: 'Achieve promotion', decision_brief: { ...base.decision_brief, adaptation: { value: 'Preserve current model', priority: 'Preferred' } } }, coach({}), evidence())
  const rebuild = calculateResearchFit({ ...base, strategic_objective: 'Achieve promotion', decision_brief: { ...base.decision_brief, adaptation: { value: 'Substantial rebuild', priority: 'Preferred' } } }, coach({}), evidence())
  const conservative = calculateResearchFit({ ...base, strategic_objective: 'Achieve promotion', board_risk_appetite: 'Conservative' }, coach({}), evidence())
  const style = (fit: typeof plain) => fit.dimensions.find(row => row.key === 'style')!.weight
  const proven = (fit: typeof plain) => fit.dimensions.filter(row => ['record', 'recent', 'sample', 'underdog', 'english'].includes(row.key)).reduce((sum, row) => sum + row.weight, 0)
  assert.deepEqual(plain.modifiers, [])
  assert.ok(style(preserve) > style(plain))
  assert.ok(style(rebuild) < style(plain) && proven(rebuild) > proven(plain))
  assert.ok(proven(conservative) > proven(plain))
  assert.ok(conservative.dimensions.find(row => row.key === 'sample')!.weight > plain.dimensions.find(row => row.key === 'sample')!.weight)
  assert.match(preserve.modifiers[0], /preserve/)
  assert.match(conservative.modifiers[0], /Conservative board/)
})

test('process-only fields never change football fit', () => {
  const brief = { ...base, strategic_objective: 'Achieve promotion' }
  const before = calculateResearchFit(brief, coach({}), evidence())
  const after = calculateResearchFit({ ...brief, decision_brief: { ...brief.decision_brief, appointment_type: { value: 'Interim', priority: 'Essential' }, contact_permission: { value: 'Formal approach approved', priority: 'Essential' }, success_measures: { value: 'Win every game', priority: 'Essential' }, squad_problem: { value: 'Cannot score', priority: 'Essential' }, contradictions: { value: 'Many', priority: 'Essential' }, leadership_challenge: { value: 'Board wants control', priority: 'Essential' } } }, coach({}), evidence())
  assert.equal(after.score, before.score)
  assert.deepEqual(after.dimensions.map(row => [row.key, row.weight]), before.dimensions.map(row => [row.key, row.weight]))
  assert.ok(after.manualChecks.some(check => check.startsWith('success measures')))
})

test('feasibility fields change diligence and the timeline flag, never the score', () => {
  const brief = { ...base, strategic_objective: 'Achieve promotion' }
  const before = calculateResearchFit(brief, coach({}), evidence())
  const after = calculateResearchFit({ ...brief, succession_timeline: 'Immediate / within 30 days', decision_brief: { ...brief.decision_brief, salary: { value: '£2m', priority: 'Essential' }, compensation: { value: 'None available', priority: 'Essential' }, relocation: { value: 'Required', priority: 'Essential' }, eligibility: { value: 'Work permit needed', priority: 'Essential' } } }, coach({}), evidence())
  assert.equal(after.score, before.score)
  assert.ok(after.manualChecks.some(check => check.startsWith('salary')))
  const employed = { apiId: 1, name: 'Coach', club: 'Somewhere', role: 'Head coach', status: 'employed' as const, checkedAt: '2026-09-15', sourceUrl: 'https://example.com', sourceTitle: 'Source', note: '' }
  const flagged = eligibilityFor(coach({}), {}, { employment: employed, evidence: evidence(), timeline: 'Immediate / within 30 days' })
  assert.match(flagged.timelineNote ?? '', /within 30 days.*release would be needed/)
  assert.equal(flagged.recommendable, true)
  assert.equal(eligibilityFor(coach({}), {}, { employment: employed, evidence: evidence(), timeline: 'Not yet agreed' }).timelineNote, null)
  assert.match(eligibilityFor(coach({}), {}, { employment: { ...employed, status: 'unattached', club: null, role: null }, evidence: evidence(), timeline: 'Within 60 days' }).timelineNote ?? '', /no club to release him from/)
})

test('missing coach evidence is not scored, never zero, and reduces coverage; coded evidence lifts the people lines', () => {
  const brief = { ...base, strategic_objective: 'Avoid relegation / stabilise', decision_brief: { ...base.decision_brief, leadership_behaviours: { value: 'Calm under pressure', priority: 'Essential' }, development_focus: { value: 'Improve the current squad', priority: 'Preferred' } } }
  const bare = calculateResearchFit(brief, coach({}), evidence())
  for (const key of ['leadership', 'development', 'budget']) {
    const row = bare.dimensions.find(item => item.key === key)!
    assert.equal(row.score, null, key)
    assert.equal(row.weight, 0, key)
    assert.match(row.recorded, /Not scored/)
  }
  assert.ok(bare.coverage.unscored.length >= 3)
  assert.ok(Math.abs(bare.dimensions.reduce((sum, row) => sum + row.weight, 0) - 100) < 0.00001)
  const coded: CodedEvidence = { leadership: { answers: 3, references: 2, hireYes: 2, hireNo: 0, hireMixed: 0, sources: ['Former assistant', 'Former captain'] }, development: { answers: 1, sources: ['Former assistant'] } }
  const withEvidence = calculateResearchFit(brief, coach({}), evidence(), coded)
  assert.equal(withEvidence.dimensions.find(row => row.key === 'leadership')!.score, 100)
  assert.equal(withEvidence.dimensions.find(row => row.key === 'leadership')!.evidenceKind, 'verified')
  assert.ok(withEvidence.coverage.evidencedWeight > bare.coverage.evidencedWeight)
  const noData = calculateResearchFit(brief, coach({}), null)
  assert.equal(noData.dimensions.find(row => row.key === 'defence')!.score, null)
  assert.ok(noData.score! > 0)
  assert.ok(noData.coverage.evidencedWeight < bare.coverage.evidencedWeight)
})

test('every mandate form field is assigned an effect and the usage summary reflects the saved answers', () => {
  assert.deepEqual(fieldsWithoutEffect(), [])
  for (const field of BRIEF_FIELDS) assert.ok(MANDATE_FIELD_EFFECTS.some(effect => effect.key === field.key), field.key)
  for (const field of MANDATE_FIELD_EFFECTS) { assert.ok(field.effects.length > 0, field.key); assert.ok(field.rule.length > 20, field.key) }
  const usage = briefUsage({ ...base, strategic_objective: 'Avoid relegation / stabilise', decision_brief: { ...base.decision_brief, adaptation: { value: 'Preserve current model', priority: 'Preferred' }, salary: { value: 'Unknown', priority: 'Essential' } } })
  assert.equal(usage.profile, 'Survival brief')
  assert.match(usage.ranking.find(row => row.label === 'Change to the current model')!.rule, /1\.5×/)
  assert.ok(usage.feasibility.some(row => row.label.startsWith('Head coach salary')))
  assert.ok(usage.workflow.some(row => row.label === 'Permission to approach'))
  assert.ok(usage.evidenceRequired.some(row => row.label === 'Leadership behaviours'))
})

test('a sourced executive post takes a coach out of the pursuable list by rule, not by name', () => {
  const executive = { apiId: 1, name: 'Coach', club: 'Red Bull GmbH', role: 'Head of Global Soccer (non-coaching role from 1 October 2026)', status: 'employed' as const, checkedAt: '2026-09-15', sourceUrl: 'https://example.com', sourceTitle: 'Source', note: '' }
  const result = eligibilityFor(coach({}), {}, { employment: executive, evidence: evidence() })
  assert.equal(result.recommendable, false)
  assert.equal(result.headline, 'Not pursuing — executive role')
  const coaching = eligibilityFor(coach({}), {}, { employment: { ...executive, club: 'Somewhere', role: 'Head coach' }, evidence: evidence() })
  assert.equal(coaching.recommendable, true)
})
