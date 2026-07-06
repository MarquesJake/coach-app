import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MandateTabNav } from '../_components/mandate-tab-nav'
import { ASSESSMENT_CRITERIA } from '@/lib/assessment/criteria'
import { deriveEvidence } from '@/lib/assessment/derived-evidence'
import { cn } from '@/lib/utils'

export default async function MandateAssessmentIndexPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id: mandateId } = params

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, clubs(name)')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()
  if (!mandate) notFound()

  const { data: shortlist } = await supabase
    .from('mandate_shortlist')
    .select('coach_id, status, placement_probability, coaches(name, club_current)')
    .eq('mandate_id', mandateId)
    .order('placement_probability', { ascending: false })

  const coachIds = (shortlist ?? []).map((s) => s.coach_id)

  const [assessments, evidence, recommendations] = await Promise.all([
    coachIds.length
      ? supabase
          .from('candidate_assessments')
          .select('coach_id, criterion, status')
          .eq('mandate_id', mandateId)
      : Promise.resolve({ data: [] as { coach_id: string; criterion: string; status: string }[] }),
    coachIds.length
      ? supabase
          .from('assessment_evidence')
          .select('coach_id, criterion')
          .eq('mandate_id', mandateId)
      : Promise.resolve({ data: [] as { coach_id: string; criterion: string }[] }),
    coachIds.length
      ? supabase
          .from('candidate_recommendations')
          .select('coach_id, verdict, confidence')
          .eq('mandate_id', mandateId)
      : Promise.resolve({ data: [] as { coach_id: string; verdict: string | null; confidence: number | null }[] }),
  ])

  // Coverage counts captured evidence plus auto-derived platform evidence,
  // matching what the per-candidate workspace matrix shows.
  const [derivedCoaches, allStints, allTactical, allChecks, allRefs] = coachIds.length
    ? await Promise.all([
        supabase
          .from('coaches')
          .select('id, tactical_identity, preferred_style')
          .in('id', coachIds),
        supabase
          .from('coach_stints')
          .select('coach_id, club_name, points_per_game, league')
          .in('coach_id', coachIds),
        supabase
          .from('coach_tactical_reports')
          .select('id, coach_id, match_observed, formation_used, overall_tactical_score')
          .in('coach_id', coachIds),
        supabase
          .from('coach_background_checks')
          .select('id, coach_id, media_reputation, overall_risk_rating, last_verified_at')
          .in('coach_id', coachIds),
        supabase
          .from('coach_references')
          .select('id, coach_id, reference_name, reference_role, rating')
          .in('coach_id', coachIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]

  const coverage = new Map<string, Set<string>>()
  for (const row of evidence.data ?? []) {
    const set = coverage.get(row.coach_id) ?? new Set<string>()
    set.add(row.criterion)
    coverage.set(row.coach_id, set)
  }
  for (const coach of derivedCoaches.data ?? []) {
    const derived = deriveEvidence({
      coach,
      stints: (allStints.data ?? []).filter((s) => s.coach_id === coach.id),
      tacticalReports: (allTactical.data ?? []).filter((t) => t.coach_id === coach.id),
      backgroundChecks: (allChecks.data ?? []).filter((b) => b.coach_id === coach.id),
      references: (allRefs.data ?? []).filter((r) => r.coach_id === coach.id),
    })
    const set = coverage.get(coach.id) ?? new Set<string>()
    for (const item of derived) set.add(item.criterion)
    coverage.set(coach.id, set)
  }
  const completeCounts = new Map<string, number>()
  for (const row of assessments.data ?? []) {
    if (row.status === 'complete') {
      completeCounts.set(row.coach_id, (completeCounts.get(row.coach_id) ?? 0) + 1)
    }
  }
  const verdicts = new Map(
    (recommendations.data ?? []).map((r) => [r.coach_id, r])
  )

  const clubName =
    (mandate as { custom_club_name?: string | null }).custom_club_name ??
    (mandate as { clubs?: { name?: string } | null }).clubs?.name ??
    'Mandate'

  const totalCriteria = ASSESSMENT_CRITERIA.length

  return (
    <div className="max-w-[1200px] mx-auto">
      <MandateTabNav mandateId={mandateId} />
      <h1 className="text-lg font-semibold text-foreground">Candidate assessment · {clubName}</h1>
      <p className="text-xs text-muted-foreground mt-0.5">
        Run the 9-criteria assessment for each shortlisted candidate. Evidence coverage, criterion findings and a board-ready recommendation.
      </p>

      <div className="mt-6 card-surface rounded-lg overflow-hidden">
        <div className="grid grid-cols-[minmax(170px,1fr)_130px_110px_120px_110px] px-5 py-2.5 border-b border-border bg-surface/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          <span>Candidate</span>
          <span>Evidence coverage</span>
          <span>Assessed</span>
          <span>Verdict</span>
          <span></span>
        </div>
        <div className="divide-y divide-border/50">
          {!shortlist?.length ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No shortlisted candidates yet. Add coaches to the shortlist first — assessment runs on shortlisted candidates.
            </div>
          ) : (
            shortlist.map((row) => {
              const covered = coverage.get(row.coach_id)?.size ?? 0
              const complete = completeCounts.get(row.coach_id) ?? 0
              const rec = verdicts.get(row.coach_id)
              const coach = row.coaches as { name?: string; club_current?: string | null } | null
              return (
                <div
                  key={row.coach_id}
                  className="grid grid-cols-[minmax(170px,1fr)_130px_110px_120px_110px] px-5 py-3 items-center gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{coach?.name ?? 'Unknown coach'}</p>
                    <p className="text-2xs text-muted-foreground truncate">{coach?.club_current ?? 'Unattached'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-surface border border-border/50 overflow-hidden">
                      <div
                        className="h-full bg-primary/70"
                        style={{ width: `${Math.round((covered / totalCriteria) * 100)}%` }}
                      />
                    </div>
                    <span className="text-2xs tabular-nums text-muted-foreground">{covered}/{totalCriteria}</span>
                  </div>
                  <span className="text-2xs tabular-nums text-muted-foreground">{complete}/{totalCriteria} complete</span>
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
                    {rec?.verdict ?? '—'}
                    {rec?.confidence !== null && rec?.confidence !== undefined && (
                      <span className="text-muted-foreground ml-1 tabular-nums">{rec.confidence}%</span>
                    )}
                  </span>
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/mandates/${mandateId}/assessment/${row.coach_id}`}
                      className="text-2xs font-medium text-primary hover:underline"
                    >
                      Assess →
                    </Link>
                    <Link
                      href={`/mandates/${mandateId}/assessment/${row.coach_id}/board-pack`}
                      className="text-2xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Board pack
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
