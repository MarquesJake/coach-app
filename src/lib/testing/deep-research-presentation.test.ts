/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
const require = createRequire(import.meta.url)
function load(file: string, mocks: Record<string, any> = {}) {
  const source = readFileSync(new URL('../../components/assessment/' + file, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports: any = {}
  new Function('require', 'exports', code)((id: string) => id in mocks ? mocks[id] : require(id), exports)
  return exports
}
test('deep research renders only populated sections with source links, periods and limitations', () => {
  const { DeepCoachResearch } = load('deep-coach-research.tsx')
  const html = renderToStaticMarkup(DeepCoachResearch({ profile: { apiId: 22937, name: 'Danny Röhl', reviewedAt: '2026-09-14', sections: [{key:'career',title:'Career context',points:[{text:'Fixture account.',period:'2023–24',sourceUrls:['https://example.com/source']}]},{key:'management',title:'Empty heading',points:[]}],sources:[{url:'https://example.com/source',title:'Source title',publisher:'Publisher'}],limitations:['Sample limitation.'] },coachId:'reviewed-id' }))
  assert.match(html,/Fixture account/);assert.match(html,/2023–24/);assert.match(html,/Publisher · Source title/);assert.match(html,/Sample limitation/)
  assert.match(html,/href="https:\/\/example.com\/source"/);assert.match(html,/\/coaches\/reviewed-id\/research/);assert.doesNotMatch(html,/Empty heading/)
  assert.equal(renderToStaticMarkup(DeepCoachResearch({profile:null})), '')
})
test('match evidence resolves reviewed API identity, preserves metrics and exposes every period', () => {
  const snapshot=JSON.parse(readFileSync(new URL('../integrations/coach-match-snapshots.json',import.meta.url),'utf8'))
  const coach=snapshot.coaches.find((row:any)=>row.apiId===22937)
  assert.ok(coach?.periods.length)
  const {VerifiedMatchEvidence}=load('verified-match-evidence.tsx',{'@/lib/integrations/coach-match-snapshots.json':snapshot,'@/lib/scoring/research/catalogue':{researchProfileForName:(name:string)=>name==='Röhl'?{apiId:22937}:undefined}})
  const html=renderToStaticMarkup(VerifiedMatchEvidence({coachName:'Röhl'}))
  for(const label of ['Points per match','Possession (average)','xG for per match','xG against per match','Points from losing positions','Points after conceding first','Goals by substitutes','First substitution (average minute)','Reported starting formations','Form across the spell']) assert.ok(html.includes(label),label)
  for(let i=0;i<coach.periods.length;i++){assert.ok(html.includes(`href="#match-period-22937-${i}"`));assert.ok(html.includes(`id="match-period-22937-${i}"`))}
  assert.match(html,/lineup-confirmed/);assert.match(html,/bounded-tenure fallback/);assert.match(html,/matches covered/)
  assert.match(renderToStaticMarkup(VerifiedMatchEvidence({coachName:'unknown'})),/No checked match data for this coach yet/)
})

test('provider history preserves incomplete dates without inventing employment or results', () => {
  const {ProviderCareerEvidence}=load('provider-career-evidence.tsx')
  const record={retrievedAt:'2026-09-14',career:[{club:'Earlier',start:'2020-01-01',end:'2021-01-01'},{club:'Later',start:'2024-02-03',end:null}]}
  const html=renderToStaticMarkup(ProviderCareerEvidence({coachName:'Exact identity',apiId:42,record,coachId:'uuid',hasMatchEvidence:false}))
  assert.ok(html.indexOf('Later')<html.indexOf('Earlier'))
  assert.match(html,/2 career entries, including 1 with both/);assert.match(html,/2024-02-03/);assert.match(html,/Not supplied/)
  assert.match(html,/not evidence that the coach remains/);assert.match(html,/Points per match/);assert.match(html,/Goals by substitutes/)
  assert.equal((html.match(/>Not available</g)??[]).length,13)
  assert.match(html,/API-Football coach ID 42/);assert.match(html,/\/coaches\/uuid\/career/)
  assert.equal(record.career[0].club,'Earlier')
  assert.equal(renderToStaticMarkup(ProviderCareerEvidence({coachName:'Empty',apiId:1,hasMatchEvidence:false,record:{retrievedAt:'2026-09-14',career:[]}})), '')
})

test('career section does not duplicate unavailable measures when an attributed sample exists', () => {
  const {ProviderCareerEvidence}=load('provider-career-evidence.tsx')
  const html=renderToStaticMarkup(ProviderCareerEvidence({coachName:'Coach',apiId:42,hasMatchEvidence:true,record:{retrievedAt:'2026-09-14',career:[{club:'Club',start:'2024-01-01',end:null}]}}))
  assert.match(html,/Club/);assert.doesNotMatch(html,/No checked match sample|Results and match-data coverage|Not available/)
})
test('explicit reviewed provider IDs override names and empty identities never fall back', () => {
  const snapshot=JSON.parse(readFileSync(new URL('../integrations/coach-match-snapshots.json',import.meta.url),'utf8'))
  const sample=snapshot.coaches.find((row:any)=>row.periods.length)
  const {VerifiedMatchEvidence,matchSnapshotForApiIds}=load('verified-match-evidence.tsx',{'@/lib/integrations/coach-match-snapshots.json':snapshot,'@/lib/scoring/research/catalogue':{researchProfileForName:()=>({apiId:sample.apiId})}})
  assert.equal(matchSnapshotForApiIds([-1,sample.apiId]).apiId,sample.apiId)
  assert.match(renderToStaticMarkup(VerifiedMatchEvidence({coachName:'Different display name',apiIds:[sample.apiId]})),/His record, season by season/)
  assert.equal(renderToStaticMarkup(VerifiedMatchEvidence({coachName:sample.name,apiIds:[],hideMissing:true})), '')
})

test('alias snapshots stay separate with no sum and only latest period starts expanded', () => {
  const snapshot=JSON.parse(readFileSync(new URL('../integrations/coach-match-snapshots.json',import.meta.url),'utf8'))
  const sample=snapshot.coaches.find((row:any)=>row.periods.length)
  const periods=[{...sample.periods[0],last:'2022-01-01'},{...sample.periods[0],last:'2025-01-01'}]
  const fixture={retrievedAt:snapshot.retrievedAt,coaches:[{...sample,apiId:10001,periods},{...sample,apiId:10002,periods}]}
  const {VerifiedMatchEvidence}=load('verified-match-evidence.tsx',{'@/lib/integrations/coach-match-snapshots.json':fixture,'@/lib/scoring/research/catalogue':{researchProfileForName:()=>undefined}})
  const html=renderToStaticMarkup(VerifiedMatchEvidence({coachName:'Reviewed alias',apiIds:[10001,10002,10001]}))
  assert.match(html,/do not add their matches/)
  assert.match(html,/Provider coach ID 10001/);assert.match(html,/Provider coach ID 10002/)
  assert.equal((html.match(/<details[^>]*open=""/g)??[]).length,2)
  assert.equal((html.match(/id="match-period-/g)??[]).length,4)
})

test('Data page wires exact UUID identities, provider history and match-aware placeholders', async () => {
  const source=readFileSync(new URL('../../app/(dashboard)/coaches/[id]/data/page.tsx',import.meta.url),'utf8')
  const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText
  for(const hasMatches of [false,true]){
    const calls:string[]=[]
    const q:any={select:()=>q,eq:()=>q,order:()=>q,maybeSingle:async()=>({data:null,error:null}),then:(resolve:any)=>resolve({data:[],error:null})}
    const db={auth:{getUser:async()=>({data:{user:{id:'u'}}})},from:()=>q}
    const mocks:any={
      '@/lib/scoring/research/catalogue':{researchProfileForName:()=>{throw Error('Existing UUID must not use name fallback')}},
      'next/navigation':{},'@/lib/supabase/server':{createServerSupabaseClient:async()=>db},'@/lib/db/coaches':{getCoachById:async()=>({data:{name:'Ambiguous display name'},error:null})},
      '@/lib/coaches/deep-provider-history':{resolveDeepCoachIdentity:(id:string)=>{calls.push(id);return {apiIds:[123],canonicalName:'Resolved'}},resolveDeepProviderHistory:(id:string)=>{calls.push(id);return {providers:[{apiId:123,career:[{club:'Club',start:'2020-01-01',end:null}],source:{retrievedAt:'2026-09-14',sourceUrl:'https://example.com/source',sourcePath:'/private/never-show'},limitations:['Provider limitation']}]}}},
      '@/lib/coaches/deep-research-profiles':{findDeepResearchProfile:(id:number)=>{assert.equal(id,123);return undefined}},
      '@/components/assessment/verified-match-evidence':{VerifiedMatchEvidence:'match-panel',matchSnapshotForApiIds:(ids:number[])=>{assert.deepEqual(ids,[123]);return hasMatches?{}:undefined}},
      '@/components/assessment/provider-career-evidence':{ProviderCareerEvidence:'provider-panel'},'@/components/assessment/deep-coach-research':{DeepCoachResearch:'deep-panel'},'@/components/assessment/sourced-coach-research':{SourcedCoachResearch:'sourced-panel'},'./_components/coach-data-tab':{CoachDataTab:'legacy-panel'},
    }
    const exports:any={};new Function('require','exports',code)((id:string)=>id in mocks?mocks[id]:require(id),exports)
    const tree=await exports.default({params:Promise.resolve({id:'exact-uuid'})})
    const children=tree.props.children.flat().filter(Boolean)
    assert.deepEqual(calls,['exact-uuid','exact-uuid'])
    const provider=children.find((c:any)=>c.type==='provider-panel');assert.equal(provider.props.hasMatchEvidence,hasMatches);assert.equal(provider.props.sourceUrl,'https://example.com/source')
    assert.ok(!JSON.stringify(provider.props).includes('/private/never-show'))
    assert.ok(!children.some((c:any)=>c.type==='sourced-panel'))
    assert.deepEqual(children.find((c:any)=>c.type==='match-panel').props.apiIds,[123])
  }
})

test('new UUID uses only exact reviewed aliases; mapped UUID never uses a conflicting name', async () => {
  const source=readFileSync(new URL('../../app/(dashboard)/coaches/[id]/data/page.tsx',import.meta.url),'utf8')
  const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText
  for(const scenario of [{mapped:undefined,name:'Reviewed alias',expected:[77]},{mapped:undefined,name:'Unknown surname',expected:[]},{mapped:{apiIds:[],canonicalName:'Mapped'},name:'Reviewed alias',expected:[]},{mapped:{apiIds:[88],canonicalName:'Mapped'},name:'Reviewed alias',expected:[88]}]){
    let lookups=0
    const q:any={select:()=>q,eq:()=>q,order:()=>q,maybeSingle:async()=>({data:null,error:null}),then:(resolve:any)=>resolve({data:[],error:null})}
    const mocks:any={'next/navigation':{},'@/lib/supabase/server':{createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'u'}}})},from:()=>q})},'@/lib/db/coaches':{getCoachById:async()=>({data:{name:scenario.name},error:null})},'@/lib/coaches/deep-provider-history':{resolveDeepCoachIdentity:()=>scenario.mapped,resolveDeepProviderHistory:()=>undefined},'@/lib/scoring/research/catalogue':{researchProfileForName:(name:string)=>{lookups++;return name==='Reviewed alias'?{apiId:77,name:'Reviewed full name'}:undefined}},'@/lib/coaches/deep-research-profiles':{findDeepResearchProfile:()=>undefined},'@/components/assessment/verified-match-evidence':{VerifiedMatchEvidence:'match-panel',matchSnapshotForApiIds:()=>undefined},'@/components/assessment/provider-career-evidence':{ProviderCareerEvidence:'provider-panel'},'@/components/assessment/deep-coach-research':{DeepCoachResearch:'deep-panel'},'@/components/assessment/sourced-coach-research':{SourcedCoachResearch:'sourced-panel'},'./_components/coach-data-tab':{CoachDataTab:'legacy-panel'}}
    const exports:any={};new Function('require','exports',code)((id:string)=>id in mocks?mocks[id]:require(id),exports)
    const tree=await exports.default({params:Promise.resolve({id:'new-uuid'})})
    const panel=tree.props.children.flat().find((c:any)=>c?.type==='match-panel')
    assert.deepEqual(panel.props.apiIds,scenario.expected);assert.equal(lookups,scenario.mapped?0:1)
    const sourced=tree.props.children.flat().some((c:any)=>c?.props?.children?.type==='sourced-panel')
    assert.equal(sourced,!scenario.mapped && scenario.name==='Reviewed alias')
  }
})

