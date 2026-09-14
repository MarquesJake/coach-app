import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, ChevronDown } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dossier } from '@/lib/mandates/showcase/data'
import { isTottenhamScenario } from '@/lib/mandates/showcase/scope'
import { MandateTabNav } from '../_components/mandate-tab-nav'
import { ShowcaseControls } from './controls'
import { PerformanceIntroduction, CoachPerformance } from './performance'
import { EloTrends } from './elo'
import './showcase.css'

export const metadata = { title: { absolute: 'Tottenham | Succession study · Gaffa' }, robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

function Sources({ ids }: { ids: string[] }) {
  return <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{ids.map(id => {
    const source = dossier.sources.find(s => s.id === id)
    return source ? <a key={id} className="case-source text-primary" href={source.url} target="_blank" rel="noreferrer">{source.title}<span className="sr-only"> (opens in new tab)</span></a> : null
  })}</div>
}
function Heading({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return <header className="mb-6"><p className="case-label">{number} / Appointment study</p><h2 className="mt-2 font-serif text-3xl font-medium tracking-tight">{title}</h2><p className="case-copy mt-2 max-w-3xl">{subtitle}</p></header>
}
function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h4 className="text-sm font-semibold">{title}</h4><div className="case-copy mt-2">{children}</div></div>
}
export default async function TottenhamShowcase({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const { data: mandate } = await db.from('mandates').select('id,custom_club_name').eq('id', id).maybeSingle()
  // The dashboard requires internal membership; this query also enforces mandate RLS.
  // Never serve the static case merely because someone knows the scenario UUID.
  if (!mandate || !isTottenhamScenario(mandate.id, mandate.custom_club_name)) notFound()
  return <div id="tottenham-showcase" className="mx-auto max-w-6xl space-y-12 pb-16">
    <div className="space-y-5 print:hidden"><MandateTabNav mandateId={id}/><Link href={`/mandates/${id}/decision`} className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4"/>Back to mandate</Link></div>
    <header className="case-cover rounded-2xl border border-border bg-card px-6 py-8 sm:px-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4"><p className="case-label">Gaffa / Succession study</p><p className="text-xs text-muted-foreground">{dossier.edition}</p></div>
      <p className="case-disclaimer mt-8 text-xs font-semibold text-primary">{dossier.label}</p>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">Tottenham Hotspur.<br/><span className="text-muted-foreground">The next decision.</span></h1>
      <p className="case-copy mt-6 max-w-2xl">Successor research after the club commissions a possible change. Six potential successors are studied against De Zerbi as the current-manager benchmark — the football case, feasibility and evidence still needed.</p>
      <div className="case-grid mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">{[['7','coaches studied'],['9','assessment areas each'],['17','public context references']].map(([n,label])=><div key={label}><p className="font-serif text-3xl">{n}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</div>
      <p className="mt-6 max-w-3xl text-xs leading-6 text-muted-foreground">Public facts link to their sources. Assessments, budgets and plans are Gaffa’s working view ahead of interviews and references. Dated edition; the live research may have moved on.</p>
    </header>
    <div className="space-y-4 print:hidden"><nav aria-label="Study contents" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">{[['brief','Decision brief'],['field','Coach comparison'],['results','Results & evidence'],['elo','Elo trends'],['dossiers','Full dossiers'],['delivery','Process & costs'],['sources','Source register']].map(([hash,label])=><a key={hash} className="underline underline-offset-4" href={`#${hash}`}>{label}</a>)}</nav><ShowcaseControls/></div>

    <section id="brief">
      <Heading number="01" title="Research the next appointment." subtitle="Commissioned successor research · no advice to retain or dismiss the incumbent."/>
      <div className="case-grid grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6"><Note title="The situation"><p>One point and no goals from the first three league games. That needs looking at, but it is a small sample — and the 5–1 cup win and a tighter display at Forest count too.</p><Sources ids={['spurs-bees','spurs-newcastle','spurs-forest','spurs-cup']}/></Note>
          <Note title="Our position"><p>The ranking from the brief puts Gasperini, Sarri and Knutsen top once the current manager and unrealistic targets are taken out. This study goes deeper on the seven coaches below — McKenna and Farioli (joint 4th), Hoeneß, Terzić, Silva and Knutsen — and De Zerbi as the benchmark. Gasperini and Sarri are next to be taken into the full assessment. De Zerbi is not a successor candidate.</p></Note>
          <Note title="The decision this helps the board make"><p>Agree where to spend the next round of research and what evidence would narrow the field. A successor only moves forward when we can explain the football, the timing, the staff and the cost together. If the job comes up before we are ready, look at an interim rather than rushing a permanent appointment.</p></Note></div>
        <aside className="rounded-xl border border-border bg-card p-6"><p className="case-label">What would change our view?</p><ul className="case-copy mt-4 space-y-4"><li><strong className="text-foreground">The benchmark changes.</strong> New evidence about the incumbent updates the comparison; the club determines whether to continue the succession commission.</li><li><strong className="text-foreground">An alternative can’t show a credible first month.</strong> A good long-term idea is no use if the handover would not work.</li><li><strong className="text-foreground">The deal can’t be done.</strong> No realistic release, the cost is too high or the staff demands don’t fit — that stops it.</li><li><strong className="text-foreground">The evidence doesn’t back the story.</strong> Solid evidence against a coach changes the case, however good the profile looks.</li></ul></aside>
      </div>
      <div className="case-grid mt-8 grid gap-4 sm:grid-cols-3">{[['Essential','Possession football, short build-up and high pressing; work with the inherited squad and show a credible first month.'],['Preferred','A record of improving players; more than one way to attack; works well with medical, analysis and recruitment.'],['Flexible','Exact formation, coaching language and the order of longer-term tactical changes.']].map(([label,body])=><div key={label} className="rounded-xl border border-border p-5"><p className="case-label">{label} · mandate requirement</p><p className="case-copy mt-3">{body}</p></div>)}</div>
    </section>

    <section id="field" className="case-section">
      <Heading number="02" title="Six successors and one benchmark." subtitle="Dated editorial research order, with the current-manager benchmark identified separately. Live computed football fit and its evidence are in Candidates; assessment reports remain in Assessment."/>
      <div className="divide-y divide-border border-y border-border">{dossier.coaches.map((c,index)=><article key={c.id} className="case-grid grid gap-3 py-5 sm:grid-cols-[2fr_2fr_2fr]">
        <div className="flex gap-4"><span className="case-label pt-1">{c.key === 'de-zerbi' ? 'Benchmark' : String(index).padStart(2,'0')}</span><div><a className="font-serif text-xl underline decoration-border underline-offset-4" href={`#coach-${c.key}`}>{c.name}</a><p className="mt-1 text-xs text-muted-foreground">{c.club}</p></div></div><div><p className="text-sm font-medium">{c.route}</p><p className="case-copy mt-1">{c.angle}</p></div><p className="case-copy">{c.obstacle}</p>
      </article>)}</div>
      <Link className="mt-4 inline-block text-sm text-primary underline" href={`/mandates/${id}/candidates#brief-matches`}>View computed football fit, source evidence and rule breakdown</Link>
      <details className="mt-5 rounded-xl border border-border p-5"><summary className="flex items-center justify-between gap-3 text-sm font-medium">Why not just add the obvious names?<ChevronDown className="case-chevron h-4 w-4"/></summary><div className="mt-5 space-y-5">{dossier.exclusions.map(c=><Note key={c.name} title={c.name}><p>{c.reason}</p><Sources ids={[c.source]}/></Note>)}<p className="case-copy">This is a chosen comparison, not the whole market. Any extra name has to cover a route we are missing or solve a specific need.</p></div></details>
    </section>

    <PerformanceIntroduction/>
    <EloTrends/>
    <section id="dossiers" className="case-section">
      <Heading number="03" title="The case for each coach." subtitle="All nine assessment areas for every coach. Public facts are kept separate from our working view, how we would test it and what is still unproven. The 63 sections are our view to test, not finished evidence."/>
      <div className="space-y-5">{dossier.coaches.map((c,index)=><details id={`coach-${c.key}`} key={c.id} className="rounded-xl border border-border bg-card p-5 sm:p-7">
        <summary className="flex items-center justify-between gap-4"><div><p className="case-label">{c.key === 'de-zerbi' ? 'Benchmark' : String(index).padStart(2,'0')} / {c.route}</p><h3 className="mt-2 font-serif text-2xl sm:text-3xl">{c.name}</h3><p className="mt-2 text-sm text-muted-foreground">{c.angle}</p></div><ChevronDown className="case-chevron h-5 w-5 shrink-0"/></summary>
        <div className="mt-7 space-y-7">
          <section className="rounded-lg border border-border p-5"><p className="case-label">Public facts · checked 10 September 2026</p><p className="case-copy mt-3">{c.facts}</p><Sources ids={c.sources}/></section>
          <CoachPerformance coachKey={c.key}/>
          <div className="case-disclaimer text-xs font-semibold text-primary">Our working view · interviews and references to follow</div>
          <div className="case-grid grid gap-6 md:grid-cols-3"><Note title="Why look at him?">{c.case}</Note><Note title="The case against">{c.against}</Note><Note title="What has to happen next">{c.gate}</Note></div>
          <div className="divide-y divide-border">{c.areas.map((area,i)=><section key={area.key} className="case-assessment py-6"><p className="case-label">{String(i+1).padStart(2,'0')} / Working assessment</p><h4 className="mt-2 text-lg font-semibold">{area.title}</h4><p className="case-copy mt-3">{area.hypothesis}</p><div className="case-grid mt-4 grid gap-5 md:grid-cols-2"><Note title="How we would test it">{area.test}</Note><Note title="Still to prove">{area.counter}</Note></div></section>)}</div>
          <div className="flex flex-wrap gap-3 border-t border-border pt-5 print:hidden"><Link className="gaffa-action gaffa-action-secondary" href={`/coaches/${c.id}`}>Coach profile<ArrowUpRight className="h-3 w-3"/></Link><Link className="gaffa-action gaffa-action-primary" href={`/coaches/${c.id}/research?mandate=${id}`}>Open live research<ArrowUpRight className="h-3 w-3"/></Link><a className="gaffa-action" href="#field">Back to comparison</a></div>
        </div>
      </details>)}</div>
    </section>

    <section id="delivery" className="case-section">
      <Heading number="04" title="From a good story to a decision we can defend." subtitle="Who does what, and by when."/>
      <div className="space-y-4">{dossier.workstreams.map((w,i)=><details key={w.title} className="rounded-xl border border-border p-5"><summary className="flex items-center justify-between gap-4"><div><p className="case-label">{String(i+1).padStart(2,'0')} / {w.due}</p><h3 className="mt-2 text-lg font-semibold">{w.title}</h3><p className="mt-1 text-xs text-muted-foreground">{w.owner}</p></div><ChevronDown className="case-chevron h-4 w-4 shrink-0"/></summary><div className="mt-5 space-y-4"><p className="case-copy">{w.body}</p><Note title="The output">{w.output}</Note></div></details>)}</div>
      <div className="case-grid mt-10 grid gap-8 lg:grid-cols-2"><section><h3 className="font-serif text-2xl">What would it cost?</h3><p className="case-copy mt-2">Planning figures — not what any coach has asked for, and not a budget the club has signed off.</p><dl className="mt-5 divide-y divide-border">{dossier.budgets.map(([label,value])=><div key={label} className="flex justify-between gap-6 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[45%] text-right font-medium">{value}</dd></div>)}</dl><p className="case-copy mt-4">Head coach and extra staff: £7m–£10m a year, or up to £11m with the full bonus. Add up to £8m compensation to release the new coach and the first year could reach £19m. Employer costs, retained staff, relocation and paying off De Zerbi are on top and not yet known — so this is not the full cost of a change.</p></section>
      <section className="rounded-xl border border-border bg-card p-6"><h3 className="font-serif text-2xl">Who does what?</h3><p className="case-label mt-3">Who is responsible for what</p><div className="mt-5 space-y-5"><Note title="Head coach">Team selection, training and match decisions. Explains the staff roles he needs before naming anyone.</Note><Note title="Sporting director">Squad planning, recruitment decisions and the link between the coach, the academy and the board.</Note><Note title="Existing specialists">Keep the medical, performance and academy staff in place for the first eight weeks, then review roles with them.</Note><Note title="Incoming staff">Up to three new staff to start. For each: the job, any overlap, the cost, and the back-up if they cannot come.</Note></div></section></div>
    </section>

    <section className="case-section"><Heading number="05" title="References that tell us something." subtitle="Who we plan to speak to and what we will ask. Every account gets a date, the person’s relationship to the coach, how close they were, and what backs it up or contradicts it."/>
      <div className="case-grid grid gap-4 md:grid-cols-2">{dossier.references.map(([role,focus,question,caution])=><article key={role} className="case-assessment rounded-xl border border-border p-5"><p className="case-label">Planned reference · {focus}</p><h3 className="mt-2 text-lg font-semibold">{role}</h3><p className="case-copy mt-3">{question}</p><p className="case-copy mt-4 border-t border-border pt-4">{caution}</p></article>)}</div>
      <p className="case-copy mt-5">We use desk research, data, media, match analysis, training visits, interviews and references. This edition covers public research and our analysis; training visits, interviews and reference calls come next.</p>
    </section>

    <section className="case-section"><Heading number="06" title="The first 90 days." subtitle="A plan to test with a potential successor, using the current-manager baseline for comparison."/><div className="case-grid grid gap-5 md:grid-cols-3">{dossier.plan.map(([days,title,body,review])=><article key={days} className="rounded-xl border border-border p-6"><p className="case-label">{days}</p><h3 className="mt-3 font-serif text-2xl">{title}</h3><p className="case-copy mt-4">{body}</p><div className="mt-5 border-t border-border pt-4"><Note title="Review question">{review}</Note></div></article>)}</div></section>

    <section id="sources" className="case-section"><Heading number="07" title="Our sources." subtitle="Every public source, checked for this 10 September 2026 edition. An older article confirms what happened then — not whether a coach is available now."/><div className="divide-y divide-border">{dossier.sources.map((s,i)=><article key={s.id} className="case-assessment py-4"><p className="case-label">{String(i+1).padStart(2,'0')} / {s.date}</p><a className="case-source mt-2 inline-block text-primary" href={s.url} target="_blank" rel="noreferrer">{s.title}<span className="sr-only"> (opens in new tab)</span></a><p className="case-copy mt-2">{s.note}</p></article>)}</div></section>
    <footer className="border-t border-border pt-6"><p className="case-label">Gaffa / Tottenham Hotspur / 10 September 2026</p><p className="case-copy mt-2">Next step: back up the points that matter most for the decision with hard evidence.</p><Link className="gaffa-action gaffa-action-secondary mt-5 print:hidden" href={`/mandates/${id}/plan`}>Open mandate tasks<ArrowUpRight className="h-4 w-4"/></Link></footer>
  </div>
}
