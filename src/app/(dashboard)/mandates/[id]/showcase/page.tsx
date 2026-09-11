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

export const metadata = { title: { absolute: 'Tottenham | Internal appointment study · Gaffa' }, robots: { index: false, follow: false } }
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
      <div className="flex flex-wrap items-center justify-between gap-4"><p className="case-label">Gaffa / Executive search study</p><p className="text-xs text-muted-foreground">{dossier.edition}</p></div>
      <p className="case-disclaimer mt-8 text-xs font-semibold text-primary">{dossier.label}</p>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">Tottenham Hotspur.<br/><span className="text-muted-foreground">The next decision.</span></h1>
      <p className="case-copy mt-6 max-w-2xl">A working study of supported continuity and six alternative coaches. Prepared for discussion with Rasmus and Ben: the football case, the practical conditions and the questions that could change the view.</p>
      <div className="case-grid mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">{[['7','coaches studied'],['9','assessment areas each'],['17','public context references']].map(([n,label])=><div key={label}><p className="font-serif text-3xl">{n}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</div>
      <p className="mt-6 max-w-3xl text-xs leading-6 text-muted-foreground">Public facts are linked to sources. Worked assessments, budgets and plans are fictional scenario material. No club instruction, candidate interest, private reference, completed interview or appointment recommendation is claimed. This is a dated presentation edition; live research records may subsequently change.</p>
    </header>
    <div className="space-y-4 print:hidden"><nav aria-label="Study contents" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">{[['brief','Decision brief'],['field','Coach comparison'],['results','Results & evidence'],['elo','Elo trends'],['dossiers','Full dossiers'],['delivery','Process & costs'],['sources','Source register']].map(([hash,label])=><a key={hash} className="underline underline-offset-4" href={`#${hash}`}>{label}</a>)}</nav><ShowcaseControls/></div>

    <section id="brief">
      <Heading number="01" title="Support now. Prepare properly." subtitle="Example board brief · fictional internal position, not a recommendation to Tottenham."/>
      <div className="case-grid grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6"><Note title="The situation"><p>The opening three league games produced one point and no goals. That warrants close examination, but it is a small sample. The separate cup win and the improved organisation described after Forest belong in the assessment too.</p><Sources ids={['spurs-bees','spurs-newcastle','spurs-forest','spurs-cup']}/></Note>
          <Note title="The proposed internal position"><p>Continue assessing the incumbent against a specific improvement plan while preparing alternatives. Research McKenna first and Hoeneß as the strongest comparative study in this exercise. Keep Knutsen as a longer-horizon route. Use Silva, Terzić and Farioli to challenge whether the preferred direction is actually the right one.</p></Note>
          <Note title="The decision this study should enable"><p>Agree the next research spend and the evidence needed to narrow the field. A successor should only advance when the football advantage, timing, staff requirements and cost can be explained together. If a hypothetical vacancy arrives first, evaluate a separate interim bridge rather than forcing a permanent appointment.</p></Note></div>
        <aside className="rounded-xl border border-border bg-card p-6"><p className="case-label">What would change our view?</p><ul className="case-copy mt-4 space-y-4"><li><strong className="text-foreground">Improvement under the incumbent.</strong> Repeatable chance creation and better protection make continuity more attractive.</li><li><strong className="text-foreground">An alternative fails the first-month test.</strong> A good long-term idea cannot compensate for an unworkable transition.</li><li><strong className="text-foreground">The appointment cannot be made.</strong> No credible release route, unacceptable cost or incompatible staff conditions stops progression.</li><li><strong className="text-foreground">The evidence contradicts the story.</strong> Relevant, corroborated counterevidence changes the case even when the profile is appealing.</li></ul></aside>
      </div>
      <div className="case-grid mt-8 grid gap-4 sm:grid-cols-3">{[['Essential','Work with the inherited squad; explain a credible first month; accept clear decision rights.'],['Preferred','Demonstrable player improvement; adaptable attacking solutions; effective multidisciplinary work.'],['Flexible','Exact formation, coaching vocabulary and the sequence of longer-term tactical changes.']].map(([label,body])=><div key={label} className="rounded-xl border border-border p-5"><p className="case-label">{label} · scenario requirement</p><p className="case-copy mt-3">{body}</p></div>)}</div>
    </section>

    <section id="field" className="case-section">
      <Heading number="02" title="A field with a purpose." subtitle="Research order in this fictional exercise. These are different routes to test, not a ranked appointment shortlist."/>
      <div className="divide-y divide-border border-y border-border">{dossier.coaches.map((c,index)=><article key={c.id} className="case-grid grid gap-3 py-5 sm:grid-cols-[2fr_2fr_2fr]">
        <div className="flex gap-4"><span className="case-label pt-1">{String(index+1).padStart(2,'0')}</span><div><a className="font-serif text-xl underline decoration-border underline-offset-4" href={`#coach-${c.key}`}>{c.name}</a><p className="mt-1 text-xs text-muted-foreground">{c.club}</p></div></div><div><p className="text-sm font-medium">{c.route}</p><p className="case-copy mt-1">{c.angle}</p></div><p className="case-copy">{c.obstacle}</p>
      </article>)}</div>
      <details className="mt-5 rounded-xl border border-border p-5"><summary className="flex items-center justify-between gap-3 text-sm font-medium">Why not simply add the familiar names?<ChevronDown className="case-chevron h-4 w-4"/></summary><div className="mt-5 space-y-5">{dossier.exclusions.map(c=><Note key={c.name} title={c.name}><p>{c.reason}</p><Sources ids={[c.source]}/></Note>)}<p className="case-copy">This is a selected comparison field, not an exhaustive market search. Additional names should fill a missing route or solve a specific requirement.</p></div></details>
    </section>

    <PerformanceIntroduction/>
    <EloTrends/>
    <section id="dossiers" className="case-section">
      <Heading number="03" title="The case behind each name." subtitle="All nine areas from the assessment framework. Public baselines are separated from worked hypotheses, tests and reasons for caution. Historical results now inform each case; none of the 63 fictional scenario sections counts as completed evidence."/>
      <div className="space-y-5">{dossier.coaches.map((c,index)=><details id={`coach-${c.key}`} key={c.id} className="rounded-xl border border-border bg-card p-5 sm:p-7">
        <summary className="flex items-center justify-between gap-4"><div><p className="case-label">{String(index+1).padStart(2,'0')} / {c.route}</p><h3 className="mt-2 font-serif text-2xl sm:text-3xl">{c.name}</h3><p className="mt-2 text-sm text-muted-foreground">{c.angle}</p></div><ChevronDown className="case-chevron h-5 w-5 shrink-0"/></summary>
        <div className="mt-7 space-y-7">
          <section className="rounded-lg border border-border p-5"><p className="case-label">Public baseline · checked 10 September 2026</p><p className="case-copy mt-3">{c.facts}</p><Sources ids={c.sources}/></section>
          <CoachPerformance coachKey={c.key}/>
          <div className="case-disclaimer text-xs font-semibold text-primary">Fictional scenario assessment below · no candidate proposal or private testimony received</div>
          <div className="case-grid grid gap-6 md:grid-cols-3"><Note title="Why investigate?">{c.case}</Note><Note title="The strongest countercase">{c.against}</Note><Note title="Condition for progressing">{c.gate}</Note></div>
          <div className="divide-y divide-border">{c.areas.map((area,i)=><section key={area.key} className="case-assessment py-6"><p className="case-label">{String(i+1).padStart(2,'0')} / Fictional working assessment</p><h4 className="mt-2 text-lg font-semibold">{area.title}</h4><p className="case-copy mt-3">{area.hypothesis}</p><div className="case-grid mt-4 grid gap-5 md:grid-cols-2"><Note title="How we would test it">{area.test}</Note><Note title="What remains unproven">{area.counter}</Note></div></section>)}</div>
          <div className="flex flex-wrap gap-3 border-t border-border pt-5 print:hidden"><Link className="gaffa-action gaffa-action-secondary" href={`/coaches/${c.id}`}>Coach profile<ArrowUpRight className="h-3 w-3"/></Link><Link className="gaffa-action gaffa-action-primary" href={`/coaches/${c.id}/research?mandate=${id}`}>Open live research<ArrowUpRight className="h-3 w-3"/></Link><a className="gaffa-action" href="#field">Back to comparison</a></div>
        </div>
      </details>)}</div>
    </section>

    <section id="delivery" className="case-section">
      <Heading number="04" title="From a good story to a defensible decision." subtitle="Fictional work programme · proposed responsibilities and dates for the internal exercise. No meeting or external approach has been arranged."/>
      <div className="space-y-4">{dossier.workstreams.map((w,i)=><details key={w.title} className="rounded-xl border border-border p-5"><summary className="flex items-center justify-between gap-4"><div><p className="case-label">{String(i+1).padStart(2,'0')} / {w.due}</p><h3 className="mt-2 text-lg font-semibold">{w.title}</h3><p className="mt-1 text-xs text-muted-foreground">{w.owner}</p></div><ChevronDown className="case-chevron h-4 w-4 shrink-0"/></summary><div className="mt-5 space-y-4"><p className="case-copy">{w.body}</p><Note title="The output">{w.output}</Note></div></details>)}</div>
      <div className="case-grid mt-10 grid gap-8 lg:grid-cols-2"><section><h3 className="font-serif text-2xl">What would it cost?</h3><p className="case-copy mt-2">Fictional planning envelope, not candidate salary intelligence or a club-approved budget.</p><dl className="mt-5 divide-y divide-border">{dossier.budgets.map(([label,value])=><div key={label} className="flex justify-between gap-6 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[45%] text-right font-medium">{value}</dd></div>)}</dl><p className="case-copy mt-4">Base annual coach and additional staff cost: £7m–£10m, or up to £11m including the full example bonus. With the full £8m incoming compensation allowance, the upper first-year subtotal is £19m. Employer costs, retained staff, relocation and any incumbent settlement are additional and unknown. This is not a complete cost of change.</p></section>
      <section className="rounded-xl border border-border bg-card p-6"><h3 className="font-serif text-2xl">Who does what?</h3><p className="case-label mt-3">Fictional staff and authority model</p><div className="mt-5 space-y-5"><Note title="Head coach">Selection, training and match decisions. Explain required staff roles before naming individuals.</Note><Note title="Sporting lead">Squad planning, recruitment decisions and the link between the coach, academy and executive team.</Note><Note title="Existing specialists">Retain medical, performance and academy continuity for the first eight weeks in this exercise. Review responsibilities with the people involved.</Note><Note title="Incoming staff">Model up to three initial arrivals. Identify the purpose, overlap, cost and fallback if a preferred colleague cannot move.</Note></div></section></div>
    </section>

    <section className="case-section"><Heading number="05" title="Reference work with a point." subtitle="A planned reference matrix, not a record of completed calls. Every account should have a date, relationship, proximity to the event and a separate record of what corroborates or contradicts it."/>
      <div className="case-grid grid gap-4 md:grid-cols-2">{dossier.references.map(([role,focus,question,caution])=><article key={role} className="case-assessment rounded-xl border border-border p-5"><p className="case-label">Planned reference · {focus}</p><h3 className="mt-2 text-lg font-semibold">{role}</h3><p className="case-copy mt-3">{question}</p><p className="case-copy mt-4 border-t border-border pt-4">{caution}</p></article>)}</div>
      <p className="case-copy mt-5">The framework uses desk research, data, AI-assisted work, media, match analysis, training observation, interviews and references. This edition contains public-source research and clearly labelled worked content. AI-written material is not a primary source; training visits, interviews and reference calls remain unperformed.</p>
    </section>

    <section className="case-section"><Heading number="06" title="The first 90 days." subtitle="An illustrative delivery plan to test with any coach. It also provides a fair benchmark for supported continuity."/><div className="case-grid grid gap-5 md:grid-cols-3">{dossier.plan.map(([days,title,body,review])=><article key={days} className="rounded-xl border border-border p-6"><p className="case-label">{days}</p><h3 className="mt-3 font-serif text-2xl">{title}</h3><p className="case-copy mt-4">{body}</p><div className="mt-5 border-t border-border pt-4"><Note title="Review question">{review}</Note></div></article>)}</div></section>

    <section id="sources" className="case-section"><Heading number="07" title="Show the workings." subtitle="Public source register · reviewed for this 10 September 2026 edition. Historical articles establish the event they describe; they do not automatically establish present availability."/><div className="divide-y divide-border">{dossier.sources.map((s,i)=><article key={s.id} className="case-assessment py-4"><p className="case-label">{String(i+1).padStart(2,'0')} / {s.date}</p><a className="case-source mt-2 inline-block text-primary" href={s.url} target="_blank" rel="noreferrer">{s.title}<span className="sr-only"> (opens in new tab)</span></a><p className="case-copy mt-2">{s.note}</p></article>)}</div></section>
    <footer className="border-t border-border pt-6"><p className="case-label">Gaffa / Internal scenario / 10 September 2026</p><p className="case-copy mt-2">The next useful step is to replace the most decision-critical hypotheses with evidence. More pages only help if they make the choice clearer.</p><Link className="gaffa-action gaffa-action-secondary mt-5 print:hidden" href={`/mandates/${id}/plan`}>Open mandate tasks<ArrowUpRight className="h-4 w-4"/></Link></footer>
  </div>
}
