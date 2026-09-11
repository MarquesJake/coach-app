import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const db = new PGlite()
await db.exec(`
 create table mandates(id int primary key);
 create table club_briefs(id int primary key, linked_mandate_id int references mandates(id) on delete set null);
 create table confidential_access_requests(id int primary key, mandate_id int references mandates(id) on delete cascade);
 create table mandate_shortlist(id int primary key, mandate_id int references mandates(id) on delete cascade);
 insert into mandates values (1), (2), (3);
 insert into club_briefs values (1,1);
 insert into confidential_access_requests values (2,2);
 insert into mandate_shortlist values (1,1), (2,2), (3,3);
`)
await db.exec(readFileSync(new URL('../supabase/migrations/20260908171221_protect_mandate_cleanup_links.sql', import.meta.url), 'utf8'))
for (const [id, relation] of [[1,'club_briefs'],[2,'confidential_access_requests']]) {
 await assert.rejects(db.query('delete from mandates where id=$1',[id]),error=>error.code==='23503')
 assert.equal((await db.query('select id from mandates where id=$1',[id])).rows.length,1)
 assert.equal((await db.query(`select id from ${relation}`)).rows.length,1)
 assert.equal((await db.query('select id from mandate_shortlist where mandate_id=$1',[id])).rows.length,1)
 console.log(`PASS ${relation} prevents deletion and preserves mandate/shortlist`)
}
await db.query('delete from mandates where id=3')
assert.equal((await db.query('select id from mandates where id=3')).rows.length,0)
assert.equal((await db.query('select id from mandate_shortlist where mandate_id=3')).rows.length,0)
console.log('PASS unlinked run deletes with its internal shortlist')
await db.close()
