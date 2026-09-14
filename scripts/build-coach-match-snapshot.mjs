import fs from 'node:fs/promises';
import { deriveCoachMatchMetrics } from '../src/lib/integrations/coach-match-metrics.ts';
import { loadCoachFixtures, readMatchEnvelope, deepLineup } from './collect-coach-match-data.mjs';
const envelopeCache = new Map();
const loadEnvelope = file => { if(envelopeCache.has(file))return envelopeCache.get(file); const result=readMatchEnvelope(file);envelopeCache.set(file,result);if(envelopeCache.size>5)envelopeCache.delete(envelopeCache.keys().next().value);return result; };
// Input: checked collector output with successful full fixture envelopes and coach-attribution metadata.
// Usage: node --experimental-strip-types scripts/build-coach-match-snapshot.mjs /path/to/collection
const root=process.argv[2];
if(!root) throw Error('Supply the checked match-data collection directory');
const index=JSON.parse(await fs.readFile(`${root}/index.json`,'utf8'));
if(index.status!=='complete') throw Error('Collection not complete');
const coaches=[];
const observedRetrievalDates=[];
function retrievalDate(ref) {
 if(ref?.originalSource)return retrievalDate(ref.originalSource);
 if(ref?.format==='coach-export')return null;
 return typeof ref?.retrievedAt==='string'&&Number.isFinite(Date.parse(ref.retrievedAt))?ref.retrievedAt:null;
}
function retrievalRange(dates) {
 const known=dates.filter(Boolean).sort((a,b)=>Date.parse(a)-Date.parse(b));
 return {earliest:known[0]??null,latest:known.at(-1)??null,undatedFixtureReferences:dates.length-known.length};
}
for(const entry of index.coaches){
 const source=JSON.parse(await fs.readFile(`${root}/${entry.path}`,'utf8'));
 const periods=[];
 const sourceFixtures=loadCoachFixtures(source,root,loadEnvelope);
 const refs=new Map((source.fixtureRefs??Object.entries(source.fixtureSources??{}).map(([fixtureId,ref])=>({fixtureId:Number(fixtureId),...ref}))).map(ref=>[ref.fixtureId,ref]));
 const coachRetrievalDates=[];
 for(const period of source.requestedPeriods){
  const lineupCoachId=period.lineupCoachId??source.coachApiId;
  const fixtures=sourceFixtures.filter(f=>f.league.season===period.season && deepLineup(f,{...period,lineupCoachId}));
  if(!fixtures.length) continue;
  const matches=fixtures.map(f=>({fixture:f, ...Object.fromEntries(['events','lineups','statistics'].filter(k=>Array.isArray(f[k])).map(k=>[k,{fixtureId:f.fixture.id,data:f[k],complete:true}]))}));
  const metrics=deriveCoachMatchMetrics({teamId:period.teamId,coachId:lineupCoachId,matches});
  if(!metrics.selection.includedMatches)continue;
  const dates=fixtures.map(f=>f.fixture.date).sort();
  const retrievalDates=fixtures.map(f=>retrievalDate(refs.get(f.fixture.id)));
  coachRetrievalDates.push(...retrievalDates);
  periods.push({teamId:period.teamId,club:period.teamName,season:period.season,lineupCoachId,identityEvidence:period.selectionEvidence,chronologyRules:period.chronologyRules,excludedForOfficialChronology:period.excludedForOfficialChronology,sourceRetrievalRange:retrievalRange(retrievalDates),first:dates[0],last:dates.at(-1),metrics});
 }
 periods.sort((a,b)=>b.season-a.season||b.metrics.selection.includedMatches-a.metrics.selection.includedMatches);
 // Prefer the latest substantial sample on first open; keep current partial season accessible.
 const substantial=periods.findIndex(p=>p.metrics.selection.includedMatches>=10);
 if(substantial>0)periods.unshift(...periods.splice(substantial,1));
 observedRetrievalDates.push(...coachRetrievalDates);
 coaches.push({apiId:source.coachApiId,name:source.name,periods,sourceRetrievalRange:retrievalRange(coachRetrievalDates),limitations:source.limitations});
}
const sourceRetrievalRange=retrievalRange(observedRetrievalDates);
const output={retrievedAt:sourceRetrievalRange.latest,assembledAt:new Date().toISOString(),sourceRetrievalRange,coaches};
const outputIndex=process.argv.indexOf('--output');
const outputPath=outputIndex>=0?process.argv[outputIndex+1]:new URL('../src/lib/integrations/coach-match-snapshots.json', import.meta.url);
if(!outputPath)throw Error('Missing --output path');
await fs.writeFile(outputPath,JSON.stringify(output));
console.log(JSON.stringify(coaches.map(c=>({coach:c.name,periods:c.periods.length,matches:c.periods.reduce((n,p)=>n+p.metrics.selection.includedMatches,0),eventsCovered:c.periods.reduce((n,p)=>n+p.metrics.pointsFromLosingPositions.coverage.coveredMatches,0),subsCovered:c.periods.reduce((n,p)=>n+p.metrics.goalsBySubstitutes.coverage.coveredMatches,0)})),null,2));
