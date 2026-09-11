import { createRequire } from 'node:module'
const { PGlite } = createRequire(import.meta.url)('@electric-sql/pglite')
import fs from 'node:fs'
import assert from 'node:assert/strict'
const db = new PGlite()
const root = new URL('../', import.meta.url)
const migration = fs.readFileSync(new URL('supabase/migrations/20260908171219_controlled_club_brief_amendments.sql', root), 'utf8')
const base = fs.readFileSync(new URL('supabase/migrations/20260714145111_club_dossier_commercial_flow.sql', root), 'utf8')
const identity = fs.readFileSync(new URL('supabase/migrations/20260714163809_club_identity_invitations.sql', root), 'utf8')
const uid = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`
const users = { director:uid(1), analyst:uid(2), other:uid(3), viewer:uid(4), otherAnalyst:uid(5), coach:uid(6) }
const club=uid(10), service=uid(11), otherClub=uid(12), otherService=uid(13), coachOrg=uid(14), briefId=uid(20), mandateId=uid(30)
await db.exec(`create role authenticated; create role anon; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 grant usage on schema auth to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;
 create table public.clubs(id uuid primary key);
 create table public.mandates(id uuid primary key, club_id uuid references public.clubs(id));
 ${base.slice(base.indexOf('create table if not exists public.organizations'),base.indexOf('create table if not exists public.dossier_offers'))}
 ${identity.slice(identity.indexOf('create or replace function public.is_internal_operator'),identity.indexOf('alter table public.club_invitations'))}
 alter table public.club_briefs enable row level security;
 ${base.slice(base.indexOf('create policy "Brief participants can view club briefs"'),base.indexOf('create policy "Offer participants can view dossier offers"'))}
 grant select, insert, update on public.club_briefs to authenticated;
 grant select on public.organizations, public.organization_memberships, public.mandates to authenticated;
 insert into auth.users values ${Object.values(users).map(id=>`('${id}')`).join(',')};
 insert into public.clubs values ('${club}'),('${otherClub}');
 insert into public.organizations(id,name,slug,organization_type,club_id,created_by) values
 ('${club}','Club','club','club','${club}','${users.director}'),
 ('${otherClub}','Other club','other-club','club','${otherClub}','${users.other}'),
 ('${service}','Gaffa','gaffa','internal',null,'${users.analyst}'),
 ('${otherService}','Other service','other-service','internal',null,'${users.otherAnalyst}'),
 ('${coachOrg}','Coach','coach','coach_business',null,'${users.coach}');
 insert into public.organization_memberships(organization_id,user_id,role) values
 ('${club}','${users.director}','club_director'), ('${club}','${users.viewer}','club_viewer'),
 ('${service}','${users.analyst}','analyst'), ('${otherClub}','${users.other}','club_director'),
 ('${otherService}','${users.otherAnalyst}','analyst'), ('${coachOrg}','${users.coach}','coach');
 insert into public.mandates values ('${mandateId}','${club}');
 insert into public.club_briefs(id,buyer_organization_id,service_organization_id,club_id,created_by,title,role_title,status,budget_parameters) values
 ('${briefId}','${club}','${service}','${club}','${users.director}','Head coach appointment','Head Coach','submitted','Original budget');
