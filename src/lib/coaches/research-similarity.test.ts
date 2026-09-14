import test from 'node:test'
import assert from 'node:assert/strict'
import { compareResearchCategories } from './research-similarity.ts'
import type { ResearchProfile } from '../scoring/research/brief-fit.ts'

const profile = (name: string, apiId: number, overrides: Partial<ResearchProfile> = {}): ResearchProfile => ({
  name, apiId, aliases: [], style: 'Possession', build: 'Short', pressing: 'High', trackRecord: [],
  summary: 'Research interpretation', limitation: 'Dated evidence',
  sources: [{ title: 'Source', url: 'https://example.com/research', period: '2023–24' }], ...overrides,
})
const current = profile('Current Coach', 1)

test('unknown or excluded current identity produces no inferred peers', () => {
  assert.equal(compareResearchCategories('missing', [{ id: 'peer', name: 'Peer' }], [profile('Peer', 2)]).current, null)
  assert.deepEqual(compareResearchCategories('current', [{ id: 'current', name: 'Unresearched' }], [current]).peers, [])
})

test('compares sourced categories only and preserves differing dimensions', () => {
  const peer = profile('Peer', 2, { pressing: 'Low', build: 'Direct' })
  const result = compareResearchCategories('current', [{ id: 'current', name: current.name }, { id: 'peer', name: peer.name }], [current, peer])
  assert.deepEqual(result.peers[0].dimensions.map(row => row.shared), [true, false, false])
  assert.equal('score' in result.peers[0], false)
  assert.equal(result.peers[0].profile.sources[0].period, '2023–24')
})

test('deduplicates exact aliases and excludes current identity, inaccessible and unsourced profiles', () => {
  const peer = profile('Peer Coach', 2, { aliases: ['P. Coach'] })
  const result = compareResearchCategories('current', [
    { id: 'current', name: current.name }, { id: 'self-alias', name: 'C. Coach' },
    { id: 'a', name: 'P. Coach' }, { id: 'z', name: 'Peer Coach' }, { id: 'no-source', name: 'No Source' },
  ], [{ ...current, aliases: ['C. Coach'] }, peer, profile('Inaccessible', 3), profile('No Source', 4, { sources: [] })])
  assert.equal(result.peers.length, 1)
  assert.equal(result.peers[0].record.id, 'z')
})

test('does not infer similarity without shared categories or from ambiguous aliases', () => {
  const profiles = [current, profile('Different', 2, { style: 'Direct', build: 'Direct', pressing: 'Low' }), profile('One', 3, { aliases: ['Ambiguous'] }), profile('Two', 4, { aliases: ['Ambiguous'] })]
  assert.equal(compareResearchCategories('current', [{ id: 'current', name: current.name }, { id: 'different', name: 'Different' }, { id: 'ambiguous', name: 'Ambiguous' }], profiles).peers.length, 0)
})

test('sorts alphabetically rather than by number of shared categories', () => {
  const result = compareResearchCategories('current', [{ id: 'current', name: current.name }, { id: 'z', name: 'Zulu' }, { id: 'a', name: 'Alpha' }], [current, profile('Zulu', 2), profile('Alpha', 3, { build: 'Direct', pressing: 'Low' })])
  assert.deepEqual(result.peers.map(row => row.profile.name), ['Alpha', 'Zulu'])
})
