import test from 'node:test'
import assert from 'node:assert/strict'
import { elements, uiHarness } from '../../lib/testing/ui-harness.ts'
import * as feasibility from '../../lib/appointments/feasibility.ts'
import * as ranking from '../../lib/scoring/research/ranking.ts'
import * as briefFit from '../../lib/scoring/research/brief-fit.ts'
import { createElement } from 'react'
import { demonstrationLabel } from '../../lib/mandates/demonstration.ts'
import * as briefUsage from '../../lib/mandates/brief-usage.ts'
import * as decisionBrief from '../../lib/mandates/decision-brief.ts'
import { RESEARCH_PROFILES } from '../../lib/scoring/research/profiles.ts'

function harness() {
  return uiHarness(new URL('./brief-matches.tsx', import.meta.url), {
    '@/lib/appointments/feasibility': feasibility,
    '@/lib/scoring/research/brief-fit': briefFit,
    '@/lib/mandates/brief-usage': briefUsage,
    '@/components/mandates/demonstration-badge': { DemonstrationBadge: (props: { mandateId?: string | null; clubId?: string | null }) => { const text = demonstrationLabel(props); return text ? createElement('p', null, text) : null } },
    '@/lib/scoring/research/ranking': ranking,
    '@/lib/mandates/decision-brief': decisionBrief,
    '@/lib/supabase/server': { createServerSupabaseClient: async () => ({ from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: RESEARCH_PROFILES.map(row => ({ id: String(row.apiId), name: row.name })), error: null }) }) }) }) }) },
  })
}
const brief = {
  id: feasibility.TOTTENHAM_MANDATE_ID,
  tactical_model_required: 'Possession / build-out', pressing_intensity_required: 'High', build_preference_required: 'Short build',
  strategic_objective: 'Win trophies / Champions League',
  decision_brief: { in_possession: { value: 'Build through pressure', priority: 'Essential' }, out_of_possession: { value: 'High press', priority: 'Essential' } },
}
const cardNames = (tree: unknown) => elements(tree).filter(node => node.type === 'article')
  .flatMap(article => JSON.stringify(article).match(/"children":"([^"]+)"/g) ?? [])

test('top three never include the incumbent or anyone we would not pursue, and each explains its place', async () => {
  const tree = await harness().render('BriefMatches', { mandate: brief })
  const articles = elements(tree).filter(node => node.type === 'article')
  assert.equal(articles.length, 3)
  const cards = JSON.stringify(articles)
  for (const name of ['Roberto De Zerbi', 'Enzo Maresca', 'Mikel Arteta', 'Luis Enrique']) assert.doesNotMatch(cards, new RegExp(name))
  assert.equal((cards.match(/Why he is above the next man/g) ?? []).length, 3)
  const text = JSON.stringify(tree)
  assert.match(text, /Current manager — the benchmark/)
  assert.match(text, /coaching-team-enzo-maresca-confirmed-63919119/)
  assert.doesNotMatch(text, /probability of success(?! —)/i)
  assert.ok(cardNames(tree).length > 0)
})

test('a survival brief produces a different list under a different named model, with every line labelled', async () => {
  const survival = { ...brief, id: 'c07e4a2e-0915-4bd1-9f3a-2026091500c1', strategic_objective: 'Avoid relegation / stabilise', tactical_model_required: 'Possession / build-out', pressing_intensity_required: 'Medium', build_preference_required: 'Mixed',
    decision_brief: { in_possession: { value: 'Progress quickly', priority: 'Preferred' }, out_of_possession: { value: 'Mid-block', priority: 'Essential' } } }
  const tree = await harness().render('BriefMatches', { mandate: survival })
  const text = JSON.stringify(tree)
  assert.match(text, /"Weighting model: ","Survival brief"/)
  assert.equal(demonstrationLabel({ mandateId: survival.id }), 'Demonstration mandate — created from public information and analyst assumptions. Not commissioned by Coventry City.')
  assert.match(text, /"mandateId":"c07e4a2e-0915-4bd1-9f3a-2026091500c1"/)
  assert.match(text, /Keeping a side in the top flight/)
  assert.match(text, /"evidenceKind":"unavailable"/)
  assert.match(text, /"requirementSource":"Saved brief — survival brief/)
  const trophies = ranking.rankResearchProfiles({ brief, context: { mandateId: brief.id }, records: RESEARCH_PROFILES.map(row => ({ id: String(row.apiId), name: row.name })) }).shortlist.slice(0, 3).map(row => row.profile.name)
  const survivalTop = ranking.rankResearchProfiles({ brief: survival, context: { mandateId: survival.id }, records: RESEARCH_PROFILES.map(row => ({ id: String(row.apiId), name: row.name })) }).shortlist.slice(0, 3).map(row => row.profile.name)
  assert.notDeepEqual(trophies, survivalTop)
  for (const name of survivalTop) assert.match(text, new RegExp(name))
})

test('the rendered order is the shared calculation, with no tied positions in the top three', async () => {
  const tree = await harness().render('BriefMatches', { mandate: brief })
  const expected = ranking.rankResearchProfiles({ brief, context: { mandateId: brief.id }, records: RESEARCH_PROFILES.map(row => ({ id: String(row.apiId), name: row.name })) }).shortlist.slice(0, 3)
  const cards = elements(tree).filter(node => node.type === 'article').map(article => JSON.stringify(article))
  expected.forEach((coach, index) => {
    assert.match(cards[index], new RegExp(coach.profile.name))
    assert.equal(coach.joint, false)
  })
})