`)
await db.exec(migration)
let tests = 0
async function as(name) { await db.exec(`reset role; set role ${name === 'anon' ? 'anon' : 'authenticated'}; set request.jwt.claim.sub = '${users[name] ?? ''}';`) }
async function pass(name, fn) { await fn(); tests++; console.log('PASS',name) }
async function rejected(sql, params=[]) { await assert.rejects(db.query(sql, params)) }
const insert = (changes,version=1,reason='Board changed requirements') => db.query(`insert into public.club_brief_amendments(brief_id,base_version,changes,request_reason) values ($1,$2,$3,$4) returning *`,[briefId,version,JSON.stringify(changes),reason])
let firstId
await as('director')
await pass('cannot amend an unlinked brief',()=>assert.rejects(insert({budget_parameters:'New budget'})))
await pass('club cannot self-agree a brief through the data API',()=>rejected(`update club_briefs set linked_mandate_id='${mandateId}', status='converted' where id='${briefId}'`))
await as('analyst')
await pass('responsible analyst can link same-club brief',()=>db.exec(`update club_briefs set linked_mandate_id='${mandateId}', status='converted' where id='${briefId}'`))
for (const user of ['director','analyst']) {
 await as(user)
 await pass(`${user} cannot overwrite agreed wording directly`,()=>rejected(`update club_briefs set budget_parameters='Hidden overwrite' where id='${briefId}'`))
}
await as('director')
await pass('director cannot inject accepted status or snapshot metadata',()=>rejected(`insert into club_brief_amendments(brief_id,base_version,changes,request_reason,status,before_snapshot) values ('${briefId}',1,'{"budget_parameters":"X"}','Reason','accepted','{}')`))
await pass('unknown and identity fields rejected',()=>assert.rejects(insert({service_organization_id:otherService})))
await pass('nested JSON rejected',()=>assert.rejects(insert({budget_parameters:{unsafe:'shape'}})))
await pass('empty title rejected',()=>assert.rejects(insert({title:''})))
await pass('oversized field rejected',()=>assert.rejects(insert({budget_parameters:'x'.repeat(12001)})))
await pass('empty reason rejected',()=>assert.rejects(insert({budget_parameters:'New'},1,' ')))
await pass('unchanged proposal rejected',()=>assert.rejects(insert({budget_parameters:'Original budget'})))
await pass('stale version rejected',()=>assert.rejects(insert({budget_parameters:'New'},2)))
await pass('request snapshots current version and actor',async()=>{
 const {rows:[row]}=await insert({budget_parameters:'New budget',location_requirements:'UK based'})
 firstId=row.id
 assert.equal(row.before_snapshot.budget_parameters,'Original budget')
 assert.equal(row.after_snapshot.budget_parameters,'New budget')
 assert.equal(row.after_snapshot.title,'Head coach appointment')
 assert.equal(row.requested_by,users.director)
 assert.equal(row.status,'pending')
 assert.equal(row.accepted_version,null)
})
await pass('duplicate pending request rejected',()=>assert.rejects(insert({title:'Another title'})))
await pass('club cannot approve own request',async()=>{
 const {rows}=await db.query(`update club_brief_amendments set status='accepted',decision_note='yes',next_action='Review criteria' where id=$1 returning id`,[firstId])
 assert.equal(rows.length,0)
})
for (const user of ['other','otherAnalyst','coach','anon']) {
 await as(user)
 await pass(`${user} cannot read amendment history`,async()=>{
  if(user==='anon') return rejected('select * from club_brief_amendments')
  assert.equal((await db.query('select * from club_brief_amendments')).rows.length,0)
 })
 await pass(`${user} cannot create requests for another club`,()=>assert.rejects(insert({title:'Attack'})))
}
await as('viewer')
await pass('club viewer can read history',async()=>assert.equal((await db.query('select * from club_brief_amendments')).rows.length,1))
await pass('club viewer cannot request changes',()=>assert.rejects(insert({title:'Viewer edit'})))
await as('analyst')
await pass('analyst cannot rewrite club proposal',()=>rejected(`update club_brief_amendments set changes='{}' where id=$1`,[firstId]))
await pass('decision requires reason and next action',()=>rejected(`update club_brief_amendments set status='accepted',decision_note=' ',next_action='Review' where id=$1`,[firstId]))
await pass('acceptance creates version two with reviewer and original unchanged',async()=>{
 const {rows:[row]}=await db.query(`update club_brief_amendments set status='accepted',decision_note='Agreed with director',next_action='Analyst: review financial fit before issuing packs' where id=$1 returning *`,[firstId])
 assert.equal(row.accepted_version,2);assert.equal(row.reviewed_by,users.analyst);assert.ok(row.reviewed_at)
 assert.equal((await db.query('select budget_parameters from club_briefs')).rows[0].budget_parameters,'Original budget')
})
await pass('accepted decision is immutable',async()=>{
 assert.equal((await db.query(`update club_brief_amendments set status='declined',decision_note='Rewrite',next_action='None' where id=$1 returning id`,[firstId])).rows.length,0)
})
await pass('history cannot be deleted',()=>rejected('delete from club_brief_amendments'))
await as('director')
await pass('stale form after acceptance cannot create a request',()=>assert.rejects(insert({title:'Stale'})))
let declineId
await pass('second request starts from accepted snapshot',async()=>{
 const {rows:[row]}=await insert({location_requirements:null},2)
 declineId=row.id
 assert.equal(row.before_snapshot.budget_parameters,'New budget');assert.equal(row.before_snapshot.location_requirements,'UK based')
 assert.equal(row.after_snapshot.location_requirements,null)
})
await as('analyst')
await pass('decline leaves accepted version at two',async()=>{
 await db.query(`update club_brief_amendments set status='declined',decision_note='Retain agreed location',next_action='Director: clarify relocation options' where id=$1`,[declineId])
 assert.equal((await db.query(`select max(accepted_version) as version from club_brief_amendments`)).rows[0].version,2)
})
await as('director')
let thirdId
await pass('request after decline still starts from version two',async()=>{
 const {rows:[row]}=await insert({availability_timeline:'October'},2);thirdId=row.id
 assert.equal(row.before_snapshot.location_requirements,'UK based')
})
await as('analyst')
await pass('third accepted version keeps previous accepted changes',async()=>{
 const {rows:[row]}=await db.query(`update club_brief_amendments set status='accepted',decision_note='Timing agreed',next_action='Analyst: revisit availability' where id=$1 returning *`,[thirdId])
 assert.equal(row.accepted_version,3); assert.equal(row.after_snapshot.budget_parameters,'New budget');assert.equal(row.after_snapshot.availability_timeline,'October')
})
await db.exec(`reset role; update organization_memberships set status='revoked' where user_id='${users.director}';`)
await as('director')
await pass('revoked member cannot read history',async()=>assert.equal((await db.query('select * from club_brief_amendments')).rows.length,0))
await pass('revoked member cannot submit',()=>assert.rejects(insert({title:'Revoked'},3)))
await db.exec('reset role')
await pass('no definer functions added and table has RLS',async()=>{
 const {rows}=await db.query(`select prosecdef from pg_proc join pg_namespace n on n.oid=pronamespace where n.nspname='private'`)
 assert.ok(rows.every(row=>!row.prosecdef))
 assert.equal((await db.query(`select relrowsecurity from pg_class where relname='club_brief_amendments'`)).rows[0].relrowsecurity,true)
})
console.log(`${tests} PostgreSQL amendment checks passed`)
await db.close()
