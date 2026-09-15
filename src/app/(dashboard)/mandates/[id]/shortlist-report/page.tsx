import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { displayClubName } from '@/lib/display-names'
import { loadMandateRanking, isAnalystOverride, standingLabel } from '@/lib/mandates/mandate-ranking.server'
import { positionLabel } from '@/lib/scoring/research/ranking'
import { RANKING_EVIDENCE_RETRIEVED_AT, modelFor, EVIDENCE_KIND_LABELS } from '@/lib/scoring/research/brief-fit'
import { demonstrationLabel } from '@/lib/mandates/demonstration'
import { PrintButton } from '../assessment/[coachId]/board-pack/print-button'

export const metadata = { title: 'Shortlist report' }

/** Board output generated from the same ranking as Candidates, Succession and Assessment. */
export default async function ShortlistReportPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: mandate }, ranking, recs, findingsRes] = await Promise.all([
    supabase.from('mandates').select('id, custom_club_name, strategic_objective, tactical_model_required, pressing_intensity_required, build_preference_required, engagement_owner, clubs(name, current_manager)').eq('id', id).maybeSingle(),
    loadMandateRanking(id),
    supabase.from('candidate_recommendations').select('coach_id, verdict, summary, updated_at').eq('mandate_id', id),
    supabase.from('profile_claims').select('coach_id, claimed_value, source_type, source_name, reviewed_at').in('review_status', ['accepted', 'applied']).is('deleted_at', null).in('claim_type', ['approach_route', 'availability', 'current_status', 'contract', 'staff']),
  ])
  const findingsByCoach = new Map<string, NonNullable<typeof findingsRes.data>>()
  for (const finding of findingsRes.data ?? []) if (finding.coach_id) findingsByCoach.set(finding.coach_id, [...(findingsByCoach.get(finding.coach_id) ?? []), finding])
  if (!mandate || !ranking) notFound()
  const club = displayClubName(mandate.custom_club_name, (mandate.clubs as { name?: string } | null)?.name, 'Mandate')
  const top = ranking.shortlist.slice(0, 5)
  const author = mandate.engagement_owner?.trim() || 'Gaffa analyst'
  const overrides = (recs.data ?? []).map(rec => ({ rec, row: ranking.byCoachId.get(rec.coach_id) }))
    .filter(({ rec, row }) => row?.eligibility.status !== 'incumbent' && isAnalystOverride(row, rec.verdict))
  const date = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return <div className="mx-auto max-w-[900px] pb-16">
    <div className="mb-4 flex items-center justify-between print:hidden">
      <Link href={`/mandates/${id}/pack`} className="text-xs text-muted-foreground hover:text-foreground">← Board report</Link>
      <PrintButton />
    </div>
    <div className="print-keep-color always-dark rounded-lg bg-[#101623] px-10 py-12 text-white print:rounded-none">
      <p className="text-[10px] font-bold tracking-[0.25em] text-emerald-300">CONFIDENTIAL · SHORTLIST REPORT</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">{club}: who fits the brief</h1>
      <p className="mt-3 text-sm text-slate-300">Generated {date(new Date().toISOString())} from the saved brief. Match data retrieved {date(RANKING_EVIDENCE_RETRIEVED_AT)}.</p>
      <p className="mt-2 text-xs text-amber-200">{demonstrationLabel({ mandateId: id }) ?? 'Analyst demonstration brief — not supplied or approved by the club.'}</p>
    </div>

    <section className="mt-8 print:break-inside-avoid">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">The brief</h2>
      <p className="mt-2 text-sm">{[mandate.tactical_model_required, mandate.build_preference_required, `${mandate.pressing_intensity_required ?? ''} press`.trim(), mandate.strategic_objective].filter(Boolean).join(' · ')}</p>
      <p className="mt-2 text-xs text-muted-foreground">Weighting model: {modelFor(mandate).label}. {modelFor(mandate).summary}</p>
      <p className="mt-2 text-xs text-muted-foreground">Fit with the brief measures football match, not the chance of success and not whether a coach can be signed.</p>
    </section>

    <section className="mt-8">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">The ranking</h2>
      <div className="mt-3 space-y-4">
        {top.map(coach => <div key={coach.profile.apiId} className="border-t border-border pt-3 print:break-inside-avoid">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-base font-semibold">{positionLabel(coach)} · {coach.profile.name}</p>
            <p className="text-lg font-semibold tabular-nums text-primary">{coach.fit.score}</p>
          </div>
          {coach.aheadOfNext && <p className="mt-1 text-xs text-muted-foreground">{coach.aheadOfNext}</p>}
          <p className="mt-2 text-sm">{coach.profile.summary}</p>
          <p className="mt-2 text-xs"><span className="font-semibold">Situation:</span> {coach.eligibility.headline}. {coach.eligibility.reason}</p>
          <p className="mt-1 text-xs text-muted-foreground">Evidence: {coach.fit.dimensions.map(row => `${row.label} ${row.score}`).join(' · ')}</p>
          <p className="mt-1 text-xs text-muted-foreground">Evidence behind {coach.fit.coverage.evidencedWeight}% of the weight{coach.fit.coverage.unavailable.length ? ` · not yet covered: ${coach.fit.coverage.unavailable.join(', ')}` : ''}. {EVIDENCE_KIND_LABELS.unavailable}.</p>
          {coach.record && (findingsByCoach.get(coach.record.id) ?? []).map((finding, index) => <p key={index} className="mt-1 text-xs"><span className="font-semibold">{/demo/i.test(`${finding.source_type} ${finding.source_name}`) ? 'Approved finding (DEMO · fictional):' : 'Approved finding:'}</span> {finding.claimed_value}</p>)}
        </div>)}
      </div>
    </section>

    {overrides.length > 0 && <section className="mt-8 print:break-inside-avoid">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Where the analyst differs</h2>
      <div className="mt-3 space-y-3">{overrides.map(({ rec, row }) => <div key={rec.coach_id} className="border-l-2 border-amber-500 pl-3 text-xs">
        <p className="font-semibold">{row?.profile.name ?? 'Coach'} · analyst verdict: {rec.verdict} · ranking: {standingLabel(row)}</p>
        <p className="mt-1 text-muted-foreground">{rec.summary}</p>
        <p className="mt-1 text-muted-foreground">Recorded by {author} · {date(rec.updated_at)}</p>
      </div>)}</div>
    </section>}

    <section className="mt-8 print:break-inside-avoid">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Assessed but left off</h2>
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        {[...(ranking.incumbent ? [ranking.incumbent] : []), ...ranking.notPursuing, ...ranking.researchGaps].map(coach => <li key={coach.profile.apiId}><span className="font-medium text-foreground">{coach.profile.name}</span> (fit {coach.fit.score}) — {coach.eligibility.headline}</li>)}
      </ul>
    </section>

    <section className="mt-8 text-xs text-muted-foreground print:break-inside-avoid">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.25em]">Still to check before any approach</h2>
      <p className="mt-2">Interest in the job, salary and staff costs, release terms, references, work permit. None of these are scored or assumed.</p>
    </section>
  </div>
}
