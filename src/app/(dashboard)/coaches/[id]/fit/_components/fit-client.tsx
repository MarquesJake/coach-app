 'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { readResearchContext, researchHref } from '@/lib/research-context'
import { getFitResultAction, addToLonglistAction, addToShortlistAction } from '../actions'
import { DecisionBriefReview } from '@/app/(dashboard)/mandates/_components/decision-brief-fields'
type FitResult = NonNullable<Awaited<ReturnType<typeof getFitResultAction>>['data']> & { coachId: string }
export function FitClient({coachId, mandates}: {coachId:string;mandates:{id:string;label:string}[]}) {
 const router = useRouter(); const params = useSearchParams(); const context = readResearchContext(params)
 const selected = mandates.some(m => m.id === context.mandate) ? context.mandate! : ''
 const [result,setResult]=useState<FitResult | null>(null),[message,setMessage]=useState('')

 const [pending,start]=useTransition();const request=useRef(0)
 useEffect(() => {
   const version = ++request.current
   let cancelled = false
   if (!selected) return
   start(async () => {
     setResult(null); setMessage('')
     try {
       const response = await getFitResultAction(coachId, selected)
       if (cancelled || version !== request.current) return
       setResult(response.data ? { ...response.data, coachId } : null); setMessage(response.error ?? '')
     } catch { if (!cancelled && version === request.current) setMessage('Could not load the appointment. Please retry.') }
   })
   return () => { cancelled = true }
 }, [coachId, selected])
 function choose(id: string) {
   setResult(null); setMessage('')
   router.replace(researchHref(`/coaches/${coachId}/fit`, { coach: coachId, mandate: id || undefined }))
 }
 function add(shortlist: boolean) {
   const version = request.current
   start(async () => {
     try {
       const response = shortlist ? await addToShortlistAction(selected, coachId, null) : await addToLonglistAction(selected, coachId)
       if (version !== request.current) return
       if (response.ok) {
         setResult(current => current?.coachId === coachId && current.mandateId === selected ? { ...current, ...(shortlist ? { shortlisted: true } : { inPool: true }) } : current)
         setMessage('Candidate saved. Return to appointment candidates to manage the pool and shortlist.')
       } else setMessage(response.error || 'Could not save')
     } catch { if (version === request.current) setMessage('Save could not be confirmed. Reload membership before retrying.') }
   })
 }
 const href = (path: string) => researchHref(path, { ...context, coach: coachId, mandate: selected, scope: undefined })

 return <div className="space-y-5"><h2 className="text-xl font-semibold">Assess against a brief</h2><p className="text-sm text-muted-foreground">Compare saved profile fields with a selected brief. Recorded alignment needs source review; it is not the sourced football-fit calculation.</p><p className="text-sm text-muted-foreground">The selector lists all accessible club briefs, not clubs recommended for this coach. Selecting one does not create an association.</p><label className="block text-sm">Mandate<select className="mt-2 block w-full rounded border bg-background p-3" value={selected} onChange={e=>choose(e.target.value)}><option value="">Choose a mandate</option>{mandates.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select></label>{selected && <section className="rounded border bg-card p-4"><h3 className="font-medium">Sourced football fit</h3><p className="mt-2 text-sm text-muted-foreground">Candidates compares the saved brief with sourced coach research. A saved association does not establish a match; coaches without the required research are outside that comparison.</p><Link className="mt-3 inline-block text-sm text-primary underline" href={href(`/mandates/${selected}/candidates#brief-matches`)}>View calculated matches, evidence and scoring rules</Link></section>}{message&&<p role="status" className="rounded border p-3 text-sm">{message}</p>}{pending&&<p className="text-sm">Working…</p>}{!pending && result && result.coachId === coachId && result.mandateId === selected && <><section className="rounded border p-4"><h3 className="font-medium">Saved mandate association</h3><p className="mt-2 text-sm">{result.shortlisted ? 'Saved on the shortlist' : result.inPool ? 'Saved in the research pool' : 'No saved pool or shortlist association'}</p><p className="mt-1 text-sm text-muted-foreground">Pool and shortlist membership records a workflow decision, not an algorithmic recommendation or verified appointment suitability.</p></section><div className="grid gap-3 md:grid-cols-2">{result.rows.map(row=><section key={row.label} className="rounded border bg-card p-4"><h3 className="font-medium">{row.label} · {row.state}</h3><p className="mt-2 text-sm">Required: {row.requirement}</p><p className="text-sm text-muted-foreground">Recorded: {row.recorded}</p></section>)}</div><DecisionBriefReview value={result.requirements}/><section className="rounded border p-4"><h3 className="font-medium">Before making a recommendation</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{result.concerns.map(c=><li key={c}>{c}</li>)}</ul></section><div className="flex flex-wrap gap-3">{!result.shortlisted && <button className="rounded border px-4 py-2 text-sm" disabled={pending || result.inPool} onClick={()=>add(false)}>{result.inPool ? 'Already in research pool' : 'Add to research pool'}</button>}<button className="rounded border px-4 py-2 text-sm" disabled={pending || result.shortlisted} onClick={()=>add(true)}>{result.shortlisted ? 'Already shortlisted' : 'Add to shortlist'}</button><Link className="rounded border px-4 py-2 text-sm" href={href(`/mandates/${selected}/candidates`)}>Return to candidates</Link>{result.shortlisted ? <Link className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground" href={href(`/mandates/${selected}/assessment/${coachId}`)}>Continue assessment</Link> : <p className="self-center text-sm text-muted-foreground">Add him to the shortlist to carry on the assessment.</p>}<Link className="px-4 py-2 text-sm text-primary underline" href={href(`/coaches/${coachId}/research#new-question`)}>Add a research question</Link></div></>}{!mandates.length&&<Link className="text-primary underline" href="/mandates/new">Create a club brief first</Link>}</div>
}
