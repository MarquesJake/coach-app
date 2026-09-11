 'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { readResearchContext, researchHref } from '@/lib/research-context'
import { getFitResultAction, addToLonglistAction, addToShortlistAction } from '../actions'
import { DecisionBriefReview } from '@/app/(dashboard)/mandates/_components/decision-brief-fields'
type FitResult = NonNullable<Awaited<ReturnType<typeof getFitResultAction>>['data']> & { coachId: string }
export function FitClient({coachId, mandates}: {coachId:string;coach:object;mandates:{id:string;label:string}[];evidenceCount:number;completenessPercent:number}) {
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

 return <div className="space-y-5"><h2 className="text-xl font-semibold">Assess against a brief</h2><p className="text-sm text-muted-foreground">Compare this coach with the club’s requirements and identify what needs checking.</p><label className="block text-sm">Appointment<select className="mt-2 block w-full rounded border bg-background p-3" value={selected} onChange={e=>choose(e.target.value)}><option value="">Choose an appointment</option>{mandates.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select></label>{message&&<p role="status" className="rounded border p-3 text-sm">{message}</p>}{pending&&<p className="text-sm">Working…</p>}{!pending && result && result.coachId === coachId && result.mandateId === selected && <><div className="grid gap-3 md:grid-cols-2">{result.rows.map(row=><section key={row.label} className="rounded border bg-card p-4"><h3 className="font-medium">{row.label} · {row.state}</h3><p className="mt-2 text-sm">Required: {row.requirement}</p><p className="text-sm text-muted-foreground">Recorded: {row.recorded}</p></section>)}</div><DecisionBriefReview value={result.requirements}/><section className="rounded border p-4"><h3 className="font-medium">Before making a recommendation</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{result.concerns.map(c=><li key={c}>{c}</li>)}</ul></section><div className="flex flex-wrap gap-3">{!result.shortlisted && <button className="rounded border px-4 py-2 text-sm" disabled={pending || result.inPool} onClick={()=>add(false)}>{result.inPool ? 'Already in research pool' : 'Add to research pool'}</button>}<button className="rounded border px-4 py-2 text-sm" disabled={pending || result.shortlisted} onClick={()=>add(true)}>{result.shortlisted ? 'Already shortlisted' : 'Add to shortlist'}</button><Link className="rounded border px-4 py-2 text-sm" href={href(`/mandates/${selected}/candidates`)}>Return to candidates</Link>{result.shortlisted ? <Link className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground" href={href(`/mandates/${selected}/assessment/${coachId}`)}>Continue assessment</Link> : <p className="self-center text-sm text-muted-foreground">Add to shortlist first to continue assessment.</p>}<Link className="px-4 py-2 text-sm text-primary underline" href={href(`/coaches/${coachId}/research#new-question`)}>Add a research question</Link></div></>}{!mandates.length&&<Link className="text-primary underline" href="/mandates/new">Create an appointment brief first</Link>}</div>
}
