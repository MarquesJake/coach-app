import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canonicalCoachName } from '@/lib/coaches/canonical-name'
import { MandateTabNav } from '../../_components/mandate-tab-nav'
import { deriveEvidence } from '@/lib/assessment/derived-evidence'
import { calculateGbe } from '@/lib/analysis/gbe'
import { displayClubName } from '@/lib/display-names'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { AssessmentClaimPromotion } from './_components/assessment-claim-promotion'
import {
  AssessmentWorkspaceClient,
  type AssessmentRow,
  type ConfidentialAccessRequestRow,
  type EvidenceRow,
  type InterviewAnswerRow,
  type PrivateMaterialRow,
  type RecommendationRow,
  type ReferenceAnswerRow,
} from './_components/assessment-workspace-client'

import { deepDiveFor, finalEvaluationFor } from '@/lib/assessment/deep-dive'
import { VerifiedMatchEvidence } from '@/components/assessment/verified-match-evidence'
import { safeDecisionBrief } from '@/lib/mandates/decision-brief'

export const metadata = { title: 'Assessment' }


export default async function CandidateAssessmentPage(
  props: {
    params: Promise<{ id: string; coachId: string }>
  }
) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)

  const { id: mandateId, coachId } = params

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, strategic_objective, tactical_model_required, pressing_intensity_required, build_preference_required, decision_brief, clubs(name)')
    .eq('id', mandateId)
    .single()
  if (!mandate) notFound()
  const briefDetail = safeDecisionBrief((mandate as { decision_brief?: unknown }).decision_brief)
  const briefContext = {
    clubName: displayClubName((mandate as { custom_club_name?: string | null }).custom_club_name, (mandate as { clubs?: { name?: string } | null }).clubs?.name, 'the club'),
    objective: (mandate as { strategic_objective?: string | null }).strategic_objective ?? null,
    identity: [(mandate as { tactical_model_required?: string | null }).tactical_model_required, (mandate as { build_preference_required?: string | null }).build_preference_required, (mandate as { pressing_intensity_required?: string | null }).pressing_intensity_required ? `${(mandate as { pressing_intensity_required?: string | null }).pressing_intensity_required} press` : null].filter(Boolean).join(' · ') || null,
    squadProblem: briefDetail.squad_problem?.value ?? null,
    leadership: briefDetail.leadership_challenge?.value ?? null,
    successMeasures: briefDetail.success_measures?.value ?? null,
    analystBrief: true,
  }

  // Assessment runs on shortlisted candidates only.
  const { data: shortlisted } = await supabase
    .from('mandate_shortlist')
    .select('coach_id')
    .eq('mandate_id', mandateId)
    .eq('coach_id', coachId)
    .maybeSingle()
  if (!shortlisted) notFound()

  const { data: coach } = await supabase
    .from('coaches')
    .select('id, name, club_current, nationality, coaching_licence, tactical_identity, preferred_style, availability_status, due_diligence_summary, compliance_notes')
    .eq('id', coachId)
    .single()
  if (!coach) notFound()

  const [
    assessments,
    evidence,
    recommendation,
    interviewAnswers,
    referenceAnswers,
    privateMaterials,
    accessRequests,
    stints,
    tacticalReports,
    backgroundChecks,
    references,
    trustedClaims,
  ] =
    await Promise.all([
      supabase
        .from('candidate_assessments')
        .select('criterion, score, summary, status')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('assessment_evidence')
        .select('id, criterion, method, title, detail, source, confidence, verification_status, used_in_recommendation, created_at, origin_profile_claim_id')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false }),
      supabase
        .from('candidate_recommendations')
        .select('verdict, confidence, summary, key_strengths, key_risks, mitigation')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId)
        .maybeSingle(),
      supabase
        .from('candidate_interview_answers')
        .select('id, question_key, question, answer, criterion, interview_focus, interviewer, confidence, verification_status, used_in_recommendation, created_at')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('candidate_reference_answers')
        .select('id, stakeholder_group, reference_name, reference_role, question_key, question, answer, criterion, confidence, would_hire_again, risk_flag, verification_status, used_in_recommendation, created_at')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('coach_private_materials')
        .select('id, title, material_type, description, external_url, source_label, uploaded_by, confidentiality_status, verification_status, storage_path, upload_status, created_at')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false }),
      supabase
        .from('confidential_access_requests')
        .select('id, requested_by, requester_role, club_context, request_reason, status, requested_at, decided_at')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId)
        .order('requested_at', { ascending: false })
        .limit(10),
      supabase
        .from('coach_stints')
        .select('club_name, league, role_title, started_on, ended_on, points_per_game')
        .eq('coach_id', coachId)
        .order('started_on', { ascending: false }),
      supabase
        .from('coach_tactical_reports')
        .select('id, match_observed, formation_used, overall_tactical_score')
        .eq('coach_id', coachId),
      supabase
        .from('coach_background_checks')
        .select('id, media_reputation, overall_risk_rating, last_verified_at')
        .eq('coach_id', coachId),
      supabase
        .from('coach_references')
        .select('id, reference_name, reference_role, rating')
        .eq('coach_id', coachId),
      organizationId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (supabase as any)
            .from('profile_claims')
            .select('id, claimed_value, evidence_summary, evidence_strength, external_visibility, statement_type, fact_check_status, restriction_status, review_status, methodology_criteria, reviewed_at')
            .eq('org_id', organizationId)
            .eq('coach_id', coachId)
            .in('review_status', ['accepted', 'applied'])
            .neq('external_visibility', 'internal_only')
            .neq('statement_type', 'allegation')
            .neq('fact_check_status', 'requires_legal')
            .eq('restriction_status', 'active')
            .is('deleted_at', null)
            .order('reviewed_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

  if (assessments.error || evidence.error || recommendation.error || privateMaterials.error) {
    throw new Error('Assessment progress could not be loaded. Refresh to retry.')
  }

  const derived = deriveEvidence({
    coach,
    tacticalReports: tacticalReports.data ?? [],
    backgroundChecks: backgroundChecks.data ?? [],
    references: references.data ?? [],
    stints: stints.data ?? [],
  })

  const gbe = calculateGbe(stints.data ?? [], coach.coaching_licence)

  const clubName = displayClubName(
    (mandate as { custom_club_name?: string | null }).custom_club_name,
    (mandate as { clubs?: { name?: string } | null }).clubs?.name,
    'Mandate'
  )

  return (
    <div className="max-w-[1200px] mx-auto">
      <MandateTabNav mandateId={mandateId} />
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <Link
            href={`/mandates/${mandateId}/assessment`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Assessment overview
          </Link>
          <h1 className="text-lg font-semibold text-foreground mt-1">
            Candidate assessment · {canonicalCoachName(coachId, coach.name)}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {clubName} — evidence coverage, criterion assessments and final recommendation.
          </p>
        </div>
        <Link
          href={`/mandates/${mandateId}/assessment/${coachId}/board-pack`}
          className="shrink-0 px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          Assessment pack →
        </Link>
      </div>

      <VerifiedMatchEvidence coachName={canonicalCoachName(coachId, coach.name)} />
      {deepDiveFor(coachId, mandateId) && <section role="note" className="my-5 rounded-lg border border-amber-500/60 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><strong>DEMO ASSESSMENT WORKFLOW</strong><p className="mt-1">The example dossier and its recorded assessment scores, review states and recommendation below demonstrate the workflow. They are not validated by the match-data import. Separately sourced facts retain their own provenance; review each claim before relying on it.</p></section>}
      <AssessmentWorkspaceClient
        mandateId={mandateId}
        coachId={coachId}
        coachName={canonicalCoachName(coachId, coach.name)}
        deepDive={deepDiveFor(coachId, mandateId)}
        finalEvaluation={finalEvaluationFor(mandateId, coachId)}
        coachProvenance={{ due_diligence_summary: coach.due_diligence_summary, compliance_notes: coach.compliance_notes }}
        assessments={(assessments.data ?? []) as AssessmentRow[]}
        evidence={(evidence.data ?? []) as EvidenceRow[]}
        derived={derived}
        recommendation={(recommendation.data ?? null) as RecommendationRow | null}
        interviewAnswers={(interviewAnswers.data ?? []) as InterviewAnswerRow[]}
        referenceAnswers={(referenceAnswers.data ?? []) as ReferenceAnswerRow[]}
        privateMaterials={(privateMaterials.data ?? []) as PrivateMaterialRow[]}
        accessRequests={(accessRequests.data ?? []) as ConfidentialAccessRequestRow[]}
        gbe={gbe}
        coachingLicence={coach.coaching_licence}
        briefContext={briefContext}
      />
      <AssessmentClaimPromotion
        mandateId={mandateId}
        coachId={coachId}
        claims={trustedClaims.data ?? []}
        promotedClaimIds={(evidence.data ?? []).map((row: { origin_profile_claim_id?: string | null }) => row.origin_profile_claim_id).filter((id: string | null | undefined): id is string => Boolean(id))}
      />
    </div>
  )
}
