import test from 'node:test'
import assert from 'node:assert/strict'
import { elements, uiHarness } from '../../lib/testing/ui-harness.ts'
import * as feasibility from '../../lib/appointments/feasibility.ts'
import * as scoring from '../../lib/scoring/research/brief-fit.ts'
import * as decisionBrief from '../../lib/mandates/decision-brief.ts'
import { RESEARCH_PROFILES } from '../../lib/scoring/research/profiles.ts'

function harness(employment?: { club: string; role: string; status: string; checkedAt: string; sourceUrl: string; sourceTitle: string; note: string }) {
  const profiles = RESEARCH_PROFILES.filter(row => ['Enzo Maresca', 'Roberto De Zerbi', 'Russell Martin', 'Sean Dyche'].includes(row.name))
  return uiHarness(new URL('./brief-matches.tsx', import.meta.url), {
    '@/lib/appointments/feasibility': feasibility,
    '@/lib/scoring/research/current-employment': { currentEmploymentForApiId: () => employment },
    '@/lib/scoring/research/brief-fit': scoring,
    '@/lib/scoring/research/profiles': { RESEARCH_PROFILES: profiles },
    '@/lib/mandates/decision-brief': decisionBrief,
    '@/lib/supabase/server': { createServerSupabaseClient: async () => ({ from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: profiles.map(row => ({ id: String(row.apiId), name: row.name })), error: null }) }) }) }) }) },
  })
}
const brief = { id: feasibility.TOTTENHAM_MANDATE_ID, tactical_model_required: 'Possession / build-out', pressing_intensity_required: 'High', build_preference_required: 'Short build' }

test('rendered BriefMatches excludes Maresca and incumbent from top cards but shows sourced decision and original score', async () => {
  const tree = await harness().render('BriefMatches', { mandate: brief })
  const nodes = elements(tree)
  const articles = nodes.filter(node => node.type === 'article')
  const cardNames = articles.flatMap(article => elements(article).filter(node => node.type === 'h3').flatMap(node => elements(node).map(child => child.props.children)))
  assert.ok(!cardNames.includes('Enzo Maresca'))
  assert.ok(!cardNames.includes('Roberto De Zerbi'))
  assert.ok(cardNames.includes('Russell Martin'))
  assert.equal(articles.length, 2)
  const text = JSON.stringify(tree)
  assert.match(text, /Appointment feasibility is unassessed/)
  assert.match(text, /Not pursuing/)
  assert.match(text, /2026-09-14/)
  assert.match(text, /coaching-team-enzo-maresca-confirmed-63919119/)
  const nameRow = nodes.find(node => node.type === 'p' && Array.isArray(node.props.children) && node.props.children[0] === 'Enzo Maresca')!
  const expected = scoring.calculateResearchFit(brief, RESEARCH_PROFILES.find(row => row.name === 'Enzo Maresca')!).score
  assert.ok(nameRow.props.children instanceof Array && nameRow.props.children.includes(expected))
})

test('another mandate does not inherit Tottenham exclusions and still labels unknown feasibility', async () => {
  const tree = await harness().render('BriefMatches', { mandate: { ...brief, id: 'another-mandate' } })
  const articles = elements(tree).filter(node => node.type === 'article')
  assert.equal(articles.length, 3)
  assert.match(JSON.stringify(articles), /Enzo Maresca/)
  assert.match(JSON.stringify(articles), /Appointment feasibility unknown/)
})


test('shortlist role evidence shows the catalogue date and source without asserting appointment feasibility', async () => {
  const employment = { club: 'Fixture club', role: 'Head coach', status: 'employed', checkedAt: '2026-09-14', sourceUrl: 'https://example.com/fixture-role', sourceTitle: 'Fixture official announcement', note: 'Fixture reviewed evidence.' }
  const tree = await harness(employment).render('BriefMatches', { mandate: brief })
  const roleNode = elements(tree).find(node => typeof node.type === 'function' && node.props.apiId === 12629)!
  assert.ok(roleNode)
  const renderedRole = (roleNode.type as (props: Record<string, unknown>) => unknown)(roleNode.props)
  const text = JSON.stringify(renderedRole)
  assert.match(text, /Head coach · Fixture club/)
  assert.match(text, /2026-09-14/)
  assert.match(text, /https:\/\/example.com\/fixture-role/)
  assert.match(text, /does not establish willingness/)
})
