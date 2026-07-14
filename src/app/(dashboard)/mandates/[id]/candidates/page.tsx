import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, ListFilter, Search, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MandateTabNav } from '../_components/mandate-tab-nav'
import { displayClubName } from '@/lib/display-names'

export default async function MandateCandidatesPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, clubs(name)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (!mandate) notFound()

  const [{ data: shortlist }, { data: longlist }, { data: recommendations }] = await Promise.all([
    supabase
      .from('mandate_shortlist')
      .select('coach_id, status, placement_probability, risk_rating, notes')
      .eq('mandate_id', params.id)
      .order('placement_probability', { ascending: false }),
    supabase
      .from('mandate_longlist')
      .select('coach_id, ranking_score, fit_explanation')
      .eq('mandate_id', params.id)
      .order('ranking_score', { ascending: false, nullsFirst: false }),
    supabase
      .from('candidate_recommendations')
      .select('coach_id, verdict, confidence')
      .eq('mandate_id', params.id),
  ])

  const coachIds = Array.from(new Set([
    ...(shortlist ?? []).map((row) => row.coach_id),
    ...(longlist ?? []).map((row) => row.coach_id),
  ]))
  const { data: coaches } = coachIds.length
    ? await supabase
        .from('coaches')
        .select('id, name, club_current, role_current, available_status, nationality')
        .in('id', coachIds)
    : { data: [] }

  const coachMap = new Map((coaches ?? []).map((coach) => [coach.id, coach]))
  const recommendationMap = new Map((recommendations ?? []).map((row) => [row.coach_id, row]))
  const shortlistIds = new Set((shortlist ?? []).map((row) => row.coach_id))
  const researchPool = (longlist ?? []).filter((row) => !shortlistIds.has(row.coach_id))
  const clubName = displayClubName(
    mandate.custom_club_name,
    (mandate.clubs as { name?: string } | null)?.name,
    'Mandate'
  )

  return (
    <div className="mx-auto max-w-[1200px]">
      <MandateTabNav mandateId={params.id} />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Candidate room</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground">{clubName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Separate active decision candidates from the wider research pool.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/mandates/${params.id}/longlist`} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/50">
            <Search className="h-3.5 w-3.5" />
            Edit research pool
          </Link>
          <Link href={`/mandates/${params.id}/shortlist`} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/50">
            <ListFilter className="h-3.5 w-3.5" />
            Manage shortlist
          </Link>
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Decision candidates</h2>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{shortlist?.length ?? 0}</span>
        </div>
        <div className="divide-y divide-border/60">
          {(shortlist ?? []).map((row) => {
            const coach = coachMap.get(row.coach_id)
            const recommendation = recommendationMap.get(row.coach_id)
            return (
              <Link key={row.coach_id} href={`/mandates/${params.id}/assessment/${row.coach_id}`} className="grid gap-3 px-5 py-4 transition-colors hover:bg-secondary/30 sm:grid-cols-[minmax(0,1fr)_110px_120px_20px] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{coach?.name ?? 'Unknown coach'}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{coach?.club_current ?? coach?.role_current ?? 'Unattached'} · {coach?.nationality ?? 'Nationality not recorded'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Process</p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">{row.status}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Decision</p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">{recommendation?.verdict ?? 'Not assessed'}{recommendation?.confidence != null ? ` · ${recommendation.confidence}%` : ''}</p>
                </div>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </Link>
            )
          })}
          {!shortlist?.length && <p className="px-5 py-8 text-center text-sm text-muted-foreground">No candidates have entered the decision set yet.</p>}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Research pool</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Relevant options that have not entered formal assessment.</p>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{researchPool.length}</span>
        </div>
        <div className="divide-y divide-border/60">
          {researchPool.slice(0, 8).map((row) => {
            const coach = coachMap.get(row.coach_id)
            return (
              <div key={row.coach_id} className="grid gap-3 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_100px_2fr] sm:items-center">
                <Link href={`/coaches/${row.coach_id}`} className="truncate text-sm font-medium text-foreground hover:text-primary">{coach?.name ?? 'Unknown coach'}</Link>
                <span className="text-xs tabular-nums text-muted-foreground">{row.ranking_score != null ? `${row.ranking_score}% fit` : 'Unscored'}</span>
                <p className="truncate text-xs text-muted-foreground">{row.fit_explanation ?? 'Research notes not yet recorded.'}</p>
              </div>
            )
          })}
          {!researchPool.length && <p className="px-5 py-6 text-center text-sm text-muted-foreground">The wider research pool is currently empty.</p>}
        </div>
      </section>
    </div>
  )
}
