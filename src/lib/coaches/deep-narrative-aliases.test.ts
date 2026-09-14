import assert from 'node:assert/strict'
import { test } from 'node:test'
import identities from './deep-identity-map.json' with { type: 'json' }
import { REVIEWED_NARRATIVE_ALIASES, narrativeApiIdForReviewedAlias } from './deep-narrative-aliases.ts'
import { DEEP_RESEARCH_PROFILES, findDeepResearchProfile } from './deep-research-profiles.ts'

test('reviewed aliases resolve canonical narratives without duplicating profiles', () => {
  const ids = new Set(DEEP_RESEARCH_PROFILES.map(profile => profile.apiId))
  const aliases = new Set<number>()
  for (const row of REVIEWED_NARRATIVE_ALIASES) {
    assert.ok(!aliases.has(row.apiId), `duplicate alias ${row.apiId}`)
    aliases.add(row.apiId)
    assert.equal(row.scope, 'narrative_only')
    assert.ok(row.evidence && row.sourceUrls.length >= 2)
    assert.ok(ids.has(row.narrativeApiId), `missing target ${row.narrativeApiId}`)
    assert.equal(findDeepResearchProfile(row.apiId), findDeepResearchProfile(row.narrativeApiId))
    assert.equal(narrativeApiIdForReviewedAlias(row.narrativeApiId), undefined, 'no alias chains')
  }
  assert.equal(ids.size, DEEP_RESEARCH_PROFILES.length)
})

test('all originally proven aliases resolve through the public UI lookup', () => {
  for (const [alias, target] of [[25762,16246],[26564,16373],[26573,627],[26578,618],[26677,14971]]) {
    assert.equal(findDeepResearchProfile(alias)?.apiId, target)
  }
  assert.ok(identities.filter(row => findDeepResearchProfile(row.apiId)).length >= 203)
})

test('narrative-only identity review leaves provider/statistical aliases untouched', () => {
  for (const id of [25651,25753,25765,25929,26568]) {
    const row = identities.find(row => row.apiId === id)
    assert.ok(row)
    assert.deepEqual(row.apiIds, [id])
    assert.ok(findDeepResearchProfile(id))
  }
  assert.equal(narrativeApiIdForReviewedAlias(99999999), undefined)
  assert.equal(findDeepResearchProfile('Holloway'), undefined)
  assert.equal(findDeepResearchProfile('Scott Ian'), undefined)
})
