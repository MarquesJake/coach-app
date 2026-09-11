export type FitReviewRow = { label: string; requirement: string; recorded: string; state: 'Not specified' | 'Unknown' | 'Recorded alignment' | 'Needs assessment' }
export function reviewRequirement(label: string, required: unknown, recorded: unknown): FitReviewRow {
 const normalise=(v:unknown)=>Array.isArray(v) ? v.map(String).filter(Boolean).join(', ') : typeof v==='string' ? v.trim() : ''
 const requirement=normalise(required), value=normalise(recorded)
 const unknown=(v:string)=>!v || /^(not yet agreed|unknown|tbc|not captured)$/i.test(v)
 return {label,requirement:requirement||'Not specified',recorded:value||'Not captured',state:unknown(requirement)?'Not specified':unknown(value)?'Unknown':requirement.toLowerCase()===value.toLowerCase()?'Recorded alignment':'Needs assessment'}
}
export function reviewLanguages(required: string[] | null | undefined, recorded: string[] | null | undefined): FitReviewRow {
 const row=reviewRequirement('Working languages',required,recorded)
 if(required?.length && recorded?.length) row.state=required.every(r=>recorded.some(v=>v.trim().toLowerCase()===r.trim().toLowerCase()))?'Recorded alignment':'Needs assessment'
 return row
}
