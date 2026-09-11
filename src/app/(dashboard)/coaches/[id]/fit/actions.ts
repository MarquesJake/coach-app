'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { reviewRequirement, reviewLanguages, type FitReviewRow } from '@/lib/mandates/fit-review'
import { safeDecisionBrief, type DecisionBrief } from '@/lib/mandates/decision-brief'
import { getMandateFitFields } from '@/lib/db/mandate'

async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { user }
}

type FitResult = { mandateId: string; rows: FitReviewRow[]; concerns: string[]; requirements: DecisionBrief; inPool: boolean; shortlisted: boolean }
export async function getFitResultAction(coachId: string, mandateId: string): Promise<{data:FitResult|null;error:string|null}> {
 await requireUser()
 const {data:coach}=await getCoachById(coachId)
 const {data:mandate}=await getMandateFitFields(mandateId)
 if(!coach || !mandate) return {data:null,error:'Coach or mandate unavailable'}
 const rows=[
 reviewRequirement('Tactical model',mandate.tactical_model_required,coach.tactical_identity),
 reviewRequirement('Pressing',mandate.pressing_intensity_required,coach.pressing_intensity),
 reviewRequirement('Build preference',mandate.build_preference_required,coach.build_preference),
 reviewRequirement('Leadership',mandate.leadership_profile_required,coach.leadership_style),
 reviewLanguages(mandate.language_requirements,coach.languages),
 reviewRequirement('Relocation',mandate.relocation_required ? 'Required' : null,coach.relocation_flexibility),
 ]
 const concerns=['Confirm sources and dates: recorded alignment is a hypothesis, not verified appointment suitability.','Assess salary, staff, compensation and start-date conditions against the explicit brief.']
 if(coach.legal_risk_flag || coach.integrity_risk_flag || coach.safeguarding_risk_flag) concerns.push('A recorded risk flag needs a documented diligence review.')
 else concerns.push('No risk flag is recorded; this does not establish that diligence is complete.')
 const db=await createServerSupabaseClient()
 const {data:brief,error}=await db.from('mandates').select('decision_brief').eq('id',mandateId).single()
 if(error) return {data:null,error:'Mandate requirements could not be loaded.'}
 const [pool, shortlist] = await Promise.all([
   db.from('mandate_longlist').select('coach_id').eq('mandate_id', mandateId).eq('coach_id', coachId).maybeSingle(),
   db.from('mandate_shortlist').select('coach_id').eq('mandate_id', mandateId).eq('coach_id', coachId).maybeSingle(),
 ])
 if (pool.error || shortlist.error) return {data:null,error:'Candidate membership could not be loaded. Reload before adding.'}
 return {data:{mandateId,rows,concerns,requirements:safeDecisionBrief(brief?.decision_brief),inPool:!!pool.data,shortlisted:!!shortlist.data},error:null}
}

async function addMembership(mandateId: string, coachId: string, shortlist: boolean, notes: string | null) {
  const db = await createServerSupabaseClient()
  const { data: mandate } = await db.from('mandates').select('id').eq('id', mandateId).maybeSingle()
  if (!mandate) return 'Mandate unavailable'
  const result = shortlist
    // Required legacy fields are not shown as a fit judgement. Existing memberships remain untouched.
    ? await db.from('mandate_shortlist').upsert({ mandate_id: mandateId, coach_id: coachId, status: 'Under Review', placement_probability: 50, risk_rating: 'Medium', notes }, { onConflict: 'mandate_id,coach_id', ignoreDuplicates: true })
    : await db.from('mandate_longlist').upsert({ mandate_id: mandateId, coach_id: coachId }, { onConflict: 'mandate_id,coach_id', ignoreDuplicates: true })
  return result.error?.message ?? null
}

/** Add coach to mandate longlist. Returns { ok, error }. */
export async function addToLonglistAction(
  mandateId: string,
  coachId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireUser()
  const { data: coach } = await getCoachById(coachId)
  if (!coach) return { ok: false, error: 'Coach not found' }

  const err = await addMembership(mandateId, coachId, false, null)
  if (err) return { ok: false, error: err }

  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/longlist`)
  revalidatePath(`/mandates/${mandateId}/candidates`)
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/fit`)
  return { ok: true }
}

/** Add coach to mandate shortlist. Returns { ok, error }. */
export async function addToShortlistAction(
  mandateId: string,
  coachId: string,
  notes: string | null
): Promise<{ ok: boolean; error?: string }> {
  await requireUser()
  const { data: coach } = await getCoachById(coachId)
  if (!coach) return { ok: false, error: 'Coach not found' }

  const err = await addMembership(mandateId, coachId, true, notes)
  if (err) return { ok: false, error: err }

  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/shortlist`)
  revalidatePath(`/mandates/${mandateId}/candidates`)
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/fit`)
  return { ok: true }
}
