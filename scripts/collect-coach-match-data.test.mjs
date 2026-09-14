import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {deepLineup,deepFixtureReason,loadCoachFixtures,readMatchEnvelope,exactLineup} from './collect-coach-match-data.mjs';
const period={teamId:74,season:2023,lineupCoachId:22937};
const fixture={fixture:{id:1,date:'2024-04-01T15:00:00Z',status:{short:'FT'}},league:{id:40,season:2023,round:'Regular Season - 30'},teams:{home:{id:74},away:{id:41}},goals:{home:2,away:0},score:{fulltime:{home:2,away:0},extratime:{home:null,away:null},penalty:{home:null,away:null}},lineups:[{team:{id:74},coach:{id:22937}}]};
const leagues=new Map([[40,{league:{id:40,name:'Championship',type:'League'},country:{name:'England'},seasons:[{year:2023,start:'2023-08-01',end:'2024-05-31'}]}]]);
test('a named different coach cannot be assigned by tenure or same club',()=>{
 assert.equal(deepLineup({...fixture,lineups:[{team:{id:74},coach:{id:13539,name:'N. Thompson'}}]},period),null);
 assert.equal(deepLineup({...fixture,lineups:[{team:{id:41},coach:{id:22937}}]},period),null);
 assert.equal(deepLineup({...fixture,lineups:[...fixture.lineups,...fixture.lineups]},period),null);
 const ambiguous={...fixture,lineups:[...fixture.lineups,{team:{id:41},coach:{id:22937}}]};
 assert.equal(deepLineup(ambiguous,period),null);
 assert.equal(exactLineup(ambiguous,22937,[period]),null);
});
test('explicit alternate identity is exact and leaves the provider lineup untouched',()=>{
 const f={...fixture,lineups:[{team:{id:74},coach:{id:25738,name:'Danny Rohl'}}]};
 assert.equal(deepLineup(f,period),null);
 assert.equal(deepLineup(f,{...period,lineupCoachId:25738}).coach.id,25738);
 assert.equal(f.lineups[0].coach.id,25738);
});
test('official chronology can reject a matching provider ID but cannot assign another coach',()=>{
 const bounded={...period,chronologyRules:[{notAfter:'2024-03-31',sourceUrl:'https://club.example/official-departure'}]};
 assert.equal(deepLineup(fixture,bounded),null);
 assert.equal(deepLineup({...fixture,fixture:{...fixture.fixture,date:'2024-03-31T15:00:00Z'}},bounded)?.coach.id,22937);
 assert.equal(deepLineup({...fixture,lineups:[{team:{id:74},coach:{id:13539}}]},period),null);
 const appointment={...period,chronologyRules:[{notBefore:'2024-04-01'}]};
 assert.equal(deepLineup({...fixture,fixture:{...fixture.fixture,date:'2024-03-31T23:59:00Z'}},appointment),null);
 assert.equal(deepLineup(fixture,appointment)?.coach.id,22937);
 assert.equal(fixture.lineups[0].coach.id,22937);
});
test('post-split league groups retain season/date checks; knockout results remain excluded',()=>{
 const f={...fixture,league:{...fixture.league,round:'Championship Round - 1'}};
 assert.equal(deepFixtureReason(f,period,leagues,Date.parse('2026-09-14')),null);
 assert.equal(f.league.round,'Championship Round - 1');
 assert.equal(deepFixtureReason({...f,fixture:{...f.fixture,date:'2025-04-01'}},period,leagues,Date.parse('2026-09-14')),'outside-verified-season-dates');
 assert.equal(deepFixtureReason({...f,league:{...f.league,round:'Final'}},period,leagues,Date.parse('2026-09-14')),'knockout-or-unrecognised-round');
});
test('missing referenced fixtures fail and empty feeds remain unknown without editing raw evidence',()=>{
 const raw={data:{response:[{...fixture,events:[]}]}};
 const rows=loadCoachFixtures({fixtureRefs:[{fixtureId:1,source:'fixture.json'}]},'/tmp',()=>raw);
 assert.ok(!Object.hasOwn(rows[0],'events'));
 assert.deepEqual(raw.data.response[0].events,[]);
 assert.deepEqual(loadCoachFixtures({fixtures:raw.data.response},'/tmp'),rows);
 assert.throws(()=>loadCoachFixtures({fixtureRefs:[{fixtureId:2,source:'fixture.json'}]},'/tmp',()=>raw),/Missing referenced fixture/);
});
test('a verified compressed cache preserves references to its original JSON path',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'coach-cache-'));
 try {
  const file=path.join(root,'source.json');
  const raw={data:{response:[fixture]}};
  fs.writeFileSync(file+'.gz',gzipSync(JSON.stringify(raw)));
  assert.deepEqual(readMatchEnvelope(file),raw);
  assert.deepEqual(loadCoachFixtures({fixtureRefs:[{fixtureId:1,source:'source.json'}]},root),[fixture]);
  fs.writeFileSync(file+'.gz','corrupt');
  assert.throws(()=>readMatchEnvelope(file));
 } finally {fs.rmSync(root,{recursive:true});}
});
test('snapshot builder accepts legacy inline fixtures and preserves exact coach attribution',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'coach-legacy-'));
 try {
  fs.writeFileSync(path.join(root,'index.json'),JSON.stringify({status:'complete',retrievedAt:'2026-09-14',coaches:[{path:'coach.json'}]}));
  fs.writeFileSync(path.join(root,'coach.json'),JSON.stringify({coachApiId:22937,name:'Danny Rohl',fixtureSources:{1:{retrievedAt:'2024-04-02T10:00:00Z'},2:{retrievedAt:'2024-04-03T10:00:00Z'}},fixtures:[fixture,{...fixture,fixture:{...fixture.fixture,id:2},lineups:[{team:{id:74},coach:{id:13539}}]}],requestedPeriods:[{teamId:74,teamName:'Sheffield Wednesday',season:2023}],limitations:['Legacy sample']}));
  const output=path.join(root,'candidate.json');
  const run=spawnSync(process.execPath,['--experimental-strip-types',new URL('./build-coach-match-snapshot.mjs',import.meta.url).pathname,root,'--output',output],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const result=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(result.coaches.length,1);
  assert.equal(result.retrievedAt,'2024-04-02T10:00:00Z');
  assert.equal(result.sourceRetrievalRange.earliest,'2024-04-02T10:00:00Z');
  assert.notEqual(result.assembledAt,result.retrievedAt);
  const p=result.coaches[0].periods[0];
  assert.equal(p.lineupCoachId,22937);
  assert.equal(p.excludedForOfficialChronology,undefined);
  assert.equal(p.metrics.selection.includedMatches,1);
  assert.equal(p.metrics.selection.tenureFallbackMatches,0);
  assert.equal(p.metrics.possession.coverage.coveredMatches,0);
 } finally {fs.rmSync(root,{recursive:true});}
});
