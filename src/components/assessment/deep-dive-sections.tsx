import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Aspect, DeepDive, FinalEvaluation, Fit, Level, XgSplit } from '@/lib/assessment/deep-dive'

const xgTotal = (x: XgSplit) => ({
  openPlay: x.transition + x.buildUp + x.restart,
  setPieces: x.corners + x.directFk + x.indirectFk + x.throwIns,
})

// Presentational blocks for the nine-area assessment depth. No hooks, so they
// render in server pages, client workspaces and the printable board report.

const label = 'text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80'
const body = 'text-xs leading-relaxed text-muted-foreground'

export function DemoDataNotice({ detail = 'Illustrative figures and assessment examples. Historical facts are included for context.' }: { detail?: string }) {
  return <p className="rounded border border-amber-500/50 px-3 py-2 text-xs leading-relaxed text-foreground print:break-inside-avoid print:border-black print:text-black"><strong className="mr-2 font-bold">DEMO DATA</strong>{detail}</p>
}

export function DeepDiveSource() {
  return <p className="mt-3 text-[10px] text-muted-foreground/70">DEMO DATA · These illustrative figures require metric-specific sources and validation before replacement.</p>
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return <div className="print:break-inside-avoid"><p className={label}>{title}</p><div className="mt-1.5">{children}</div></div>
}

function List({ items }: { items: string[] }) {
  return <ul className="space-y-1">{items.map(item => <li key={item} className={`${body} pl-3 border-l border-border`}>{item}</li>)}</ul>
}

function Stats({ items }: { items: { label: string; value: string }[] }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">{items.map(item => <div key={item.label} className="border-t-2 border-emerald-500/60 pt-2"><p className={label}>{item.label}</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{item.value}</p></div>)}</div>
}

function Bar({ value, max = 100, tone = 'bg-emerald-500' }: { value: number; max?: number; tone?: string }) {
  const width = Math.max(2, Math.min(100, (value / max) * 100))
  return <div className="h-1.5 w-full rounded-full bg-muted"><div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} /></div>
}

function Aspects({ items }: { items: Aspect[] }) {
  return <div className="divide-y divide-border border-y border-border">{items.map(a => <div key={a.aspect} className="grid grid-cols-[1fr_2.2fr] gap-3 py-1.5 text-xs"><span className="font-medium text-foreground">{a.aspect}</span><span className="text-muted-foreground">{a.note}</span></div>)}</div>
}

const fitTone: Record<Fit, string> = { Strong: 'bg-emerald-600 text-white', Partial: 'bg-amber-500 text-white', Weak: 'bg-red-600 text-white' }

const levelTone: Record<Level, string> = { Low: 'text-emerald-700 dark:text-emerald-400', Medium: 'text-amber-700 dark:text-amber-400', High: 'text-red-700 dark:text-red-400' }

export function ProfileDeepDive({ d }: { d: DeepDive }) {
  const p = d.profile
  return <div className="space-y-4"><DemoDataNotice />
    <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
      <Block title="Playing career"><p className={body}>{p.playingCareer}</p></Block>
      <Block title="Key staff"><p className={body}>{p.keyStaff}</p></Block>
      <Block title="Family and relocation"><p className={body}>{p.familyRelocation}</p></Block>
      <Block title="Salary band and representation"><p className={body}>{p.salaryBand} · {p.representation}</p></Block>
    </div>
    <Block title="Coaching career"><div className="divide-y divide-border border-y border-border">{d.career.map(c => <div key={c.period + c.club} className="grid grid-cols-[1fr_1fr_2fr] gap-3 py-1.5 text-xs"><span className="tabular-nums text-muted-foreground">{c.period}</span><span className="font-medium text-foreground">{c.club}</span><span className="text-muted-foreground">{c.role}</span></div>)}</div></Block>
    <Block title="Key achievements"><List items={p.keyAchievements} /></Block>
  </div>
}

function XgRows({ label: title, x }: { label: string; x: XgSplit }) {
  const t = xgTotal(x)
  const rows: [string, number][] = [['Open play', t.openPlay], ['— transition', x.transition], ['— build-up', x.buildUp], ['— restarts', x.restart], ['Set pieces', t.setPieces], ['— corners', x.corners], ['— direct free kicks', x.directFk], ['— indirect free kicks', x.indirectFk], ['— throw-ins', x.throwIns]]
  return <div><p className="text-xs font-semibold text-foreground">{title} <span className="font-normal text-muted-foreground">(per 90)</span></p><table className="mt-1 w-full text-xs"><tbody>{rows.map(([name, value]) => <tr key={name} className="border-b border-border/60"><td className={`py-1 ${name.startsWith('—') ? 'pl-3 text-muted-foreground' : 'font-medium text-foreground'}`}>{name.replace('— ', '')}</td><td className="py-1 text-right tabular-nums">{value.toFixed(2)}</td></tr>)}</tbody></table></div>
}

