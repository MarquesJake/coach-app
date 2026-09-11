'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { RESEARCH_DOMAINS, validateResearchQuestion } from '@/lib/decision-workflow'
import { logActivity } from '@/lib/db/activity'
import { validateResearchClassification } from '@/lib/coach-assessment-coverage'

export async function saveResearchQuestion(form: FormData) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user || !await getInternalOrganizationId(user.id)) return { error: 'Internal research access is required.' }
  const value = (key: string) => String(form.get(key) ?? '').trim()
  const coachId = value('coach_id')
  const { data: coach } = await db.from('coaches').select('id').eq('id', coachId).maybeSingle()
  if (!coach) return { error: 'Coach is no longer available.' }
  const payload = {
    assessment_area: value('assessment_area') || null,
    evidence_methods: [...new Set(form.getAll('evidence_methods').map(String))],
    domain: value('domain'), question: value('question'), decision_impact: value('decision_impact'),
    source_plan: value('source_plan'), owner: value('owner'), due_on: value('due_on') || null,
    status: value('status') || 'open', answer: value('answer'), counter_evidence: value('counter_evidence'),
    evidence_claim_ids: [...new Set(form.getAll('evidence_claim_ids').map(String))], mandate_id: value('mandate_id') || null,
  }
  const invalid = validateResearchQuestion(payload)
  if (invalid) return { error: invalid }
  const classificationError = validateResearchClassification(payload.assessment_area, payload.evidence_methods, payload.evidence_claim_ids)
  if (classificationError) return { error: classificationError }
  if (!(RESEARCH_DOMAINS as readonly string[]).includes(payload.domain)) return { error: 'Choose a research area.' }
  if (payload.source_plan.length > 4000 || payload.counter_evidence.length > 8000 || payload.owner.length > 200) return { error: 'Shorten the source plan, counter-evidence or owner entry.' }
  if (payload.due_on && (!/^\d{4}-\d{2}-\d{2}$/.test(payload.due_on) || !Number.isFinite(Date.parse(payload.due_on)))) return { error: 'Choose a valid review date.' }
  if (payload.mandate_id) {
    const { data } = await db.from('mandates').select('id').eq('id', payload.mandate_id).maybeSingle()
    if (!data) return { error: 'The selected mandate is not available.' }
  }
  if (payload.evidence_claim_ids.length) {
    const { data, error } = await db.from('profile_claims').select('id').eq('coach_id', coachId).in('id', payload.evidence_claim_ids)
    if (error || data?.length !== payload.evidence_claim_ids.length) return { error: 'A linked finding is no longer available for this coach. Reload before saving.' }
  }
  const id = value('id')
  const result = id
    ? await db.from('coach_research_questions').update({ ...payload, updated_by: user.id }).eq('id', id).eq('coach_id', coachId).eq('version', Number(value('version'))).select('id').maybeSingle()
    : await db.from('coach_research_questions').insert({ ...payload, coach_id: coachId, created_by: user.id, updated_by: user.id }).select('id').single()
  if (result.error) return { error: 'Could not save the research question. Your entries have been kept; please retry.' }
  if (!result.data) return { error: 'This question changed in another session. Reload and review the latest answer before saving.' }
  await logActivity({ entityType: 'coach', entityId: coachId, actionType: id ? 'updated' : 'created', description: id ? 'Research question and decision implications updated' : 'Decision research question created', metadata: { research_question_id: result.data.id, status: payload.status } })
  for (const path of [`/coaches/${coachId}`, `/coaches/${coachId}/research`, '/intelligence', '/dashboard']) revalidatePath(path)
  for (const section of ['tactical', 'career', 'leadership', 'coaching-model', 'availability', 'staff-network']) revalidatePath(`/coaches/${coachId}/${section}`)
  if (payload.mandate_id) revalidatePath(`/mandates/${payload.mandate_id}/plan`)
  return { id: result.data.id, mandateId: payload.mandate_id, success: id ? 'Research updated. An answered question remains a provisional research conclusion.' : 'Research question added.' }
}
