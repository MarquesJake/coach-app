import type { ResearchProfile } from '@/lib/scoring/research/brief-fit'

type ProviderRecord = NonNullable<ResearchProfile['apiRecord']>

/** Adapter target for an exactly resolved provider identity; career dates cannot supply results. */
export function ProviderCareerEvidence({ coachName, apiId, record, coachId, hasMatchEvidence, showMissingMetrics = true, sourceUrl, limitations = [] }: {
  showMissingMetrics?: boolean
  sourceUrl?: string
  limitations?: readonly string[]
  hasMatchEvidence: boolean
  coachName: string
  apiId: number
  record: ProviderRecord
  coachId?: string
}) {
  const periods = [...record.career].sort((a, b) => (b.start ?? '').localeCompare(a.start ?? ''))
  if (!periods.length) return null
  const bounded = periods.filter(period => period.start && period.end).length
  return <section aria-label={`Provider career evidence: ${coachName}`} className="my-6 rounded-xl border border-border bg-card p-5 sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Historical provider record</p>
    <h2 className="mt-2 text-xl font-semibold">{coachName}: the recorded career</h2>
    <p className="mt-3 text-sm leading-relaxed">The provider lists {periods.length} career entries, including {bounded} with both start and end dates. These entries identify periods to investigate; they do not establish match results, achievements or current employment.</p>
    <p className="mt-2 text-xs text-muted-foreground">API-Football coach ID {apiId} · Retrieved {record.retrievedAt}. Provider entries may overlap or repeat; they are not necessarily distinct appointments.</p>
    <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Provider career periods, most recent recorded start first</caption><thead><tr className="border-b"><th scope="col" className="py-2 pr-4">Club</th><th scope="col" className="pr-4">Recorded start</th><th scope="col" className="pr-4">Recorded end</th><th scope="col">Date coverage</th></tr></thead><tbody>{periods.map((period, index) => <tr key={`${period.club}-${period.start}-${index}`} className="border-b"><th scope="row" className="py-3 pr-4 font-medium">{period.club}</th><td className="pr-4 tabular-nums">{period.start ?? 'Not supplied'}</td><td className="pr-4 tabular-nums">{period.end ?? 'Not supplied'}</td><td className="text-xs text-muted-foreground">{period.start && period.end ? 'Both boundaries recorded' : 'Incomplete dates'}</td></tr>)}</tbody></table></div>
    <p className="mt-3 text-xs text-muted-foreground">A missing end date is an unknown boundary, not evidence that the coach remains at that club. Dates alone cannot attribute individual fixtures to the coach.</p>
    {!hasMatchEvidence && showMissingMetrics && <>
    <h3 className="mt-6 font-semibold">Results and match-data coverage</h3>
    <p className="mt-2 text-sm text-muted-foreground">No checked match sample is attached to this view. Each heading is retained below; none of these measures can be calculated from the career record alone.</p>
    <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Match measures awaiting attributed fixture evidence</caption><thead><tr className="border-b"><th scope="col" className="py-2 pr-4">Measure</th><th scope="col" className="pr-4">Value</th><th scope="col">Evidence needed</th></tr></thead><tbody>{[
      ['Won · drawn · lost', 'Attributed completed fixtures'],
      ['Match points', 'Attributed completed fixtures'],
      ['Goals for / Goals against', 'Attributed fixture scores'],
      ['Points per match', 'Attributed completed fixtures'],
      ['Possession (average)', 'Per-match possession statistics'],
      ['xG for per match', 'Provider xG statistics'],
      ['xG against per match', 'Provider xG statistics'],
      ['Points from losing positions', 'Complete, reconciled goal events'],
      ['Points after conceding first', 'Complete, reconciled goal events'],
      ['Goals by substitutes', 'Lineups and reconciled substitution/goal events'],
      ['First substitution (average minute)', 'Lineups and complete substitution events'],
      ['Reported starting formations', 'Coach-attributed starting lineups'],
      ['Results over the observed period', 'Dated, attributed fixture sequence'],
    ].map(([label, evidence]) => <tr key={label} className="border-b"><th scope="row" className="py-2 pr-4 font-normal">{label}</th><td className="pr-4 text-muted-foreground">Not available</td><td className="text-xs text-muted-foreground">{evidence}</td></tr>)}</tbody></table></div>
    </>}
    <p className="mt-4 text-xs text-muted-foreground">Source: <a href={sourceUrl ?? "https://www.api-football.com/documentation-v3"} target="_blank" rel="noreferrer" className="text-primary underline">API-Football coach career records</a>. This is provider history, not independently verified performance research.</p>
    {limitations.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{limitations.map(item => <li key={item}>{item}</li>)}</ul>}
    {coachId && <div className="mt-4 flex flex-wrap gap-4 text-sm"><a href={`/coaches/${coachId}/career`} className="text-primary underline">Review career evidence</a><a href={`/coaches/${coachId}/research`} className="text-primary underline">Research these periods</a></div>}
  </section>
}
