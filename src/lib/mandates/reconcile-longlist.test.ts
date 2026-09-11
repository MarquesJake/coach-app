import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reconcileGeneratedLonglist } from './reconcile-longlist.ts'
import { appointmentWriteFixture } from '../testing/appointment-write-fixture.ts'

function fixture() {
  return appointmentWriteFixture({
    mandate_longlist: [
      { id: 'old', mandate_id: 'mandate', coach_id: 'excluded', ranking_score: 88, fit_explanation: 'Old recommendation' },
      { id: 'kept', mandate_id: 'mandate', coach_id: 'viable', ranking_score: 60, fit_explanation: 'Old score' },
      { id: 'other', mandate_id: 'another-mandate', coach_id: 'excluded', ranking_score: 90, fit_explanation: 'Other mandate' },
    ],
    mandate_shortlist: [{ mandate_id: 'mandate', coach_id: 'excluded', candidate_stage: 'Interview' }],
  })
}

const generated = [{ coach_id: 'viable', ranking_score: 75, fit_explanation: 'Current evidence' }]

test('regeneration removes stale exclusions, updates viable rankings, and preserves other mandates and the pipeline', async () => {
  const db = fixture()
  const result = await reconcileGeneratedLonglist(db.client, 'mandate', generated, ['excluded'])
  assert.equal(result.error, null)
  assert.deepEqual(result.data?.map((row) => [row.coach_id, row.ranking_score]), [['viable', 75]])
  assert.equal(db.rows.mandate_longlist.find((row) => row.id === 'other')?.ranking_score, 90)
  assert.equal(db.rows.mandate_shortlist[0].candidate_stage, 'Interview')
  assert.deepEqual(db.requests.map((request) => request.method), ['DELETE', 'POST', 'GET'])
})

test('an all-excluded generation clears the current mandate even when there are no rows to upsert', async () => {
  const db = fixture()
  const result = await reconcileGeneratedLonglist(db.client, 'mandate', [], ['excluded', 'viable'])
  assert.equal(result.error, null)
  assert.deepEqual(result.data, [])
  assert.equal(db.rows.mandate_longlist.length, 1)
  assert.equal(db.rows.mandate_longlist[0].mandate_id, 'another-mandate')
})

test('a later eligible generation can reintroduce a previously excluded candidate', async () => {
  const db = fixture()
  await reconcileGeneratedLonglist(db.client, 'mandate', generated, ['excluded'])
  const restored = [...generated, { coach_id: 'excluded', ranking_score: 92, fit_explanation: 'Availability confirmed' }]
  const result = await reconcileGeneratedLonglist(db.client, 'mandate', restored, [])
  assert.equal(result.error, null)
  assert.equal(result.data?.[0].ranking_score, 92)
})

for (const method of ['DELETE', 'POST', 'GET']) {
  test(`${method} failure is reported rather than returning stale rankings as success`, async () => {
    const db = fixture()
    db.controls.failMethod = method
    const result = await reconcileGeneratedLonglist(db.client, 'mandate', generated, ['excluded'])
    assert.equal(result.data, null)
    assert.ok(result.error)
    assert.equal(db.requests.at(-1)?.method, method)
  })
}

test('a silently ineffective deletion is detected on readback', async () => {
  const db = fixture()
  db.controls.skipDelete = true
  const result = await reconcileGeneratedLonglist(db.client, 'mandate', generated, ['excluded'])
  assert.equal(result.data, null)
  assert.match(result.error!, /Excluded candidates remain/)
})

test('contradictory generated and excluded sets cause no writes', async () => {
  const db = fixture()
  const result = await reconcileGeneratedLonglist(db.client, 'mandate', generated, ['viable'])
  assert.ok(result.error)
  assert.equal(db.requests.length, 0)
})
