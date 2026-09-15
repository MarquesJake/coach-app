import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSuccessionRadar, mandateDefaultsForClub, type SuccessionClub, type SuccessionCoach, type SuccessionPlan, type SuccessionMandateSignal } from './radar.ts'
import { clubResearchRequirements, successionResearchRequirements, rankReviewedCoaches, scoreCoachForClub } from './research-fit.ts'
import { calculateResearchFit } from '../scoring/research/brief-fit.ts'

function club(fields: Partial<SuccessionClub> = {}): SuccessionClub {
  return { id: 'club', name: 'Test club', league: null, country: null, tier: null, current_manager: null, board_risk_tolerance: null, strategic_priority: null, media_pressure: null, development_vs_win_now: null, environment_assessment: null, instability_risk: null, tactical_model: null, pressing_model: null, build_model: null, market_reputation: null, ...fields }
}
function coach(name: string, fields: Partial<SuccessionCoach> = {}): SuccessionCoach {
  return { id: name, name, club_current: null, nationality: null, available_status: null, availability_status: null, market_status: null, tactical_identity: null, preferred_style: null, pressing_intensity: null, build_preference: null, player_development_model: null, academy_integration: null, leadership_style: null, overall_manual_score: null, intelligence_confidence: null, ...fields }
}
const coaches = [coach('Kieran McKenna'), coach('Sean Dyche'), coach('Russell Martin')]
const possession = club({ tactical_model: 'Possession', pressing_model: 'High', build_model: 'From the back' })
const direct = club({ tactical_model: 'Direct', pressing_model: 'Mid-block', build_model: 'Direct' })
function radar(c: SuccessionClub, records = coaches, plans: SuccessionPlan[] = []) {
  return buildSuccessionRadar({ clubs: [c], coaches: records, mandates: [], intelligence: [], inbox: [], plans })[0]
}

function mandate(fields: Partial<SuccessionMandateSignal> = {}): SuccessionMandateSignal {
  return { id: 'brief-a', club_id: 'club', status: 'Active', pipeline_stage: 'shortlisting', created_at: '2026-09-01T00:00:00Z', succession_timeline: null,
    strategic_objective: 'Avoid relegation / stabilise', tactical_model_required: 'Possession / build-out', pressing_intensity_required: 'Low', build_preference_required: 'Long ball / direct',
    decision_brief: { in_possession: { value: 'Build through pressure', priority: 'Essential' }, out_of_possession: { value: 'High press', priority: 'Flexible' } }, ...fields }
}

test('a club-linked saved mandate overrides legacy prose and retains structured answer weights exactly', () => {
  const c = club({ tactical_model: 'high press, possession, aggressive rotations', pressing_model: 'situational pressing and recovery', build_model: 'technical progression' })
  // A promotion objective keeps the standard model; a survival objective would switch to the survival weights.
  const m = mandate({ strategic_objective: 'Achieve promotion' })
  const result = buildSuccessionRadar({ clubs: [c], mandates: [m], coaches, intelligence: [], inbox: [] })[0]
  assert.equal(result.requirements.source.kind, 'mandate')
  assert.equal(result.requirements.source.mandateId, m.id)
  assert.equal(result.requirements.dimensionCount, 4)
  assert.ok(result.suggestedCoaches.length > 0)
  for (const candidate of result.suggestedCoaches) assert.deepEqual(candidate.fit, calculateResearchFit(m, candidate.research))
  const fit = result.suggestedCoaches.find(row => row.name === 'Kieran McKenna')!.fit
  assert.equal(fit.dimensions.find(row => row.key === 'build')!.required, 'Short build from the back')
  assert.equal(fit.dimensions.find(row => row.key === 'pressing')!.required, 'High press')
  assert.equal(fit.dimensions.find(row => row.key === 'build')!.weight, fit.dimensions.find(row => row.key === 'pressing')!.weight * 3)
  assert.equal(result.requirements.brief.decision_brief, m.decision_brief)
  assert.equal(result.requirements.rows.find(row => row.field === 'decision_brief.in_possession')!.priority, 'Essential')
  const preferred = mandate({ strategic_objective: 'Achieve promotion', decision_brief: { in_possession: { value: 'Build through pressure', priority: 'Preferred' }, out_of_possession: { value: 'High press', priority: 'Essential' } } })
  const changed = successionResearchRequirements(c, [preferred])
  const weighted = rankReviewedCoaches(coaches, c, changed).matches.find(row => row.name === 'Kieran McKenna')!.fit
  assert.notEqual(weighted.dimensions.find(row => row.key === 'build')!.weight, fit.dimensions.find(row => row.key === 'build')!.weight)
})

