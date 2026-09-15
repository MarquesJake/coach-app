import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RESEARCH_PROFILES } from './profiles.ts'
import { rankResearchProfiles } from './ranking.ts'

/**
 * The four live briefs as saved on 15 September 2026 (structured answers only). If one of these
 * orders changes, the change must be explained in the meeting guide before it ships.
 */
const records = RESEARCH_PROFILES.map(row => ({ id: String(row.apiId), name: row.name }))
const live = {
  tottenham: { brief: { strategic_objective: 'Win trophies / Champions League', tactical_model_required: 'Possession / build-out', pressing_intensity_required: 'High', build_preference_required: 'Short build', board_risk_appetite: null, succession_timeline: 'Not yet agreed', decision_brief: { adaptation: { value: 'Gradual evolution', priority: 'Preferred' }, development: { value: 'x', priority: 'Preferred' }, in_possession: { value: 'Build through pressure', priority: 'Essential' }, out_of_possession: { value: 'High press', priority: 'Essential' }, leadership_behaviours: { value: 'x', priority: 'Essential' } } }, context: { mandateId: '09420a64-b4d2-4245-8088-af0dc88266eb', clubId: '4b296c0a-60e9-4f32-956f-ad3bd742ff0f' }, top: ['Gian Piero Gasperini', 'Maurizio Sarri', 'Kjetil Knutsen'] },
  coventry: { brief: { strategic_objective: 'Avoid relegation / stabilise', tactical_model_required: 'Hybrid / flexible', pressing_intensity_required: 'Medium', build_preference_required: 'Mixed', board_risk_appetite: 'Moderate', succession_timeline: 'Not yet agreed', decision_brief: { adaptation: { value: 'Gradual evolution', priority: 'Preferred' }, development: { value: 'x', priority: 'Preferred' }, in_possession: { value: 'Progress quickly', priority: 'Preferred' }, out_of_possession: { value: 'Mid-block', priority: 'Essential' }, leadership_behaviours: { value: 'x', priority: 'Essential' } } }, context: { mandateId: 'c07e4a2e-0915-4bd1-9f3a-2026091500c1', clubId: 'ebd45bd1-bb8b-4ec8-8213-3d33121ae15e' }, top: ['Marcelino Garcia Toral', 'Scott Parker', 'Thomas Frank'] },
  hull: { brief: { strategic_objective: 'Avoid relegation / stabilise', tactical_model_required: 'Hybrid / flexible', pressing_intensity_required: 'Medium', build_preference_required: 'Long ball / direct', board_risk_appetite: 'Moderate', succession_timeline: 'Within 60 days', decision_brief: { adaptation: { value: 'Preserve current model', priority: 'Preferred' }, transitions: { value: 'Counter press quickly', priority: 'Essential' }, in_possession: { value: 'Adaptable', priority: 'Preferred' }, out_of_possession: { value: 'Low block', priority: 'Preferred' }, leadership_behaviours: { value: 'x', priority: 'Preferred' } } }, context: { mandateId: '28242eca-d9c7-4b42-866a-4d0a02bd76f7', clubId: 'f8b23d29-c2b6-4ae4-bc4c-afd773a9558b' }, top: ['Sean Dyche', 'Marcelino Garcia Toral', 'Marco Silva'] },
  westHam: { brief: { strategic_objective: 'Achieve promotion', tactical_model_required: 'Counter-attack / compact', pressing_intensity_required: 'Medium', build_preference_required: 'Mixed', board_risk_appetite: 'Moderate', succession_timeline: 'x', decision_brief: { adaptation: { value: 'Gradual evolution', priority: 'Preferred' }, development: { value: 'x', priority: 'Preferred' }, in_possession: { value: 'Progress quickly', priority: 'Essential' }, out_of_possession: { value: 'Mid-block', priority: 'Essential' }, leadership_behaviours: { value: 'x', priority: 'Essential' } } }, context: { mandateId: 'f3646b63-7d72-4420-8c16-b8456a4fee98', clubId: '573ab690-3f67-4b30-bb5a-cfcb24106953', incumbentName: 'Nuno Espírito Santo' }, top: ['Steve Cooper', 'Marcelino Garcia Toral', 'Marco Silva'] },
}

for (const [name, fixture] of Object.entries(live)) {
  test(`${name}: the saved brief reproduces the published top three with no club-specific rule`, () => {
    const ranking = rankResearchProfiles({ brief: fixture.brief, context: fixture.context, records })
    assert.deepEqual(ranking.shortlist.slice(0, 3).map(row => row.profile.name), fixture.top)
    for (const row of ranking.shortlist.slice(0, 3)) {
      for (const line of row.fit.dimensions) {
        assert.ok(line.required && line.requirementSource && line.period && line.evidenceKind, `${name} ${line.key}`)
      }
      assert.ok(row.fit.coverage.evidencedWeight > 0)
    }
  })
}

test('Hull: Dyche at the top is explained by the answers — direct build, low block, preserve the model — not by a Hull rule', () => {
  const ranking = rankResearchProfiles({ brief: live.hull.brief, context: live.hull.context, records })
  const dyche = ranking.shortlist.find(row => row.profile.name === 'Sean Dyche')!
  assert.equal(dyche.position, 1)
  assert.equal(ranking.shortlist[0].profile.name, 'Sean Dyche')
  assert.match(dyche.aheadOfNext ?? '', /closer match to the brief|ahead of/)
  assert.equal(dyche.fit.dimensions.find(row => row.key === 'build')!.score, 100)
  assert.ok(dyche.fit.dimensions.find(row => row.key === 'pragmatism')!.score === 100)
  assert.match(dyche.fit.modifiers[0], /preserve the current model/)
  const mckenna = ranking.shortlist.find(row => row.profile.name === 'Kieran McKenna')!
  assert.ok((mckenna.position ?? 0) > 6)
  assert.equal(mckenna.fit.dimensions.find(row => row.key === 'build')!.score, 25)
  assert.match(dyche.eligibility.timelineNote ?? '', /within 60 days/)
})

test('Coventry: switching the longer-term identity to possession moves the list, and switching back restores it', () => {
  const before = rankResearchProfiles({ brief: live.coventry.brief, context: live.coventry.context, records }).shortlist.map(row => row.profile.name)
  const switched = rankResearchProfiles({ brief: { ...live.coventry.brief, tactical_model_required: 'Possession / build-out' }, context: live.coventry.context, records }).shortlist.map(row => row.profile.name)
  assert.notDeepEqual(before.slice(0, 6), switched.slice(0, 6))
  const restored = rankResearchProfiles({ brief: live.coventry.brief, context: live.coventry.context, records }).shortlist.map(row => row.profile.name)
  assert.deepEqual(restored, before)
})
