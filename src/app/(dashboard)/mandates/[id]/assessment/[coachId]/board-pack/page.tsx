import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ASSESSMENT_CRITERIA, methodLabel } from '@/lib/assessment/criteria'
import { calculateGbe } from '@/lib/analysis/gbe'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { deriveEvidence } from '@/lib/assessment/derived-evidence'
import { PrintButton } from './print-button'
import { claimFieldLabel, claimTypeLabel } from '@/lib/profile-claims'
import { displayClubName } from '@/lib/display-names'
import {
  coachPortalVisibilityLabel,
  evidenceStrengthLabel,
  formatEnumLabel,
  stakeholderGroupLabel,
} from '@/lib/intelligence/display'
import { canStaffMemberAppearInPack } from '@/lib/coach-appointment'
import { isIllustrativeEvidence } from '@/lib/assessment/evidence-integrity'
import { deriveAssessmentStatus } from '@/lib/assessment/status'
import { boardCall, dimensionFor } from '@/lib/assessment/methodology'
import { loadMandateRanking, standingLabel, isAnalystOverride } from '@/lib/mandates/mandate-ranking.server'
import { declarationReviewLabel } from '@/lib/assessment/material-status'
import { canPrintCircumstances, referencesForPack } from '@/lib/assessment/pack-release'
import { deepDiveFor, finalEvaluationFor } from '@/lib/assessment/deep-dive'
import { VerifiedMatchEvidence } from '@/components/assessment/verified-match-evidence'
import { AreaDeepDive, FinalEvaluationSection } from '@/components/assessment/deep-dive-sections'

// The tab title doubles as the default filename when the pack is saved as a
// PDF, so it names the candidate and the club rather than the page type.
export async function generateMetadata(
  props: { params: Promise<{ id: string; coachId: string }> }
): Promise<{ title: string | { absolute: string } }> {
  const { id: mandateId, coachId } = await props.params
  const supabase = await createServerSupabaseClient()
  const [{ data: mandate }, { data: coach }] = await Promise.all([
    supabase.from('mandates').select('custom_club_name, clubs(name)').eq('id', mandateId).maybeSingle(),
    supabase.from('coaches').select('name').eq('id', coachId).maybeSingle(),
  ])
  if (!mandate || !coach?.name) return { title: 'Board report' }
  const club = displayClubName(
    (mandate as { custom_club_name?: string | null }).custom_club_name,
    (mandate as { clubs?: { name?: string } | null }).clubs?.name,
    ''
  )
  // Absolute: skip the appointment layout's template so the saved PDF is named
  // for the candidate and club alone.
  return { title: { absolute: club ? `${coach.name} – ${club} board report` : `${coach.name} board report` } }
}


// Board-ready Head Coach Assessment Pack: structured HTML print view.
// Section order mirrors the club-leadership assessment deck format.

