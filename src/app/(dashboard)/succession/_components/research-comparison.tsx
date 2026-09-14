import Link from 'next/link'
import type { RadarClub } from '@/lib/succession/radar'
import type { ReviewedSuccessionCoach } from '@/lib/succession/research-fit'


function Situation({ coach }: { coach: ReviewedSuccessionCoach }) {
  const { eligibility } = coach
  return <div className="mt-2 text-xs leading-5 text-muted-foreground">
    <p className="font-medium text-foreground">{eligibility.headline}</p>
    <p>{eligibility.reason}</p>
    {eligibility.source && <p><a href={eligibility.source.url} target="_blank" rel="noreferrer" className="text-primary underline">{eligibility.source.title}</a> · checked {eligibility.source.checkedAt}</p>}
  </div>
}

function ScoreEvidence({ coach }: { coach: ReviewedSuccessionCoach }) {
  return <details className="mt-3 border-t border-border pt-3">
    <summary className="cursor-pointer text-xs font-semibold">Why this score?</summary>
    <div className="mt-3 space-y-3 text-xs leading-5">
      {coach.fit.dimensions.map(row => <div key={row.key}>
        <p className="font-semibold">{row.label}: {row.score}/100 × {row.weight.toFixed(1)}% = {row.contribution.toFixed(1)}</p>
        <p className="text-muted-foreground">Brief asks for: {row.required}. He shows: {row.recorded}.</p>
        <p className="text-muted-foreground">{row.explanation}</p>
      </div>)}
      <p>Add the contributions: {coach.fitScore}/100.</p>
      {coach.research.sources.map(source => <p key={source.url}>
        <a href={source.url} target="_blank" rel="noreferrer" className="text-primary underline">{source.title}</a>
        <span className="block text-muted-foreground">Period covered: {source.period}</span>
      </p>)}
      <p className="text-muted-foreground">Caveat: {coach.research.limitation}</p>
      <p className="font-semibold">Still to check by hand</p>
      <ul className="list-disc space-y-1 pl-4 text-muted-foreground">{coach.fit.manualChecks.map(check => <li key={check}>{check}</li>)}</ul>
    </div>
  </details>
}

function BriefSource({ plan }: { plan: RadarClub }) {
  const source = plan.requirements.source
  return <div className="mt-3 text-xs leading-5">
    <p className="text-muted-foreground">{source.message}</p>
    {source.mandateId && <Link href={`/mandates/${source.mandateId}/workspace`} className="mt-2 inline-block font-medium text-primary underline">Open {plan.club.name} source brief</Link>}
    {(source.choices.length > 1 || source.kind === 'needs-choice') && <div className="mt-3 space-y-2">
      <p className="font-semibold">Choose a source brief for this comparison</p>
      {source.choices.map(choice => <Link key={choice.id} href={`/succession/${plan.club.id}?briefId=${encodeURIComponent(choice.id)}`} className="block text-primary underline" aria-current={source.mandateId === choice.id ? 'page' : undefined}>
        {choice.objective || 'Objective not saved'} · {choice.createdAt.slice(0, 10)} · {choice.id.slice(0, 8)}
      </Link>)}
      <p className="text-muted-foreground">This changes the comparison view only; it does not update the club or succession plan.</p>
    </div>}
  </div>
}

export function ResearchRequirements({ plan }: { plan: RadarClub }) {
  const fromMandate = plan.requirements.source.kind === 'mandate'
  return <div id="succession-brief-source" className="rounded-lg border border-border bg-card p-4">
    <h2 className="text-sm font-semibold">Saved requirements used for comparison</h2>
    <BriefSource plan={plan} />
    {plan.requirements.source.kind === 'club' && <p className="mt-2 text-xs leading-5 text-muted-foreground">The original author, date and board approval of the club fields are not recorded here. No requirements are inferred from league, reputation or urgency.</p>}
    {fromMandate && <p className="mt-2 text-xs leading-5 text-muted-foreground">Saved inputs are shown below. Structured football answers override broad fields where the shared rule supports them. Other requirements remain manual checks; the coach calculation shows exactly what contributes.</p>}
    <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold">View saved inputs and priorities · {plan.requirements.dimensionCount} scored requirements</summary><dl className="mt-3 space-y-3">
      {plan.requirements.rows.map(row => <div key={row.field} className="border-b border-border pb-2 last:border-0">
        <dt className="text-xs font-semibold">{row.label}{row.priority ? ` · ${row.priority}` : ''}</dt>
        <dd className="mt-1 text-xs leading-5 text-muted-foreground">{row.savedValue ? `Saved ${fromMandate ? 'mandate' : 'club'} value: ${row.savedValue}` : 'Not saved'}
          {!fromMandate && <><br />{row.mappedValue ? `Used as: ${row.mappedValue}` : row.savedValue ? 'Not scored: clarify this value or assess it manually.' : 'Needs brief: agree this requirement.'}</>}
        </dd>
      </div>)}
    </dl></details>
    {plan.requirements.source.kind === 'club' && <Link href={`/clubs/${plan.club.id}`} className="mt-3 inline-block text-xs font-medium text-primary underline">Review and edit club requirements</Link>}
  </div>
}

