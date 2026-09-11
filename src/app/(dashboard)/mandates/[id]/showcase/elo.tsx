'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import data from '@/lib/mandates/showcase/clubelo.json'
import { eloSegments, summariseEloSpell } from '@/lib/analysis/published-club-elo'

const dateLabel = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const shortDate = (time: number) => new Date(time).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const time = (date: string) => Date.parse(`${date}T00:00:00Z`)
const signed = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}`
type Spell = typeof data.spells[number]
const coaches = data.spells.filter((s, i) => data.spells.findIndex(c => c.coachKey === s.coachKey) === i)

export function EloTrends() {
  const [spellId, setSpellId] = useState(data.spells[0].id)
  const spell = data.spells.find(s => s.id === spellId)!
  const spells = data.spells.filter(s => s.coachKey === spell.coachKey)
  return <section id="elo" className="case-section space-y-6" aria-labelledby="elo-title">
    <header><p className="case-label">Evidence / ClubElo</p><h2 id="elo-title" className="mt-2 font-serif text-3xl font-medium tracking-tight">How strong did the team become?</h2><p className="case-copy mt-3 max-w-3xl">Follow the club’s rating through a coaching spell: the starting point, the progress and what happened after the peak. Elo adds opponent context to results. It is a team-strength estimate, not a coach rating.</p></header>
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-7">
      <div className="grid gap-4 border-b border-border pb-5 sm:grid-cols-2 print:hidden">
        <label className="text-xs font-medium">Coach<select aria-label="Coach for Elo trends" value={spell.coachKey} onChange={e => setSpellId(data.spells.find(s => s.coachKey === e.target.value)!.id)} className="mt-2 block min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">{coaches.map(c => <option value={c.coachKey} key={c.coachKey}>{c.coach}</option>)}</select></label>
        <label className="text-xs font-medium">Club spell<select aria-label="Club spell for Elo trends" value={spellId} onChange={e => setSpellId(e.target.value)} className="mt-2 block min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">{spells.map(s => <option value={s.id} key={s.id}>{s.club} · {s.start.slice(0,4)}–{s.end?.slice(0,4) ?? 'present'}</option>)}</select></label>
      </div>
      <SpellChart key={spell.id} spell={spell}/>
    </div>
    <details className="rounded-xl border border-border p-5"><summary className="flex items-center justify-between gap-4 text-sm font-medium">How to read this evidence<ChevronDown className="case-chevron h-4 w-4"/></summary><div className="case-copy mt-5 space-y-3">
      <p>Higher Elo means greater estimated team strength. ClubElo’s published method accounts for opponent strength, home advantage, score margin and cross-league adjustments. It can include domestic and European competition; it has a different scope from the league-only results above.</p>
      <p>A rise during a coach’s spell is an association. Recruitment, resources, squad changes and the wider club also matter. Spells differ in length and starting level, so the changes are not a coach league table.</p>
      <p>These are saved observations from ClubElo’s public charts, retrieved {dateLabel(data.retrieved_date)}. Each club’s available history spans roughly four years. We preserve the provider’s steps and declared gaps; we do not recreate the rating or invent missing observations. The chart axis adapts to the displayed range and does not start at zero.</p>
      <p>The start comparison uses the last published observation on or before arrival. If that is missing, the first observation within the spell is used and the change is labelled partial. End comparisons stop at the last observation on or before departure. Dates next to every figure show the actual observations used. A peak is the highest observed rating in that measured period.</p>
      <p>Published history can be revised and gaps between observations are not proof that a team’s underlying strength stayed constant. “Latest” means the latest observation saved in this edition, not a live feed. Earlier seasons and other clubs in these coaches’ careers are not fully covered.</p>
      <a className="case-source text-primary" href="https://clubelo.com/System" target="_blank" rel="noreferrer">ClubElo methodology (opens in new tab)</a>
    </div></details>
  </section>
}

function SpellChart({ spell }: { spell: Spell }) {
  const clipId = useId().replace(/:/g, '')
  const club = data.clubs.find(c => c.key === spell.clubKey)!
  const summary = summariseEloSpell(club.points, spell, data.retrieved_date)!
  const [fullHistory, setFullHistory] = useState(false)
  const [inspectedDate, setInspectedDate] = useState(summary.last.date)
  const end = spell.end ?? data.retrieved_date
  const margin = 90 * 86_400_000
  const focusStart = Math.max(time(club.points[0].date), time(spell.start) - margin)
  const focusEnd = Math.min(time(club.points.at(-1)!.date), time(end) + margin)
  const points = fullHistory ? club.points : club.points.filter(p => time(p.date) >= focusStart && time(p.date) <= focusEnd)
  const firstTime = time(points[0].date), lastTime = time(points.at(-1)!.date)
  const minRating = Math.floor((Math.min(...points.map(p => p.rating)) - 20) / 50) * 50
  const maxRating = Math.max(minRating + 100, Math.ceil((Math.max(...points.map(p => p.rating)) + 20) / 50) * 50)
  const x = (date: string) => (time(date) - firstTime) / Math.max(1, lastTime - firstTime) * 1000
  const y = (rating: number) => 220 - (rating - minRating) / (maxRating - minRating) * 220
  const startX = Math.max(0, Math.min(1000, x(spell.start))), endX = Math.max(0, Math.min(1000, x(end)))
  const inspected = points.find(p => p.date === inspectedDate) ?? points.at(-1)!
  const inspectedIndex = points.indexOf(inspected)
  const withinSpell = inspected.date >= spell.start && inspected.date <= end
  const paths = eloSegments(points).map(segment => segment.map((p, i) => i === 0 ? `M${x(p.date)},${y(p.rating)}` : `H${x(p.date)}V${y(p.rating)}`).join(' '))
  const arrivalInChart = x(spell.start) >= 0 && x(spell.start) <= 1000
  const departureInChart = spell.end && x(spell.end) >= 0 && x(spell.end) <= 1000
  const metrics = [
    [summary.partial ? 'First available in spell' : 'Before arrival', summary.baseline.rating.toFixed(1), dateLabel(summary.baseline.date)],
    [spell.end ? 'Last in spell' : 'Latest in spell', summary.last.rating.toFixed(1), dateLabel(summary.last.date)],
    [summary.partial ? 'Change · partial period' : 'Change from baseline', signed(summary.change), `${summary.measured.length} observations`],
    ['Peak in measured period', summary.peak.rating.toFixed(1), `${dateLabel(summary.peak.date)} · ${signed(summary.fromPeak)} since`],
  ]
  return <div className="space-y-6 pt-6" aria-label="Published ClubElo trend">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-serif text-2xl">{spell.coach} <span className="text-muted-foreground">/ {spell.club}</span></h3><p className="mt-2 text-xs text-muted-foreground">{spell.startLabel} – {spell.end ? dateLabel(spell.end) : 'ongoing at this review'}</p></div><span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Published ratings</span></header>
    {summary.partial && <p className="rounded-lg border border-border bg-background p-3 text-xs leading-6 text-muted-foreground">Partial spell: the available chart begins on {dateLabel(summary.baseline.date)}, after the coach arrived. The change below covers that period only; a full-spell gain cannot be calculated here.</p>}
    {summary.discontinuous && <p className="text-xs text-amber-700">The provider marks a break in this history. Separate line segments should not be read as continuous evidence.</p>}
    <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">{metrics.map(([label,value,note]) => <div key={label}><dt className="text-xs leading-5 text-muted-foreground">{label}</dt><dd className="mt-1 font-serif text-3xl tabular-nums">{value}</dd><dd className="mt-1 text-[11px] leading-5 text-muted-foreground">{note}</dd></div>)}</dl>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span><span className="mr-2 inline-block h-0.5 w-5 bg-primary align-middle"/>Coach’s spell</span><span><span className="mr-2 inline-block h-0.5 w-5 bg-stone-400 align-middle"/>Other periods</span></div><div className="flex rounded-lg border border-border p-1 print:hidden" aria-label="Elo chart range">{[[false, 'Around the spell'], [true, 'Available history']].map(([value,label]) => <button type="button" key={String(label)} aria-pressed={fullHistory === value} className={`min-h-9 rounded-md px-3 text-xs ${fullHistory === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setFullHistory(Boolean(value))}>{label}</button>)}</div></div>
    <figure aria-label={`${spell.club} published Elo ratings during ${spell.coach}'s spell`}>
      <figcaption className="mb-5 flex flex-wrap items-baseline justify-between gap-2 text-sm" aria-live="polite"><span>{dateLabel(inspected.date)} <span className="ml-2 text-xs text-muted-foreground">{withinSpell ? 'Within spell' : 'Club context'}</span></span><span className="font-semibold tabular-nums">{inspected.rating.toFixed(1)} <span className="font-normal text-muted-foreground">Elo</span></span></figcaption>
      <div className="relative ml-11 h-[220px]">
        {[0,1,2,3,4].map(i => <div key={i} className="pointer-events-none absolute inset-x-0 border-t border-border" style={{top:`${i*25}%`}}><span className="absolute -left-11 -top-2 w-9 text-right text-[11px] tabular-nums text-muted-foreground">{Math.round(maxRating-(maxRating-minRating)*i/4)}</span></div>)}
        <svg className="absolute inset-0 h-full w-full touch-pan-y overflow-visible" viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label={`Step chart. ${summary.partial ? 'Partial-period' : 'Baseline-to-end'} change ${signed(summary.change)} Elo points. Use the date slider for individual observations.`} onPointerMove={e => {
          if(e.pointerType === 'touch' && e.buttons === 0) return
          const rect=e.currentTarget.getBoundingClientRect()
          const target=firstTime+Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width))*(lastTime-firstTime)
          setInspectedDate(points.reduce((a,b)=>Math.abs(time(b.date)-target)<Math.abs(time(a.date)-target)?b:a).date)
        }} onPointerDown={e => {
          const rect=e.currentTarget.getBoundingClientRect(), target=firstTime+(e.clientX-rect.left)/rect.width*(lastTime-firstTime)
          setInspectedDate(points.reduce((a,b)=>Math.abs(time(b.date)-target)<Math.abs(time(a.date)-target)?b:a).date)
        }}>
          <defs><clipPath id={clipId}><rect x={startX} y={-3} width={Math.max(0,endX-startX)} height={226}/></clipPath></defs>
          <rect x={startX} y={0} width={Math.max(0,endX-startX)} height={220} fill="currentColor" className="text-primary" opacity="0.035"/>
          {paths.map((path,i)=><g key={i}><path d={path} fill="none" stroke="currentColor" className="text-stone-400" strokeWidth={2} vectorEffect="non-scaling-stroke"/><path d={path} clipPath={`url(#${clipId})`} fill="none" stroke="currentColor" className="text-primary" strokeWidth={2.5} vectorEffect="non-scaling-stroke"/></g>)}
          {arrivalInChart && <line x1={startX} x2={startX} y1={0} y2={220} stroke="currentColor" className="text-muted-foreground" strokeDasharray="4 5" strokeWidth={1} vectorEffect="non-scaling-stroke"/>}
          {departureInChart && <line x1={endX} x2={endX} y1={0} y2={220} stroke="currentColor" className="text-muted-foreground" strokeDasharray="4 5" strokeWidth={1} vectorEffect="non-scaling-stroke"/>}
          <line x1={x(inspected.date)} x2={x(inspected.date)} y1={0} y2={220} stroke="currentColor" className="text-primary" strokeWidth={1} opacity={0.3} vectorEffect="non-scaling-stroke"/>
        </svg>
        <span aria-hidden="true" className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary" style={{left:`${x(inspected.date)/10}%`,top:`${y(inspected.rating)/2.2}%`}}/>
      </div>
      <div className="ml-11 mt-3 flex justify-between text-[11px] text-muted-foreground">{[0,1,2,3].map(i=><span key={i}>{shortDate(firstTime+(lastTime-firstTime)*i/3)}</span>)}</div>
      <div className="mt-5 print:hidden"><label htmlFor={`${clipId}-date`} className="text-xs text-muted-foreground">Inspect a date · drag or use arrow keys</label><input id={`${clipId}-date`} aria-label="Inspect Elo observation" aria-valuetext={`${dateLabel(inspected.date)}: ${inspected.rating.toFixed(1)} Elo`} type="range" min={0} max={points.length-1} value={inspectedIndex} onChange={e=>setInspectedDate(points[Number(e.target.value)].date)} className="mt-1 block h-8 w-full accent-primary"/></div>
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">Elo points · dashed lines mark arrival/departure where visible · saved observations, not a forecast. Around-the-spell view includes up to 90 days of context on each side.</p>
    </figure>
    <p className="case-copy border-t border-border pt-5"><strong className="text-foreground">What to investigate:</strong> {spell.question}</p>
    <div className="flex flex-wrap gap-x-5 gap-y-3"><a className="case-source text-primary" href={club.source_url} target="_blank" rel="noreferrer">{spell.club} on ClubElo (opens in new tab)</a><a className="case-source text-primary" href={spell.startSource} target="_blank" rel="noreferrer">Appointment source (opens in new tab)</a>{spell.endSource && <a className="case-source text-primary" href={spell.endSource} target="_blank" rel="noreferrer">Departure source (opens in new tab)</a>}</div>
    <p className="text-[11px] leading-5 text-muted-foreground">Source chart: {dateLabel(club.points[0].date)}–{dateLabel(club.points.at(-1)!.date)} · {club.points.length} observations · retrieved {dateLabel(data.retrieved_date)}. {spell.coachKey === 'knutsen' ? 'Arrival is sourced to the year 2018; no exact day is claimed.' : ''}</p>
  </div>
}
