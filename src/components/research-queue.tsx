import Link from 'next/link'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function ResearchQueue({mandateId, coachId, expanded = false}: {mandateId?: string; coachId?: string; expanded?: boolean}) {
 const db=await createServerSupabaseClient()
 let query=db.from('coach_research_questions').select('id,coach_id,question,decision_impact,owner,due_on,status').neq('status','answered').order('due_on',{ascending:true,nullsFirst:false}).limit(50)
 if(mandateId) query=query.eq('mandate_id',mandateId)
 if(coachId) query=query.eq('coach_id',coachId)
 const {data,error}=await query
 const ids=[...new Set((data??[]).map(q=>q.coach_id))]
 const {data:coaches}=ids.length ? await db.from('coaches').select('id,name').in('id',ids) : {data:[]}
 const rows=data ?? []
 const renderQuestion=(q: typeof rows[number]) => <Link href={`/coaches/${q.coach_id}/research${mandateId ? `?mandate=${mandateId}` : ''}#question-${q.id}`} key={q.id} className="group grid gap-2 border-t border-border py-4 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center">
   <div className="min-w-0"><p className="mb-1 text-xs font-medium text-primary">{coaches?.find(c=>c.id===q.coach_id)?.name || 'Coach'}</p><p className="text-sm font-medium leading-relaxed group-hover:text-primary">{q.question}</p></div>
   <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground sm:justify-end"><span className="sm:text-right"><span className="block">{q.owner || 'Unassigned'}</span><span className={`mt-1 block ${q.due_on && q.due_on < new Date().toISOString().slice(0,10) ? 'text-destructive' : ''}`}>{q.due_on ? `${q.due_on < new Date().toISOString().slice(0,10) ? 'Overdue' : 'Due'} ${q.due_on}` : 'No due date'}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100"/></div>
 </Link>
 return <section className="gaffa-panel my-6"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="gaffa-eyebrow mb-2">Research priorities</p><h2 className="gaffa-panel-heading">Questions that could change a decision</h2></div><Link className="gaffa-link inline-flex items-center gap-2" href={coachId ? `/coaches/${coachId}/research` : '/coaches'}>{coachId ? 'Open research' : 'Choose a coach'}<ArrowUpRight className="h-3.5 w-3.5"/></Link></div>
 {error ? <p role="alert" className="text-sm">The research list didn’t load. Refresh before relying on it.</p> : rows.length ? <>{rows.slice(0,expanded ? 50 : 3).map(renderQuestion)}{!expanded && rows.length>3 && <details className="gaffa-disclosure border-t border-border pt-4"><summary className="flex items-center justify-between text-sm font-medium text-primary">{rows.length-3} more questions<ChevronDown className="disclosure-chevron h-4 w-4"/></summary><div className="mt-3">{rows.slice(3).map(renderQuestion)}</div></details>}{rows.length===50 && <p className="mt-3 text-xs text-muted-foreground">The next 50 open questions. Open a coach’s research to see everything.</p>}</> : <p className="text-sm text-muted-foreground">No open research questions recorded{mandateId ? ' for this appointment' : ''}. Add a question from a coach’s Research page.</p>}
 </section>
}
