import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const data=JSON.parse(readFileSync(new URL('./performance.json',import.meta.url),'utf8'))
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100

test('historical periods reconcile and have complete match samples',()=>{
  assert.equal(data.periods.length,19)
  assert.equal(new Set(data.periods.map((p:{coach_key:string})=>p.coach_key)).size,7)
  let observations=0
  for(const p of data.periods){
    assert.equal(p.wins+p.draws+p.losses,p.games)
    assert.equal(3*p.wins+p.draws,p.points)
    assert.equal(p.gf-p.ga,p.gd)
    assert.equal(p.ppg,round(p.points/p.games))
    assert.equal(p.home.games+p.away.games,p.games)
    assert.equal(p.home.points+p.away.points,p.points)
    assert.equal(p.first_half.points+p.second_half.points,p.points)
    assert.ok(p.clean_sheets<=p.games&&p.failed_to_score<=p.games)
    assert.ok(p.start<=p.end&&p.end<'2025-06-01')
    assert.match(p.sha256,/^[0-9a-f]{64}$/)
    observations+=p.games
  }
  assert.equal(observations,data.quality.coach_fixture_observations)
  assert.equal(data.quality.unique_fixtures,640)
})
test('previous coaches and short appointment samples remain explicit',()=>{
  const before=data.periods.find((p:{coach_key:string;baseline:boolean})=>p.coach_key==='hoeness'&&p.baseline)
  assert.equal(before.games,26);assert.equal(before.points,20)
  const after=data.periods.find((p:{coach_key:string;games:number})=>p.coach_key==='hoeness'&&p.games===8)
  assert.equal(after.points,13);assert.equal(after.ppg,1.63)
  const ajaxBefore=data.periods.find((p:{club:string;baseline:boolean})=>p.club==='Ajax'&&p.baseline)
  assert.equal(ajaxBefore.points,56)
  const ajaxAfter=data.periods.find((p:{club:string;baseline:boolean})=>p.club==='Ajax'&&!p.baseline)
  assert.equal(ajaxAfter.points,78);assert.equal(ajaxAfter.gf,67);assert.equal(ajaxAfter.ga,32)
})
test('data coverage does not imply current form, xG or a scouting score',()=>{
  assert.ok(data.limitations.some((s:string)=>s.includes('2025/26')))
  assert.ok(data.limitations.some((s:string)=>s.includes('expected-goals')))
  for(const p of data.periods){assert.equal(p.xg,undefined);assert.equal(p.fit_score,undefined)}
})
