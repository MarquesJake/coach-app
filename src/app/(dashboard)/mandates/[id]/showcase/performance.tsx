import 'server-only'
import data from '@/lib/mandates/showcase/performance.json'
import { ChevronDown } from 'lucide-react'

type CoachKey = keyof typeof data.notes
const number = (n: number | null) => n === null ? 'Not available' : n.toFixed(2)

export function PerformanceIntroduction() {
  return <section id="results" className="case-section space-y-6">
    <header><p className="case-label">Evidence / Historical league results</p><h2 className="mt-2 font-serif text-3xl font-medium tracking-tight">What the results say.</h2><p className="case-copy mt-3 max-w-3xl">Match data, calculated separately from the working assessments. {data.quality.club_seasons} club-seasons, {data.quality.unique_fixtures} distinct league fixtures and {data.quality.coach_fixture_observations} team-match records. The same match can appear for both teams.</p></header>
    <div className="rounded-xl border border-primary/25 bg-card p-5"><p className="text-sm font-semibold">{data.coverage}</p><p className="case-copy mt-2">Pulled from API-Football on 10 September 2026. Our plan does not include the 2025 season, so this is not current 2026/27 form.</p></div>
    <div className="case-grid grid gap-5 md:grid-cols-3">
      {[
        ['McKenna: can it carry into the Premier League?','98 and 96 points in the promotion seasons; 22 in the Premier League. A strong development record worth digging into — but not yet proof he can steady a Premier League side.'],
        ['Hoeneß: look at what happened next','73 league points in 2023/24 became 50 in 2024/25. The turnaround was real — the question is how much of it lasted once the squad and fixtures changed.'],
        ['Farioli: what exactly improved?','Ajax conceded 29 fewer league goals than the year before, but scored seven fewer. Tighter at the back — what would it take to add goals?'],
      ].map(([title,body])=><article key={title} className="rounded-xl border border-border p-5"><h3 className="text-base font-semibold">{title}</h3><p className="case-copy mt-3">{body}</p></article>)}
    </div>
    <p className="case-copy">This is our reading of the results, not proof of cause and not a ranking. Each coach’s section below has the figures, why they matter, the case against and the sources.</p>
    <details className="rounded-xl border border-border p-5"><summary className="flex items-center justify-between gap-4 text-sm font-medium">How we checked it, and what is missing<ChevronDown className="case-chevron h-4 w-4"/></summary><div className="mt-5 space-y-4"><ul className="case-copy list-disc space-y-2 pl-5">{data.limitations.map(text=><li key={text}>{text}</li>)}</ul><p className="case-copy">Fixtures, game counts, scores, dates and points all checked, with selected totals matched against league and club reports. Stuttgart’s 2022/23 season is split at his appointment date, and the two relegation play-offs are left out. Ajax’s season before Farioli is shown as another coach’s baseline.</p><p className="case-copy"><strong className="text-foreground">Still to add:</strong> xG for and against, set-piece xG, pressing and progression numbers, squad age and minutes, transfer spend, wages and availability. Results alone are not a substitute for these.</p><a className="case-source text-primary" href="https://www.api-football.com/documentation-v3#tag/Fixtures" target="_blank" rel="noreferrer">API-Football fixture documentation (opens in new tab)</a></div></details>
  </section>
}