export function PerformanceDeepDive({ d }: { d: DeepDive }) {
  const p = d.performance
  return <div className="space-y-5"><DemoDataNotice />
    <Block title="Results and underlying numbers">
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-xs"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-1 font-medium">Season</th><th className="font-medium">Club</th><th className="text-right font-medium">P</th><th className="text-right font-medium">W-D-L</th><th className="text-right font-medium">Win %</th><th className="text-right font-medium">PPG</th><th className="text-right font-medium">Goals</th><th className="text-right font-medium">GD</th><th className="text-right font-medium">xG for</th><th className="text-right font-medium">xG against</th><th className="text-right font-medium">Finish</th></tr></thead>
        <tbody>{p.seasons.map(s => <tr key={s.season + s.club} className="border-b border-border/60"><td className="py-1">{s.season}</td><td>{s.club} <span className="text-muted-foreground">· {s.league}</span></td><td className="text-right tabular-nums">{s.played}</td><td className="text-right tabular-nums">{s.w}-{s.d}-{s.l}</td><td className="text-right tabular-nums">{Math.round((s.w / s.played) * 100)}%</td><td className="text-right tabular-nums">{((3 * s.w + s.d) / s.played).toFixed(2)}</td><td className="text-right tabular-nums">{s.gf}:{s.ga}</td><td className="text-right tabular-nums">{s.gf - s.ga > 0 ? '+' : ''}{s.gf - s.ga}</td><td className="text-right tabular-nums">{s.xgf.toFixed(1)}</td><td className="text-right tabular-nums">{s.xga.toFixed(1)}</td><td className="text-right">{s.finish}</td></tr>)}</tbody></table></div>
    </Block>
    <Block title={`xG breakdown · ${d.xgSeason}`}><div className="grid gap-5 sm:grid-cols-2 print:grid-cols-2"><XgRows label="xG for" x={p.xgFor} /><XgRows label="xG against" x={p.xgAgainst} /></div></Block>
    <div className="grid gap-5 sm:grid-cols-2 print:grid-cols-2">
      <Block title="Physical output vs league average">
        <div className="space-y-2">{p.physical.map(m => <div key={m.metric}><div className="flex justify-between text-xs"><span>{m.metric}</span><span className="tabular-nums text-muted-foreground">{m.value} · {m.vsLeague > 0 ? '+' : ''}{m.vsLeague}%</span></div><Bar value={50 + m.vsLeague * 2.5} tone={m.vsLeague >= 0 ? 'bg-emerald-500' : 'bg-amber-500'} /></div>)}</div>
      </Block>
      <Block title="Impact over time (points per game)">
        <div className="space-y-2">{p.impact.map(w => <div key={w.window}><div className="flex justify-between text-xs"><span>{w.window}</span><span className="tabular-nums font-semibold">{w.ppg.toFixed(2)}</span></div><Bar value={w.ppg} max={3} /><p className="mt-0.5 text-[10px] text-muted-foreground">{w.note}</p></div>)}</div>
      </Block>
    </div>
    <Stats items={[{ label: 'Wage bill rank', value: p.resources.wageRank }, { label: 'Squad value rank', value: p.resources.squadValueRank }, { label: 'Finished', value: p.resources.finish }, { label: 'Elo start → peak → end', value: `${p.elo.start} → ${p.elo.peak} → ${p.elo.end}` }]} />
    <p className={body}><strong className="text-foreground">Value for money:</strong> {p.resources.verdict} {p.elo.note}</p>
    <Block title="Squad injuries"><p className={body}>{p.injuries}</p></Block>
    <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2"><Block title="What the data backs up"><List items={p.strengths} /></Block><Block title="Warning signs"><List items={p.concerns} /></Block></div>
    <DeepDiveSource />
  </div>
}

