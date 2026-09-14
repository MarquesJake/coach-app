import test from 'node:test'
import assert from 'node:assert/strict'
import { reportDeskPresentation } from './report-desk-presentation.ts'
import { readFileSync } from 'node:fs'

const progress = {
  recordedCount: 9, reviewedCount: 9, totalCriteria: 9,
  recordedLabel: '9/9 recorded assessments', reviewedLabel: '9/9 criteria with reviewed evidence',
  recommendationLabel: 'Recorded recommendation: Proceed', confidence: 74,
  nextAction: 'Ready for the board',
}

test('complete demo dossier cannot advertise human recommendation or readiness', () => {
  const result = reportDeskPresentation(progress, true, false, true)
  assert.equal(result.canPresentRecommendation, false)
  assert.match(result.badge, /DEMO DATA/)
  assert.match(result.progress_label, /9\/9 demo criteria examples/)
  assert.doesNotMatch(result.next_action, /Ready for/)
  assert.match(result.summaryLabel, /Legacy saved text.*not current advice/)
})

test('incumbent benchmark stays contextual even with a recorded Proceed verdict', () => {
  const result = reportDeskPresentation(progress, false, true, true)
  assert.equal(result.canPresentRecommendation, false)
  assert.match(result.badge, /not a successor candidate/)
  assert.match(result.verdictLabel, /not a current recommendation/)
})

test('non-demo records retain existing presentation eligibility and progress', () => {
  const result = reportDeskPresentation(progress, false, false, true)
  assert.equal(result.canPresentRecommendation, true)
  assert.equal(result.next_action, progress.nextAction)
  assert.equal(reportDeskPresentation(progress, false, false, false).canPresentRecommendation, false)
})

test('report desk retains raw saved summary with explicit legacy label and blocks its publish form', () => {
  const page = readFileSync(new URL('../../app/(dashboard)/mandates/[id]/pack/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /deepDiveFor\(coachId, params.id\)/)
  assert.match(page, /isCurrentManagerBenchmark\(params.id, coachId\)/)
  assert.match(page, /const packReady = presentation.canPresentRecommendation/)
  assert.match(page, /presentation.summaryLabel/)
  assert.match(page, /presentation.legacy \|\| packReady \? recommendation.summary/)
  assert.doesNotMatch(page, /status\.nextAction|status\.recordedLabel|status\.reviewedLabel/)
})
