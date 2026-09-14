import fs from 'node:fs/promises';
import { deriveCoachMatchMetrics } from '../src/lib/integrations/coach-match-metrics.ts';
// Input: checked collector output with successful full fixture envelopes and coach-attribution metadata.
// Usage: node --experimental-strip-types scripts/build-coach-match-snapshot.mjs /path/to/collection
const root=process.argv[2];
if(!root) throw Error('Supply the checked match-data collection directory');
const index=JSON.parse(await fs.readFile(`${root}/index.json`,'utf8'));
if(index.status!=='complete') throw Error('Collection not complete');
const coaches=[];
for(const entry of index.coaches){
 const source=JSON.parse(await fs.readFile(`${root}/${entry.path}`,'utf8'));
 const periods=[];
 for(const period of source.requestedPeriods){
  const fixtures=source.fixtures.filter(f=>f.league.season===period.season && [f.teams.home.id,f.teams.away.id].includes(period.teamId));
  if(!fixtures.length) continue;
  const matches=fixtures.map(f=>({fixture:f, ...Object.fromEntries(['events','lineups','statistics'].filter(k=>Array.isArray(f[k])).map(k=>[k,{fixtureId:f.fixture.id,data:f[k],complete:true}]))}));
  const metrics=deriveCoachMatchMetrics({teamId:period.teamId,coachId:source.coachApiId,matches});
  if(!metrics.selection.includedMatches)continue;
  const dates=fixtures.map(f=>f.fixture.date).sort();
  periods.push({club:period.teamName,season:period.season,first:dates[0],last:dates.at(-1),metrics});
 }
 periods.sort((a,b)=>b.season-a.season||b.metrics.selection.includedMatches-a.metrics.selection.includedMatches);
 // Prefer the latest substantial sample on first open; keep current partial season accessible.
 const substantial=periods.findIndex(p=>p.metrics.selection.includedMatches>=10);
 if(substantial>0)periods.unshift(...periods.splice(substantial,1));
 coaches.push({apiId:source.coachApiId,name:source.name,periods,limitations:source.limitations});
}
const output={retrievedAt:index.retrievedAt,coaches};
await fs.writeFile(new URL('../src/lib/integrations/coach-match-snapshots.json', import.meta.url),JSON.stringify(output));
console.log(JSON.stringify(coaches.map(c=>({coach:c.name,periods:c.periods.length,matches:c.periods.reduce((n,p)=>n+p.metrics.selection.includedMatches,0),eventsCovered:c.periods.reduce((n,p)=>n+p.metrics.pointsFromLosingPositions.coverage.coveredMatches,0),subsCovered:c.periods.reduce((n,p)=>n+p.metrics.goalsBySubstitutes.coverage.coveredMatches,0)})),null,2));