export function ResearchComparison({ plan, returnTo, compact = false }: { plan: RadarClub; returnTo: string; compact?: boolean }) {
  const displayed = compact ? plan.suggestedCoaches.slice(0, 3) : plan.suggestedCoaches
  return <section className="rounded-lg border border-border bg-card p-4">
    <h2 className="text-sm font-semibold">Shadow shortlist</h2>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">Same ranking as the mandate’s Candidates tab. {plan.researchCoverage.reviewed} researched coaches scored; {plan.researchCoverage.unreviewed} directory records have no research yet and are left out rather than guessed.</p>
    <BriefSource plan={plan} />
    <details className="mt-3 text-xs leading-5">
      <summary className="cursor-pointer font-semibold">How the score is built</summary>
      <p className="mt-2 text-muted-foreground">Starting weights: playing identity 25, build-up 15, defending 15, relevant achievement 25, front-foot football in the match data 10, recent head-coach evidence 10. Essential build-up or defending counts 1.5 times, Flexible half. Weights are scaled to 100. Level scores are ordered by weight of recent verified matches, never by name.</p>
      <p className="mt-2 text-muted-foreground">Before anyone is listed we take out the current manager, coaches at Premier League rivals, elite clubs or national teams, and anyone without recent evidence. Contract, salary and interest are never scored or assumed.</p>
    </details>
    {!plan.requirements.ready ? <p className="mt-4 text-sm leading-6">{plan.requirements.source.kind === 'needs-choice' ? 'Choose which brief to rank against.' : 'Agree at least two football requirements before ranking names.'}</p>
      : !plan.suggestedCoaches.length ? <p className="mt-4 text-sm leading-6">Nobody left to rank once the current manager, unrealistic targets and thin evidence are taken out.</p>
        : <div className="mt-4 space-y-3">{displayed.map(coach => <article key={coach.id} className="rounded border border-border bg-background/40 p-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold"><span className="mr-2 text-xs font-normal text-muted-foreground">{coach.position ? `${coach.joint ? 'Joint ' : ''}#${coach.position}` : ''}</span><Link className="hover:text-primary" href={`/coaches/${coach.id}?returnTo=${encodeURIComponent(returnTo)}`}>{coach.research.name}</Link></h3>
            <p className="text-right text-sm font-semibold tabular-nums text-primary">{coach.fitScore}/100<span className="block text-[10px] font-normal text-muted-foreground">Fit with the brief</span></p>
          </div>
          {coach.aheadOfNext && <p className="mt-2 text-xs leading-5"><span className="font-semibold">Above the next man because:</span> {coach.aheadOfNext}</p>}
          <Situation coach={coach} />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{coach.research.summary}</p>
          <ScoreEvidence coach={coach} />
        </article>)}</div>}
    {compact && plan.suggestedCoaches.length > displayed.length && <Link href={`/succession/${plan.club.id}`} className="mt-3 inline-block text-xs font-medium text-primary underline">See all {plan.suggestedCoaches.length} and the saved requirements</Link>}
    {plan.excludedCoaches.length > 0 && <details className="mt-4 border-t border-border pt-3">
      <summary className="cursor-pointer text-sm font-semibold">Assessed but not on the list · {plan.excludedCoaches.length}</summary>
      {plan.excludedCoaches.map(coach => <div key={coach.id} className="mt-3 text-xs leading-5">
        <p className="font-semibold">{coach.research.name} · fit {coach.fitScore}</p>
        <Situation coach={coach} />
      </div>)}
    </details>}
    {plan.incumbentBenchmark && <details className="mt-4 border-t border-border pt-3 text-xs leading-5">
      <summary className="cursor-pointer font-semibold">Current manager, for comparison: {plan.incumbentBenchmark.research.name} · {plan.incumbentBenchmark.fitScore}/100</summary>
      <p className="mt-2 text-muted-foreground">The man in the job is the yardstick, not a successor.</p>
      <ScoreEvidence coach={plan.incumbentBenchmark} />
    </details>}
  </section>
}
