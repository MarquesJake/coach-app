import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canPublishRecommendation, isIllustrativeEvidence, isVerifiedEvidence } from './evidence-integrity.ts'

test('legacy verified flags cannot authenticate invented evidence', () => {
  for (const text of ['Illustrative composite reference', 'Synthetic interview answer', 'Demo data - metadata only; no real coach file', 'Invented for product testing']) {
    const row = { verification_status: 'verified', source: text }
    assert.equal(isIllustrativeEvidence(row), true)
    assert.equal(isVerifiedEvidence(row), false)
  }
})

test('source-backed evidence keeps its actual review state', () => {
  assert.equal(isVerifiedEvidence({ verification_status: 'verified' }), true)
  assert.equal(isVerifiedEvidence({ verification_status: 'unverified' }), false)
  assert.equal(isIllustrativeEvidence({ source: 'Official club appointment announcement' }), false)
  assert.equal(isIllustrativeEvidence({ name: 'Demo Person', metadata: 'synthetic' }), false)
})

test('null and missing fields are safe and markers are case insensitive', () => {
  assert.equal(isIllustrativeEvidence({ answer: null }), false)
  assert.equal(isIllustrativeEvidence({ answer: 'ILLUSTRATIVE ONLY' }), true)
  assert.equal(isIllustrativeEvidence({ answer: 'This is not a real quote' }), true)
})

test('publication requires a complete recommendation and rejects illustrative provenance', () => {
  const recommendation = { verdict: 'Recommended', summary: 'Recorded analyst judgement.' }
  assert.equal(canPublishRecommendation({}, recommendation), true)
  assert.equal(canPublishRecommendation(null, recommendation), false)
  assert.equal(canPublishRecommendation({}, null), false)
  assert.equal(canPublishRecommendation({}, { ...recommendation, summary: ' ' }), false)
  assert.equal(canPublishRecommendation({}, { ...recommendation, verdict: null }), false)
  assert.equal(canPublishRecommendation({ compliance_notes: 'Illustrative data' }, recommendation), false)
  assert.equal(canPublishRecommendation({}, { ...recommendation, summary: 'Synthetic assessment' }), false)
})

test('published snapshot corrections are visibly classified as illustrative', () => {
  assert.equal(isIllustrativeEvidence({ preview_summary: 'Illustrative appointment scenario, not a real recommendation.' }), true)
})
