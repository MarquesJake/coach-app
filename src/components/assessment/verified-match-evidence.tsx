import snapshot from '@/lib/integrations/coach-match-snapshots.json'
import { researchProfileForName } from '@/lib/scoring/research/catalogue'
import type { CoachMatchMetrics, MatchMetric } from '@/lib/integrations/coach-match-metrics'

type ChronologyRule = { apiIds: number[]; teamId: number; fromSeason: number; notBefore?: string; notAfter?: string; sourceUrl: string; checkedAt: string; note: string }
type Period = { sourceRetrievalRange?: { earliest: string | null; latest: string | null; undatedFixtureReferences: number }; chronologyRules?: ChronologyRule[]; excludedForOfficialChronology?: number; club: string; season: number; first: string; last: string; metrics: CoachMatchMetrics; lineupCoachId?: number; identityEvidence?: { sourceUrl?: string; checkedAt?: string; kind?: string } }
type CoachSnapshot = { apiId: number; name: string; periods: Period[]; limitations: string[] }
const coaches = snapshot.coaches as CoachSnapshot[]
function number(value: number | null, digits = 2) { return value === null ? 'Not available' : value.toLocaleString('en-GB', { maximumFractionDigits: digits }) }
function linkedText(text: string) { return text.split(/(https:\/\/[^\s]+)/g).map((part, index) => part.startsWith('https://') ? <a key={index} href={part} target="_blank" rel="noreferrer" className="text-primary underline">{part}</a> : part) }
function coverage(metric: MatchMetric<unknown>) { return `${metric.coverage.coveredMatches}/${metric.coverage.eligibleMatches} matches covered` }
function periodIdentity(period: Period, apiId: number) { return period.lineupCoachId !== undefined ? `lineup coach ID ${period.lineupCoachId}` : `provider coach ID ${apiId}` }
function date(value: string | null | undefined) { if (!value || !Number.isFinite(Date.parse(value))) return 'Not supplied'; return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) }

/** Ordered, reviewed provider IDs only; select one snapshot rather than double-count duplicate providers. */
export function matchSnapshotForApiIds(apiIds: readonly number[]) {
  return apiIds.map(apiId => coaches.find(row => row.apiId === apiId)).find(row => row && row.periods.length > 0)
}

