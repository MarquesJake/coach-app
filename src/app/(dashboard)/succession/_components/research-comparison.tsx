import Link from 'next/link'
import type { RadarClub } from '@/lib/succession/radar'
import type { ReviewedSuccessionCoach } from '@/lib/succession/research-fit'

function ScoreEvidence({ coach }: { coach: ReviewedSuccessionCoach }) {
  return <details className="mt-3 border-t border-border pt-3">
    <summary className="cursor-pointer text-xs font-semibold">Why this score? Sources and calculation</summary>
    <div className="mt-3 space-y-3 text-xs leading-5">
      {coach.fit.dimensions.map(row => <div key={row.key}>
        <p className="font-semibold">{row.label}: {row.score}/100 × {row.weight.toFixed(1)}% = {row.contribution.toFixed(1)} points</p>
        <p className="text-muted-foreground">Saved requirement mapped to: {row.required}. Research classification: {row.recorded}.</p>
        <p className="text-muted-foreground">{row.explanation}</p>
      </div>)}
      <p>Sum the contributions and round once: {coach.fitScore}/100.</p>
      {coach.research.sources.map(source => <p key={source.url}>
        <a href={source.url} target="_blank" rel="noreferrer" className="text-primary underline">{source.title}</a>
        <span className="block text-muted-foreground">Evidence period: {source.period}</span>
      </p>)}
      <p className="text-muted-foreground">{coach.research.limitation}</p>
      <p className="font-semibold">Still needs verification</p>
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
    <h2 className="text-sm font-semibold">Shadow shortlist · research comparisons</h2>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">{plan.researchCoverage.reviewed} reviewed profiles matched to accessible coach records; {plan.researchCoverage.unreviewed} records without this research and {plan.researchCoverage.ambiguous} ambiguous records are not scored. {plan.requirements.dimensionCount} supported saved requirements.</p>
    <BriefSource plan={plan} />
    <details className="mt-3 text-xs leading-5">
      <summary className="cursor-pointer font-semibold">Where do the benchmarks come from?</summary>
      <p className="mt-2 text-muted-foreground">Gaffa’s reviewed research profiles code tactics from dated public analyses and official club or league sources. They are compared with the selected saved requirements, using the same published decision rule as appointment briefs. API-Football identifies coaches and records careers; it does not supply these tactical assessments.</p>
      <p className="mt-2 text-muted-foreground">Starting weights: playing identity 30, build-up 20, defensive approach 20, relevant achievement 30. Structured in-possession and out-of-possession priorities multiply their base weights: Essential × 1.5, Preferred × 1, Flexible × 0.5. Only supported requirements contribute, with active weights normalised to 100%. At least two are needed. These are editorial comparison rules, not validated success probabilities or market rankings. Equal scores are ties; names determine display order.</p>
      <p className="mt-2 text-muted-foreground">Succession urgency is separate. Contract status, salary, release terms and willingness are not scored or inferred; being under contract does not exclude a coach. Each profile’s calculation and dated sources are below.</p>
    </details>
    {!plan.requirements.ready ? <p className="mt-4 text-sm leading-6">{plan.requirements.source.kind === 'needs-choice' ? 'Choose a source brief above to compare coaches.' : `Needs brief: agree at least two supported requirements in the ${plan.requirements.source.kind === 'mandate' ? 'source mandate brief' : 'club profile'} before comparing names. Inferred defaults do not receive fit scores.`}</p>
      : !plan.suggestedCoaches.length ? <p className="mt-4 text-sm leading-6">Needs research: no reviewed successor profiles could be matched unambiguously to the loaded coach records. No unreviewed names are substituted.</p>
        : <div className="mt-4 space-y-3">{displayed.map(coach => <article key={coach.id} className="rounded border border-border bg-background/40 p-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold"><Link className="hover:text-primary" href={`/coaches/${coach.id}?returnTo=${encodeURIComponent(returnTo)}`}>{coach.research.name}</Link></h3>
            <p className="text-right text-sm font-semibold tabular-nums text-primary">{coach.fitScore}/100<span className="block text-[10px] font-normal text-muted-foreground">Football fit</span></p>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{coach.research.summary}</p>
          <ScoreEvidence coach={coach} />
        </article>)}</div>}
    {compact && plan.suggestedCoaches.length > displayed.length && <Link href={`/succession/${plan.club.id}`} className="mt-3 inline-block text-xs font-medium text-primary underline">View all {plan.suggestedCoaches.length} comparisons and saved requirements</Link>}
    {plan.incumbentBenchmark && <details className="mt-4 border-t border-border pt-3 text-xs leading-5">
      <summary className="cursor-pointer font-semibold">Recorded manager comparison: {plan.incumbentBenchmark.research.name} · {plan.incumbentBenchmark.fitScore}/100</summary>
      <p className="mt-2 text-muted-foreground">Matched to the club’s saved manager field and shown separately from successors. This is a comparison reference, not independent confirmation of current employment.</p>
      <ScoreEvidence coach={plan.incumbentBenchmark} />
    </details>}
  </section>
}
