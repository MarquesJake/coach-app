import { ArrowUpRight, ChevronDown, Plus } from 'lucide-react'
import { researchAreaLabel, evidenceLabel } from '@/lib/display-copy'
import Link from 'next/link'
import { readResearchContext, researchHref, questionsForScope, type ResearchParams } from '@/lib/research-context'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { RESEARCH_DOMAINS, RESEARCH_PROMPTS, evidenceStatus } from '@/lib/decision-workflow'
import { ResearchForm, type FindingOption } from './research-form'
import { ResearchGuide } from './research-guide'
import { coachResearchTemplate } from '@/lib/coach-research-guide'
import { COACH_RESEARCH_GUIDE } from '@/lib/coach-research-guide'
import { methodLabel } from '@/lib/assessment/criteria'

export const metadata = { title: 'Research' }


export default async function ResearchPage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<ResearchParams> }) {
  const { id } = await params; const query = await searchParams
  const { mandate: requestedMandate, ...restContext } = readResearchContext(query)
  const area = typeof query.area === 'string' ? query.area : undefined
  const template = typeof query.template === 'string' ? query.template : undefined
  const general = query.scope === 'general'
  const initialTemplate = coachResearchTemplate(template)
  const db = await createServerSupabaseClient()
  let questionQuery = db.from('coach_research_questions').select('*').eq('coach_id', id)
  questionQuery = requestedMandate && !general ? questionQuery.eq('mandate_id', requestedMandate) : questionQuery.is('mandate_id', null)
  const [{data:coach}, questions, claims, mandates] = await Promise.all([
    db.from('coaches').select('id').eq('id',id).maybeSingle(),
    questionQuery.order('created_at',{ascending:false}),
    db.from('profile_claims').select('id, claimed_value, source_name, verification_status, occurred_at, evidence_summary').eq('coach_id',id).order('occurred_at',{ascending:false}),
    db.from('mandates').select('id,custom_club_name,clubs(name)').order('created_at',{ascending:false}),
  ])
  if (!coach) notFound()
  const findings=(claims.data ?? []) as FindingOption[]
  const mandateOptions=(mandates.data ?? []).map(m=>({id:m.id,name:m.custom_club_name || (m.clubs as {name:string}|null)?.name || 'Confidential appointment'}))
  const initialMandate = mandateOptions.some(m => m.id === requestedMandate) ? requestedMandate : undefined
  if (requestedMandate && !initialMandate) return <p role="alert">This mandate didn’t load. Go back to the mandate and open research again.</p>
  const context = { ...restContext, coach: id, mandate: initialMandate }
  const visibleQuestions = questionsForScope(questions.data ?? [], initialMandate, general)
  const href = (path: string) => researchHref(path, context)
  const captureHref = (path: string) => researchHref(path, general ? { coach: id, returnTo: href(`/coaches/${id}/research?scope=general`) } : context)
  return <div className="space-y-5">
    {initialMandate && <Link className="text-sm text-primary underline" href={href(`/mandates/${initialMandate}/decision`)}>Back to mandate overview</Link>}
    <section className="flex flex-wrap items-start justify-between gap-4"><div><p className="gaffa-eyebrow mb-2">Build the evidence</p><h2 className="text-2xl font-semibold tracking-tight">Research</h2><p className="gaffa-description mt-2 hidden sm:block">Ask what could change the decision. Link your sources and note anyone who sees it differently.</p><div className="mt-4 hidden flex-wrap gap-4 sm:flex"><Link className="gaffa-link" href={captureHref(`/intelligence/conversations?coach=${id}`)}>Record conversation</Link><Link className="gaffa-link" href={captureHref(`/intelligence/inbox?coach=${id}`)}>Add source material</Link><Link className="gaffa-link" href={href(`/coaches/${id}/intelligence`)}>Review findings</Link></div></div><Link className="gaffa-action gaffa-action-primary" href="#new-question"><Plus className="h-4 w-4"/>New question</Link></section>
    {(questions.error || claims.error || mandates.error) && <p role="alert" className="rounded border border-destructive p-4 text-sm">Some research didn’t load. Refresh before making changes.</p>}
    <div className="flex flex-wrap gap-3 text-sm"><strong>{general || !initialMandate ? 'General coach research' : `Mandate research: ${mandateOptions.find(m => m.id === initialMandate)?.name}`}</strong>{initialMandate && <Link className="underline" href={researchHref(`/coaches/${id}/research?scope=${general ? 'appointment' : 'general'}`, { ...context, question: undefined })}>{general ? 'This appointment' : 'Separate general research'}</Link>}<details><summary className="cursor-pointer underline">Switch mandate</summary>{mandateOptions.map(m => <Link className="block py-2 underline" key={m.id} href={researchHref(`/coaches/${id}/research`, { coach: id, mandate: m.id })}>{m.name}</Link>)}</details></div>
    <p className="text-xs text-muted-foreground">General research can be reused for any mandate. It only counts for a specific brief once it has been assessed for it.</p>
    <ResearchGuide mandate={initialMandate} context={context} general={general}/>
    <details className="gaffa-disclosure rounded-xl bg-muted/60 p-4"><summary className="cursor-pointer font-medium">Start with a broader question</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">{RESEARCH_DOMAINS.map(d=><Link key={d} href={href(`/coaches/${id}/research?area=${encodeURIComponent(d)}${general ? '&scope=general' : ''}#new-question`)} className="rounded border border-border p-3 text-sm hover:bg-muted"><strong>{researchAreaLabel(d)}</strong><p className="mt-1 text-muted-foreground">{RESEARCH_PROMPTS[d]}</p></Link>)}</div></details>
    <div className="gaffa-panel !py-2">{visibleQuestions.map(q=><article key={q.id} id={`question-${q.id}`} className="scroll-mt-20 border-b border-border py-6 last:border-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="gaffa-eyebrow">{researchAreaLabel(q.domain)}</span><span className="gaffa-badge">{q.status === 'answered' ? 'Answer recorded' : q.status === 'in_progress' ? 'In progress' : 'Open question'}</span></div>
      <div className="mb-3 flex flex-wrap gap-4 text-sm">{[['Add source material', '/intelligence/inbox'], ['Record conversation', '/intelligence/conversations'], ['Review findings', '/intelligence/review']].map(([label, path]) => <Link key={path} className="text-primary underline" href={researchHref(path, { ...context, mandate: q.mandate_id ?? undefined, question: q.id })}>{label}</Link>)}</div>
      <h3 className="max-w-4xl text-base font-medium leading-relaxed">{q.question}</h3>
      <p className="mt-2 text-xs text-muted-foreground">Assessment area: {COACH_RESEARCH_GUIDE.find(a => a.criterion === q.assessment_area)?.title ?? 'Not assigned yet — choose an area in Edit research'}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{q.mandate_id ? mandateOptions.find(m=>m.id===q.mandate_id)?.name || 'Unavailable appointment' : 'General coach research'}</span><span>{q.owner || 'Assign an owner'}</span>{q.due_on && <span className={q.status!=='answered' && q.due_on < new Date().toISOString().slice(0,10)?'text-destructive':''}>Review {q.due_on}</span>}</div>
      <details className="gaffa-disclosure mt-4"><summary className="flex w-fit items-center gap-2 text-sm font-medium text-primary">Assessment and sources<ChevronDown className="disclosure-chevron h-4 w-4"/></summary><div className="mt-4 space-y-4 rounded-xl bg-muted/50 p-5">
        <div><h4 className="text-xs font-semibold text-muted-foreground">Why this matters</h4><p className="mt-1 text-sm leading-relaxed">{q.decision_impact}</p></div>
        <p className="text-xs text-muted-foreground">Evidence methods recorded: {q.evidence_methods?.length ? q.evidence_methods.map(methodLabel).join(' · ') : 'Not recorded'}</p>
        {q.answer && <div><h4 className="text-xs font-semibold text-muted-foreground">Current assessment</h4><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{q.answer}</p></div>}
        {q.counter_evidence && <div><h4 className="text-xs font-semibold text-muted-foreground">Conflicting accounts and limits</h4><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{q.counter_evidence}</p></div>}
        {q.evidence_claim_ids.length>0 && <div className="space-y-3"><h4 className="text-xs font-semibold text-muted-foreground">What supports it</h4>{q.evidence_claim_ids.map(fid=>{const f=findings.find(x=>x.id===fid);return <div key={fid} className="border-l-2 border-primary/30 pl-3 text-sm">{f ? <><p>{f.claimed_value}</p><p className="mt-1 text-xs text-muted-foreground">{evidenceLabel(evidenceStatus(f))} · {f.source_name || 'Source missing'} · {f.occurred_at?.slice(0,10) || 'Undated'}</p></> : 'Linked finding unavailable — review this conclusion'}</div>})}</div>}
        {q.source_plan && <div><h4 className="text-xs font-semibold text-muted-foreground">How we’ll check</h4><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{q.source_plan}</p></div>}
        <p className="text-xs text-muted-foreground">Updated {q.updated_at.slice(0,10)} · Revision {q.version} · Internal research</p>
      </div></details>
      <details className="gaffa-disclosure mt-3"><summary className="flex w-fit items-center gap-2 text-xs text-muted-foreground">Edit research<ArrowUpRight className="h-3 w-3"/></summary><div className="mt-4"><ResearchForm coachId={id} row={q} findings={findings} mandates={mandateOptions}/></div></details>
    </article>)}{!visibleQuestions.length && <p className="py-8 text-sm text-muted-foreground">No questions yet. Start with what could change your view of this coach.</p>}</div>
    <section id="new-question" className="gaffa-panel scroll-mt-20"><h3 className="mb-4 font-semibold">New research question</h3>{initialTemplate && <p className="mb-4 text-sm text-muted-foreground">Question picked from the guide. Adjust the wording and plan before saving — nothing has been added yet.</p>}<ResearchForm key={`${area ?? 'new'}-${general ? 'general' : initialMandate ?? ''}-${initialTemplate?.key ?? ''}`} coachId={id} findings={findings} mandates={mandateOptions} initialDomain={area} initialMandate={general ? undefined : initialMandate} initialTemplate={initialTemplate}/></section>
  </div>
}