test('multiple active linked mandates require an explicit valid choice, never latest or club fallback', () => {
  const a = mandate(), b = mandate({ id: 'brief-b', created_at: '2026-09-14T00:00:00Z' })
  const ambiguous = successionResearchRequirements(possession, [b, a])
  assert.equal(ambiguous.source.kind, 'needs-choice')
  assert.equal(ambiguous.ready, false)
  assert.deepEqual(rankReviewedCoaches(coaches, possession, ambiguous).matches, [])
  assert.deepEqual(ambiguous, successionResearchRequirements(possession, [a, b]))
  assert.equal(successionResearchRequirements(possession, [a, b], b.id).source.mandateId, b.id)
  assert.equal(successionResearchRequirements(possession, [a, b], 'not-linked').source.kind, 'needs-choice')
  const plan = { club_id: 'club', linked_mandate_id: 'brief-b' } as SuccessionPlan
  const result = buildSuccessionRadar({ clubs: [possession], mandates: [a, b], coaches, intelligence: [], inbox: [], plans: [plan] })[0]
  assert.equal(result.requirements.source.mandateId, 'brief-b')
  const selected = buildSuccessionRadar({ clubs: [possession], mandates: [a, b], coaches, intelligence: [], inbox: [], plans: [plan], selectedMandateIds: { club: 'brief-a' } })[0]
  assert.equal(selected.requirements.source.mandateId, 'brief-a')
})

test('only active mandates joined by club_id qualify; an incomplete linked brief does not inherit club defaults', () => {
  const excluded = [mandate({ club_id: 'another-club' }), mandate({ id: 'closed', pipeline_stage: 'closed' }), mandate({ id: 'inactive', status: 'Completed' })]
  assert.deepEqual(successionResearchRequirements(possession, excluded), clubResearchRequirements(possession))
  const empty = mandate({ strategic_objective: null, tactical_model_required: null, pressing_intensity_required: null, build_preference_required: null, decision_brief: {} })
  const requirements = successionResearchRequirements(possession, [empty])
  assert.equal(requirements.source.kind, 'mandate')
  assert.equal(requirements.ready, false)
  assert.equal(requirements.dimensionCount, 0)
  assert.deepEqual(rankReviewedCoaches(coaches, possession, requirements).matches, [])
})

test('different saved club requirements change the order using the shared research decision rule', () => {
  const passing = rankReviewedCoaches(coaches, possession).matches
  const vertical = rankReviewedCoaches(coaches, direct).matches
  assert.notEqual(passing[0].research.name, 'Sean Dyche')
  assert.equal(vertical[0].research.name, 'Sean Dyche')
  assert.ok(passing.find(c => c.name === 'Sean Dyche')!.fitScore < passing[0].fitScore, 'poor comparisons remain visible, not silently filtered by an invented threshold')
  for (const c of passing) {
    assert.deepEqual(c.fit, calculateResearchFit(clubResearchRequirements(possession).brief, c.research))
    assert.equal(Math.round(c.fit.dimensions.reduce((sum, d) => sum + d.contribution, 0) * 10) / 10, c.fitScore)
    assert.ok(Math.abs(c.fit.dimensions.reduce((sum, d) => sum + d.weight, 0) - 100) < 0.001)
    assert.ok(c.research.sources.every(s => s.url.startsWith('https://') && s.period.length > 0))
  }
})

test('unknown and one-dimensional club briefs produce no named shortlist or fabricated score', () => {
  for (const c of [club(), club({ tactical_model: 'Possession' }), club({ tactical_model: 'constructor', build_model: '__proto__' }), club({ tactical_model: 'High press, possession', pressing_model: 'reactive', strategic_priority: 'Top four / promotion' })]) {
    assert.equal(scoreCoachForClub(coaches[0], c).score, null)
    const result = radar(c)
    assert.deepEqual(result.suggestedCoaches, [])
    assert.equal(result.requirements.ready, false)
    assert.match(result.nextAction, /Agree at least two/)
  }
})

