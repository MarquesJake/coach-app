import { deepDiveFor, finalEvaluationFor } from '../assessment/deep-dive'

/** Confirms seeded assessment provenance only; never infers a fictional invoice. */
export function hasSeededDossierAssessment(mandateId: string | null | undefined, coachId: string | null | undefined): boolean {
  return Boolean(mandateId && coachId && deepDiveFor(coachId, mandateId) && finalEvaluationFor(mandateId, coachId))
}
