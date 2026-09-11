import type { Database } from '../types/db.ts'
import { deriveAssessmentStatus } from '../assessment/status.ts'
import { isIllustrativeEvidence, isVerifiedEvidence } from '../assessment/evidence-integrity.ts'
import { resolveControlledRelease } from '../dossiers/release-state.ts'
import { calculateAppointmentGates, getNextFootballAction, isServiceModel, type AppointmentPlanFacts } from './appointment-plan.ts'
import { selectLeadRecommendation } from './appointment-outcome.ts'
import { reviewRequirement } from './fit-review.ts'

type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export const APPOINTMENT_BRIEF_FIELDS = [
  'strategic_objective', 'tactical_model_required', 'pressing_intensity_required',
  'build_preference_required', 'leadership_profile_required', 'budget_band', 'succession_timeline',
] as const
export type AppointmentMandate = Pick<Row<'mandates'>, 'id' | 'service_model' | 'engagement_owner' | 'target_completion_date' | typeof APPOINTMENT_BRIEF_FIELDS[number]>
type Coach = Pick<Row<'coaches'>, 'id' | 'name' | 'due_diligence_summary' | 'compliance_notes'>
type Scoped = { mandate_id: string; coach_id: string }
type AssessmentInput = Parameters<typeof deriveAssessmentStatus>[0]
export type AppointmentActionData = {
  shortlist: (Scoped & { coaches: Coach | null })[]
  assessments: (Scoped & NonNullable<AssessmentInput['assessments']>[number])[]
  evidence: (Scoped & NonNullable<AssessmentInput['evidence']>[number] & { id: string; used_in_recommendation: boolean })[]
  recommendations: (Scoped & NonNullable<AssessmentInput['recommendation']> & { verdict: string | null; confidence: number | null })[]
  interviews: (Scoped & { id: string; evidence_id: string | null; answer: string; verification_status: string })[]
  references: (Scoped & { id: string; evidence_id: string | null; answer: string; reference_role: string | null; verification_status: string })[]
  profiles: Pick<Row<'coach_portal_profiles'>, 'coach_id' | 'feasibility_review_status' | 'feasibility_reviewed_at' | 'football_identity' | 'short_bio' | 'personal_statement'>[]
  workItems: Row<'mandate_deliverables'>[]
  orders: Pick<Row<'dossier_orders'>, 'id' | 'mandate_id' | 'coach_id' | 'buyer_organization_id' | 'status' | 'expires_at'>[]
  grants: Pick<Row<'confidential_access_grants'>, 'order_id' | 'coach_id' | 'buyer_organization_id' | 'status' | 'expires_at' | 'revoked_at'>[]
}

export function appointmentBriefCompleteness(mandate: Pick<AppointmentMandate, typeof APPOINTMENT_BRIEF_FIELDS[number]>) {
  const missingFields = APPOINTMENT_BRIEF_FIELDS.filter(key => {
    const value = mandate[key]
    return reviewRequirement(key, value, null).state === 'Not specified'
      || (typeof value === 'string' && /^(?:not recorded|not specified|tbd|pending|n\/a|-)$/i.test(value.trim()))
  })
  return { complete: missingFields.length === 0, missing: missingFields.length, pct: Math.round((1 - missingFields.length / APPOINTMENT_BRIEF_FIELDS.length) * 100) }
}

