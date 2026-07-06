import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MandateTabNav } from '../../_components/mandate-tab-nav'
import { deriveEvidence } from '@/lib/assessment/derived-evidence'
import { calculateGbe } from '@/lib/analysis/gbe'
import {
  AssessmentWorkspaceClient,
  type AssessmentRow,
  type EvidenceRow,
  type RecommendationRow,
} from './_components/assessment-workspace-client'

export default async function CandidateAssessmentPage({
  params,
}: {
  params: { id: string; coachId: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id: mandateId, coachId } = params

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, clubs(name)')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()
  if (!mandate) notFound()

  const { data: coach } = await supabase
    .from('coaches')
    .select('id, name, club_current, nationality, coaching_licence, tactical_identity, preferred_style, availability_status')
    .eq('id', coachId)
    .eq('user_id', user.id)
    .single()
  if (!coach) notFound()

  const [assessments, evidence, recommendation, stints, tacticalReports, backgroundChecks, references] =
    await Promise.all([
      supabase
        .from('candidate_assessments')
        .select('criterion, score, summary, status')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId),
      supabase
        .from('assessment_evidence')
        .select('id, criterion, method, title, detail, source, confidence, verification_status, used_in_recommendation, created_at')
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
    ])

  const derived = deriveEvidence({
    coach,
    tacticalReports: tacticalReports.data ?? [],
    backgroundChecks: backgroundChecks.data ?? [],
    references: references.data ?? [],
    stints: stints.data ?? [],
  })

  const gbe = calculateGbe(stints.data ?? [], coach.coaching_licence)

  const clubName =
    (mandate as { custom_club_name?: string | null }).custom_club_name ??
    (mandate as { clubs?: { name?: string } | null }).clubs?.name ??
    'Mandate'

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
            Candidate assessment · {coach.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {clubName} — evidence coverage, criterion assessments and final recommendation.
          </p>
        </div>
        <Link
          href={`/mandates/${mandateId}/assessment/${coachId}/board-pack`}
          className="shrink-0 px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          Board pack →
        </Link>
      </div>

      <AssessmentWorkspaceClient
        mandateId={mandateId}
        coachId={coachId}
        coachName={coach.name}
        assessments={(assessments.data ?? []) as AssessmentRow[]}
        evidence={(evidence.data ?? []) as EvidenceRow[]}
        derived={derived}
        recommendation={(recommendation.data ?? null) as RecommendationRow | null}
        gbe={gbe}
        coachingLicence={coach.coaching_licence}
      />
    </div>
  )
}
