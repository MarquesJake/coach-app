import { redirect } from 'next/navigation'
import { readResearchContext, researchHref, type ResearchParams } from '@/lib/research-context'
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<ResearchParams>}){const {id}=await params;redirect(researchHref(`/coaches/${id}/fit`, { ...readResearchContext(await searchParams), coach: id }))}
