import assert from 'node:assert/strict'
import { test } from 'node:test'
import { declarationReviewLabel, deriveMaterialStatus, submissionQueueRank, summarizeMaterials } from './material-status.ts'

const uploaded = { storage_path: 'coach/private/file.pdf', upload_status: 'uploaded', verification_status: 'verified', confidentiality_status: 'available' }

test('verified available metadata never counts as an uploaded or reviewed file', () => {
  const metadata = { verification_status: 'verified', confidentiality_status: 'available' }
  const status = deriveMaterialStatus(metadata)
  assert.equal(status.uploaded, false)
  assert.equal(status.reviewedUpload, false)
  assert.equal(status.canReview, false)
  assert.equal(status.label, 'Description only - no file uploaded')
  assert.equal(summarizeMaterials([metadata]).reviewedUploads, 0)
})

test('illustrative entries cannot become real files through legacy upload and verification flags', () => {
  const example = { ...uploaded, description: 'Illustrative metadata only; no real coach file' }
  assert.equal(deriveMaterialStatus(example).uploaded, false)
  assert.equal(deriveMaterialStatus(example).reviewedUpload, false)
  assert.equal(deriveMaterialStatus(example).canReview, false)
  assert.equal(summarizeMaterials([example]).illustrative, 1)
})

test('external links and incomplete uploads stay separate from completed file uploads', () => {
  for (const row of [{ ...uploaded, upload_status: 'pending' }, { ...uploaded, upload_status: 'failed' }, { ...uploaded, storage_path: ' ' }, { external_url: 'https://example.com/deck', verification_status: 'verified' }]) {
    assert.equal(deriveMaterialStatus(row).uploaded, false)
    assert.equal(deriveMaterialStatus(row).reviewedUpload, false)
  }
  assert.equal(deriveMaterialStatus({ external_url: 'https://example.com/deck' }).canReview, true)
})

test('reviewed uploads do not authorize release and disputed files remain unreviewed', () => {
  assert.equal(deriveMaterialStatus(uploaded).reviewedUpload, true)
  assert.match(deriveMaterialStatus(uploaded).releaseLabel, /Needs separate permission/)
  assert.equal(deriveMaterialStatus({ ...uploaded, verification_status: 'disputed' }).reviewedUpload, false)
  assert.equal(deriveMaterialStatus({ ...uploaded, confidentiality_status: 'withheld' }).releaseLabel, 'Withheld from release')
})

test('declaration approval is distinct from example completeness and file review', () => {
  assert.equal(declarationReviewLabel({ portal_status: 'approved' }), 'Declaration review recorded')
  const example = { portal_status: 'approved', football_identity: 'Illustrative profile' }
  assert.match(declarationReviewLabel(example), /Illustrative declaration/)
  assert.equal(declarationReviewLabel(null), 'Not invited')
})

test('newly submitted and needs-update records precede reviewed records and invitation controls', () => {
  const statuses = ['approved', 'invited', 'needs_update', 'in_review', 'submitted']
  assert.deepEqual(statuses.sort((a, b) => submissionQueueRank(a) - submissionQueueRank(b)), ['submitted', 'needs_update', 'in_review', 'approved', 'invited'])
})
