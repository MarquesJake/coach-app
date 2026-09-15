import { isCurrentManagerBenchmark } from '@/lib/assessment/deep-dive'
import { deriveAssessmentStatus } from '@/lib/assessment/status'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MandateTabNav } from '../_components/mandate-tab-nav'
import { ASSESSMENT_CRITERIA } from '@/lib/assessment/criteria'
import { cn } from '@/lib/utils'
import { displayClubName } from '@/lib/display-names'
import { loadMandateRanking, standingLabel, isAnalystOverride } from '@/lib/mandates/mandate-ranking.server'
import { positionLabel } from '@/lib/scoring/research/ranking'
import { canonicalCoachName } from '@/lib/coaches/canonical-name'

export const metadata = { title: 'Assessment' }


export default async function MandateAssessmentIndexPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id: mandateId } = params

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, engagement_owner, clubs(name)')
    .eq('id', mandateId)
    .single()
  if (!mandate) notFound()

  const { data: shortlist, error: shortlistError } = await supabase
    .from('mandate_shortlist')
    .select('coach_id, status, placement_probability, coaches(name, club_current, due_diligence_summary, compliance_notes)')
    .eq('mandate_id', mandateId)
    .order('placement_probability', { ascending: false })

  if (shortlistError) throw new Error('Assessment candidates could not be loaded. Refresh to retry.')

  const coachIds = (shortlist ?? []).map((s) => s.coach_id)

  const [assessments, evidence, recommendations] = await Promise.all([
    coachIds.length
      ? supabase
          .from('candidate_assessments')
          .select('coach_id, criterion, status, summary')
          .eq('mandate_id', mandateId)
      : Promise.resolve({ data: [] as { coach_id: string; criterion: string; status: string }[] }),
    coachIds.length
      ? supabase
          .from('assessment_evidence')
          .select('coach_id, criterion, title, detail, source, verification_status')
          .eq('mandate_id', mandateId)
      : Promise.resolve({ data: [] as { coach_id: string; criterion: string; verification_status?: string }[] }),
    coachIds.length
      ? supabase
          .from('candidate_recommendations')
          .select('coach_id, verdict, confidence, summary, key_strengths, key_risks, mitigation, updated_at')
          .eq('mandate_id', mandateId)
      : Promise.resolve({ data: [] as { coach_id: string; verdict: string | null; confidence: number | null; summary: string | null; updated_at: string }[] }),
  ])
  const ranking = await loadMandateRanking(mandateId)

  if ([assessments, evidence, recommendations].some(result => 'error' in result && result.error)) {
    throw new Error('Assessment progress could not be loaded. Refresh to retry.')
  }

  const statuses = new Map((shortlist ?? []).map(row => [row.coach_id, deriveAssessmentStatus({
    coach: row.coaches,
    assessments: (assessments.data ?? []).filter(a => a.coach_id === row.coach_id),
    evidence: (evidence.data ?? []).filter(e => e.coach_id === row.coach_id),
    recommendation: (recommendations.data ?? []).find(r => r.coach_id === row.coach_id),
  })]))
  const verdicts = new Map(
    (recommendations.data ?? []).filter(r => statuses.get(r.coach_id)?.recommendationRecorded).map((r) => [r.coach_id, r])
  )

  const clubName = displayClubName(
    (mandate as { custom_club_name?: string | null }).custom_club_name,
    (mandate as { clubs?: { name?: string } | null }).clubs?.name,
    'Mandate'
  )

  const totalCriteria = ASSESSMENT_CRITERIA.length

  const top = ranking?.shortlist.slice(0, 3) ?? []
  const author = (mandate as { engagement_owner?: string | null }).engagement_owner?.trim() || 'Gaffa analyst'
  const overrides = (recommendations.data ?? [])
    .filter(r => statuses.get(r.coach_id)?.recommendationRecorded && !isCurrentManagerBenchmark(mandateId, r.coach_id))
    .map(r => ({ rec: r, row: ranking?.byCoachId.get(r.coach_id), name: (shortlist ?? []).find(s => s.coach_id === r.coach_id)?.coaches as { name?: string } | null }))
    .filter(item => isAnalystOverride(item.row, item.rec.verdict))

  // Calculated order first; assessed coaches outside the list follow, the benchmark last.
  const calcOrder = (coachId: string) => {
    if (isCurrentManagerBenchmark(mandateId, coachId)) return 10_000
    const row = ranking?.byCoachId.get(coachId)
    return row?.eligibility.recommendable ? row.position ?? 999 : 5_000
  }
  const orderedShortlist = [...(shortlist ?? [])].sort((a, b) => calcOrder(a.coach_id) - calcOrder(b.coach_id))

  return (
    <div className="max-w-[1200px] mx-auto">
      <MandateTabNav mandateId={mandateId} />
      <h1 className="text-lg font-semibold text-foreground">Candidate assessment · {clubName}</h1>
      <p className="text-xs text-muted-foreground mt-0.5">
        Assessments and checked evidence are counted separately. A recommendation still needs approval before it is shared.
      </p>

      <Link className="mt-3 inline-block text-xs text-primary underline" href={`/mandates/${mandateId}/candidates#brief-matches`}>Full ranking and the working behind every score</Link>

      {top.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Top three from the brief</h2>
          <p className="mt-2 text-xs text-muted-foreground">Worked out from the saved brief and each coach’s evidence — the same list as Candidates, Succession and the board output. Fit with the brief is not a probability of success.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            {top.map(coach => {
              const assessed = coach.record && (shortlist ?? []).some(s => s.coach_id === coach.record!.id)
              const rec = coach.record ? (recommendations.data ?? []).find(r => r.coach_id === coach.record!.id) : undefined
              return <div key={coach.profile.apiId} className="card-surface rounded-lg border-t-2 border-emerald-500/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{positionLabel(coach)} · fit {coach.fit.score}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{coach.record ? <Link className="hover:underline" href={`/coaches/${coach.record.id}`}>{coach.profile.name}</Link> : coach.profile.name}</p>
                {coach.aheadOfNext && <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">{coach.aheadOfNext}</p>}
                <p className="mt-2 text-2xs text-muted-foreground">{coach.eligibility.headline}</p>
                <p className="mt-1 text-2xs text-muted-foreground">{assessed ? `Full assessment on file${rec?.verdict ? ` · analyst verdict: ${rec.verdict}` : ''}` : 'Not yet taken into the full nine-area assessment'}</p>
              </div>
            })}
          </div>
        </div>
      )}

      {overrides.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Where the analyst differs from the ranking</h2>
          <p className="mt-2 text-xs text-muted-foreground">These are human calls, shown next to the calculation — never passed off as the ranking’s choice.</p>
          <div className="mt-2 space-y-2">
            {overrides.map(({ rec, row, name }) => <div key={rec.coach_id} className="card-surface rounded-lg border-l-2 border-amber-500/50 px-4 py-3 text-xs">
              <p className="font-semibold text-foreground">{canonicalCoachName(rec.coach_id, name?.name) } · analyst verdict: {rec.verdict}</p>
              <p className="mt-1 text-muted-foreground">Ranking: {standingLabel(row)}</p>
              <p className="mt-1 text-muted-foreground">Analyst’s reason: {rec.summary || 'No reason recorded — needs one before this goes anywhere.'}</p>
              <p className="mt-1 text-muted-foreground">Recorded by {author} · {new Date(rec.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>)}
          </div>
        </div>
      )}

      <div className="mt-6 card-surface rounded-lg overflow-hidden">
        <div className="hidden lg:grid grid-cols-[minmax(170px,1fr)_130px_110px_120px_160px] gap-3 px-5 py-2.5 border-b border-border bg-surface/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          <span>Candidate</span>
          <span>Reviewed evidence</span>
          <span>Assessments</span>
          <span>Verdict</span>
          <span></span>
        </div>
        <div className="divide-y divide-border/50">
          {!shortlist?.length ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No one on the shortlist yet. Add coaches to the shortlist to start assessing them.
              <Link href={`/mandates/${mandateId}/candidates`} className="mt-3 flex min-h-10 items-center justify-center text-primary underline">Choose candidates</Link>
            </div>
          ) : (
            orderedShortlist.map((row) => {
              const benchmark = isCurrentManagerBenchmark(mandateId, row.coach_id)
              const status = statuses.get(row.coach_id)!
              const covered = status.reviewedCount
              const rec = verdicts.get(row.coach_id)
              const coach = row.coaches as { name?: string; club_current?: string | null } | null
              return (
                <div
                  key={row.coach_id}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(170px,1fr)_130px_110px_120px_160px] px-5 py-4 items-start gap-3"
                >
                  <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                    <p className="text-sm font-medium text-foreground truncate">{canonicalCoachName(row.coach_id, coach?.name)}</p>
                    <p className="text-2xs text-muted-foreground truncate">{coach?.club_current?.trim() || 'Current club not recorded'}</p>
                    <p className="mt-1 text-2xs font-medium text-foreground/80">{benchmark ? 'Current manager — benchmark only, not a successor' : `Ranking: ${standingLabel(ranking?.byCoachId.get(row.coach_id))}`}</p>
                    {!benchmark && <p className="mt-0.5 text-2xs text-muted-foreground">{status.nextAction}</p>}
                  </div>
                  <div><span className="mb-1 block text-xs text-muted-foreground lg:hidden">Reviewed evidence</span><div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-surface border border-border/50 overflow-hidden">
                      <div
                        className="h-full bg-primary/70"
                        style={{ width: `${Math.round((covered / totalCriteria) * 100)}%` }}
                      />
                    </div>
                    <span className="text-2xs tabular-nums text-muted-foreground">{status.reviewedLabel}</span>
                  </div></div>
                  <span className="text-2xs tabular-nums text-muted-foreground"><span className="mb-1 block text-xs lg:hidden">Assessment entries</span>{status.recordedLabel}</span>
                  <span
                    className={cn(
                      'text-2xs font-medium',
                      rec?.verdict === 'Proceed' && 'text-emerald-400',
                      rec?.verdict === 'Dismiss' && 'text-red-400',
                      (rec?.verdict === 'Shortlist' || rec?.verdict === 'Target') && 'text-primary',
                      rec?.verdict === 'Monitor' && 'text-amber-400',
                      !rec?.verdict && 'text-muted-foreground'
                    )}
                  >
                    <span className="mb-1 block text-xs text-muted-foreground lg:hidden">Recommendation</span>
                    {benchmark ? 'Benchmark only' : status.recommendationLabel}
                    {!benchmark && rec?.confidence !== null && rec?.confidence !== undefined && (
                      <span className="text-muted-foreground ml-1 tabular-nums">{rec.confidence}% analyst confidence</span>
                    )}
                    {benchmark && rec?.verdict && <span className="mt-1 block font-normal text-muted-foreground">Stored benchmark verdict: {rec.verdict}{rec.confidence != null ? ` · ${rec.confidence}% recorded confidence` : ''}. Not a successor choice.</span>}
                  </span>
                  <div className="flex flex-wrap items-start gap-3">
                    <Link
                      href={`/mandates/${mandateId}/assessment/${row.coach_id}`}
                      className="inline-flex min-h-10 items-center text-xs font-medium text-primary hover:underline"
                    >
                      Assess →
                    </Link>
                    <Link
                      href={`/mandates/${mandateId}/assessment/${row.coach_id}/board-pack`}
                      className="inline-flex min-h-10 items-center text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Assessment pack
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