export function TacticalDeepDive({ d }: { d: DeepDive }) {
  const t = d.tactical
  return <div className="space-y-5"><DemoDataNotice />
    <div className="grid gap-5 sm:grid-cols-2 print:grid-cols-2">
      <Block title="Formations used"><div className="space-y-2">{t.formations.map(f => <div key={f.shape}><div className="flex justify-between text-xs"><span className="font-medium">{f.shape}</span><span className="tabular-nums text-muted-foreground">{f.share}% of games</span></div><Bar value={f.share} /></div>)}</div></Block>
      <Block title="Style of play"><table className="w-full text-xs"><tbody>{t.style.map(s => <tr key={s.metric} className="border-b border-border/60"><td className="py-1">{s.metric}</td><td className="py-1 text-right font-semibold tabular-nums">{s.value}</td><td className="py-1 pl-3 text-[10px] text-muted-foreground">{s.note}</td></tr>)}</tbody></table></Block>
    </div>
    <Block title="Principles by phase"><div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">{t.principles.map(p => <div key={p.phase} className="border-l-2 border-emerald-500/50 pl-3"><p className="text-xs font-semibold text-foreground">{p.phase}</p><p className={body}>{p.detail}</p></div>)}</div></Block>
    <Block title="Tactical fit and risks"><Aspects items={d.tacticalFit} /></Block>
    <Block title="Match clips — the game model in action"><div className="divide-y divide-border border-y border-border">{t.clips.map(c => <div key={c.title} className="grid grid-cols-[1.2fr_1fr_2fr] gap-3 py-1.5 text-xs"><span className="font-medium text-foreground">▶ {c.title}</span><span className="text-muted-foreground">{c.match} · {c.minute}</span><span className="text-muted-foreground">{c.shows}</span></div>)}</div></Block>
    <DeepDiveSource />
  </div>
}

export function MatchManagementDeepDive({ d }: { d: DeepDive }) {
  return <div className="space-y-4"><DemoDataNotice /><Stats items={[...d.matchManagement.stats, ...d.matchStats]} /><Block title="On matchday"><Aspects items={d.matchBehaviour} /></Block><p className={body}>{d.matchManagement.notes}</p><DeepDiveSource /></div>
}

export function TrainingDeepDive({ d }: { d: DeepDive }) {
  const t = d.training
  return <div className="space-y-4"><DemoDataNotice />
    <Block title="Training week"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 print:grid-cols-3">{t.week.map(w => <div key={w.day} className="rounded border border-border p-2"><p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{w.day}</p><p className="mt-0.5 text-xs">{w.focus}</p></div>)}</div></Block>
    <p className={body}><strong className="text-foreground">Balance:</strong> {t.split}</p>
    <Block title="How he coaches and manages people"><Aspects items={d.trainingAspects} /></Block>
    <p className={body}>{t.notes}</p>
  </div>
}

export function DevelopmentDeepDive({ d }: { d: DeepDive }) {
  const v = d.development
  return <div className="space-y-4"><DemoDataNotice />
    <Stats items={v.stats} />
    <Block title="Players he has improved"><div className="divide-y divide-border border-y border-border">{v.players.map(p => <div key={p.name} className="grid grid-cols-[1fr_1fr_2fr] gap-3 py-1.5 text-xs"><span className="font-medium text-foreground">{p.name}</span><span className="tabular-nums text-emerald-700 dark:text-emerald-400">{p.change}</span><span className="text-muted-foreground">{p.note}</span></div>)}</div></Block>
    <Block title="Pathway and alignment"><Aspects items={d.developmentAspects} /></Block>
    <p className={body}>{v.notes}</p>
    <DeepDiveSource />
  </div>
}

export function MediaDeepDive({ d }: { d: DeepDive }) {
  const m = d.media
  return <div className="space-y-4"><DemoDataNotice />
    <Block title="Media sentiment (last 12 months)">
      <div className="flex h-3 w-full overflow-hidden rounded-full"><div className="bg-emerald-500" style={{ width: `${m.sentiment.positive}%` }} /><div className="bg-slate-400" style={{ width: `${m.sentiment.neutral}%` }} /><div className="bg-red-500" style={{ width: `${m.sentiment.negative}%` }} /></div>
      <p className="mt-1 text-[10px] text-muted-foreground">Positive {m.sentiment.positive}% · Neutral {m.sentiment.neutral}% · Negative {m.sentiment.negative}%</p>
    </Block>
    <Block title="Inside the club and outside it"><Aspects items={d.mediaChannels} /></Block>
    <Block title="Recurring themes"><List items={m.themes} /></Block>
    <p className={body}>{m.notes}</p>
  </div>
}

