import snapshot from '@/lib/integrations/coach-match-snapshots.json'
import { RESEARCH_PROFILES } from '@/lib/scoring/research/profiles'
import { normalizeCoachName } from '@/lib/scoring/research/brief-fit'
import type { CoachMatchMetrics, MatchMetric } from '@/lib/integrations/coach-match-metrics'

type Period = { club: string; season: number; first: string; last: string; metrics: CoachMatchMetrics }
type CoachSnapshot = { apiId: number; name: string; periods: Period[]; limitations: string[] }
const coaches = snapshot.coaches as CoachSnapshot[]
function number(value: number | null, digits = 2) { return value === null ? 'Not available' : value.toLocaleString('en-GB', { maximumFractionDigits: digits }) }
function coverage(metric: MatchMetric<unknown>) { return `${metric.coverage.coveredMatches}/${metric.coverage.eligibleMatches} matches covered` }
function date(value: string) { return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) }

/** Published provider snapshot; never fills a missing field from the illustrative dossier. */
export function VerifiedMatchEvidence({ coachName }: { coachName: string }) {
  const identity = normalizeCoachName(coachName)
  const research = RESEARCH_PROFILES.find(profile => [profile.name, ...profile.aliases].some(name => normalizeCoachName(name) === identity))
  const coach = coaches.find(row => row.apiId === research?.apiId)
  if (!coach?.periods.length) return <section className="my-6 rounded-xl border border-border bg-card p-5 print:break-inside-avoid"><h2 className="font-semibold">Verified match data</h2><p className="mt-2 text-sm text-muted-foreground">A checked match dataset has not yet been published for this coach. Illustrative figures elsewhere in the dossier are labelled demo data.</p></section>
  return <section aria-label="Verified match data" className="my-6 rounded-xl border border-emerald-600/40 bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Verified match data</h2><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200">API-Football · calculated from match records</span></div>
    <p className="mt-2 text-sm text-muted-foreground">Historical league matches attributed to {coach.name} by the coach ID in the provider’s lineup. These are real provider records and transparent calculations, not demo figures. Provider errors and incomplete coverage remain possible.</p>
    <p className="mt-2 text-xs text-muted-foreground">Snapshot retrieved {date(snapshot.retrievedAt)}. Each club and season is shown separately. This is a published snapshot, not a live feed or a claim about current employment.</p>
    <div className="mt-5 space-y-4">{coach.periods.map((period, index) => {
      const m = period.metrics
      const results = m.results.value
      const rows: [string, MatchMetric<number>, string?][] = [
        ['Points per match', m.pointsPerMatch], ['Possession (average)', m.possession, '%'], ['xG for per match', m.xgFor], ['xG against per match', m.xgAgainst],
        ['Points from losing positions', m.pointsFromLosingPositions], ['Points after conceding first', m.pointsAfterConcedingFirst], ['Goals by substitutes', m.goalsBySubstitutes], ['First substitution (average minute)', m.averageFirstSubstitutionMinute],
      ]
      return <details key={`${period.club}-${period.season}`} open={index === 0} className="rounded-lg border border-border p-4 print:break-inside-avoid">
        <summary className="cursor-pointer font-medium">{period.club} · season starting {period.season} · {m.selection.includedMatches} matches</summary>
        <p className="mt-2 text-xs text-muted-foreground">Included dates: {date(period.first)} – {date(period.last)}. Only attributable matches in this collection are included.</p>
        {results && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[[`${results.wins}–${results.draws}–${results.losses}`, 'Won · drawn · lost'], [results.points, 'Match points'], [results.goalsFor, 'Goals for'], [results.goalsAgainst, 'Goals against']].map(([value, label]) => <div className="rounded-lg bg-muted/50 p-3" key={label}><p className="text-xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</div>}
        <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="py-2">Measure</th><th>Value</th><th>Coverage</th></tr></thead><tbody>{rows.map(([label, metric, suffix]) => <tr className="border-b border-border" key={label}><td className="py-2 pr-3">{label}</td><td className="pr-3 tabular-nums">{number(metric.value)}{metric.value === null ? '' : suffix}</td><td className="text-xs text-muted-foreground">{coverage(metric)}</td></tr>)}</tbody></table></div>
        <p className="mt-3 text-xs text-muted-foreground">Missing matches are excluded, not counted as zero. Totals with partial coverage are observed totals, not season totals. First-substitution average uses {m.averageFirstSubstitutionMinute.coverage.denominator} matches with substitutions; {m.averageFirstSubstitutionMinute.matchesWithoutSubstitutions} confirmed matches without substitutions are excluded.</p>
        <h3 className="mt-5 text-sm font-semibold">Results over the observed period</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">{m.windows.map(window => <div className="rounded-lg bg-muted/50 p-3" key={window.key}><p className="text-xs font-medium">Observed matches {window.key}</p><p className="mt-1 text-lg font-semibold">{number(window.metrics.pointsPerMatch.value)} <span className="text-xs font-normal">points per match</span></p><p className="mt-1 text-xs text-muted-foreground">{window.dateRange ? `${date(window.dateRange.first)} – ${date(window.dateRange.last)}` : 'No matches in this window'}</p></div>)}</div>
        <p className="mt-2 text-xs text-muted-foreground">These windows restart within this club-season sample. They are not necessarily the first games of the appointment and do not measure the coach’s causal impact.</p>
        <p className="mt-4 text-sm"><strong>Reported starting formations:</strong> {m.formations.value ? Object.entries(m.formations.value).map(([shape, count]) => `${shape}: ${count} matches`).join(' · ') : 'Not available'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{coverage(m.formations)}. Starting formations do not establish in-game shape or style.</p>
        <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-xs font-medium">Calculation rules and excluded data</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{m.limitations.map(rule => <li key={rule}>{rule}</li>)}</ul>{m.diagnostics.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{m.diagnostics.length} data checks excluded an unsupported measure. Reasons: {[...new Set(m.diagnostics.map(item => item.reason))].join(', ')}.</p>}</details>
      </details>
    })}</div>
    <p className="mt-4 text-xs text-muted-foreground">Source: <a className="text-primary underline" href="https://www.api-football.com/documentation-v3" target="_blank" rel="noreferrer">API-Football fixtures, lineups, events and match statistics</a>. Tactical research and the brief-fit rules are separate; these figures are not a probability of appointment success.</p>
  </section>
}