/** Resolve one already-authorized mandate from bulk-loaded rows; never infer publication from a preview. */
export function deriveAppointmentNextAction(mandate: AppointmentMandate, data: AppointmentActionData, now = new Date()) {
  const candidates = new Map(data.shortlist.filter(row => row.mandate_id === mandate.id && row.coaches && !isIllustrativeEvidence(row.coaches)).map(row => [row.coach_id, row.coaches!]))
  const recommendations = data.recommendations.filter(row => row.mandate_id === mandate.id && candidates.has(row.coach_id))
  const assessments = data.assessments.filter(row => row.mandate_id === mandate.id)
  const evidence = data.evidence.filter(row => row.mandate_id === mandate.id)
  const assessmentByCoach = new Map([...candidates].map(([coachId, coach]) => [coachId, deriveAssessmentStatus({
    coach, assessments: assessments.filter(row => row.coach_id === coachId),
    evidence: evidence.filter(row => row.coach_id === coachId),
    recommendation: recommendations.find(row => row.coach_id === coachId),
  })]))
  const recordedRecommendations = recommendations.filter(row => assessmentByCoach.get(row.coach_id)?.recommendationRecorded)
  const lead = selectLeadRecommendation(recordedRecommendations)
  const leadCoachId = lead?.coach_id ?? null
  const leadAssessment = leadCoachId ? assessmentByCoach.get(leadCoachId)! : null
  const reviewedEvidence = new Set(evidence.filter(row => row.coach_id === leadCoachId && isVerifiedEvidence(row) && row.used_in_recommendation).map(row => row.id))
  const reviewedAnswers = (rows: AppointmentActionData['interviews']) => new Set(rows.filter(row =>
    row.mandate_id === mandate.id && row.coach_id === leadCoachId && !isIllustrativeEvidence(row)
    && row.evidence_id && reviewedEvidence.has(row.evidence_id)
  ).map(row => row.evidence_id)).size
  const workItems = data.workItems.filter(row => row.mandate_id === mandate.id)
  const activeReleases = data.orders.filter(order => order.mandate_id === mandate.id && candidates.has(order.coach_id) && data.grants.some(grant =>
    grant.order_id === order.id && grant.coach_id === order.coach_id && grant.buyer_organization_id === order.buyer_organization_id
    && !grant.revoked_at && resolveControlledRelease(order, grant, now).canViewMaterials
  ))
  const brief = appointmentBriefCompleteness(mandate)
  const facts: AppointmentPlanFacts = {
    serviceModel: isServiceModel(mandate.service_model) ? mandate.service_model : 'full_service_search',
    briefComplete: brief.complete,
    candidateCount: candidates.size,
    recommendationCount: new Set(recordedRecommendations.map(row => row.coach_id)).size,
    leadCoachId, leadCoachName: leadCoachId ? candidates.get(leadCoachId)?.name ?? null : null,
    leadCriteriaComplete: leadAssessment?.recordedCount ?? 0,
    leadInterviewCount: reviewedAnswers(data.interviews), leadReferenceCount: reviewedAnswers(data.references),
    leadFeasibilityVerified: data.profiles.some(row => row.coach_id === leadCoachId && row.feasibility_review_status === 'verified' && Boolean(row.feasibility_reviewed_at) && !isIllustrativeEvidence(row)),
    releaseCount: activeReleases.length,
  }
  const gates = calculateAppointmentGates(facts)
  // Preserve service thresholds while making the assessment and release claims precise.
  const assessmentGate = gates.find(gate => gate.key === 'assessment')!
  if (leadAssessment) {
    assessmentGate.detail = `${facts.leadCoachName ?? 'Lead candidate'}: ${leadAssessment.recordedLabel}; ${leadAssessment.reviewedLabel}.`
    const reviewedFacts = { ...facts, leadCriteriaComplete: leadAssessment.recordedCriteria.filter(key => leadAssessment.reviewedCriteria.includes(key)).length }
    assessmentGate.status = calculateAppointmentGates(reviewedFacts).find(gate => gate.key === 'assessment')!.status
  }
  const releaseGate = gates.find(gate => gate.key === 'release')!
  if (releaseGate.status !== 'not_required') releaseGate.detail = activeReleases.length
    ? `${activeReleases.length} recipient release${activeReleases.length === 1 ? '' : 's'} with live access.`
    : 'No club has live access yet. Check the order, the access granted and the expiry — a preview isn’t a release.'
  const selected = getNextFootballAction(gates, workItems, now)
  const hrefSuffix = selected.hrefSuffix.startsWith('#') ? `/decision${selected.hrefSuffix}` : selected.hrefSuffix.replace(/^\/plan(?=#|$)/, '/decision')
  // Resolve manual identity through the same engine instead of copying its priority rules.
  const selectedIdentity = selected.source === 'manual'
    ? getNextFootballAction(gates, workItems.map(item => ({ ...item, item: item.id })), now).label : null
  const manual = workItems.find(item => item.id === selectedIdentity)
  return {
    mandateId: mandate.id, facts, gates, brief, lead, leadAssessment, workItems,
    nextAction: { ...selected, hrefSuffix, href: `/mandates/${mandate.id}${hrefSuffix}`,
      owner: manual?.assigned_to?.trim() || mandate.engagement_owner?.trim() || null,
      dueDate: manual?.due_date ?? mandate.target_completion_date ?? null,
      workItemId: manual?.id ?? null,
    },
  }
}

export type AppointmentNextAction = ReturnType<typeof deriveAppointmentNextAction>
