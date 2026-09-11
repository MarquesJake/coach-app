import { deriveAssessmentStatus } from '@/lib/assessment/status'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MandateTabNav } from '../_components/mandate-tab-nav'
import { ASSESSMENT_CRITERIA } from '@/lib/assessment/criteria'
import { cn } from '@/lib/utils'
import { displayClubName } from '@/lib/display-names'

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
    .select('id, custom_club_name, clubs(name)')
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
          .select('coach_id, verdict, confidence, summary, key_strengths, key_risks, mitigation')
          .eq('mandate_id', mandateId)
      : Promise.resolve({ data: [] as { coach_id: string; verdict: string | null; confidence: number | null; summary: string | null }[] }),
  ])

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

  // Board decision set: surface the decided candidates so the trade-off reads at
  // a glance — lead recommendation, watching brief, and the rejected option.
  const coachName = (row: { coaches: unknown }) =>
    (row.coaches as { name?: string } | null)?.name ?? 'Unknown coach'
  const decided = (shortlist ?? [])
    .map((row) => ({ row, rec: verdicts.get(row.coach_id) }))
    .filter((c) => c.rec?.verdict)
  const lead = decided
    .filter((c) => c.rec!.verdict === 'Proceed' || c.rec!.verdict === 'Target')
    .sort((a, b) => (b.rec!.confidence ?? 0) - (a.rec!.confidence ?? 0))[0]
  const monitor = decided.find((c) => c.rec!.verdict === 'Monitor')
  const rejected = decided.find((c) => c.rec!.verdict === 'Dismiss')
  const decisionSet = [
    lead && { tag: 'Lead recommendation', tone: 'text-emerald-400 border-emerald-500/40', c: lead },
    monitor && { tag: 'Monitor', tone: 'text-amber-400 border-amber-500/40', c: monitor },
    rejected && { tag: 'Do not proceed', tone: 'text-red-400 border-red-500/40', c: rejected },
  ].filter(Boolean) as Array<{ tag: string; tone: string; c: (typeof decided)[number] }>

  // Decided candidates first (in decision order), then the rest of the shortlist.
  const verdictRank = new Map([['Proceed', 0], ['Target', 1], ['Shortlist', 2], ['Monitor', 3], ['Dismiss', 4]])
  const orderedShortlist = [...(shortlist ?? [])].sort((a, b) => {
    const ra = verdictRank.get(verdicts.get(a.coach_id)?.verdict ?? '') ?? 9
    const rb = verdictRank.get(verdicts.get(b.coach_id)?.verdict ?? '') ?? 9
    return ra - rb
  })

  return (
    <div className="max-w-[1200px] mx-auto">
      <MandateTabNav mandateId={mandateId} />
      <h1 className="text-lg font-semibold text-foreground">Candidate assessment · {clubName}</h1>
      <p className="text-xs text-muted-foreground mt-0.5">
        Recorded assessments, illustrative examples and reviewed evidence are counted separately. A recorded human recommendation does not authorize publication.
      </p>

      {decisionSet.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Recorded human recommendations · internal review
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            {decisionSet.map(({ tag, tone, c }) => (
              <Link
                key={c.row.coach_id}
                href={`/mandates/${mandateId}/assessment/${c.row.coach_id}`}
                className={cn('card-surface rounded-lg px-4 py-3 border-t-2 transition-colors hover:bg-surface/60', tone.split(' ')[1])}
              >
                <p className={cn('text-[10px] font-semibold uppercase tracking-widest', tone.split(' ')[0])}>{tag}</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {coachName(c.row)}
                  {c.rec!.confidence !== null && (
                    <span className="text-xs font-normal text-muted-foreground ml-2 tabular-nums">
                      {c.rec!.verdict} · {c.rec!.confidence}%
                    </span>
                  )}
                </p>
                {c.rec!.summary && (
                  <p className="text-2xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{c.rec!.summary}</p>
                )}
                <p className="mt-2 text-2xs text-muted-foreground">{statuses.get(c.row.coach_id)?.nextAction}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 card-surface rounded-lg overflow-hidden">
        <div className="hidden lg:grid grid-cols-[minmax(170px,1fr)_130px_110px_120px_160px] gap-3 px-5 py-2.5 border-b border-border bg-surface/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          <span>Candidate</span>
          <span>Reviewed evidence</span>
          <span>Recorded / illustrative</span>
          <span>Verdict</span>
          <span></span>
        </div>
        <div className="divide-y divide-border/50">
          {!shortlist?.length ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No shortlisted candidates yet. Add coaches to the shortlist first — assessment runs on shortlisted candidates.
              <Link href={`/mandates/${mandateId}/candidates`} className="mt-3 flex min-h-10 items-center justify-center text-primary underline">Choose candidates</Link>
            </div>
          ) : (
            orderedShortlist.map((row) => {
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
                    <p className="text-sm font-medium text-foreground truncate">{coach?.name ?? 'Unknown coach'}</p>
                    <p className="text-2xs text-muted-foreground truncate">{coach?.club_current?.trim() || 'Current club not recorded'}</p>
                    <p className="mt-1 text-2xs text-muted-foreground">{status.nextAction}</p>
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
                  <span className="text-2xs tabular-nums text-muted-foreground"><span className="mb-1 block text-xs lg:hidden">Assessment entries</span>{status.recordedLabel}<br />{status.illustrativeLabel}</span>
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
                    {status.recommendationLabel}
                    {rec?.confidence !== null && rec?.confidence !== undefined && (
                      <span className="text-muted-foreground ml-1 tabular-nums">{rec.confidence}%</span>
                    )}
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
