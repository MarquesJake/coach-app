import Link from 'next/link'
import { researchProfileForName } from '@/lib/scoring/research/catalogue'

export function SourcedCoachResearch({ name, coachId }: { name: string; coachId: string }) {
  const profile = researchProfileForName(name)
  if (!profile) return null
  return <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sourced coach profile</p>
    <h2 className="mt-2 text-xl font-semibold">Research supporting the football comparison</h2>
    <p className="mt-3 text-sm leading-relaxed">{profile.summary}</p>
    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
      {Object.entries({ 'Playing identity': profile.style, 'Defensive approach': profile.pressing, 'Build-up': profile.build }).map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}
    </dl>
    <p className="mt-4 text-xs text-muted-foreground">These classifications are research interpretations of the periods below, not fields supplied by the match API or guarantees of future performance.</p>
    <p className="mt-3 text-sm"><strong>Documented experience:</strong> {profile.trackRecord.join(' · ') || 'No supported achievement classification recorded'}</p>
    <div className="mt-4 space-y-3">{profile.sources.map(source => <div key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{source.title}</a><p className="mt-1 text-xs text-muted-foreground">Evidence period: {source.period}</p></div>)}</div>
    <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{profile.limitation}</p>
    {profile.apiRecord && <details className="mt-4"><summary className="cursor-pointer text-sm font-medium">Provider career history and coverage</summary><p className="mt-3 text-xs text-muted-foreground">API-Football record retrieved {profile.apiRecord.retrievedAt}. Dates may be incomplete or overlap. A missing end date does not establish current employment or availability.</p><ul className="mt-3 space-y-2 text-sm">{profile.apiRecord.career.map((job, index) => <li key={index}>{job.club} · {job.start || 'Start unknown'} to {job.end || 'End not supplied'}</li>)}</ul></details>}
    <div className="mt-4 flex flex-wrap gap-4 text-sm"><Link href={`/coaches/${coachId}/data`} className="text-primary underline">Match data and coverage</Link><Link href={`/coaches/${coachId}/fit`} className="text-primary underline">Compare against a club brief</Link></div>
    <p className="mt-4 text-xs text-muted-foreground">Research depth is not appointment clearance. Salary, release clauses, willingness, references and squad suitability need separate evidence. Add analyst research questions and evidence below to develop this profile further.</p>
  </section>
}
