import assert from 'node:assert/strict'
import test from 'node:test'

import { summarizeDecisionCoverage } from './decision-coverage.ts'

test('decision coverage is board-ready when every candidate has complete recorded work', () => {
  const summary = summarizeDecisionCoverage([
    { evidenceCoverageCount: 9, assessmentCompleteCount: 9, recommendationVerdict: 'Proceed' },
    { evidenceCoverageCount: 10, assessmentCompleteCount: 9, recommendationVerdict: 'Hold' },
  ])

  assert.deepEqual(summary, {
    candidateCount: 2,
    evidenceReadyCount: 2,
    fullyAssessedCount: 2,
    verdictCount: 2,
    status: 'board_ready',
  })
})

test('decision coverage stays developing when any recorded-work dimension is incomplete', () => {
  const summary = summarizeDecisionCoverage([
    { evidenceCoverageCount: 9, assessmentCompleteCount: 9, recommendationVerdict: 'Proceed' },
    { evidenceCoverageCount: 8, assessmentCompleteCount: 9, recommendationVerdict: null },
  ])

  assert.equal(summary.evidenceReadyCount, 1)
  assert.equal(summary.fullyAssessedCount, 2)
  assert.equal(summary.verdictCount, 1)
  assert.equal(summary.status, 'developing')
})

test('decision coverage reports an empty decision set without claiming readiness', () => {
  assert.deepEqual(summarizeDecisionCoverage([]), {
    candidateCount: 0,
    evidenceReadyCount: 0,
    fullyAssessedCount: 0,
    verdictCount: 0,
    status: 'empty',
  })
})

test('decision coverage supports a different criterion target', () => {
  const summary = summarizeDecisionCoverage(
    [{ evidenceCoverageCount: 7, assessmentCompleteCount: 7, recommendationVerdict: 'Proceed' }],
    7
  )

  assert.equal(summary.status, 'board_ready')
})
