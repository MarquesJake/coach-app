import test from 'node:test'
import assert from 'node:assert/strict'
import { appointmentWriteFixture } from '../testing/appointment-write-fixture.ts'
import { moveMandateRecord, deleteMandateRecord } from './board-mutations.ts'

function fixture(stage: string | null = 'identified') {
  return appointmentWriteFixture({ mandates: [{ id: 'run', pipeline_stage: stage }], coach_research_questions: [], club_briefs: [], confidential_access_requests: [], dossier_offers: [], dossier_orders: [] })
}

test('moves forward, backwards and across stages with the expected source stage', async () => {
  const db = fixture()
  assert.deepEqual(await moveMandateRecord(db.client, 'run', 'interviews', 'identified'), {})
  assert.equal(db.rows.mandates[0].pipeline_stage, 'interviews')
  assert.deepEqual(await moveMandateRecord(db.client, 'run', 'board_approved', 'interviews'), {})
  assert.equal(db.rows.mandates[0].pipeline_stage, 'board_approved')
})
test('rejects an unknown stage without writing identified as a fallback', async () => {
  const db = fixture('interviews')
  assert.ok((await moveMandateRecord(db.client, 'run', 'nonsense', 'interviews')).error)
  assert.equal(db.requests.length, 0)
})
test('concurrent stage change is not overwritten', async () => {
  const db = fixture()
  db.controls.beforeWrite = () => { db.rows.mandates[0].pipeline_stage = 'offer' }
  assert.match((await moveMandateRecord(db.client, 'run', 'interviews', 'identified')).error!, /changed/)
  assert.equal(db.rows.mandates[0].pipeline_stage, 'offer')
})
test('null legacy stages can move, but missing rows and denied writes cannot report success', async () => {
  const db = fixture(null)
  assert.deepEqual(await moveMandateRecord(db.client, 'run', 'shortlisting', null), {})
  assert.ok((await moveMandateRecord(db.client, 'missing', 'offer', 'identified')).error)
  db.controls.failMethod = 'PATCH'
  assert.ok((await moveMandateRecord(db.client, 'run', 'offer', 'shortlisting')).error)
  assert.equal(db.rows.mandates[0].pipeline_stage, 'shortlisting')
})
test('unlinked run can be deleted', async () => {
  const db = fixture()
  assert.deepEqual(await deleteMandateRecord(db.client, 'run'), { ok: true })
  assert.equal(db.rows.mandates.length, 0)
})
test('each protected relationship prevents any DELETE request', async () => {
  for (const table of ['coach_research_questions', 'club_briefs', 'confidential_access_requests', 'dossier_offers', 'dossier_orders']) {
    const db = fixture()
    db.rows[table].push({ id: 'linked', [table === 'club_briefs' ? 'linked_mandate_id' : 'mandate_id']: 'run' })
    const result = await deleteMandateRecord(db.client, 'run')
    assert.equal(result.ok, false)
    assert.equal(db.rows.mandates.length, 1)
    assert.ok(!db.requests.some(r => r.method === 'DELETE'))
  }
})
test('failed preflight, denied deletion and missing mandate are not success', async () => {
  const db = fixture()
  db.controls.failMethod = 'GET'
  assert.equal((await deleteMandateRecord(db.client, 'run')).ok, false)
  assert.ok(!db.requests.some(r => r.method === 'DELETE'))
  db.controls.failMethod = 'DELETE'
  assert.equal((await deleteMandateRecord(db.client, 'run')).ok, false)
  assert.equal(db.rows.mandates.length, 1)
  db.controls.failMethod = ''
  assert.equal((await deleteMandateRecord(db.client, 'missing')).ok, false)
})
