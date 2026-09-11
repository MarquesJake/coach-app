import Link from 'next/link'
import { summariseLeagueSample, type VerifiedExample } from '@/lib/demo/verified-examples'

export function VerifiedExampleCard({ example, showProfileLink = false }: { example: VerifiedExample; showProfileLink?: boolean }) {
  const sample = example.leagueSample ? summariseLeagueSample(example.leagueSample) : null
  return (
    <section className="rounded-md border border-emerald-800/20 bg-emerald-50/40 p-5 space-y-3 print:break-inside-avoid">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Source-checked public snapshot · {example.league}</p>
      <h2 className="font-serif text-xl">{example.coachName} · {example.clubName}</h2>
      <p className="text-xs text-muted-foreground">Reviewed {example.reviewedOn}. Only the statements below were checked, not every field on this profile.</p>
      <ul className="space-y-3 text-sm">
        {example.facts.map(fact => <li key={fact.text}><p>{fact.text}</p><a href={fact.url} target="_blank" rel="noreferrer" className="text-xs underline">{fact.sourceTitle} · {fact.asOf}</a></li>)}
      </ul>
      {sample && <div className="rounded border border-border bg-card p-3 text-sm">
        <p className="font-semibold">{example.leagueSampleSeason ?? 'Season not established'} observed league sample: {sample.played} games · {sample.points} points · {sample.ppg?.toFixed(2)} PPG</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">{example.leagueSample!.map(match => <li key={match.opponent}>{match.opponent}: {match.goalsFor}-{match.goalsAgainst} (Barnet score first)</li>)}</ul>
        <p className="mt-2 text-xs text-muted-foreground">Calculated from the cited results, not provider Elo, a whole-career rating, or an estimate of the manager&apos;s causal impact. Five matches are a small sample, not a live season table or final-season total.</p>
      </div>}
      <p className="text-sm"><strong>Why it matters:</strong> {example.use}</p>
      <p className="text-xs text-muted-foreground">Not established by this snapshot: recruitment availability, salary expectations, private references, coach consent or a client relationship.</p>
      {showProfileLink && <Link href={`/coaches/${example.coachId}`} className="inline-block text-sm underline">Open existing profile</Link>}
    </section>
  )
}
