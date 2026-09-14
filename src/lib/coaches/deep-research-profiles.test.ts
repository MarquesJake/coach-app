import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEEP_RESEARCH_PROFILES, findDeepResearchProfile } from './deep-research-profiles.ts'
import { RESEARCH_PROFILES } from '../scoring/research/profiles.ts'

test('each shortlist coach has distinct period-bound research with resolvable point citations', () => {
  const seen = new Set<number>()
  for (const profile of DEEP_RESEARCH_PROFILES) {
    assert.ok(!seen.has(profile.apiId), `duplicate ${profile.apiId}`)
    seen.add(profile.apiId)
    assert.ok(profile.sections.length >= 3, `${profile.name}: insufficient substance`)
    assert.ok(profile.limitations.length, `${profile.name}: missing limits`)
    const urls = new Set(profile.sources.map(source => source.url))
    for (const section of profile.sections) for (const point of section.points) {
      assert.ok(point.text.trim() && point.period.trim(), `${profile.name}: undated/empty point`)
      assert.ok(point.sourceUrls.length, `${profile.name}: unsourced point`)
      for (const url of point.sourceUrls) {
        assert.ok(urls.has(url), `${profile.name}: unresolved citation ${url}`)
        assert.equal(new URL(url).protocol, 'https:')
      }
    }
  }
  for (const profile of RESEARCH_PROFILES) {
    assert.ok(findDeepResearchProfile(profile.apiId), profile.name)
    assert.equal(findDeepResearchProfile(profile.name)?.apiId, profile.apiId)
    for (const alias of profile.aliases) assert.equal(findDeepResearchProfile(alias)?.apiId, profile.apiId)
  }
})
test('research identity does not guess missing or partial names', () => {
  assert.equal(findDeepResearchProfile('Made Up Coach'), undefined)
  assert.equal(findDeepResearchProfile('Still'), undefined)
  assert.equal(findDeepResearchProfile(99999999), undefined)
  assert.equal(findDeepResearchProfile('Danny Rohl')?.apiId, 22937)
})
