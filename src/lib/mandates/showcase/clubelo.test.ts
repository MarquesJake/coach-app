import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { summariseEloSpell } from '../../analysis/published-club-elo.ts'
import type { PublishedEloPoint } from '../../analysis/published-club-elo.ts'

const data = JSON.parse(readFileSync(new URL('./clubelo.json',import.meta.url),'utf8')) as {
  retrieved_date:string
  clubs:Array<{key:string;sha256:string;source_url:string;points:PublishedEloPoint[]}>
  spells:Array<{id:string;coachKey:string;clubKey:string;start:string;end:string|null}>
}
test('ClubElo snapshot has valid, ordered observations and resolvable spells for all seven coaches', () => {
  assert.equal(new Set(data.spells.map(s=>s.coachKey)).size,7)
  assert.equal(new Set(data.clubs.map(c=>c.key)).size,data.clubs.length)
  for(const club of data.clubs){
    assert.match(club.sha256,/^[a-f0-9]{64}$/)
    assert.equal(new URL(club.source_url).hostname,'clubelo.com')
    assert.ok(club.points.length>20)
    for(const [i,p] of club.points.entries()){
      assert.ok(Number.isFinite(p.rating)&&p.rating>0&&p.rating<4000)
      assert.ok(p.date<=data.retrieved_date)
      if(i>0) assert.ok(club.points[i-1].date<p.date)
    }
  }
  for(const spell of data.spells){
    const club=data.clubs.find(c=>c.key===spell.clubKey)
    assert.ok(club)
    const summary=summariseEloSpell(club.points,spell,data.retrieved_date)
    assert.ok(summary)
    assert.ok(summary.last.date<=(spell.end??data.retrieved_date))
    if(club.points[0].date>spell.start) assert.equal(summary.fullSpellChange,null)
  }
})