export function PersonalityDeepDive({ d }: { d: DeepDive }) {
  return <div className="space-y-4"><DemoDataNotice /><Block title="Traits (1–5)"><div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 print:grid-cols-2">{d.traits.map(t => <div key={t.trait}><div className="flex justify-between text-xs"><span>{t.trait}</span><span className="tabular-nums font-semibold">{t.rating}/5</span></div><Bar value={t.rating} max={5} /></div>)}</div></Block><div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">{d.personality.map((s, i) => <div key={s.heading} className="border-l-2 border-emerald-500/50 pl-3 print:break-inside-avoid"><p className="text-xs font-semibold text-foreground">{i + 1}. {s.heading}</p><p className={body}>{s.text}</p></div>)}</div></div>
}

export function CulturalFitDeepDive({ d }: { d: DeepDive }) {
  const c = d.culturalFit
  return <div className="space-y-4"><DemoDataNotice />
    <Block title={`Fit with ${d.fitClub}`}><div className="divide-y divide-border border-y border-border">{d.clubAlignment.map(a => <div key={a.aspect} className="grid grid-cols-[1.2fr_auto_2.2fr] items-start gap-3 py-1.5 text-xs"><span className="font-medium text-foreground">{a.aspect}</span><span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${fitTone[a.fit]}`}>{a.fit}</span><span className="text-muted-foreground">{a.note}</span></div>)}</div></Block>
    <Block title="Best-fit club"><div className="divide-y divide-border border-y border-border">{c.bestFit.map(f => <div key={f.dimension} className="grid grid-cols-[1fr_2.5fr] gap-3 py-1.5 text-xs"><span className="font-medium text-foreground">{f.dimension}</span><span className="text-muted-foreground">{f.fit}</span></div>)}</div></Block>
    <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2"><Block title="Where it could rub"><List items={c.frictionPoints} /></Block><Block title="What he needs to succeed"><List items={c.successFactors} /></Block></div>
  </div>
}

export const AREA_DEEP_DIVE: Record<string, { title: string; render: (d: DeepDive) => ReactNode }> = {
  coach_profile: { title: 'Profile detail', render: d => <ProfileDeepDive d={d} /> },
  performance_impact: { title: 'Performance dashboard', render: d => <PerformanceDeepDive d={d} /> },
  tactical_proposal: { title: 'Tactical profile', render: d => <TacticalDeepDive d={d} /> },
  match_management: { title: 'Match management numbers', render: d => <MatchManagementDeepDive d={d} /> },
  training_management: { title: 'Training week', render: d => <TrainingDeepDive d={d} /> },
  players_development: { title: 'Player development', render: d => <DevelopmentDeepDive d={d} /> },
  media_comms: { title: 'Media profile', render: d => <MediaDeepDive d={d} /> },
  personality_profile: { title: 'Personality profile — ten-part review', render: d => <PersonalityDeepDive d={d} /> },
  cultural_org_fit: { title: 'Club fit', render: d => <CulturalFitDeepDive d={d} /> },
}

// Methods and deliverables per area, as set out in the Head Coach Assessment Methodology.
export const AREA_METHODOLOGY: Record<string, { methods: string; delivers: string }> = {
  coach_profile: { methods: 'Desktop research · AI-assisted checks · Candidate interview · References', delivers: 'Profile and career overview · Availability and what it would take to hire him · Key considerations' },
  performance_impact: { methods: 'Desktop research · Data analysis · AI-assisted analysis', delivers: 'Performance dashboard · Impact and value for money · Sustainability and achievements' },
  tactical_proposal: { methods: 'Data analysis · Match analysis · Training observation · Candidate interview · References', delivers: 'Tactical identity · Game model shown in match clips · Fit with our squad and risks' },
  match_management: { methods: 'Data analysis · Match analysis · Candidate interview · References', delivers: 'Match management profile · Decision-making and adaptability · Impact and risks' },
  training_management: { methods: 'Training observation · Candidate interview · References', delivers: 'Training methods · Leadership and managing people · Training environment' },
  players_development: { methods: 'Data analysis · Candidate interview (case study) · References', delivers: 'Player development · Fit with our pathway · Transfer value created' },
  media_comms: { methods: 'AI-assisted analysis · Media review · Candidate interview · References', delivers: 'Communication profile · Working with players, staff and the board · Risks' },
  personality_profile: { methods: 'AI-assisted profile · Media review · Candidate interview · References', delivers: 'Personality and leadership dossier · References and evidence' },
  cultural_org_fit: { methods: 'Desktop research · AI-assisted analysis · Candidate interview · References', delivers: 'Best-fit club and owners · Fit with this club · Friction points and what he needs to succeed' },
}

export function AreaMethodology({ area }: { area: string }) {
  const m = AREA_METHODOLOGY[area]
  if (!m) return null
  return <p className="mt-3 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground/80"><strong className="font-semibold">Methods:</strong> {m.methods}. <strong className="font-semibold">Delivers:</strong> {m.delivers}.</p>
}

export function AreaDeepDive({ area, d }: { area: string; d: DeepDive }) {
  const entry = AREA_DEEP_DIVE[area]
  if (!entry) return null
  return <div className="deep-dive mt-3 rounded-lg border border-border bg-card/40 p-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">{entry.title}</p>{entry.render(d)}<AreaMethodology area={area} /></div>
}

export function FinalEvaluationSection({ e, verdict, confidence }: { e: FinalEvaluation; verdict?: string | null; confidence?: number | null }) {
  const swot: [string, string[], string][] = [['Strengths', e.swot.strengths, 'border-emerald-500'], ['Weaknesses', e.swot.weaknesses, 'border-amber-500'], ['Opportunities', e.swot.opportunities, 'border-sky-500'], ['Threats', e.swot.threats, 'border-red-500']]
  return <div className="deep-dive space-y-5">
    <DemoDataNotice detail="Illustrative evaluation and planning assumptions; interviews and references remain to be completed. Recorded recommendations are identified separately." />
    <Block title="Executive summary"><p className="text-sm leading-relaxed text-foreground">{e.executiveSummary}</p></Block>
    <Block title="SWOT"><div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">{swot.map(([name, items, border]) => <div key={name} className={`rounded border-t-2 ${border} bg-card/40 p-3`}><p className="text-xs font-semibold text-foreground">{name}</p><ul className="mt-1.5 space-y-1">{items.map(item => <li key={item} className={body}>• {item}</li>)}</ul></div>)}</div></Block>
    <Block title="Organisational fit"><p className={body}>{e.organisationalFit}</p></Block>
    <Block title="Budget"><table className="w-full text-xs"><tbody>{e.budget.map(b => <tr key={b.item} className="border-b border-border/60"><td className="py-1">{b.item}</td><td className="py-1 text-right font-semibold tabular-nums">{b.value}</td></tr>)}</tbody></table><p className="mt-1.5 text-[10px] text-muted-foreground">{e.budgetNote}</p></Block>
    <Block title="Risk assessment"><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-xs"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-1 font-medium">Risk</th><th className="pr-3 font-medium">Likelihood</th><th className="pr-3 font-medium">Impact</th><th className="font-medium">How we manage it</th></tr></thead><tbody>{e.risks.map(r => <tr key={r.risk} className="border-b border-border/60 align-top"><td className="py-1.5 pr-3 font-medium text-foreground">{r.risk}</td><td className={`py-1.5 pr-3 font-semibold ${levelTone[r.likelihood]}`}>{r.likelihood}</td><td className={`py-1.5 pr-3 font-semibold ${levelTone[r.impact]}`}>{r.impact}</td><td className="py-1.5 text-muted-foreground">{r.mitigation}</td></tr>)}</tbody></table></div></Block>
    <div className="rounded-lg border border-border p-4">
      <p className={label}>{e.currentManagerBenchmark ? 'Current-manager benchmark · not a successor candidate' : 'Recorded recommendation'}</p>
      {e.currentManagerBenchmark ? <p className={`${body} mt-1`}>Any stored verdict concerns the incumbent benchmark and is not a successor recommendation. This study does not advise retaining or dismissing the current manager.</p> : <p className="mt-1 text-lg font-semibold text-foreground">{verdict ?? 'Not decided'}{confidence != null && <span className="ml-2 text-sm font-normal text-muted-foreground">{confidence}% recorded confidence</span>}</p>}
    </div>
    <p className="text-xs text-muted-foreground">These illustrative assessments do not calculate a probability of success. Football fit is assessed separately against the mandate brief; it is not a forecast of results.</p>
    {e.mandateId && <Link className="text-xs text-primary underline" href={`/mandates/${e.mandateId}/candidates#brief-matches`}>View computed football fit, source evidence and rule breakdown in Candidates</Link>}
  </div>
}