test('saved values have explicit provenance and field-specific translations, ambiguous objectives stay manual', () => {
  const c = club({ tactical_model: 'High press, possession', pressing_model: ' HIGH ', build_model: 'From the back', strategic_priority: 'Top four / promotion' })
  const requirements = clubResearchRequirements(c)
  assert.equal(requirements.ready, true)
  assert.equal(requirements.dimensionCount, 2)
  assert.deepEqual(requirements.brief, { pressing_intensity_required: 'High', build_preference_required: 'Short build' })
  assert.equal(requirements.rows[0].status, 'needs-interpretation')
  assert.equal(requirements.rows[0].savedValue, c.tactical_model)
  assert.equal(requirements.rows[1].status, 'saved-club')
  assert.equal(requirements.rows[3].mappedValue, null)
  assert.equal(clubResearchRequirements(club()).rows[0].status, 'missing')
  assert.equal(clubResearchRequirements(club({ tactical_model: 'Possession', strategic_priority: 'Youth development' })).ready, false)
})

test('unknown fictional fixture identities are not promoted by generic keyword text', () => {
  const unreviewed = ['Fictional Fixture Coach Alpha', 'Fictional Fixture Coach Beta', 'Fictional Fixture Coach Gamma'].map(name => coach(name, {
    preferred_style: 'possession high press technical player development', leadership_style: 'elite winner',
    available_status: 'available', overall_manual_score: 100, intelligence_confidence: 100,
  }))
  const result = radar(possession, unreviewed)
  assert.equal(result.researchCoverage.unreviewed, 3)
  assert.deepEqual(result.suggestedCoaches, [])
  for (const record of unreviewed) {
    const fit = scoreCoachForClub(record, possession)
    assert.equal(fit.status, 'needs-research')
    assert.equal(fit.score, null)
  }
  assert.match(result.nextAction, /reviewed, sourced/)
})

test('Parker, Lowe and Still follow their reviewed evidence rather than keyword bonuses or a name exclusion', () => {
  const reviewed = ['Scott Parker', 'Ryan Lowe', 'Will Still'].map(name => coach(name))
  for (const c of [possession, direct]) {
    const result = radar(c, reviewed)
    assert.equal(result.researchCoverage.reviewed, reviewed.length)
    assert.equal(result.researchCoverage.unreviewed, 0)
    assert.deepEqual(new Set(result.suggestedCoaches.map(row => row.name)), new Set(reviewed.map(row => row.name)))
    for (const record of reviewed) {
      const baseline = scoreCoachForClub(record, c)
      assert.equal(baseline.status, 'scored')
      assert.ok(baseline.research)
      assert.ok(baseline.research.sources.length > 0)
      assert.ok(baseline.research.sources.every(source => source.url.startsWith('https://') && source.period.length > 0))
      const expected = calculateResearchFit(clubResearchRequirements(c).brief, baseline.research)
      assert.deepEqual(baseline.fit, expected)
      assert.equal(result.suggestedCoaches.find(row => row.id === record.id)!.fitScore, expected.score)
      const decorated = { ...record, preferred_style: 'possession high press technical player development', leadership_style: 'elite winner', available_status: 'available', overall_manual_score: 100, intelligence_confidence: 100 }
      assert.deepEqual(scoreCoachForClub(decorated, c).fit, baseline.fit)
      assert.equal(scoreCoachForClub(record, club()).score, null, 'reviewed evidence still requires an adequate club brief')
    }
  }
})

test('availability, manual scores, leadership claims and high-pressure club prose do not change football fit', () => {
  const baseline = scoreCoachForClub(coaches[0], possession)
  for (const status of ['available', 'unavailable', 'contracted', 'open to discussion', null]) {
    const decorated = coach('Kieran McKenna', { availability_status: status, available_status: status, overall_manual_score: 100, intelligence_confidence: 100, leadership_style: 'Demanding winner', club_current: 'Unknown employer' })
    assert.deepEqual(scoreCoachForClub(decorated, possession).fit, baseline.fit)
  }
  const pressure = { ...possession, media_pressure: 'Extreme', instability_risk: 'High', market_reputation: 'Elite', environment_assessment: 'direct high press promotion winner' }
  assert.deepEqual(clubResearchRequirements(pressure), clubResearchRequirements(possession))
  assert.deepEqual(radar(pressure).suggestedCoaches, radar(possession).suggestedCoaches)
  assert.ok(radar(pressure).score > radar(possession).score, 'planning urgency stays separate')
})

