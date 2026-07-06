import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canAssessCandidate, type AssessmentAccessClient } from './access.ts'
import {
  ASSESSMENT_CRITERIA,
  EVIDENCE_METHODS,
  ASSESSMENT_STATUSES,
  VERIFICATION_STATUSES,
  RECOMMENDATION_VERDICTS,
} from './criteria.ts'

// Minimal stub matching the query chain canAssessCandidate uses. Each table
// resolves to a preset { data } so we can simulate mandate ownership and
// shortlist membership independently.
function stubClient(results: Record<string, unknown>): AssessmentAccessClient {
  return {
    from(table: string) {
      const chain = {
        eq() {
          return chain
        },
        async maybeSingle() {
          return { data: results[table] ?? null }
        },
      }
      return { select: () => chain }
    },
  }
}

test('canAssessCandidate: true only when mandate is owned AND coach is shortlisted', async () => {
  const client = stubClient({ mandates: { id: 'm1' }, mandate_shortlist: { coach_id: 'c1' } })
  assert.equal(await canAssessCandidate(client, 'u1', 'm1', 'c1'), true)
})

test('canAssessCandidate: false when coach is owned but not shortlisted', async () => {
  const client = stubClient({ mandates: { id: 'm1' }, mandate_shortlist: null })
  assert.equal(await canAssessCandidate(client, 'u1', 'm1', 'c1'), false)
})

test('canAssessCandidate: false when mandate is not owned', async () => {
  const client = stubClient({ mandates: null, mandate_shortlist: { coach_id: 'c1' } })
  assert.equal(await canAssessCandidate(client, 'u1', 'm1', 'c1'), false)
})

test('canAssessCandidate: false on missing identifiers', async () => {
  const client = stubClient({ mandates: { id: 'm1' }, mandate_shortlist: { coach_id: 'c1' } })
  assert.equal(await canAssessCandidate(client, '', 'm1', 'c1'), false)
  assert.equal(await canAssessCandidate(client, 'u1', '', 'c1'), false)
  assert.equal(await canAssessCandidate(client, 'u1', 'm1', ''), false)
})

// These enum sets are what the server actions validate against and what the DB
// CHECK constraints enforce — lock them so drift breaks the build, not the demo.
test('assessment enums match the methodology and reject unknowns', () => {
  assert.deepEqual(
    ASSESSMENT_CRITERIA.map((c) => c.key),
    [
      'coach_profile', 'performance_impact', 'tactical_proposal', 'match_management',
      'training_management', 'players_development', 'media_comms', 'personality_profile',
      'cultural_org_fit',
    ]
  )
  assert.equal(EVIDENCE_METHODS.length, 8)
  assert.deepEqual(
    EVIDENCE_METHODS.map((m) => m.key),
    [
      'desktop_research', 'data_analysis', 'ai_generated', 'media_review',
      'match_analysis', 'training_observation', 'candidate_interview', 'references',
    ]
  )
  assert.deepEqual([...ASSESSMENT_STATUSES], ['not_started', 'in_progress', 'complete'])
  assert.deepEqual([...VERIFICATION_STATUSES], ['unverified', 'verified', 'disputed'])
  assert.deepEqual([...RECOMMENDATION_VERDICTS], ['Proceed', 'Shortlist', 'Target', 'Monitor', 'Dismiss'])

  const criterionKeys = ASSESSMENT_CRITERIA.map((c) => c.key as string)
  assert.equal(criterionKeys.includes('bogus'), false)
  assert.equal((RECOMMENDATION_VERDICTS as readonly string[]).includes('Hire'), false)
})
