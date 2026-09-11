import assert from 'node:assert/strict'
import { test } from 'node:test'
import { briefClubName, createdMandateForBrief, createFromBriefHref, presentBriefHandoff } from './brief-presentation.ts'

test('intake uses the linked club when buyer organisation names are not visible', () => {
  assert.equal(briefClubName('Club board', 'Football club'), 'Club board')
  assert.equal(briefClubName(undefined, 'Football club'), 'Football club')
  assert.equal(briefClubName(' ', ' Football club '), 'Football club')
  assert.equal(briefClubName(null, null), 'Club identity unconfirmed')
})

test('linked submitted briefs and converted briefs both show the agreed version', () => {
  const linked = presentBriefHandoff({ status: 'submitted', linked_mandate_id: 'appointment' }, 3)
  assert.deepEqual(linked, presentBriefHandoff({ status: 'converted' }, 3))
  assert.equal(linked.label, 'Agreed version 3')
  assert.equal(linked.isAgreed, true)
})

test('pending amendments keep agreed wording in force and identify the next reviewer', () => {
  const state = presentBriefHandoff({ status: 'converted' }, 2, true)
  assert.equal(state.label, 'Agreed version 2')
  assert.equal(state.owner, 'Gaffa reviewer')
  assert.match(state.nextAction, /agreed wording remains in force/)
  assert.equal(presentBriefHandoff({ status: 'converted' }, null).label, 'Agreed - version unconfirmed')
})

test('submitted and draft states identify who acts next without implying agreement', () => {
  assert.equal(presentBriefHandoff({ status: 'submitted' }).isAgreed, false)
  assert.equal(presentBriefHandoff({ status: 'submitted' }).owner, 'Gaffa reviewer')
  assert.equal(presentBriefHandoff({ status: 'in_review' }).label, 'Under review')
  assert.equal(presentBriefHandoff({ status: 'draft' }).owner, 'Club director')
  assert.equal(presentBriefHandoff(null).label, 'Not started')
})

test('create-from-brief retains its source as one query parameter', () => {
  const url = new URL(createFromBriefHref('brief & role=coach'), 'https://gaffa.invalid')
  assert.equal(url.pathname, '/mandates/new')
  assert.deepEqual([...url.searchParams], [['brief_id', 'brief & role=coach']])
})

test('created mandate preselection requires this unlinked submitted brief and an open same-club mandate', () => {
  const brief = { id: 'brief-1', club_id: 'club-1', status: 'submitted', linked_mandate_id: null }
  const query = { brief_id: brief.id, created_mandate: 'mandate-1' }
  const mandate = { id: 'mandate-1', club_id: 'club-1', status: 'Active' }
  assert.equal(createdMandateForBrief(query, brief, [mandate]), mandate.id)
  assert.equal(presentBriefHandoff(brief).isAgreed, false)
  assert.equal(createdMandateForBrief({ ...query, brief_id: 'other' }, brief, [mandate]), '')
  assert.equal(createdMandateForBrief(query, { ...brief, club_id: null }, [mandate]), '')
  assert.equal(createdMandateForBrief(query, { ...brief, status: 'converted' }, [mandate]), '')
  assert.equal(createdMandateForBrief(query, { ...brief, linked_mandate_id: 'linked' }, [mandate]), '')
  assert.equal(createdMandateForBrief(query, brief, [{ ...mandate, club_id: 'other' }]), '')
  assert.equal(createdMandateForBrief(query, brief, [{ ...mandate, status: 'Completed' }]), '')
  assert.equal(createdMandateForBrief(query, brief, []), '')
})
