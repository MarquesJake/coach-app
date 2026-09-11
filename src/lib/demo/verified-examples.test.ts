import test from 'node:test'
import assert from 'node:assert/strict'
import { INVESTOR_DEMO_SEASON, VERIFIED_EXAMPLES, verifiedExampleForCoach, summariseLeagueSample } from './verified-examples.ts'

test('free demo subset covers four distinct tiers with dated primary sources', () => {
  assert.deepEqual(VERIFIED_EXAMPLES.map(e => e.league), ['Premier League', 'Championship', 'League One', 'League Two'])
  assert.equal(new Set(VERIFIED_EXAMPLES.map(e => e.coachId)).size, 4)
  const domains = ['www.premierleague.com', 'www.bwfc.co.uk', 'efl.com', 'www.bromleyfc.co.uk', 'barnetfc.com']
  for (const example of VERIFIED_EXAMPLES) {
    assert.equal(example.reviewedOn, '2026-09-06')
    assert.ok(example.facts.length >= 2)
    for (const fact of example.facts) {
      assert.ok(domains.includes(new URL(fact.url).hostname))
      assert.ok(fact.asOf && fact.sourceTitle && fact.text)
    }
  }
})

test('subset review never spreads to other or missing coach records', () => {
  assert.equal(verifiedExampleForCoach('missing'), undefined)
  assert.equal(verifiedExampleForCoach(VERIFIED_EXAMPLES[0].coachId)?.coachName, 'Mikel Arteta')
})

test('Barnet league sample uses five league results, not the cup win', () => {
  assert.equal(INVESTOR_DEMO_SEASON, '2026/27')
  assert.equal(VERIFIED_EXAMPLES[3].leagueSampleSeason, '2026/27')
  assert.deepEqual(summariseLeagueSample(VERIFIED_EXAMPLES[3].leagueSample!), { played: 5, points: 9, ppg: 1.8 })
  assert.deepEqual(summariseLeagueSample([]), { played: 0, points: 0, ppg: null })
  assert.ok(!VERIFIED_EXAMPLES[3].leagueSample!.some(m => m.opponent.includes('Arsenal')))
})

test('historical evidence retains its original season and publication dates', () => {
  assert.ok(VERIFIED_EXAMPLES[0].facts.some(f => f.text.includes('2025/26')))
  assert.ok(VERIFIED_EXAMPLES[1].facts.some(f => f.asOf === '2026-05-24'))
  assert.ok(VERIFIED_EXAMPLES[2].facts.some(f => f.asOf === '2026-04-19'))
})
