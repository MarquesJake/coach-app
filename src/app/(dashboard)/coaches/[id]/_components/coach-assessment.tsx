import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { ChevronDown } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { assessmentCoverage, type CoverageQuestion, type CoverageFinding } from '@/lib/coach-assessment-coverage'
import { COACH_RESEARCH_GUIDE } from '@/lib/coach-research-guide'
import { methodLabel, type CriterionKey } from '@/lib/assessment/criteria'
import { evidenceStatus } from '@/lib/decision-workflow'
import { evidenceLabel } from '@/lib/display-copy'

export async function CoachAssessment({ coachId, areas, data }: { coachId: string; areas?: CriterionKey[]; data?: {questions: CoverageQuestion[]; findings: CoverageFinding[]} }) {
  let loaded = data
  if (!loaded) {
    const db = await createServerSupabaseClient()
    const [research, claims] = await Promise.all([
      db.from('coach_research_questions').select('*').eq('coach_id',coachId).is('mandate_id',null).order('updated_at',{ascending:false}),
      db.from('profile_claims').select('id,claimed_value,source_name,verification_status,review_status,occurred_at,evidence_summary').eq('coach_id',coachId),
    ])
    if (research.error || claims.error) return <section className="gaffa-panel"><p role="alert" className="text-sm">The assessment didn’t load. Refresh the page before relying on it.</p></section>
    loaded = {questions: research.data ?? [], findings: claims.data ?? []}
  }
  const coverage = assessmentCoverage(loaded.questions, loaded.findings).filter(a => !areas || areas.includes(a.key))
  const unclassified = loaded.questions.filter(q => !q.mandate_id && !q.assessment_area)
  const scoped = loaded.questions.filter(q => q.mandate_id)
  const base = `/coaches/${coachId}/research?scope=general`
  // Mandate research stays in its own context, but the profile should point to it rather than look empty.
  const mandateResearch = new Map<string, { name: string; count: number }>()
  if (!areas && !coverage.some(a => a.rows.length)) {
    const db = await createServerSupabaseClient()
    const { data: rows } = await db.from('coach_research_questions').select('mandate_id, mandates(custom_club_name, clubs(name))').eq('coach_id', coachId).not('mandate_id', 'is', null)
    for (const row of (rows ?? []) as Array<{ mandate_id: string; mandates: { custom_club_name: string | null; clubs: { name: string | null } | null } | null }>) {
      const name = row.mandates?.custom_club_name || row.mandates?.clubs?.name || 'Mandate'
      const entry = mandateResearch.get(row.mandate_id) ?? { name, count: 0 }
      entry.count++
      mandateResearch.set(row.mandate_id, entry)
    }
  }
  return <section className="gaffa-panel">
    <div className="mb-5"><p className="gaffa-eyebrow mb-2">{areas ? 'Supporting research' : 'The assessment'}</p><h2 className="gaffa-panel-heading">{areas ? 'What the research tells us' : 'Coach assessment at a glance'}</h2><p className="gaffa-description mt-2">Our view on each of the nine areas, what backs it up and what we still need to check. Internal views, not final recommendations.</p></div>
    {mandateResearch.size > 0 && <div className="mb-5 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
      <p className="font-medium">The research on this coach is held within his mandates.</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">{[...mandateResearch].map(([id, m]) => <Link key={id} className="gaffa-link" href={`/coaches/${coachId}/research?mandate=${id}`}>{m.name} · {m.count} question{m.count === 1 ? '' : 's'} →</Link>)}</div>
    </div>}
    <div className="divide-y divide-border">{coverage.map(area => {
      const guide = COACH_RESEARCH_GUIDE.find(g => g.criterion === area.key)!
      return <details key={area.key} open={!!areas && area.answers.length > 0} className="gaffa-disclosure py-4">
        <summary className="flex cursor-pointer items-start justify-between gap-3"><span className="min-w-0"><span className="block text-sm font-medium">{guide.title}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{area.answers.length ? `${area.answers.length} provisional answer${area.answers.length === 1 ? '' : 's'}` : area.rows.length ? 'Research started, no answer yet' : 'No linked analyst research yet'}</span>{area.answers[0] && <span className="mt-2 line-clamp-2 text-sm font-normal leading-relaxed">{area.answers[0].answer}</span>}{area.answers.some(a => a.needsReview || a.disputed) && <span className="mt-1 block text-xs font-medium text-amber-700 dark:text-amber-300">Sources or conflicting accounts need review</span>}</span><ChevronDown className="disclosure-chevron mt-1 h-4 w-4 shrink-0 text-muted-foreground"/></summary>
        <div className="mt-4 space-y-4 border-l-2 border-primary/30 pl-4">
          {area.answers.slice(0,2).map(answer => <article key={answer.id} className="space-y-2">
            <p className="text-sm font-medium">{answer.question}</p><p className="whitespace-pre-wrap text-sm leading-relaxed">{answer.answer}</p>
            <p className="text-sm text-muted-foreground">Why it matters: {answer.decision_impact}</p>
            {answer.disputed && <p className="rounded-lg bg-muted p-3 text-sm">Conflicting accounts or reservations: {answer.counter_evidence || 'A linked source is disputed. Resolve the difference before relying on this view.'}</p>}
            {answer.needsReview && <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Some linked sources need checking: they may be unconfirmed, out of date or missing.</p>}
            <details className="gaffa-disclosure text-xs"><summary className="cursor-pointer text-primary">Supporting accounts and sources · {answer.sources.length}</summary><ul className="mt-2 space-y-3">{answer.sources.map(f => <li key={f.id}><p className="text-sm">{f.claimed_value}</p><p className="mt-1 text-muted-foreground">{f.source_name || 'Source not identified'} · {f.occurred_at?.slice(0,10) || 'Date not recorded'} · {evidenceLabel(evidenceStatus(f))}</p></li>)}</ul><Link className="gaffa-link mt-3 inline-block" href={`/coaches/${coachId}/intelligence`}>Review source records</Link></details>
            <Link className="gaffa-link inline-block py-2 text-xs" href={`${base}#question-${answer.id}`}>Review answer · {answer.updated_at.slice(0,10)}</Link>
          </article>)}
          {area.answers.length > 2 && <Link className="gaffa-link text-sm" href={base}>Review all {area.answers.length} answers in this area</Link>}
          {area.held > 0 && <p className="text-xs text-muted-foreground">{area.held} recorded answer(s) need usable linked findings before appearing here.</p>}
          {area.open.length > 0 && <div><h3 className="text-xs font-semibold text-muted-foreground">Open questions</h3><ul className="mt-2 space-y-2">{area.open.slice(0,3).map(q => <li key={q.id}><Link className="gaffa-link text-sm" href={`${base}#question-${q.id}`}>{q.question}</Link></li>)}</ul>{area.open.length > 3 && <Link href={base} className="gaffa-link mt-2 inline-block text-xs">Review all {area.open.length} open questions</Link>}</div>}
          <div className="rounded-lg bg-muted/50 p-3"><h3 className="text-xs font-semibold">Evidence still to check</h3>{area.missingMethods.length ? <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{area.missingMethods.map(method => <li key={method}>{methodLabel(method)} — not yet used for this area.</li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">The key evidence is in. Check how good, independent and relevant it is before reaching a view.</p>}<p className="mt-2 text-xs text-muted-foreground">Only counts research linked here — there may be more evidence still to connect.</p></div>
          <Link href={`${base}&template=${guide.key}#new-question`} className="gaffa-link inline-block py-2 text-sm">Investigate {guide.title.toLowerCase()} →</Link>
        </div>
      </details>
    })}</div>
    {unclassified.length > 0 && <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">{unclassified.length} general research question(s) still need an assessment area. <Link className="gaffa-link" href={base}>Classify existing research</Link>.</p>}
    {!areas && scoped.length > 0 && <p className="mt-4 text-xs text-muted-foreground">{scoped.length} appointment-specific question(s) remain in their own context. <Link className="gaffa-link" href={base}>Review appointment research</Link>.</p>}
    <Link className="gaffa-link mt-5 inline-block text-sm" href={`${base}#assessment-guide`}>Open the nine-area assessment guide</Link>
  </section>
}