/** Published provider snapshot; never fills a missing field from the illustrative dossier. */
export function VerifiedMatchEvidence({ coachName, apiIds, hideMissing = false }: { coachName: string; apiIds?: readonly number[]; hideMissing?: boolean }) {
  const research = researchProfileForName(coachName)
  const resolvedIds = [...new Set(apiIds ?? (research ? [research.apiId] : []))]
  const available = resolvedIds.filter(apiId => matchSnapshotForApiIds([apiId]))
  if (available.length > 1) return <div><p className="my-4 rounded-lg border border-border p-4 text-sm text-muted-foreground">Multiple reviewed provider identities have match samples. Each is shown separately below. Periods can overlap; do not add their matches or metrics together.</p>{available.map(apiId => <VerifiedMatchEvidence key={apiId} coachName={coachName} apiIds={[apiId]} />)}</div>
  const coach = matchSnapshotForApiIds(resolvedIds)
  if (!coach?.periods.length && hideMissing) return null
  if (!coach?.periods.length) return <section className="my-6 rounded-xl border border-border bg-card p-5 print:break-inside-avoid"><h2 className="font-semibold">Verified match data</h2><p className="mt-2 text-sm text-muted-foreground">A checked match dataset has not yet been published for this coach. Illustrative figures elsewhere in the dossier are labelled demo data.</p><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Measures without a published match sample</caption><thead><tr><th scope="col">Measure</th><th scope="col">Value</th><th scope="col">Coverage</th></tr></thead><tbody>{['Won · drawn · lost', 'Match points', 'Goals for / Goals against', 'Points per match', 'Possession (average)', 'xG for per match', 'xG against per match', 'Points from losing positions', 'Points after conceding first', 'Goals by substitutes', 'First substitution (average minute)', 'Reported starting formations', 'Results over the observed period'].map(label => <tr key={label} className="border-t"><th scope="row" className="py-2 pr-3 font-normal">{label}</th><td className="pr-3">Not available</td><td className="text-xs text-muted-foreground">Not established</td></tr>)}</tbody></table></div></section>
  const periods = [...coach.periods].sort((a, b) => b.last.localeCompare(a.last))
  return <section aria-label="Verified match data" className="my-6 rounded-xl border border-emerald-600/40 bg-card p-5 sm:p-6">
    <style>{'@media print { .match-period::details-content { display: block; content-visibility: visible; } .match-period > :not(summary) { display: block !important; } }'}</style>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Verified match data</h2><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200">API-Football · calculated from match records</span></div>
    <p className="mt-2 text-sm text-muted-foreground">Historical matches attributed to {coach.name} using the recorded lineup coach or a separately bounded tenure fallback, as shown for each period. These are real provider records and transparent calculations, not demo figures. Provider errors and incomplete coverage remain possible.</p>
    <p className="mt-2 text-xs text-muted-foreground">Provider coach ID {coach.apiId} · Snapshot dated {date(snapshot.retrievedAt)}. Individual source records may have been retrieved earlier and reused. Each club, season and provider-ID slice is shown separately. This is a published snapshot, not a live feed or a claim about current employment.</p>
    <div className="mt-5 rounded-lg bg-muted/40 p-4">
      <h3 className="font-semibold">Explore the observed record</h3>
      <p className="mt-2 text-sm text-muted-foreground">{periods.length} observed {periods.length === 1 ? 'slice' : 'slices'} available. Each slice covers only its attributed matches, not necessarily the whole season. Provider-ID slices can overlap; do not add their matches or metrics together. Compare results alongside the coverage for each measure. Samples may differ in length, competition and squad; they are not a ranking of coaching quality.</p>
      <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Available periods, results and statistical coverage</caption><thead><tr className="border-b"><th scope="col" className="py-2 pr-4">Club / season / provider ID</th><th scope="col" className="pr-4">Observed matches</th><th scope="col" className="pr-4">Points per match</th><th scope="col" className="pr-4">Possession coverage</th><th scope="col">xG coverage (for / against)</th></tr></thead><tbody>{periods.map((period, index) => <tr key={`${period.club}-${period.season}-${index}`} className="border-b"><th scope="row" className="py-3 pr-4 font-medium"><a className="text-primary underline underline-offset-4" href={`#match-period-${coach.apiId}-${index}`}>{period.club} · {period.season} · {periodIdentity(period, coach.apiId)}</a><span className="mt-1 block text-xs font-normal text-muted-foreground">{date(period.first)} – {date(period.last)}</span></th><td className="pr-4 tabular-nums">{period.metrics.selection.includedMatches}</td><td className="pr-4 tabular-nums">{number(period.metrics.pointsPerMatch.value)}</td><td className="pr-4 text-xs">{coverage(period.metrics.possession)}</td><td className="text-xs">{coverage(period.metrics.xgFor)} / {coverage(period.metrics.xgAgainst)}</td></tr>)}</tbody></table></div>
    </div>
    {coach.limitations.length > 0 && <aside className="mt-4 rounded-lg border border-amber-300 p-4"><h3 className="text-sm font-semibold">Collection coverage</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{coach.limitations.map(item => <li key={item}>{linkedText(item)}</li>)}</ul></aside>}
    <div className="mt-5 space-y-4">{periods.map((period, index) => {
      const m = period.metrics
      const results = m.results.value
      const rows: [string, MatchMetric<number>, string?][] = [
        ['Points per match', m.pointsPerMatch], ['Possession (average)', m.possession, '%'], ['xG for per match', m.xgFor], ['xG against per match', m.xgAgainst],
        ['Points from losing positions', m.pointsFromLosingPositions], ['Points after conceding first', m.pointsAfterConcedingFirst], ['Goals by substitutes', m.goalsBySubstitutes], ['First substitution (average minute)', m.averageFirstSubstitutionMinute],
      ]
      return <details key={`${period.club}-${period.season}-${index}`} open={index === 0} className="match-period scroll-mt-24 rounded-lg border border-border p-4 print:break-inside-avoid">
        <summary className="cursor-pointer font-medium">{period.club} · season starting {period.season} · {periodIdentity(period, coach.apiId)} · {m.selection.includedMatches} observed matches · {number(m.pointsPerMatch.value)} points/match{results ? ` · ${results.wins}W ${results.draws}D ${results.losses}L` : ''}</summary>
        <h3 id={`match-period-${coach.apiId}-${index}`} tabIndex={-1} className="mt-3 scroll-mt-24 text-sm font-semibold">{period.club} · {period.season} · {periodIdentity(period, coach.apiId)}: slice results and coverage</h3>
        <p className="mt-2 text-xs text-muted-foreground">Included dates: {date(period.first)} – {date(period.last)}. Only attributable matches in this collection are included.</p>
        {period.sourceRetrievalRange && <p className="mt-2 text-xs text-muted-foreground">Source records retrieved: {date(period.sourceRetrievalRange.earliest)} – {date(period.sourceRetrievalRange.latest)}. {period.sourceRetrievalRange.undatedFixtureReferences} fixture references without a recorded retrieval date.</p>}
        <p className="mt-2 text-xs text-muted-foreground">Attribution: {m.selection.verifiedLineupMatches} lineup-confirmed; {m.selection.tenureFallbackMatches} bounded-tenure fallback. {m.selection.excluded.length} supplied matches excluded.</p>
        {(period.chronologyRules?.length || (period.excludedForOfficialChronology ?? 0) > 0) ? <aside className="mt-3 rounded-lg border border-amber-300 p-3 text-xs text-muted-foreground">
          <h4 className="font-semibold">Official chronology checks</h4>
          <p className="mt-1">{period.excludedForOfficialChronology === undefined ? 'An exclusion count is not supplied for this slice.' : `${period.excludedForOfficialChronology} provider-labelled ${period.excludedForOfficialChronology === 1 ? 'observation excluded' : 'observations excluded'} from this slice because of official chronology conflicts.`} Excluded matches are not reassigned to another coach.</p>
          {period.chronologyRules?.map((rule, ruleIndex) => <div key={ruleIndex} className="mt-2">
            <p>{rule.note}</p>
            <p>{rule.notBefore && `Not before ${rule.notBefore}. `}{rule.notAfter && `Not after ${rule.notAfter}. `}Reviewed {rule.checkedAt}.</p>
            {rule.sourceUrl.startsWith('https://') && <a href={rule.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline">Official source for this period’s chronology</a>}
          </div>)}
        </aside> : null}
        {period.lineupCoachId !== undefined && period.lineupCoachId !== coach.apiId && <aside className="mt-3 rounded-lg border border-border p-3 text-xs text-muted-foreground">
          <p>This period uses lineup coach ID {period.lineupCoachId}, linked to profile provider ID {coach.apiId} by a reviewed identity decision. Original lineup IDs are preserved; this does not establish current employment.</p>
          {period.identityEvidence?.sourceUrl?.startsWith('https://') && <p className="mt-1"><a href={period.identityEvidence.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline">Public source supporting this period’s identity link</a>{period.identityEvidence.checkedAt && ` · Reviewed ${period.identityEvidence.checkedAt}`}</p>}
          {!period.identityEvidence?.sourceUrl?.startsWith('https://') && <p className="mt-1">A public identity-review link is not included in this snapshot.</p>}
        </aside>}
        {results && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[[`${results.wins}–${results.draws}–${results.losses}`, 'Won · drawn · lost'], [results.points, 'Match points'], [results.goalsFor, 'Goals for'], [results.goalsAgainst, 'Goals against']].map(([value, label]) => <div className="rounded-lg bg-muted/50 p-3" key={label}><p className="text-xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</div>}
        <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="py-2">Measure</th><th>Value</th><th>Coverage</th></tr></thead><tbody>{rows.map(([label, metric, suffix]) => <tr className="border-b border-border" key={label}><td className="py-2 pr-3">{label}</td><td className="pr-3 tabular-nums">{number(metric.value)}{metric.value === null ? '' : suffix}</td><td className="text-xs text-muted-foreground">{coverage(metric)}</td></tr>)}</tbody></table></div>
        <p className="mt-3 text-xs text-muted-foreground">Missing matches are excluded, not counted as zero. Totals with partial coverage are observed totals, not season totals. First-substitution average uses {m.averageFirstSubstitutionMinute.coverage.denominator} matches with substitutions; {m.averageFirstSubstitutionMinute.matchesWithoutSubstitutions} confirmed matches without substitutions are excluded.</p>
        <h3 className="mt-5 text-sm font-semibold">Results over the observed period</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">{m.windows.map(window => <div className="rounded-lg bg-muted/50 p-3" key={window.key}><p className="text-xs font-medium">Observed matches {window.key}</p><p className="mt-1 text-lg font-semibold">{number(window.metrics.pointsPerMatch.value)} <span className="text-xs font-normal">points per match</span></p><p className="mt-1 text-xs text-muted-foreground">{window.dateRange ? `${date(window.dateRange.first)} – ${date(window.dateRange.last)}` : 'No matches in this window'}</p></div>)}</div>
        <p className="mt-2 text-xs text-muted-foreground">These windows restart within this provider-ID slice of the club-season sample. They are not necessarily the first games of the appointment and do not measure the coach’s causal impact.</p>
        <p className="mt-4 text-sm"><strong>Reported starting formations:</strong> {m.formations.value ? Object.entries(m.formations.value).map(([shape, count]) => `${shape}: ${count} matches`).join(' · ') : 'Not available'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{coverage(m.formations)}. Starting formations do not establish in-game shape or style.</p>
        <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-xs font-medium">Calculation rules and excluded data</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{m.limitations.map(rule => <li key={rule}>{rule}</li>)}</ul>{m.diagnostics.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{m.diagnostics.length} data checks excluded an unsupported measure. Reasons: {[...new Set(m.diagnostics.map(item => item.reason))].join(', ')}.</p>}</details>
      </details>
    })}</div>
    <p className="mt-4 text-xs text-muted-foreground">Source: <a className="text-primary underline" href="https://www.api-football.com/documentation-v3" target="_blank" rel="noreferrer">API-Football fixtures, lineups, events and match statistics</a>. Tactical research and the brief-fit rules are separate; these figures are not a probability of appointment success.</p>
  </section>
}
