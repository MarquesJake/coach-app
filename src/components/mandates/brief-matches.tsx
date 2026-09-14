import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { calculateResearchFit, normalizeCoachName, type RankingBrief } from '@/lib/scoring/research/brief-fit'
import { RESEARCH_PROFILES } from '@/lib/scoring/research/profiles'
import { safeDecisionBrief } from '@/lib/mandates/decision-brief'

/** Read-only recomputation: saving a new brief never leaves a stale score snapshot. */
export async function BriefMatches({ mandate }: { mandate: RankingBrief & { id: string } }) {
  const appointmentBrief = safeDecisionBrief(mandate.decision_brief)
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from('coaches').select('id,name').order('name').limit(1000)
  if (error) return <section className="my-6 rounded-xl border border-border p-5"><h2 className="font-semibold">Matches from this brief</h2><p role="alert" className="mt-2 text-sm">Coach records could not be loaded. Refresh to calculate the matches.</p></section>
  const matches = RESEARCH_PROFILES.flatMap(profile => {
    // Tottenham's commissioned study treats De Zerbi as the incumbent benchmark.
    if (mandate.id === '09420a64-b4d2-4245-8088-af0dc88266eb' && profile.apiId === 2424) return []
    const aliases = new Set([profile.name, ...profile.aliases].map(normalizeCoachName))
    const records = (data ?? []).filter(row => aliases.has(normalizeCoachName(row.name)))
    const record = records.find(row => row.name === profile.name) ?? records.sort((a, b) => a.id.localeCompare(b.id))[0]
    if (!record) return []
    const result = calculateResearchFit(mandate, profile)
    return result.score === null ? [] : [{ profile, record, result }]
  }).sort((a, b) => b.result.score! - a.result.score! || a.profile.name.localeCompare(b.profile.name))
  const first = matches[0]
  return <section id="brief-matches" className="my-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brief-driven research · scoring rules v1</p><h2 className="mt-1 text-xl font-semibold">Your top three football matches</h2></div>
      <Link href={`/mandates/${mandate.id}/edit`} className="text-sm text-primary underline underline-offset-4">Change the brief</Link>
    </div>
    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Calculated from the saved brief and sourced coach research. A fit score measures alignment with the assessed requirements; it is not a probability of success or confirmation that a coach can be appointed.</p>
    <details className="mt-4 rounded-lg border border-border bg-muted/30 p-4"><summary className="cursor-pointer text-sm font-medium">Could this club secure the appointment?</summary>
      <p className="mt-3 text-sm text-muted-foreground">Feasibility depends on this club and this deal. Being under contract does not automatically exclude a coach. A verified release clause within the club’s compensation budget may create a realistic route, subject to its conditions, salary, staff costs and the coach’s interest.</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">{[['salary', 'Head coach salary'], ['staff_budget', 'Staff budget'], ['compensation', 'Compensation budget']].map(([key, label]) => <div key={key}><dt className="font-medium">{label}</dt><dd className="mt-1 text-muted-foreground">{appointmentBrief[key as keyof typeof appointmentBrief]?.value || 'Not yet agreed in this brief'}</dd></div>)}</dl>
      <p className="mt-3 text-xs text-muted-foreground">Network intelligence can identify a route to a deal. Record the source, date, currency, amount and clause conditions, then verify them before describing the coach as attainable. Unknown terms remain unresolved; they do not lower football fit or establish availability.</p>
    </details>
    {mandate.id === '09420a64-b4d2-4245-8088-af0dc88266eb' && <p className="mt-2 text-xs text-muted-foreground">De Zerbi is the current-manager benchmark for this study and is excluded from successor matches.</p>}
    {!first ? <p className="mt-5 text-sm">Agree at least two of playing identity, build-up, defensive approach and a supported strategic objective to calculate a useful comparison. Only researched profiles in your accessible coach database are included.</p> : <>
      <p className="mt-3 text-xs text-muted-foreground">{matches.length} researched profiles compared from {data?.length ?? 0} accessible records. Profiles without this research are outside this comparison. Recalculated when the brief changes. Equal scores are ties; names only determine their display order.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {matches.slice(0, 3).map(({ profile, record, result }, index) => <article key={record.id} className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{index && matches[index - 1].result.score === result.score ? 'Joint match' : `Match ${index + 1}`}</span><span className="text-xs font-medium text-muted-foreground">Football fit</span></div>
          <h3 className="mt-3 text-lg font-semibold"><Link className="hover:underline" href={`/coaches/${record.id}`}>{profile.name}</Link></h3>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-primary">{result.score}<span className="text-base font-normal text-muted-foreground"> / 100</span></p>
          <p className="mt-3 text-sm leading-relaxed">{profile.summary}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{profile.limitation}</p>
          <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-sm font-medium">Why this score?</summary>
            <div className="mt-3 space-y-3">{result.dimensions.map(row => <div key={row.key} className="text-xs leading-relaxed"><p className="font-semibold">{row.label}: {row.score}/100 × {row.weight.toFixed(1)}% = {row.contribution.toFixed(1)} points</p><p className="mt-1 text-muted-foreground">Brief: {row.required}. Research: {row.recorded}.</p><p className="mt-1 text-muted-foreground">{row.explanation}</p></div>)}<p className="text-xs font-medium">Sum the contributions, then round once: {result.score}/100.</p></div>
            <div className="mt-4 space-y-2">{profile.sources.map(source => <p key={source.url} className="text-xs"><a className="text-primary underline" href={source.url} target="_blank" rel="noreferrer">{source.title}</a><span className="mt-1 block text-muted-foreground">Evidence period: {source.period}</span></p>)}</div>
            {profile.apiRecord && <div className="mt-4 text-xs"><p className="font-semibold">API-Football career records · retrieved {profile.apiRecord.retrievedAt}</p><ul className="mt-2 space-y-1 text-muted-foreground">{profile.apiRecord.career.map((job, index) => <li key={index}>{job.club}: {job.start ?? 'Start not recorded'} to {job.end ?? 'end not supplied'}</li>)}</ul><p className="mt-2 text-muted-foreground">Provider dates may be incomplete or overlapping. An absent end date does not establish a current job or availability.</p></div>}
          </details>
        </article>)}
      </div>
      <details className="mt-5 border-t border-border pt-4"><summary className="cursor-pointer text-sm font-medium">All {matches.length} matches and how the brief affects them</summary>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="py-2">Coach</th><th>Football fit</th><th>Identity · defence · build-up</th></tr></thead><tbody>{matches.map(({ profile, record, result }) => <tr key={record.id} className="border-b border-border"><td className="py-2"><Link className="text-primary hover:underline" href={`/coaches/${record.id}`}>{profile.name}</Link></td><td className="tabular-nums">{result.score}/100</td><td>{profile.style} · {profile.pressing} · {profile.build}</td></tr>)}</tbody></table></div>
        <p className="mt-4 text-sm text-muted-foreground">Base weights: playing identity 30, build-up 20, defensive approach 20, relevant achievement 30. In-possession and out-of-possession priorities multiply their weight by 1.5 for Essential, 1 for Preferred and 0.5 for Flexible. Active weights are then normalised to 100%. Unrecognised or unanswered criteria are not scored.</p>
        <p className="mt-2 text-sm text-muted-foreground">These are explicit starting rules, not learned probabilities. Tactical categories are our research interpretations of the cited periods. API-Football supplies identity and career records, not these assessments. A top score still requires the checks below before recommendation.</p>
      </details>
      <details className="mt-4 border-t border-border pt-4"><summary className="cursor-pointer text-sm font-medium">Requirements still needing evidence and analyst review</summary><p className="mt-3 text-sm text-muted-foreground">These answers remain part of the brief but do not silently become numeric scores. Essential requirements must be resolved before an appointment recommendation.</p><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">{first.result.manualChecks.map((item, index) => <li key={index}>{item}</li>)}</ul></details>
    </>}
  </section>
}
