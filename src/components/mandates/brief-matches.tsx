import Link from 'next/link'
import type { AppointmentDecision } from '@/lib/appointments/feasibility'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { RankingBrief } from '@/lib/scoring/research/brief-fit'
import { rankResearchProfiles, positionLabel, type RankedCoach } from '@/lib/scoring/research/ranking'
import { safeDecisionBrief } from '@/lib/mandates/decision-brief'

function Situation({ coach }: { coach: RankedCoach }) {
  const { eligibility } = coach
  return <div className="mt-2 text-xs leading-5 text-muted-foreground">
    <p className="font-medium text-foreground">{eligibility.headline}</p>
    <p>{eligibility.reason}</p>
    {eligibility.source && <p><a href={eligibility.source.url} target="_blank" rel="noreferrer" className="text-primary underline">{eligibility.source.title}</a> · checked {eligibility.source.checkedAt}</p>}
  </div>
}

function ScoreBreakdown({ coach }: { coach: RankedCoach }) {
  return <div className="mt-3 space-y-3">
    {coach.fit.dimensions.map(row => <div key={row.key} className="text-xs leading-relaxed">
      <p className="font-semibold">{row.label}: {row.score}/100 × {row.weight.toFixed(1)}% = {row.contribution.toFixed(1)}</p>
      <p className="mt-1 text-muted-foreground">Brief asks for: {row.required}. He shows: {row.recorded}.</p>
      <p className="mt-1 text-muted-foreground">{row.explanation}</p>
    </div>)}
    <p className="text-xs font-medium">Add the contributions: {coach.fit.score}/100.</p>
    <div className="space-y-1">{coach.profile.sources.map(source => <p key={source.url} className="text-xs"><a className="text-primary underline" href={source.url} target="_blank" rel="noreferrer">{source.title}</a> <span className="text-muted-foreground">· period covered: {source.period}</span></p>)}</div>
  </div>
}

/** Recalculated from the saved brief on every load, so a changed brief never leaves a stale ranking. */
export async function BriefMatches({ mandate, appointmentDecisions }: { mandate: RankingBrief & { id: string; club_id?: string | null; clubs?: { id?: string; current_manager?: string | null } | null }; appointmentDecisions?: readonly AppointmentDecision[] }) {
  const appointmentBrief = safeDecisionBrief(mandate.decision_brief)
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from('coaches').select('id,name').order('name').limit(1000)
  if (error) return <section className="my-6 rounded-xl border border-border p-5"><h2 className="font-semibold">Ranking from this brief</h2><p role="alert" className="mt-2 text-sm">Coach records could not be loaded. Refresh to rebuild the ranking.</p></section>
  const ranking = rankResearchProfiles({
    brief: mandate,
    context: { mandateId: mandate.id, clubId: mandate.club_id ?? mandate.clubs?.id, incumbentName: mandate.clubs?.current_manager },
    records: data ?? [],
    decisions: appointmentDecisions,
  })
  const top = ranking.shortlist.slice(0, 3)
  const setAside = [...ranking.notPursuing, ...ranking.researchGaps]

  return <section id="brief-matches" className="my-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ranked against the brief</p><h2 className="mt-1 text-xl font-semibold">Top three for this job</h2></div>
      <Link href={`/mandates/${mandate.id}/edit`} className="text-sm text-primary underline underline-offset-4">View the brief</Link>
    </div>
    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Every researched coach is scored on how well his football matches this brief, backed by his match data. The score is fit with the brief — not a forecast of success, and not a sign he can be signed.</p>
    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Before anyone makes the list we take out the current manager, coaches at Premier League rivals, elite clubs or national teams, and anyone without recent evidence. Those names stay visible below with the reason.</p>

    {!top.length ? <p className="mt-5 text-sm">Nobody to rank yet. The brief needs at least two of playing identity, build-up, defending and objective.</p> : <>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {top.map(coach => <article key={coach.profile.apiId} className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-muted-foreground">{positionLabel(coach)}</span><span className="text-xs text-muted-foreground">Fit with the brief</span></div>
          <h3 className="mt-3 text-lg font-semibold">{coach.record ? <Link className="hover:underline" href={`/coaches/${coach.record.id}`}>{coach.profile.name}</Link> : coach.profile.name}</h3>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-primary">{coach.fit.score}<span className="text-base font-normal text-muted-foreground"> / 100</span></p>
          {coach.aheadOfNext && <p className="mt-3 rounded-md bg-muted/40 p-2 text-xs leading-5"><span className="font-semibold">Why he is above the next man:</span> {coach.aheadOfNext}</p>}
          <Situation coach={coach} />
          <p className="mt-3 text-sm leading-relaxed">{coach.profile.summary}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Caveat: {coach.profile.limitation}</p>
          <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-sm font-medium">Why this score?</summary><ScoreBreakdown coach={coach} /></details>
        </article>)}
      </div>

      <details className="mt-5 border-t border-border pt-4" open><summary className="cursor-pointer text-sm font-medium">Full ranking · {ranking.shortlist.length} coaches we could pursue</summary>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="py-2 pr-3">Rank</th><th className="pr-3">Coach</th><th className="pr-3">Fit</th><th className="pr-3">Situation</th><th>Why above the next</th></tr></thead><tbody>
          {ranking.shortlist.map(coach => <tr key={coach.profile.apiId} className="border-b border-border align-top">
            <td className="py-2 pr-3 whitespace-nowrap">{positionLabel(coach)}</td>
            <td className="pr-3">{coach.record ? <Link className="text-primary hover:underline" href={`/coaches/${coach.record.id}`}>{coach.profile.name}</Link> : coach.profile.name}</td>
            <td className="pr-3 tabular-nums">{coach.fit.score}</td>
            <td className="pr-3 text-xs text-muted-foreground">{coach.eligibility.headline}</td>
            <td className="text-xs text-muted-foreground">{coach.aheadOfNext ?? '—'}</td>
          </tr>)}
        </tbody></table></div>
      </details>
    </>}

    {(ranking.incumbent || setAside.length > 0) && <details className="mt-4 border-t border-border pt-4"><summary className="cursor-pointer text-sm font-medium">Assessed but not on the list · {setAside.length + (ranking.incumbent ? 1 : 0)}</summary>
      <div className="mt-3 space-y-3">
        {[...(ranking.incumbent ? [ranking.incumbent] : []), ...setAside].map(coach => <div key={coach.profile.apiId} className="text-xs leading-5">
          <p className="font-semibold">{coach.profile.name} · fit {coach.fit.score}</p>
          <Situation coach={coach} />
        </div>)}
      </div>
    </details>}

    <details className="mt-4 border-t border-border pt-4"><summary className="cursor-pointer text-sm font-medium">How the score is built</summary>
      <p className="mt-3 text-sm text-muted-foreground">Starting weights: playing identity 25, build-up 15, defending 15, relevant achievement 25, front-foot football in the match data 10, recent head-coach evidence 10. Essential build-up or defending counts 1.5 times, Flexible half. Weights are then scaled to 100.</p>
      <p className="mt-2 text-sm text-muted-foreground">Playing identity comes from dated tactical research on a named period. Match figures come from API-Football league matches where the coach is on the team sheet. Level scores are ordered by weight of recent verified matches; names are never used to split them.</p>
      <p className="mt-2 text-sm text-muted-foreground">Still to check by hand for every name: {[appointmentBrief.salary?.value && 'salary', appointmentBrief.staff_budget?.value && 'staff costs', appointmentBrief.compensation?.value && 'compensation', 'interest in the job', 'references', 'work permit'].filter(Boolean).join(', ')}.</p>
    </details>
  </section>
}
