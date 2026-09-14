import test from 'node:test'
import assert from 'node:assert/strict'
import { candidateProgressLabels } from './candidate-progress.ts'

const complete = {
  recordedCount: 9, reviewedCount: 9, totalCriteria: 9,
  recordedLabel: '9/9 recorded assessments',
  reviewedLabel: '9/9 criteria with reviewed evidence',
  nextAction: 'Ready for the board — check the conditions and who can see it before sharing.',
}

test('complete demo dossier retains counts but cannot claim reviewed evidence or board readiness', () => {
  const labels = candidateProgressLabels(complete, true)
  assert.match(labels.progress_label, /9\/9 demo assessment entries/)
  assert.match(labels.progress_label, /9\/9 demo criteria examples/)
  assert.doesNotMatch(labels.progress_label, /with reviewed evidence|recorded assessments/)
  assert.doesNotMatch(labels.next_action, /Ready for the board/)
  assert.match(labels.next_action, /Replace demo criteria/)
})

test('non-demo progress and next action stay unchanged', () => {
  assert.deepEqual(candidateProgressLabels(complete, false), {
    progress_label: `${complete.recordedLabel} · ${complete.reviewedLabel}`,
    next_action: complete.nextAction,
  })
})

test('empty demo criteria remain visible without inventing coverage', () => {
  const labels = candidateProgressLabels({ ...complete, recordedCount: 0, reviewedCount: 0 }, true)
  assert.match(labels.progress_label, /0\/9 demo assessment entries/)
  assert.match(labels.progress_label, /0\/9 demo criteria examples/)
})
