import assert from 'node:assert/strict'
import { test } from 'node:test'
import { updateEditableClubBrief } from './brief-lifecycle.ts'
import { appointmentWriteFixture } from '../testing/appointment-write-fixture.ts'

function fixture(status = 'draft', linkedMandateId: string | null = null) {
  return appointmentWriteFixture({ club_briefs: [{
    id: 'brief', buyer_organization_id: 'club', status, linked_mandate_id: linkedMandateId,
    budget_parameters: 'Agreed budget', submitted_at: '2026-09-01T10:00:00Z',
  }] })
}

const revision = { status: 'draft', budget_parameters: 'Changed budget', submitted_at: null }

test('converted brief refuses both save and resubmission without changing wording or timestamps', async () => {
  for (const status of ['draft', 'submitted']) {
    const db = fixture('converted', 'mandate')
    const original = structuredClone(db.rows.club_briefs)
    const result = await updateEditableClubBrief(db.client, 'brief', 'club', { ...revision, status })
    assert.match(result.error!, /already agreed or linked/)
    assert.match(result.error!, /Contact Gaffa to arrange an amendment/)
    assert.deepEqual(db.rows.club_briefs, original)
  }
})

test('either a converted status or a mandate link independently blocks overwriting', async () => {
  for (const db of [fixture('converted'), fixture('draft', 'mandate'), fixture('submitted', 'mandate')]) {
    const original = structuredClone(db.rows.club_briefs)
    const result = await updateEditableClubBrief(db.client, 'brief', 'club', revision)
    assert.ok(result.error)
    assert.deepEqual(db.rows.club_briefs, original)
  }
})

test('conversion after the form was loaded is protected by the write predicate', async () => {
  const db = fixture()
  db.controls.beforeWrite = () => {
    db.rows.club_briefs[0].status = 'converted'
    db.rows.club_briefs[0].linked_mandate_id = 'mandate'
  }
  const result = await updateEditableClubBrief(db.client, 'brief', 'club', revision)
  assert.ok(result.error)
  assert.equal(db.rows.club_briefs[0].budget_parameters, 'Agreed budget')
  assert.equal(db.rows.club_briefs[0].status, 'converted')
})

test('unlinked drafts and submissions remain editable', async () => {
  for (const status of ['draft', 'submitted', 'in_review']) {
    const db = fixture(status)
    const result = await updateEditableClubBrief(db.client, 'brief', 'club', revision)
    assert.equal(result.error, null)
    assert.equal(db.rows.club_briefs[0].budget_parameters, 'Changed budget')
  }
})

test('missing or wrong-club brief cannot report success', async () => {
  for (const [briefId, organizationId] of [['missing', 'club'], ['brief', 'other-club']]) {
    const db = fixture()
    const result = await updateEditableClubBrief(db.client, briefId, organizationId, revision)
    assert.ok(result.error)
    assert.equal(db.rows.club_briefs[0].budget_parameters, 'Agreed budget')
  }
})

test('write errors refuse the save', async () => {
  const db = fixture()
  db.controls.failMethod = 'PATCH'
  const result = await updateEditableClubBrief(db.client, 'brief', 'club', revision)
  assert.match(result.error!, /could not be saved/)
  assert.equal(db.rows.club_briefs[0].budget_parameters, 'Agreed budget')
})