test('period-specific alternate lineup identity shows public review provenance without raw paths', () => {
  const snapshot=JSON.parse(readFileSync(new URL('../integrations/coach-match-snapshots.json',import.meta.url),'utf8'))
  const sample=snapshot.coaches.find((row:any)=>row.periods.length)
  const fixture={retrievedAt:snapshot.retrievedAt,coaches:[{...sample,apiId:16246,periods:[{...sample.periods[0],lineupCoachId:25762,identityEvidence:{sourceUrl:'https://example.com/review',checkedAt:'2026-09-14',source:'/tmp/private-cache.json',reason:'/Users/private'}}]}]}
  const {VerifiedMatchEvidence}=load('verified-match-evidence.tsx',{'@/lib/integrations/coach-match-snapshots.json':fixture,'@/lib/scoring/research/catalogue':{researchProfileForName:()=>undefined}})
  const html=renderToStaticMarkup(VerifiedMatchEvidence({coachName:'Carrick',apiIds:[16246]}))
  assert.match(html,/lineup coach ID 25762/);assert.match(html,/profile provider ID 16246/);assert.match(html,/href="https:\/\/example.com\/review"/);assert.match(html,/Reviewed 2026-09-14/);assert.doesNotMatch(html,/private-cache|\/Users\//)
})


test('same club-season lineup slices have distinct overview, collapsed and detail labels without combined totals', () => {
  const snapshot=JSON.parse(readFileSync(new URL('../integrations/coach-match-snapshots.json',import.meta.url),'utf8'))
  const sample=snapshot.coaches.find((row:any)=>row.periods.length)
  const periods=[{...sample.periods[0],club:'Salzburg',season:2026,lineupCoachId:25738,last:'2026-08-01'}, {...sample.periods[0],club:'Salzburg',season:2026,lineupCoachId:22937,last:'2026-09-01'}]
  const fixture={retrievedAt:snapshot.retrievedAt,coaches:[{...sample,apiId:22937,periods}]}
  const {VerifiedMatchEvidence}=load('verified-match-evidence.tsx',{'@/lib/integrations/coach-match-snapshots.json':fixture,'@/lib/scoring/research/catalogue':{researchProfileForName:()=>undefined}})
  const html=renderToStaticMarkup(VerifiedMatchEvidence({coachName:'Rohl',apiIds:[22937]}))
  for(const id of [25738,22937]) {
    assert.ok(html.includes(`Salzburg · 2026 · lineup coach ID ${id}</a>`))
    assert.ok(html.includes(`Salzburg · season starting 2026 · lineup coach ID ${id} ·`))
    assert.ok(html.includes(`Salzburg · 2026 · lineup coach ID ${id}: slice results and coverage`))
  }
  assert.equal((html.match(/<details[^>]*open=""/g)??[]).length,1)
  assert.match(html, /2 spells on record/)
  assert.match(html, /not always the full season/)
  assert.equal((html.match(/>Match points</g)??[]).length,2)
})


test('period chronology exclusions and dated official sources remain explicit, including zero and missing counts', () => {
  const snapshot=JSON.parse(readFileSync(new URL('../integrations/coach-match-snapshots.json',import.meta.url),'utf8'))
  const sample=snapshot.coaches.find((row:any)=>row.periods.length)
  for(const count of [2,0,undefined]) {
    const fixture={retrievedAt:null,coaches:[{...sample,limitations:['Official evidence: https://example.com/departure'],periods:[{...sample.periods[0],sourceRetrievalRange:{earliest:null,latest:null,undatedFixtureReferences:1},excludedForOfficialChronology:count,chronologyRules:[{apiIds:[sample.apiId],teamId:1,fromSeason:2025,notBefore:'2025-08-01',notAfter:'2026-05-31',sourceUrl:'https://example.com/official',checkedAt:'2026-09-14',note:'The official appointment and departure bound this slice.'}]}]}]}
    const {VerifiedMatchEvidence}=load('verified-match-evidence.tsx',{'@/lib/integrations/coach-match-snapshots.json':fixture,'@/lib/scoring/research/catalogue':{researchProfileForName:()=>undefined}})
    const html=renderToStaticMarkup(VerifiedMatchEvidence({coachName:'Coach',apiIds:[sample.apiId]}))
    assert.match(html,/Official chronology checks/)
    assert.match(html,/Not before 2025-08-01/);assert.match(html,/Not after 2026-05-31/)
    assert.match(html,/href="https:\/\/example.com\/official"/)
    assert.match(html,/href="https:\/\/example.com\/departure"/)
    assert.match(html,/Excluded matches are not reassigned/)
    if(count===undefined) assert.match(html,/An exclusion count is not supplied/)
    else assert.ok(html.includes(`${count} provider-labelled observations excluded`))
    assert.match(html,/Each club and season is kept separate/)
    assert.doesNotMatch(html,/Snapshot retrieved|1970|Invalid Date/)
    assert.match(html,/data pulled Not supplied/)
    assert.match(html,/1 fixture references without a recorded retrieval date/)
  }
})
