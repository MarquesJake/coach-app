import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import identities from './deep-identity-map.json' with { type: 'json' }
import dataset from './deep-provider-history.json' with { type: 'json' }
import { resolveDeepCoachIdentity, resolveDeepProviderHistory } from './deep-provider-history.ts'

test('all 227 exact UUIDs resolve to dated provider careers and retain each provider ID', () => {
  assert.equal(identities.length, 227)
  assert.equal(new Set(identities.map(row => row.coachId)).size, 227)
  assert.equal(dataset.coaches.length, 227)
  for (const identity of identities) {
    const result = resolveDeepProviderHistory(identity.coachId)
    assert.ok(result)
    assert.ok(result.providers.length > 0)
    assert.ok(result.career.length > 0)
    assert.deepEqual(result.apiIds, identity.apiIds)
    for (const provider of result.providers) {
      assert.ok(identity.apiIds.includes(provider.apiId))
      assert.ok(Number.isFinite(Date.parse(provider.source.retrievedAt!)))
      for (const career of provider.career) {
        assert.equal(career.providerId, provider.apiId)
        assert.equal(career.status, 'provider_reported_history')
        assert.equal(career.retrievedAt, provider.source.retrievedAt)
        assert.ok(career.sourceUrl.includes(`id=${provider.apiId}`))
      }
    }
  }
})

test('potential duplicates cannot share provider histories through names or reviewed grouping alone', () => {
  for (const [a,b] of [[1923,25651],[55,27667],[17954,26570]]) {
    const left = identities.find(row => row.apiId === a)!
    const right = identities.find(row => row.apiId === b)!
    assert.ok(left && right)
    assert.ok(!resolveDeepProviderHistory(left.coachId)!.apiIds.includes(b))
    assert.ok(!resolveDeepProviderHistory(right.coachId)!.apiIds.includes(a))
  }
  assert.equal(resolveDeepCoachIdentity('Lee Grant'), undefined)
  assert.equal(resolveDeepProviderHistory('nonexistent-uuid'), undefined)
})

test('hard-linked provider aliases are symmetric and retained as separate attributed careers', () => {
  for (const [a,b] of [[627,26573],[618,26578],[16373,26564]]) {
    const left = identities.find(row => row.apiId === a)!
    const right = identities.find(row => row.apiId === b)!
    assert.ok(left && right)
    assert.deepEqual(resolveDeepProviderHistory(left.coachId)!.apiIds, resolveDeepProviderHistory(right.coachId)!.apiIds)
    const result = resolveDeepProviderHistory(left.coachId)!
    assert.ok(result.career.some(row => row.providerId === a))
    assert.ok(result.career.some(row => row.providerId === b))
  }
})

test('production datasets contain no local paths or external-profile UUID fields', () => {
  for (const name of ['deep-identity-map.json', 'deep-provider-history.json']) {
    const text = readFileSync(new URL(name, import.meta.url), 'utf8')
    assert.doesNotMatch(text, /\/tmp\/|\/Users\/|externalProfileId|jsonPointer|sourcePath/)
  }
  for (const identity of identities) assert.deepEqual(Object.keys(identity).sort(), ['coachId','name','apiId','apiIds','canonicalName','status','checkedAt','sourceUrls'].sort())
})

test('resolver preserves unknown ends and prevents callers from changing shared provenance', () => {
  const record = identities[0]
  const first = resolveDeepProviderHistory(record.coachId)!
  const original = first.career[0].club
  first.career[0].club = 'Mutation attempt'
  assert.equal(resolveDeepProviderHistory(record.coachId)!.career[0].club, original)
  const withOpenEnd = identities.find(row => resolveDeepProviderHistory(row.coachId)!.career.some(c => c.end === null))!
  const result = resolveDeepProviderHistory(withOpenEnd.coachId)!
  assert.ok(result.career.some(c => c.end === null))
  assert.match(result.notice, /does not establish a current job/)
  assert.equal('currentClub' in result, false)
})