export function CoachPerformance({ coachKey }: { coachKey: string }) {
  if (!(coachKey in data.notes)) return null
  const note=data.notes[coachKey as CoachKey]
  const periods=data.periods.filter(p=>p.coach_key===coachKey)
  const sources=data.sources.filter(s=>s.coach===coachKey)
  const extras=data.extras.filter(e=>e.coach===coachKey)
  return <section className="space-y-5 rounded-xl border border-primary/25 p-5 sm:p-6" aria-label="Historical performance evidence">
    <header><p className="case-label">Historical data / Sourced results</p><h4 className="mt-2 text-xl font-semibold">{note.signal}</h4><p className="mt-2 text-xs leading-5 text-muted-foreground">{data.coverage}. League only. PPG = points per game; goals = scored : conceded. Read within league and squad context.</p></header>
    <div className="space-y-4">{periods.map(p=><article key={p.id} className="case-assessment rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><h5 className="text-sm font-semibold">{p.club} · {p.season}</h5><p className="mt-1 text-xs text-muted-foreground">{p.league} · {p.scope}</p></div>{p.baseline&&<span className="gaffa-badge">Other-coach baseline</span>}</div>
      <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-4 sm:grid-cols-6">{[['Games',p.games],['W–D–L',`${p.wins}–${p.draws}–${p.losses}`],['Points',p.points],['PPG',number(p.ppg)],['Goals',`${p.gf}:${p.ga}`],['Goal difference',p.gd>0?`+${p.gd}`:p.gd]].map(([label,value])=><div key={label}><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-1 text-base font-semibold tabular-nums">{value}</dd></div>)}</dl>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full" role="img" aria-label={`${p.wins} wins, ${p.draws} draws, ${p.losses} losses in ${p.games} games`}><span style={{width:`${p.wins/p.games*100}%`}} className="bg-primary"/><span style={{width:`${p.draws/p.games*100}%`}} className="bg-stone-400"/><span style={{width:`${p.losses/p.games*100}%`}} className="bg-amber-600"/></div><p className="mt-1 text-[10px] text-muted-foreground">Win / draw / loss share · results, not a fit score</p>
      <details className="mt-4 border-t border-border pt-3"><summary className="flex items-center justify-between text-xs font-medium">Home, away and season splits<ChevronDown className="case-chevron h-3 w-3"/></summary><div className="case-grid mt-4 grid gap-4 sm:grid-cols-2"><p className="case-copy">Home: {p.home.points} points / {p.home.games} games ({number(p.home.ppg)} PPG). Away: {p.away.points} / {p.away.games} ({number(p.away.ppg)} PPG).</p><p className="case-copy">Clean sheets: {p.clean_sheets}/{p.games}. Failed to score: {p.failed_to_score}/{p.games}. Goals scored/conceded per game: {number(p.gf_per_game)} / {number(p.ga_per_game)}.</p><p className="case-copy">First {p.first_half.games} games in this period: {p.first_half.points} points. Remaining {p.second_half.games}: {p.second_half.points}. Ordered by match date, not calendar half-year.</p><p className="case-copy">Trailing at half-time: {p.trailing_at_ht.games} games, {p.trailing_at_ht.points??0} eventual points. This does not isolate the effect of substitutions.</p></div><p className="mt-4 text-xs text-muted-foreground">Included match dates: {p.start}–{p.end}. API-Football fixture feed; calculated 10 September 2026.</p><a className="case-source mt-2 inline-block break-all text-primary" href={p.source_url} target="_blank" rel="noreferrer">Exact provider query (requires your own API access)</a></details>
    </article>)}</div>
    <div className="case-grid grid gap-5 md:grid-cols-2"><div><h5 className="text-sm font-semibold">Why it is worth looking at</h5><p className="case-copy mt-2">{note.support}</p></div><div><h5 className="text-sm font-semibold">The case against</h5><p className="case-copy mt-2">{note.challenge}</p></div></div>
    <p className="case-copy border-t border-border pt-4"><strong className="text-foreground">The next question:</strong> {note.question}</p>
    {extras.map(e=><article key={e.title} className="border-t border-border pt-4"><h5 className="text-sm font-semibold">{e.title}</h5><p className="case-copy mt-2">{e.text}</p><a href={e.source} className="case-source mt-2 inline-block text-primary" target="_blank" rel="noreferrer">Published analysis (opens in new tab)</a></article>)}
    <details className="border-t border-border pt-4"><summary className="flex items-center justify-between gap-3 text-sm font-medium">Published checks and context<ChevronDown className="case-chevron h-4 w-4"/></summary><div className="mt-4 space-y-4">{sources.map(s=><div key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="case-source text-primary">{s.title} (opens in new tab)</a><p className="mt-1 text-xs leading-6 text-muted-foreground">{s.note}</p></div>)}<p className="case-copy">The data provider and the published reports may draw on the same original sources, so agreement between them is not fully independent.</p></div></details>
  </section>
}
