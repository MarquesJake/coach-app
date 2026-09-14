'use client'
import { researchProfileForName } from '@/lib/scoring/research/catalogue'
import { currentEmploymentForApiId, employmentLabel } from '@/lib/scoring/research/current-employment'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { readResearchContext, researchHref } from '@/lib/research-context'
import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { Star, ChevronDown, ArrowUpRight, Search, MoreHorizontal } from 'lucide-react'
import { EditCoachDrawer, type EditCoachField } from './edit-coach-drawer'
import { updateCoachCoreAction, addToWatchlistAction, removeFromWatchlistAction } from '../actions'
import { addCoachToCompareIds } from '@/lib/compare'
import { toastSuccess, toastError } from '@/lib/ui/toast'
const MODIFY_PROFILE_FIELDS: EditCoachField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'preferred_name', label: 'Preferred name', type: 'text' },
  { key: 'nationality', label: 'Nationality', type: 'text' },
  { key: 'base_location', label: 'Base location', type: 'text' },
  { key: 'languages', label: 'Languages', type: 'comma', placeholder: 'e.g. English, Spanish' },
  { key: 'availability_status', label: 'Availability status', type: 'text' },
  { key: 'market_status', label: 'Market status', type: 'text' },
  { key: 'compensation_expectation', label: 'Compensation expectation', type: 'text' },
  { key: 'contract_expiry', label: 'Contract expiry', type: 'text', placeholder: 'YYYY-MM-DD' },
  { key: 'release_clause', label: 'Release / compensation clause', type: 'text' },
  { key: 'contract_notes', label: 'Contract context notes', type: 'textarea', rows: 3 },
  { key: 'agent_name', label: 'Agent name', type: 'text' },
  { key: 'agent_contact', label: 'Agent contact', type: 'text' },
  { key: 'due_diligence_summary', label: 'Due diligence summary', type: 'textarea', rows: 4 },
]

export function CoachCommandBar({coachId, coach, onWatchlist=false, evidenceLabel}: {coachId:string; coach:Record<string,unknown>; onWatchlist?:boolean; evidenceLabel:string}) {
 const router=useRouter();const [watchlist,setWatchlist]=useState(onWatchlist);const [pending,setPending]=useState(false)
 const context = readResearchContext(useSearchParams())
 useEffect(()=>setWatchlist(onWatchlist),[onWatchlist])
 const initialValues=Object.fromEntries(MODIFY_PROFILE_FIELDS.map(f=>[f.key,coach[f.key] ?? (f.type==='comma'?[]:'')]))
 const name=String(coach.name ?? 'Coach')
 const research=researchProfileForName(name)
 const employment=research && currentEmploymentForApiId(research.apiId)
 const recordedRole=[coach.role_current,coach.club_current].filter(Boolean).map(String).join(' · ')
 return <header className="mb-6 min-w-0 pt-2">
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0"><p className="gaffa-eyebrow mb-2">Coach profile</p><h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">{name}</h1><p className="mt-2 text-sm text-muted-foreground">{employment ? employmentLabel(employment) : recordedRole ? `${recordedRole} · recorded role, current status unconfirmed` : 'Current role requires confirmation'}</p></div>
    <button aria-label={watchlist?'Remove from watchlist':'Add to watchlist'} aria-pressed={watchlist} disabled={pending} className="gaffa-action gaffa-action-secondary !p-2.5" onClick={async()=>{setPending(true);try{const r=await(watchlist?removeFromWatchlistAction(coachId):addToWatchlistAction(coachId));if(r.error)toastError(r.error);else{setWatchlist(!watchlist);router.refresh()}}finally{setPending(false)}}}><Star className={`h-4 w-4 ${watchlist?'fill-current text-primary':''}`}/></button>
  </div>
  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
    <div className="flex max-w-xl flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="gaffa-badge">{evidenceLabel}</span><span>Recorded availability: {String(coach.availability_status || coach.available_status || 'Not confirmed')}</span></div>
    <div className="flex flex-wrap items-center gap-2">
      <Link className="gaffa-action gaffa-action-primary" href={`/coaches/${coachId}/research`}><Search className="h-4 w-4"/>Research</Link>
      <Link aria-label="Assess against a brief" className="gaffa-action gaffa-action-secondary" href={`/coaches/${coachId}/fit`}><span className="sm:hidden">Assess brief</span><span className="hidden sm:inline">Assess against a brief</span><ArrowUpRight className="h-3.5 w-3.5"/></Link>
      <details className="gaffa-menu"><summary aria-label="Coach actions" className="gaffa-action gaffa-action-secondary !px-3"><span className="hidden sm:inline">Actions</span><MoreHorizontal className="h-4 w-4 sm:hidden"/><ChevronDown className="hidden h-3.5 w-3.5 sm:block"/></summary><div className="gaffa-menu-items">
        <button onClick={()=>router.push(researchHref(`/coaches/compare?ids=${encodeURIComponent(addCoachToCompareIds(coachId).join(','))}`, context))}>Compare coaches</button>
        <EditCoachDrawer title="Edit profile" triggerLabel="Edit profile" fields={MODIFY_PROFILE_FIELDS} initialValues={initialValues} onSave={async payload=>{const r=await updateCoachCoreAction(coachId,payload);if(r.ok){toastSuccess('Profile updated');router.refresh()}else toastError(r.error);return r}}/>
        <Link href={`/coaches/${coachId}/export/dossier`}>Profile report</Link>
        <Link href={`/intelligence/conversations?coach=${coachId}`}>Record conversation</Link>
        <Link href={`/intelligence/inbox?coach=${coachId}`}>Add a source</Link>
      </div></details>
    </div>
  </div>
 </header>
}