test('blank saved football fields cannot be filled by league, generic prose or legacy inferred plan defaults', () => {
  const c = club({ league: 'Premier League', tier: 'Elite', media_pressure: 'High', strategic_priority: null, development_vs_win_now: 'Win now', environment_assessment: 'high press possession promotion' })
  const legacy = { club_id: c.id, desired_archetype: 'Pressure operator', target_profile: { tactical_model_required: 'Possession / build-out', pressing_intensity_required: 'High', budget_band: '£30m - £60m' } } as SuccessionPlan
  assert.equal(radar(c, coaches, [legacy]).suggestedCoaches.length, 0)
  const defaults = mandateDefaultsForClub(c)
  assert.equal(defaults.budget_band, '')
  assert.equal(defaults.leadership_profile_required, '')
  assert.equal(defaults.succession_timeline, '')
  assert.equal(defaults.tactical_model_required, '')
  assert.equal(defaults.pressing_intensity_required, '')
  assert.equal(defaults.build_preference_required, '')
})

test('saved manager is a labelled comparison reference, not a successor or availability exclusion', () => {
  const result = radar({ ...possession, current_manager: 'K. McKenna' })
  assert.equal(result.incumbentBenchmark?.research.apiId, 16556)
  assert.ok(result.suggestedCoaches.every(c => c.research.apiId !== 16556))
  assert.equal(result.researchCoverage.reviewed, 3)
  assert.equal(radar({ ...possession, current_manager: 'Unreviewed manager' }).incumbentBenchmark, null)
})

test('identity aliases are exact, duplicate records are not arbitrary winners, and ties stay deterministic', () => {
  assert.ok(scoreCoachForClub(coach('K. McKenna'), possession).score! > 80)
  assert.equal(scoreCoachForClub(coach('Kieran McKenna assistant'), possession).score, null)
  const aliases = rankReviewedCoaches([coach('K. McKenna', { id: 'a' }), coach('Kieran McKenna', { id: 'b' })], possession)
  assert.equal(aliases.matches.length, 1, 'an abbreviated and a full-name record are one candidate, not two')
  assert.equal(aliases.matches[0].id, 'b', 'the canonical full-name record is the one shown')
  assert.deepEqual(rankReviewedCoaches([...coaches].reverse(), possession), rankReviewedCoaches(coaches, possession))
})

test('Tottenham successor matches exclude Maresca by decision, preserve football fit and keep other employed coaches', () => {
  const c = { ...possession, id: '4b296c0a-60e9-4f32-956f-ad3bd742ff0f', current_manager: 'Roberto De Zerbi' }
  const records = [coach('Enzo Maresca'), coach('Roberto De Zerbi'), coach('Russell Martin', { available_status: 'Under contract', club_current: 'Test employer' })]
  const result = radar(c, records)
  assert.equal(result.suggestedCoaches.some(row => row.research.name === 'Enzo Maresca'), false)
  assert.equal(result.suggestedCoaches.some(row => row.research.name === 'Roberto De Zerbi'), false)
  assert.equal(result.incumbentBenchmark?.research.name, 'Roberto De Zerbi')
  const excluded = result.excludedCoaches.find(row => row.research.name === 'Enzo Maresca')!
  assert.ok(excluded)
  assert.deepEqual(excluded.fit, calculateResearchFit(result.requirements.brief, excluded.research))
  assert.equal(excluded.feasibility.status, 'not-pursuing')
  assert.equal(result.suggestedCoaches[0].research.name, 'Russell Martin')
  assert.equal(result.suggestedCoaches[0].feasibility.status, 'unknown')
  const elsewhere = radar({ ...c, id: 'another-club' }, records)
  assert.equal(elsewhere.suggestedCoaches.some(row => row.research.name === 'Enzo Maresca'), false, 'a Premier League manager is not a target for anyone')
  assert.match(elsewhere.excludedCoaches.find(row => row.research.name === 'Enzo Maresca')!.eligibility.headline, /Premier League/)
})
