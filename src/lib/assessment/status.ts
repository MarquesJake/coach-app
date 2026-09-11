import { ASSESSMENT_CRITERIA } from './criteria.ts'
import { canPublishRecommendation, isIllustrativeEvidence, isVerifiedEvidence } from './evidence-integrity.ts'

type Assessment = { criterion: string; status: string; summary?: string | null }
type Evidence = {
  criterion: string; verification_status?: string | null
  title?: string | null; detail?: string | null; source?: string | null
}
type Recommendation = {
  verdict?: string | null; summary?: string | null; confidence?: number | null
  key_strengths?: string | null; key_risks?: string | null; mitigation?: string | null
}

/** Pass rows scoped to one mandate and coach. Coverage is not release authorization. */
export function deriveAssessmentStatus({ coach, assessments = [], evidence = [], recommendation }: {
  coach?: object | null
  assessments?: Assessment[]
  evidence?: Evidence[]
  recommendation?: Recommendation | null
}) {
  const illustrativeProfile = Boolean(coach && isIllustrativeEvidence(coach))
  const keys = ASSESSMENT_CRITERIA.map(c => c.key as string)
  const recordedCriteria = keys.filter(key => assessments.some(a => a.criterion === key && a.status === 'complete' && !illustrativeProfile && !isIllustrativeEvidence(a)))
  const illustrativeCriteria = keys.filter(key => assessments.some(a => a.criterion === key && (illustrativeProfile || isIllustrativeEvidence(a))))
  const reviewedCriteria = keys.filter(key => !illustrativeProfile && evidence.some(e => e.criterion === key && isVerifiedEvidence(e)))
  const illustrativeRecommendation = Boolean(recommendation && (illustrativeProfile || isIllustrativeEvidence(recommendation)))
  const recommendationRecorded = canPublishRecommendation(coach, recommendation)
  const recommendationLabel = illustrativeRecommendation ? 'Illustrative recommendation excluded'
    : recommendationRecorded ? `Recorded recommendation: ${recommendation!.verdict}`
      : recommendation?.verdict?.trim() ? 'Draft recommendation: summary required' : 'Not decided'
  const confidence = recommendationRecorded && Number.isFinite(recommendation?.confidence) ? recommendation!.confidence! : null
  const missingAssessment = ASSESSMENT_CRITERIA.find(c => !recordedCriteria.includes(c.key))
  const missingReview = ASSESSMENT_CRITERIA.find(c => !reviewedCriteria.includes(c.key))
  const nextAction = illustrativeProfile ? 'Replace illustrative profile material with reviewed research.'
    : missingReview ? `Review evidence for ${missingReview.label}.`
      : missingAssessment ? `Record the assessment for ${missingAssessment.label}.`
        : !recommendationRecorded ? 'Record a human recommendation and supporting summary.'
          : 'Ready for the board — check the conditions and who can see it before sharing.'
  return {
    totalCriteria: keys.length, recordedCriteria, illustrativeCriteria, reviewedCriteria,
    recordedCount: recordedCriteria.length, illustrativeCount: illustrativeCriteria.length,
    reviewedCount: reviewedCriteria.length, illustrativeProfile, illustrativeRecommendation,
    recommendationRecorded, recommendationLabel, confidence, nextAction,
    recordedLabel: `${recordedCriteria.length}/${keys.length} recorded assessments`,
    illustrativeLabel: `${illustrativeCriteria.length}/${keys.length} illustrative assessments`,
    reviewedLabel: `${reviewedCriteria.length}/${keys.length} criteria with reviewed evidence`,
    coverLabel: 'Draft report - internal review only',
  }
}
