import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createOperationsItem,
  filterOperationsItems,
  operationsCounts,
  operationsToday,
  sortOperationsItems,
  type OperationsItemInput,
} from './desk.ts'

const base: OperationsItemInput = {
  id: 'item-1',
  recordId: 'record-1',
  kind: 'mandate_action',
  lane: 'mandates',
  title: 'Confirm appointment terms',
  detail: 'Contract, compensation and staff package',
  context: 'West Ham',
  owner: 'Jake',
  href: '/mandates/1/plan',
  dueAt: null,
  priority: 'normal',
  provenance: 'internal_work',
  canComplete: true,
}

test('blocked work ranks before overdue and review work', () => {
  const today = '2026-07-17'
  const items = [
    createOperationsItem({ ...base, id: 'review', lane: 'review', kind: 'finding_review', review: true }, today),
    createOperationsItem({ ...base, id: 'overdue', dueAt: '2026-07-16' }, today),
    createOperationsItem({ ...base, id: 'blocked', blocked: true }, today),
  ]
  assert.deepEqual(sortOperationsItems(items).map((item) => item.id), ['blocked', 'overdue', 'review'])
})

test('source filtering includes agent and independent follow-ups only', () => {
  const items = [
    createOperationsItem({ ...base, id: 'mandate' }),
    createOperationsItem({
      ...base,
      id: 'agent',
      kind: 'agent_follow_up',
      lane: 'sources',
      provenance: 'agent_supplied',
    }),
    createOperationsItem({
      ...base,
      id: 'contact',
      kind: 'source_follow_up',
      lane: 'sources',
      provenance: 'independent_source',
    }),
  ]
  assert.deepEqual(filterOperationsItems(items, 'sources').map((item) => item.id), ['agent', 'contact'])
})

test('counts keep review, source and release work distinct', () => {
  const items = [
    createOperationsItem({ ...base, id: 'today', dueAt: '2026-07-17' }, '2026-07-17'),
    createOperationsItem({ ...base, id: 'review', lane: 'review', kind: 'finding_review', review: true }),
    createOperationsItem({ ...base, id: 'source', lane: 'sources', kind: 'source_follow_up' }),
    createOperationsItem({ ...base, id: 'release', lane: 'releases', kind: 'dossier_release' }),
  ]
  assert.deepEqual(operationsCounts(items), {
    attention: 2,
    overdue: 0,
    review: 1,
    sources: 1,
    releases: 1,
  })
})

test('the desk day follows London time around the UTC boundary', () => {
  assert.equal(operationsToday(new Date('2026-07-16T23:30:00.000Z')), '2026-07-17')
})