function display(value: string | null | undefined) {
  return value && value.trim() ? value.trim() : '—'
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function evidenceReviewLabel(item: {
  origin_profile_claim_id: string | null
  provenance_snapshot: unknown
  verification_status: string
}) {
  if (item.origin_profile_claim_id) {
    const snapshot = item.provenance_snapshot && typeof item.provenance_snapshot === 'object'
      ? item.provenance_snapshot as Record<string, unknown>
      : null
    const strength = typeof snapshot?.evidence_strength === 'string' ? snapshot.evidence_strength : 'single_source'
    return ` · Reviewed · ${evidenceStrengthLabel(strength)}`
  }
  if (item.verification_status === 'verified') return ' · Verified'
  if (item.verification_status === 'disputed') return ' · Disputed'
  return ''
}

export default async function BoardPackPage(
  props: {
    params: Promise<{ id: string; coachId: string }>
  }
) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id: mandateId, coachId } = params

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, strategic_objective, budget_band, succession_timeline, clubs(name, league)')
    .eq('id', mandateId)
    .single()
  if (!mandate) notFound()

  // Assessment packs are generated for shortlisted candidates only.
  const { data: shortlisted } = await supabase
    .from('mandate_shortlist')
    .select('coach_id')
    .eq('mandate_id', mandateId)
    .eq('coach_id', coachId)
    .maybeSingle()
  if (!shortlisted) notFound()

  const { data: coach } = await supabase
    .from('coaches')
    .select('id, name, club_current, nationality, date_of_birth, languages, coaching_licence, agent_name, agent_contact, current_salary, wage_expectation, compensation_expectation, staff_cost_estimate, contract_expiry, release_clause, contract_notes, availability_status, availability_timeline, appointment_conditions, market_status, tactical_identity, preferred_style, family_context, relocation_flexibility, feasibility_reviewed_at, due_diligence_summary, compliance_notes')
    .eq('id', coachId)
    .single()
  if (!coach) notFound()

  const [
    assessments,
    evidence,
    recommendationRes,
    portalProfile,
    portalStaff,
    profileClaims,
    stints,
    tacticalReports,
    backgroundChecks,
    structuredReferences,
    references,
  ] =
    await Promise.all([
      supabase
        .from('candidate_assessments')
        .select('criterion, score, summary, status')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId),
      supabase
        .from('assessment_evidence')
        .select('id, criterion, method, title, detail, source, confidence, verification_status, used_in_recommendation, origin_profile_claim_id, provenance_snapshot')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: true }),
      supabase
        .from('candidate_recommendations')
        .select('verdict, confidence, summary, key_strengths, key_risks, mitigation, updated_at')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId)
        .maybeSingle(),
      supabase
        .from('coach_portal_profiles')
        .select('portal_status, visibility_status, circumstances_visibility, feasibility_review_status, feasibility_reviewed_at, current_salary, salary_expectation, contract_expiry, release_compensation, staff_cost_expectation, availability_timeline, relocation_requirements, appointment_conditions, football_identity, training_week, session_design_principles, staff_network, key_staff_likely_to_follow, reference_permissions')
        .eq('coach_id', coachId)
        .maybeSingle(),
      supabase
        .from('coach_portal_staff_members')
        .select('id, full_name, role_title, current_club, essentiality, likely_to_follow, availability, expected_salary, compensation_terms, confidentiality_status, review_status')
        .eq('coach_id', coachId)
        .eq('user_id', user.id)
        .order('created_at'),
      (supabase as any)
        .from('profile_claims')
        .select('id, claim_type, profile_field, claimed_value, evidence_summary, source_type, source_tier, confidence, sensitivity, verification_status, review_status, occurred_at, used_in_recommendation, statement_type, fact_check_status, external_visibility')
        .eq('coach_id', coachId)
        .eq('user_id', user.id)
        .eq('used_in_recommendation', true)
        .in('review_status', ['accepted', 'applied'])
        .neq('external_visibility', 'internal_only')
        .neq('statement_type', 'allegation')
        .neq('fact_check_status', 'requires_legal')
        .order('occurred_at', { ascending: false, nullsFirst: false })
        .limit(8),
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
        .from('candidate_reference_answers')
        .select('id, evidence_id, stakeholder_group, reference_name, reference_role, question, answer, confidence, verification_status, would_hire_again, risk_flag')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: true }),
      supabase
        .from('coach_references')
        .select('id, reference_name, reference_role, reference_club, rating, summary')
        .eq('coach_id', coachId),
    ])

  if (assessments.error || evidence.error || recommendationRes.error) {
    throw new Error('Report assessment progress could not be loaded. Refresh to retry.')
  }

  const illustrativeProfile = isIllustrativeEvidence(coach)
  const ranking = await loadMandateRanking(mandateId)
  const rankedRow = ranking?.byCoachId.get(coachId)
  const status = deriveAssessmentStatus({ coach, assessments: assessments.data ?? [], evidence: evidence.data ?? [], recommendation: recommendationRes.data })
  const recommendation = status.recommendationRecorded ? recommendationRes.data : null
  const deepDive = deepDiveFor(coachId, mandateId)
  const finalEvaluation = finalEvaluationFor(mandateId, coachId)
  const assessmentByCriterion = new Map((illustrativeProfile ? [] : assessments.data ?? [])
    .filter((a) => !isIllustrativeEvidence(a)).map((a) => [a.criterion, a]))
  const gbe = calculateGbe(stints.data ?? [], coach.coaching_licence)

  // The assessment pack must show the same evidence base the workspace coverage counts:
  // captured evidence marked for the recommendation, plus auto-derived platform evidence.
  const derived = illustrativeProfile ? [] : deriveEvidence({
    coach,
    tacticalReports: illustrativeProfile ? [] : tacticalReports.data ?? [],
    backgroundChecks: illustrativeProfile ? [] : backgroundChecks.data ?? [],
    references: (references.data ?? []).filter((row) => !isIllustrativeEvidence(row)),
    stints: stints.data ?? [],
  })

  const clubName = displayClubName(
    (mandate as { custom_club_name?: string | null }).custom_club_name,
    (mandate as { clubs?: { name?: string } | null }).clubs?.name,
    'the club'
  )

  const age = coach.date_of_birth
    ? Math.floor((Date.now() - new Date(coach.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  const evidenceRows = (evidence.data ?? []).filter((row) => !isIllustrativeEvidence(row))
  const claimRows = ((profileClaims.data ?? []) as Array<Record<string, any>>).filter((row) => !isIllustrativeEvidence(row))
  const referenceRows = referencesForPack((structuredReferences.data ?? []).filter((row) => !isIllustrativeEvidence(row)), evidenceRows)
  const legacyReferenceRows = (references.data ?? []).filter((row) => !isIllustrativeEvidence(row))
  // Fictional references are shown apart from the evidence, never as part of it.
  const demoReferenceRows = (structuredReferences.data ?? []).filter((row) => isIllustrativeEvidence(row))
  const omittedIllustrations = illustrativeProfile || evidenceRows.length !== (evidence.data ?? []).length
    || status.illustrativeCount > 0 || status.illustrativeRecommendation
    || (structuredReferences.data ?? []).some(isIllustrativeEvidence)
    || legacyReferenceRows.length !== (references.data ?? []).length
    || claimRows.length !== (profileClaims.data ?? []).length
  const releasedCircumstances = !illustrativeProfile && canPrintCircumstances(portalProfile.data) ? portalProfile.data : null
  const shareableStaffRows = !releasedCircumstances ? [] : (portalStaff.data ?? []).filter(row => canStaffMemberAppearInPack(row) && row.confidentiality_status === 'shareable')
  const portalCanBeShared = !illustrativeProfile && portalProfile.data?.portal_status === 'approved'
    && ['clubs_on_request', 'shareable'].includes(portalProfile.data.visibility_status)

  return (
    <div id="board-pack-root" className="max-w-[860px] mx-auto pb-16 print:max-w-none print:pb-0">
      {/* Print styling: drop app chrome and flip the dark theme to a light,
          paper-friendly palette so the pack prints like a board document, not
          a raw dark app page. Scoped to print + this subtree only. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  aside { display: none !important; }
  .pl-\\[220px\\] { padding-left: 0 !important; }
  #board-pack-root {
    --background: #ffffff; --background-subtle: #f8fafc;
    --surface: #ffffff; --surface-raised: #ffffff; --surface-overlay: #f1f5f9;
    --card: #ffffff; --card-foreground: #0f172a;
    --foreground: #0f172a; --foreground-muted: #475569; --muted-foreground: #475569;
    --border: #e2e8f0; --border-subtle: #eef2f7;
  }
  #board-pack-root, #board-pack-root * {
    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
  }
  @page { margin: 13mm; }
}`,
        }}
      />
      {/* Screen-only toolbar */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <Link
          href={`/mandates/${mandateId}/assessment/${coachId}`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to assessment
        </Link>
        <PrintButton />
      </div>

      {/* Cover */}
      <div className="print-keep-color always-dark rounded-lg print:rounded-none bg-[#101623] text-white px-10 py-14 relative overflow-hidden">
        <span className="absolute top-6 right-6 bg-emerald-700 text-white text-[10px] font-bold tracking-[0.2em] px-3 py-1.5 rounded-sm">
          CONFIDENTIAL
        </span>
        <h1 className="text-3xl font-serif font-bold leading-tight">Coach ID report<span className="sr-only">: {coach.name}</span></h1>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Head coach assessment · {clubName}</p>
        <p className="mt-3 text-sm font-bold text-amber-200">{deepDive ? 'Worked example — illustrative assessment' : status.coverLabel}</p>
        <p className="text-3xl font-serif font-bold text-slate-400 leading-tight">{coach.name}</p>
        <div className="w-16 h-0.5 bg-emerald-500 my-6" />
        <p className="text-sm text-slate-300">Prepared for {clubName}. Not yet cleared to share outside the club’s board.</p>
        <p className="mt-3 text-xs text-slate-300">{deepDive ? 'Assessment content is illustrative; match data and dated sources are real and marked as such' : `${status.recordedLabel} · ${status.reviewedLabel}`} </p>
        <p className="mt-2 text-xs text-slate-300">{deepDive ? 'Every claim needs checking, and terms confirming with the club, before this is used as a recommendation.' : status.nextAction}</p>
        <p className="text-xs text-slate-400 mt-1">
          Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {omittedIllustrations && (
        <section role="note" className="mt-5 rounded-md border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950 print:break-inside-avoid">
          <strong>Evidence limitations.</strong> Some assessments, interviews or references are not included in this report yet. Gaps need more research before this becomes a recommendation.
        </section>
      )}
      {ranking && <section className="mt-5 rounded-lg border border-border p-4 text-sm print:break-inside-avoid">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Where he sits in the ranking</p>
        <p className="mt-2 font-semibold">{standingLabel(rankedRow)}</p>
        {rankedRow?.aheadOfNext && rankedRow.eligibility.recommendable && <p className="mt-1 text-xs text-muted-foreground">{rankedRow.aheadOfNext}</p>}
        <p className="mt-1 text-xs text-muted-foreground">Top three from the brief: {ranking.shortlist.slice(0, 3).map(row => `${row.profile.name} (${row.fit.score})`).join(', ') || 'none yet'}. Same calculation as Candidates and Succession.</p>
        {recommendation?.verdict && isAnalystOverride(rankedRow, recommendation.verdict) && <div className="mt-3 border-l-2 border-amber-500 pl-3 text-xs">
          <p className="font-semibold">Analyst override · verdict: {recommendation.verdict}</p>
          <p className="mt-1 text-muted-foreground">Reason: {recommendation.summary || 'No reason recorded.'}</p>
          <p className="mt-1 text-muted-foreground">Recorded by {ranking.mandate.engagement_owner?.trim() || 'Gaffa analyst'}{(recommendation as { updated_at?: string }).updated_at ? ` · ${new Date((recommendation as { updated_at: string }).updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}</p>
        </div>}
      </section>}
      <VerifiedMatchEvidence coachName={coach.name} />
      {deepDive && <section role="note" className="my-5 rounded-lg border border-amber-500/60 p-4 text-sm print:break-inside-avoid"><strong>Worked example</strong><p className="mt-1">The nine-area scores, SWOT, budget and analyst verdict below show what a finished report looks like; they are illustrative. The ranking above, the verified match data and anything with a dated source are real.</p></section>}
      {/* At a glance — Strengths / Risks / Recommendation, per the target deck format */}
      <section className="mt-8 print:break-inside-avoid">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">At a glance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-5 mt-3">
          <div className="border-t-2 border-emerald-500 pt-3">
            <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-700 dark:text-emerald-400 uppercase">Strengths</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
              {recommendation?.key_strengths ?? '—'}
            </p>
          </div>
          <div className="border-t-2 border-emerald-500 pt-3">
            <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-700 dark:text-emerald-400 uppercase">Risks</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
              {recommendation?.key_risks ?? '—'}
            </p>
            {recommendation?.mitigation && (
              <p className="text-2xs text-muted-foreground/80 mt-2 leading-relaxed whitespace-pre-line">
                Mitigation: {recommendation.mitigation}
              </p>
            )}
          </div>
          <div className="border-t-2 border-emerald-500 pt-3">
            <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-700 dark:text-emerald-400 uppercase">Recommendation</p>
            <p className="text-lg font-semibold text-foreground mt-1">
              {finalEvaluation?.currentManagerBenchmark ? 'Current-manager benchmark' : deepDive ? 'Demo recommendation — review required' : status.recommendationLabel}
              {!deepDive && !finalEvaluation?.currentManagerBenchmark && recommendation?.confidence !== null && recommendation?.confidence !== undefined && (
                <span className="text-sm text-muted-foreground ml-2">{recommendation.confidence}% confidence</span>
              )}
            </p>
            {finalEvaluation?.currentManagerBenchmark && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Included to compare the existing football model. This is not a successor recommendation or advice to retain the manager.</p>}
            {!finalEvaluation?.currentManagerBenchmark && recommendation?.summary && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{recommendation.summary}</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded border border-border p-4 text-2xs print:break-inside-avoid">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">How to read the evidence</p>
        <p className="mt-2 text-muted-foreground"><span className="font-semibold text-foreground">Verified fact</span> — official or provider record with a date. <span className="font-semibold text-foreground">Calculated</span> — worked out from those records, coverage shown. <span className="font-semibold text-foreground">Sourced research</span> — dated public analysis of a named period. <span className="font-semibold text-foreground">Analyst judgement</span> — Gaffa’s view, signed and dated. <span className="font-semibold text-foreground">Interview</span> and <span className="font-semibold text-foreground">reference</span> — what people told us, in their words, checked before it counts. <span className="font-semibold text-foreground">Demo</span> — illustrative, not evidence. <span className="font-semibold text-foreground">Not available</span> — the heading stays; the evidence has not been gathered.</p>
      </section>

      {/* Profile + GBE */}
      <section className="mt-8 print:break-inside-avoid">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          01 · Coach profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-4 mt-3">
          {[
            {
              label: 'Date of birth / age',
              value: coach.date_of_birth
                ? `${new Date(coach.date_of_birth).toLocaleDateString('en-GB')} / ${age}`
                : '—',
            },
            { label: 'Nationality', value: coach.nationality ?? '—' },
            { label: 'Current club', value: coach.club_current?.trim() || 'Current club not recorded' },
            { label: 'Licence', value: coach.coaching_licence ?? 'Not recorded' },
            { label: 'Languages', value: coach.languages?.length ? coach.languages.join(', ') : '—' },
            { label: 'Approach route', value: 'Confirm privately with the authorised representative' },
            { label: 'Availability', value: coach.availability_status ?? '—' },
            { label: 'Market status', value: coach.market_status ?? '—' },
            { label: 'Tactical identity', value: coach.tactical_identity ?? coach.preferred_style ?? '—' },
            {
              label: 'Work permit (GBE, indicative)',
              value:
                gbe.status === 'Pass'
                  ? 'Auto-pass indicated'
                  : gbe.status === 'Fail'
                    ? 'Auto-pass not confirmed'
                    : 'Requires confirmation',
            },
            { label: 'Banded months (B1 / B1–2 / B1–5)', value: `${gbe.monthsBand1} / ${gbe.monthsBand1to2} / ${gbe.monthsBand1to5}` },
          ].map((item) => (
            <div key={item.label} className="border-t-2 border-emerald-500/60 pt-2">
              <p className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">{item.label}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-2xs text-muted-foreground/80 mt-3">
          Work-permit note: {gbe.passRoute ?? 'no GBE auto-pass route confirmed on recorded data'}. Final eligibility
          requires legal / work-permit confirmation and is not a factor in the footballing assessment below.
        </p>
      </section>

      {/* Availability and terms */}
      <section className="mt-8 print:break-inside-avoid">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          01 · Appointment feasibility — availability and terms
        </h2>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Only up-to-date, checked details the coach has agreed can be shared appear here. Private terms need separate approval before they are released.
        </p>
        {!releasedCircumstances && <p className="mt-3 text-sm">Details withheld until they are confirmed and cleared for sharing.</p>}
        {releasedCircumstances && <>
        <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-4 mt-3">
          {[
            { label: 'Contract expiry', value: formatDate(releasedCircumstances.contract_expiry) },
            { label: 'Expected salary', value: display(releasedCircumstances.salary_expectation) },
            { label: 'Estimated club compensation', value: display(releasedCircumstances.release_compensation) },
            { label: 'Staff cost estimate', value: display(releasedCircumstances.staff_cost_expectation) },
            { label: 'Availability timeline', value: display(releasedCircumstances.availability_timeline) },
            { label: 'Practical relocation requirements', value: display(releasedCircumstances.relocation_requirements) },
          ].map((item) => (
            <div key={item.label} className="border-t-2 border-emerald-500/60 pt-2">
              <p className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">{item.label}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
        {releasedCircumstances.appointment_conditions && (
          <div className="mt-4 border-l-2 border-emerald-500/50 pl-3">
            <p className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">
              What the deal needs, and what could stop it
            </p>
            <p className="text-2xs text-muted-foreground mt-1 leading-relaxed">
              {releasedCircumstances.appointment_conditions}
            </p>
          </div>
        )}
        {shareableStaffRows.length > 0 && (
          <div className="mt-5">
            <p className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">
              Confirmed staff package
            </p>
            <div className="mt-2 divide-y divide-border border-y border-border">
              {shareableStaffRows.map((member) => (
                <div key={member.id} className="grid grid-cols-[1.15fr_0.85fr_1fr] gap-4 py-2 text-2xs">
                  <div>
                    <p className="font-semibold text-foreground">{member.full_name}</p>
                    <p className="text-muted-foreground">
                      {member.role_title}
                      {member.current_club ? ` · ${member.current_club}` : ''}
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    {formatEnumLabel(member.essentiality)}
                    {` · ${member.likely_to_follow === 'unknown' ? 'Follow status unconfirmed' : `Likely to follow: ${member.likely_to_follow}`}`}
                  </p>
                  <p className="text-muted-foreground">
                    {[member.availability, member.expected_salary, member.compensation_terms].filter(Boolean).join(' · ') || 'Commercial details not released'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="mt-3 text-[10px] text-muted-foreground/75">
          {`Current declarations reviewed ${formatDate(releasedCircumstances.feasibility_reviewed_at)}.`}
          {' '}Commercial terms remain indicative until confirmed with the coach, representative and current club.
        </p>
        </>}
      </section>

      {/* Coach-submitted material */}
      <section className="mt-8 print:break-inside-avoid">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          01 · What the coach has told us himself
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 mt-3">
          {[
            { label: 'Declaration review', value: declarationReviewLabel(portalProfile.data) },
            { label: 'Visibility', value: coachPortalVisibilityLabel(portalProfile.data?.visibility_status ?? 'private') },
            { label: 'Private material', value: 'Separate recipient-approved release required' },
          ].map((item) => (
            <div key={item.label} className="border-t-2 border-emerald-500/60 pt-2">
              <p className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">{item.label}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
        {portalCanBeShared ? (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Football identity', value: portalProfile.data?.football_identity },
              { label: 'Training week', value: portalProfile.data?.training_week },
              { label: 'Session design', value: portalProfile.data?.session_design_principles },
              { label: 'Staff network', value: portalProfile.data?.staff_network ?? portalProfile.data?.key_staff_likely_to_follow },
              { label: 'Reference permissions', value: portalProfile.data?.reference_permissions },
            ].map((item) => (
              <div key={item.label} className="border-l border-border pl-3">
                <p className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">{item.label}</p>
                <p className="text-2xs text-muted-foreground mt-1 leading-relaxed">{display(item.value)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-2xs text-muted-foreground">
            Gaffa holds more football detail from the coach, but it hasn’t been cleared for this report.
          </p>
        )}
      </section>

      {/* Source-backed private claims */}
      <section className="mt-8 print:break-inside-avoid">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          Confidential findings
        </h2>
        {claimRows.length > 0 ? (
          <div className="mt-3 space-y-2">
            {claimRows.map((claim) => (
              <div key={claim.id} className="border-l-2 border-emerald-500/50 pl-3">
                <p className="text-xs font-semibold text-foreground">
                  {claimTypeLabel(claim.claim_type)}
                  <span className="font-normal text-muted-foreground">
                    {' — '}
                    {claimFieldLabel(claim.profile_field)}
                    {claim.confidence !== null ? ` · ${claim.confidence}% confidence` : ''}
                    {claim.verification_status === 'verified' ? ' · verified' : claim.verification_status === 'disputed' ? ' · disputed' : ' · unverified'}
                  </span>
                </p>
                <p className="text-2xs text-muted-foreground mt-1 leading-relaxed">
                  {claim.claimed_value}
                </p>
                <p className="text-2xs text-muted-foreground/80 mt-1 leading-relaxed">
                  {claim.evidence_summary}
                  {` Source type: ${formatEnumLabel(claim.source_type || 'not_recorded')}.`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-2xs text-muted-foreground mt-3">
            No private intelligence is included in this recommendation yet. Agent calls, references and analyst notes are checked before they go into the profile or the report.
          </p>
        )}
      </section>

      {/* Career timeline */}
      {(stints.data ?? []).length > 0 && (
        <section className="mt-8 print:break-inside-avoid">
          <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
            Career timeline
          </h2>
          <div className="mt-3 space-y-2">
            {(stints.data ?? []).map((stint, i) => (
              <div key={i} className="flex items-baseline gap-3 text-xs">
                <span className="text-muted-foreground tabular-nums shrink-0 w-40">
                  {stint.started_on ? new Date(stint.started_on).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                  {' – '}
                  {stint.ended_on ? new Date(stint.ended_on).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'present'}
                </span>
                <span className="font-semibold text-foreground">{stint.club_name}</span>
                <span className="text-muted-foreground">
                  {stint.role_title}
                  {stint.league ? ` · ${stint.league}` : ''}
                  {stint.points_per_game !== null ? ` · ${stint.points_per_game?.toFixed(2)} PPG` : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Criterion findings */}
      <section className="mt-8">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          02–09 · The nine assessment areas
        </h2>
        <div className="mt-3 space-y-5">
          {ASSESSMENT_CRITERIA.map((criterion) => {
            const assessment = assessmentByCriterion.get(criterion.key)
            const criterionEvidence = evidenceRows.filter(
              (e) => e.criterion === criterion.key && e.used_in_recommendation
            )
            const excludedCount = evidenceRows.filter(
              (e) => e.criterion === criterion.key && !e.used_in_recommendation
            ).length
            const criterionDerived = derived.filter((d) => d.criterion === criterion.key)
            return (
              <div key={criterion.key} className="print:break-inside-avoid border-t border-border pt-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {String(criterion.num).padStart(2, '0')} · {criterion.label}
                    <span className="ml-2 text-2xs font-normal text-muted-foreground">{dimensionFor(criterion.key).label}</span>
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {assessment?.score !== null && assessment?.score !== undefined ? `${assessment.score}/100` : 'Not scored'}
                    {assessment?.status === 'complete' ? ' · Complete' : assessment?.status === 'in_progress' ? ' · In progress' : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed whitespace-pre-line">
                  {assessment?.summary ?? 'No conclusive findings recorded.'}
                </p>
                {(criterionEvidence.length > 0 || criterionDerived.length > 0) && (
                  <ul className="mt-2 space-y-1">
                    {criterionEvidence.map((item, i) => (
                      <li key={i} className="text-2xs text-muted-foreground/80 pl-3 border-l border-border">
                        <span className="text-foreground/80">{item.title}</span>
                        {' — '}
                        {methodLabel(item.method)}
                        {item.source ? `, ${item.source}` : ''}
                        {item.confidence !== null ? `, confidence ${item.confidence}` : ''}
                        {deepDive ? ' · Demo review record' : evidenceReviewLabel(item)}
                      </li>
                    ))}
                    {criterionDerived.map((item, i) => (
                      <li key={`d-${i}`} className="text-2xs text-muted-foreground/70 pl-3 border-l border-dashed border-border">
                        <span className="text-foreground/70">{item.title}</span>
                        {' — '}
                        {methodLabel(item.method)}, platform data
                        {item.detail ? ` (${item.detail})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                {deepDive && <AreaDeepDive area={criterion.key} d={deepDive} />}
                {excludedCount > 0 && (
                  <p className="text-2xs text-muted-foreground/50 mt-1.5 pl-3">
                    {excludedCount} evidence item{excludedCount === 1 ? '' : 's'} on file, excluded from this recommendation.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Confidential data room */}
      <section className="mt-8">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">10–13 · Overall assessment, club fit, key risks and recommendation</h2>
        <p className="mt-2 text-xs text-muted-foreground">Board call: <span className="font-semibold text-foreground">{boardCall(recommendation?.verdict).call}</span> — {boardCall(recommendation?.verdict).meaning}{ranking ? ` Ranking from the brief: ${standingLabel(rankedRow)}.` : ''}</p>
        {finalEvaluation ? (
          <div className="mt-3"><FinalEvaluationSection e={finalEvaluation} verdict={recommendation?.verdict ?? null} confidence={recommendation?.confidence ?? null} /></div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
            <div className="rounded border border-border p-3"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Overall assessment · analyst judgement</p><p className="mt-2 text-xs leading-relaxed whitespace-pre-line">{recommendation?.summary || 'Not written yet. The analyst\u2019s overall view goes here once the nine areas have enough checked evidence.'}</p></div>
            <div className="rounded border border-border p-3"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Club fit · analyst judgement</p><p className="mt-2 text-xs leading-relaxed whitespace-pre-line">{assessmentByCriterion.get('cultural_org_fit')?.summary || 'Not assessed yet — see 09 · Cultural & Organisational Fit for what is still to gather.'}</p></div>
            <div className="rounded border border-border p-3"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Key risks · analyst judgement</p><p className="mt-2 text-xs leading-relaxed whitespace-pre-line">{recommendation?.key_risks || 'Not recorded yet.'}</p>{recommendation?.mitigation && <p className="mt-2 text-2xs text-muted-foreground whitespace-pre-line">How we would manage them: {recommendation.mitigation}</p>}</div>
            <div className="rounded border border-border p-3"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Recommendation</p><p className="mt-2 text-lg font-semibold">{boardCall(recommendation?.verdict).call}</p><p className="mt-1 text-xs text-muted-foreground">{recommendation?.verdict ? `Analyst verdict: ${recommendation.verdict}${recommendation.confidence != null ? ` · ${recommendation.confidence}% confidence` : ''}` : 'No verdict recorded. Nothing goes to a board without one.'}</p></div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded border border-border p-4 print:break-inside-avoid">
        <h2 className="font-semibold text-sm">Still to check before any approach</h2>
        <p className="mt-2 text-xs text-muted-foreground">{deepDive ? 'Every claim needs checking, and terms confirming with the club, before this is used as a recommendation.' : status.nextAction}</p>
        <p className="mt-2 text-xs text-muted-foreground">An area counts as covered once it has at least one checked piece of evidence. That doesn’t mean the evidence is complete, or that it can be shared.</p>
        <p className="mt-2 text-xs text-muted-foreground">{recommendation?.mitigation ? `Conditions before appointment: ${recommendation.mitigation}` : 'Conditions before appointment have not been recorded.'}</p>
        <Link className="mt-3 inline-block text-xs text-primary underline print:hidden" href={`/mandates/${mandateId}/decision`}>See the research questions and who owns them</Link>
      </section>

      <section className="mt-8 print:break-inside-avoid">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          Confidential data room
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 mt-3">
          <div className="border-t-2 border-emerald-500/60 pt-2">
            <p className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">
              Private material
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              Private material details withheld
            </p>
            <p className="text-2xs text-muted-foreground mt-1">
              The coach’s presentations, training video, methods and our analysts’ files are released separately from this report.
            </p>
          </div>
          <div className="border-t-2 border-emerald-500/60 pt-2">
            <p className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">
              Access status
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              Check who has access
            </p>
            <p className="text-2xs text-muted-foreground mt-1">
              This report doesn’t give access to files. Access, expiry and withdrawal are handled in the club’s decision room.
            </p>
          </div>
          <div className="border-t-2 border-emerald-500/60 pt-2">
            <p className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">
              Football value
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">Training-ground reality</p>
            <p className="text-2xs text-muted-foreground mt-1">
              What a normal database can’t tell you: how the coach presents, trains, prepares and explains his work.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">File names, sources and attachments aren’t shown in this report. Approved clubs receive them through the secure release process.</p>
      </section>

      {/* References appendix — always present so the assessment-pack shape is complete */}
      <section className="mt-8 print:break-inside-avoid">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          Appendix 1 · Character references
        </h2>
        {referenceRows.length > 0 ? (
          <div className="mt-3 space-y-3">
            {referenceRows.map((ref) => (
              <div key={ref.id} className="border-l-2 border-emerald-500/60 pl-3">
                <p className="text-xs font-semibold text-foreground">
                  {ref.reference_name}
                  <span className="font-normal text-muted-foreground">
                    {ref.reference_role ? ` — ${ref.reference_role}` : ''}
                  </span>
                </p>
                <p className="text-2xs text-muted-foreground/80 mt-1">
                  {stakeholderGroupLabel(ref.stakeholder_group)}
                  {ref.confidence !== null ? ` · ${ref.confidence}% confidence` : ''}
                  {ref.verification_status ? ` · ${ref.verification_status}` : ''}
                  {ref.would_hire_again ? ` · would hire/work again: ${ref.would_hire_again}` : ''}
                  {ref.risk_flag ? ' · risk flagged' : ''}
                </p>
                <p className="text-2xs text-foreground/80 mt-1 leading-relaxed">{ref.question}</p>
                <p className="text-2xs text-muted-foreground mt-1 leading-relaxed">{ref.answer}</p>
              </div>
            ))}
          </div>
        ) : legacyReferenceRows.length > 0 ? (
          <div className="mt-3 space-y-3">
            {legacyReferenceRows.map((ref) => (
              <div key={ref.id} className="border-l-2 border-emerald-500/60 pl-3">
                <p className="text-xs font-semibold text-foreground">
                  {ref.reference_name}
                  <span className="font-normal text-muted-foreground">
                    {ref.reference_role ? ` — ${ref.reference_role}` : ''}
                    {ref.reference_club ? `, ${ref.reference_club}` : ''}
                    {ref.rating !== null ? ` · rating ${ref.rating}` : ''}
                  </span>
                </p>
                {ref.summary && (
                  <p className="text-2xs text-muted-foreground mt-1 leading-relaxed">{ref.summary}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-2xs text-muted-foreground mt-3">
            No references taken yet. Owners, coaching staff, players, the industry and journalists are each asked the same standard questions before any appointment.
          </p>
        )}
        {demoReferenceRows.length > 0 && (
          <div className="mt-4 rounded border border-amber-400/60 bg-amber-50/40 p-3 dark:bg-amber-950/20 print:break-inside-avoid">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-800 dark:text-amber-300">Demo references — fictional, not evidence</p>
            <p className="mt-1 text-2xs text-muted-foreground">Shown only to demonstrate how a checked reference reaches this appendix. Excluded from the assessment above.</p>
            <div className="mt-2 space-y-2">
              {demoReferenceRows.map((ref) => (
                <div key={ref.id} className="border-l-2 border-amber-400 pl-3">
                  <p className="text-xs font-semibold text-foreground">{ref.reference_name}<span className="font-normal text-muted-foreground">{ref.reference_role ? ` — ${ref.reference_role}` : ''}</span></p>
                  <p className="text-2xs text-muted-foreground/80 mt-0.5">{stakeholderGroupLabel(ref.stakeholder_group)} · {ref.verification_status === 'verified' ? 'checked by analyst' : 'draft — not reviewed'}{ref.would_hire_again && ref.would_hire_again !== 'unknown' ? ` · would hire/work again: ${ref.would_hire_again}` : ''}{ref.risk_flag ? ' · risk flagged' : ''}</p>
                  <p className="text-2xs text-foreground/80 mt-1">{ref.question}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">{ref.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Mandate context footer */}
      <section className="mt-10 print:break-inside-avoid border-t-2 border-emerald-500 pt-4">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">Mandate context</h2>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {(mandate as { strategic_objective?: string | null }).strategic_objective ?? ''}
        </p>
        <p className="text-2xs text-muted-foreground/70 mt-3">
          {[
            (mandate as { budget_band?: string | null }).budget_band ? `Budget: ${(mandate as { budget_band?: string | null }).budget_band}` : null,
            (mandate as { succession_timeline?: string | null }).succession_timeline ? `Timeline: ${(mandate as { succession_timeline?: string | null }).succession_timeline}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className="text-[9px] text-muted-foreground/50 mt-4 tracking-widest uppercase">
          Confidential — prepared for the club’s board by Gaffa
        </p>
      </section>
    </div>
  )
}
