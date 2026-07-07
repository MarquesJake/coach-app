import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ASSESSMENT_CRITERIA, methodLabel } from '@/lib/assessment/criteria'
import { calculateGbe } from '@/lib/analysis/gbe'
import { deriveEvidence } from '@/lib/assessment/derived-evidence'
import { PrintButton } from './print-button'

// Board-ready candidate dossier: structured HTML print view.
// Section order mirrors the club-leadership assessment deck format.

export default async function BoardPackPage({
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
    .select('id, custom_club_name, strategic_objective, budget_band, succession_timeline, clubs(name, league)')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()
  if (!mandate) notFound()

  // Board packs are generated for shortlisted candidates only.
  const { data: shortlisted } = await supabase
    .from('mandate_shortlist')
    .select('coach_id')
    .eq('mandate_id', mandateId)
    .eq('coach_id', coachId)
    .maybeSingle()
  if (!shortlisted) notFound()

  const { data: coach } = await supabase
    .from('coaches')
    .select('id, name, club_current, nationality, date_of_birth, languages, coaching_licence, agent_name, wage_expectation, availability_status, tactical_identity, preferred_style, family_context, relocation_flexibility')
    .eq('id', coachId)
    .eq('user_id', user.id)
    .single()
  if (!coach) notFound()

  const [assessments, evidence, recommendationRes, stints, tacticalReports, backgroundChecks, references] =
    await Promise.all([
      supabase
        .from('candidate_assessments')
        .select('criterion, score, summary, status')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId),
      supabase
        .from('assessment_evidence')
        .select('criterion, method, title, detail, source, confidence, verification_status, used_in_recommendation')
        .eq('mandate_id', mandateId)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: true }),
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
        .select('id, reference_name, reference_role, reference_club, rating, summary')
        .eq('coach_id', coachId),
    ])

  const recommendation = recommendationRes.data
  const assessmentByCriterion = new Map((assessments.data ?? []).map((a) => [a.criterion, a]))
  const gbe = calculateGbe(stints.data ?? [], coach.coaching_licence)

  // The dossier must show the same evidence base the workspace coverage counts:
  // captured evidence marked for the recommendation, plus auto-derived platform evidence.
  const derived = deriveEvidence({
    coach,
    tacticalReports: tacticalReports.data ?? [],
    backgroundChecks: backgroundChecks.data ?? [],
    references: references.data ?? [],
    stints: stints.data ?? [],
  })

  const clubName =
    (mandate as { custom_club_name?: string | null }).custom_club_name ??
    (mandate as { clubs?: { name?: string } | null }).clubs?.name ??
    'the club'

  const age = coach.date_of_birth
    ? Math.floor((Date.now() - new Date(coach.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  const evidenceRows = evidence.data ?? []

  return (
    <div id="board-pack-root" className="max-w-[860px] mx-auto pb-16 print:max-w-none print:pb-0">
      {/* Print styling: drop app chrome and flip the dark theme to a light,
          paper-friendly palette so the dossier prints like a board document, not
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
      <div className="print-keep-color rounded-lg print:rounded-none bg-[#101623] text-white px-10 py-14 relative overflow-hidden">
        <span className="absolute top-6 right-6 bg-emerald-500 text-white text-[10px] font-bold tracking-[0.2em] px-3 py-1.5 rounded-sm">
          CONFIDENTIAL
        </span>
        <p className="text-3xl font-serif font-bold leading-tight">Head Coach Assessment</p>
        <p className="text-3xl font-serif font-bold text-slate-400 leading-tight">{coach.name}</p>
        <div className="w-16 h-0.5 bg-emerald-500 my-6" />
        <p className="text-sm text-slate-300">Prepared for Club Leadership — {clubName}</p>
        <p className="text-xs text-slate-400 mt-1">
          Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* At a glance — Strengths / Risks / Recommendation, per the target deck format */}
      <section className="mt-8 print:break-inside-avoid">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">At a glance</h2>
        <div className="grid grid-cols-3 gap-5 mt-3">
          <div className="border-t-2 border-emerald-500 pt-3">
            <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-600 uppercase">Strengths</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
              {recommendation?.key_strengths ?? '—'}
            </p>
          </div>
          <div className="border-t-2 border-emerald-500 pt-3">
            <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-600 uppercase">Risks</p>
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
            <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-600 uppercase">Recommendation</p>
            <p className="text-lg font-semibold text-foreground mt-1">
              {recommendation?.verdict ?? 'Not decided'}
              {recommendation?.confidence !== null && recommendation?.confidence !== undefined && (
                <span className="text-sm text-muted-foreground ml-2">{recommendation.confidence}% confidence</span>
              )}
            </p>
            {recommendation?.summary && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{recommendation.summary}</p>
            )}
          </div>
        </div>
      </section>

      {/* Profile + GBE */}
      <section className="mt-8 print:break-inside-avoid">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          01 · Coach profile
        </h2>
        <div className="grid grid-cols-4 gap-4 mt-3">
          {[
            {
              label: 'Date of birth / age',
              value: coach.date_of_birth
                ? `${new Date(coach.date_of_birth).toLocaleDateString('en-GB')} / ${age}`
                : '—',
            },
            { label: 'Nationality', value: coach.nationality ?? '—' },
            { label: 'Current club', value: coach.club_current ?? 'Unattached' },
            { label: 'Licence', value: coach.coaching_licence ?? 'Not recorded' },
            { label: 'Languages', value: coach.languages?.length ? coach.languages.join(', ') : '—' },
            { label: 'Agent', value: coach.agent_name ?? 'None recorded' },
            { label: 'Wage expectation', value: coach.wage_expectation || '—' },
            { label: 'Availability', value: coach.availability_status ?? '—' },
            { label: 'Family situation', value: coach.family_context ?? '—' },
            { label: 'Relocation', value: coach.relocation_flexibility ?? '—' },
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
          Assessment findings
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
                        {item.verification_status === 'verified' ? ' ✓ verified' : item.verification_status === 'disputed' ? ' ⚠ disputed' : ''}
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

      {/* References appendix — always present so the dossier shape is complete */}
      <section className="mt-8 print:break-inside-avoid">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          References — character &amp; working relationships
        </h2>
        {(references.data ?? []).length > 0 ? (
          <div className="mt-3 space-y-3">
            {(references.data ?? []).map((ref) => (
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
            Pending structured references — stakeholder interviews (owners, staff, players, industry, media) are
            collected in the structured references stage before appointment.
          </p>
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
          Confidential — prepared for club leadership · Generated by Coach First Intelligence OS
        </p>
      </section>
    </div>
  )
}
