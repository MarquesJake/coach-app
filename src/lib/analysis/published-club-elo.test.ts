import assert from 'node:assert/strict'
import test from 'node:test'
import { summariseEloSpell, eloSegments } from './published-club-elo.ts'

const points = [
  { date: '2024-05-20', rating: 1600, segment: 0 },
  { date: '2024-08-10', rating: 1650, segment: 0 },
  { date: '2024-09-10', rating: 1630, segment: 0 },
  { date: '2025-08-10', rating: 1900, segment: 1 },
]
test('published Elo uses the preceding observation and excludes successor and future results', () => {
  const result = summariseEloSpell(points, {start:'2024-07-01',end:'2024-10-01'}, '2026-09-10')!
  assert.equal(result.baseline.rating,1600)
  assert.equal(result.last.rating,1630)
  assert.equal(result.change,30)
  assert.equal(result.peak.rating,1650)
  assert.equal(result.fromPeak,-20)
  assert.equal(result.partial,false)
  assert.equal(summariseEloSpell(points,{start:'2024-07-01',end:null},'2024-08-31')!.last.rating,1650)
})
test('missing arrival baseline cannot produce a full-spell change', () => {
  const result=summariseEloSpell(points,{start:'2023-01-01',end:'2024-10-01'},'2026-09-10')!
  assert.equal(result.partial,true)
  assert.equal(result.fullSpellChange,null)
  assert.equal(result.change,30)
})
test('empty and pre-appointment histories return no invented rating', () => {
  assert.equal(summariseEloSpell([], {start:'2024-07-01',end:null},'2026-09-10'),null)
  assert.equal(summariseEloSpell(points,{start:'2026-01-01',end:null},'2026-09-10'),null)
})
test('declared source gaps remain separate chart segments', () => {
  assert.equal(eloSegments(points).length,2)
  assert.equal(summariseEloSpell(points,{start:'2024-07-01',end:null},'2026-09-10')!.discontinuous,true)
})
