import test from 'node:test'
import assert from 'node:assert/strict'
import { effectiveBrief, amendmentChanges, parseAmendmentForm, briefSnapshot, type BriefAmendment } from './brief-amendments.ts'

const original = { title: 'Appointment brief', role_title: 'Head Coach', budget_parameters: 'Original budget' }
function amendment(status: string, version: number | null, snapshot: unknown): BriefAmendment {
  return { status, accepted_version: version, after_snapshot: snapshot } as BriefAmendment
}

test('pending and declined requests cannot change agreed wording', () => {
  const result = effectiveBrief(original, [amendment('pending', null, { title: 'Pending' }), amendment('declined', null, { title: 'Declined' })])
  assert.equal(result.version, 1)
  assert.equal(result.snapshot.title, original.title)
})

test('latest accepted version wins regardless of query ordering', () => {
  const rows = [amendment('accepted', 3, { ...original, budget_parameters: 'Third' }), amendment('accepted', 2, { ...original, budget_parameters: 'Second' })]
  for (const input of [rows, [...rows].reverse()]) {
    assert.equal(effectiveBrief(original, input).version, 3)
    assert.equal(effectiveBrief(original, input).snapshot.budget_parameters, 'Third')
  }
})

test('diff distinguishes removed wording and ignores identity and private metadata', () => {
  const changes = amendmentChanges({ ...original, service_organization_id: 'first' }, { ...original, budget_parameters: null, service_organization_id: 'second' })
  assert.deepEqual(changes, [{ key: 'budget_parameters', label: 'Financial parameters', before: 'Original budget', after: null }])
  assert.ok(!('service_organization_id' in briefSnapshot({ service_organization_id: 'secret' })))
})

function form() {
  const data = new FormData()
  data.set('base_version', '2')
  data.set('request_reason', 'Board revised the budget')
  data.append('changed_fields', 'budget_parameters')
  data.set('budget_parameters', ' Updated budget ')
  data.set('title', 'Unselected title must not be changed')
  return data
}

test('request sends only explicitly selected fields and trims wording', () => {
  assert.deepEqual(parseAmendmentForm(form()), { baseVersion: 2, reason: 'Board revised the budget', changes: { budget_parameters: 'Updated budget' } })
})

test('optional field removal is explicit null', () => {
  const data = form(); data.set('budget_parameters', '  ')
  assert.deepEqual(parseAmendmentForm(data).changes, { budget_parameters: null })
})

test('missing selection, identity injection, empty reason and invalid versions fail', () => {
  for (const mutate of [
    (data: FormData) => data.delete('changed_fields'),
    (data: FormData) => data.append('changed_fields', 'buyer_organization_id'),
    (data: FormData) => data.set('request_reason', ' '),
    (data: FormData) => data.set('base_version', '1.2'),
    (data: FormData) => data.set('base_version', '0'),
    (data: FormData) => data.set('budget_parameters', 'x'.repeat(12001)),
    (data: FormData) => { data.append('changed_fields', 'role_title'); data.set('role_title', '') },
  ]) {
    const data = form(); mutate(data); assert.throws(() => parseAmendmentForm(data))
  }
})
