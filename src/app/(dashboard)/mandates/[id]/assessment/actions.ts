'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  ASSESSMENT_CRITERIA,
  EVIDENCE_METHODS,
  ASSESSMENT_STATUSES,
  VERIFICATION_STATUSES,
  RECOMMENDATION_VERDICTS,
} from '@/lib/assessment/criteria'
import { canAssessCandidate, type AssessmentAccessClient } from '@/lib/assessment/access'

type ActionResult = { ok: true } | { ok: false; error: string }

const CRITERION_KEYS = ASSESSMENT_CRITERIA.map((c) => c.key as string)
const METHOD_KEYS = EVIDENCE_METHODS.map((m) => m.key as string)

function clampScore(value: FormDataEntryValue | null): number | null {
  if (value === null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, Math.round(n)))
}

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

// Assessment runs on shortlisted candidates only. RLS enforces ownership too, but
// checking here returns a clear error instead of an opaque policy failure and keeps
// the surface consistent with the overview ("runs on shortlisted candidates").
// The rule itself lives in @/lib/assessment/access so it can be unit-tested.
function assessGuard(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  mandateId: string,
  coachId: string
): Promise<boolean> {
  return canAssessCandidate(supabase as unknown as AssessmentAccessClient, userId, mandateId, coachId)
}

export async function saveAssessmentAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')
  const criterion = String(formData.get('criterion') ?? '')
  const status = String(formData.get('status') ?? 'in_progress')
  const summary = String(formData.get('summary') ?? '').trim() || null

  if (!mandateId || !coachId) return { ok: false, error: 'Missing candidate context' }
  if (!CRITERION_KEYS.includes(criterion)) return { ok: false, error: 'Unknown criterion' }
  if (!ASSESSMENT_STATUSES.includes(status as (typeof ASSESSMENT_STATUSES)[number])) {
    return { ok: false, error: 'Unknown status' }
  }
  if (!(await assessGuard(supabase, user.id, mandateId, coachId))) {
    return { ok: false, error: 'Candidate is not on this mandate shortlist' }
  }

  const { error } = await supabase.from('candidate_assessments').upsert(
    {
      user_id: user.id,
      mandate_id: mandateId,
      coach_id: coachId,
      criterion,
      score: clampScore(formData.get('score')),
      summary,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'mandate_id,coach_id,criterion' }
  )
  if (error) return { ok: false, error: 'Failed to save assessment' }

  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
  return { ok: true }
}

export async function addEvidenceAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')
  const criterion = String(formData.get('criterion') ?? '')
  const method = String(formData.get('method') ?? '')
  const title = String(formData.get('title') ?? '').trim()

  if (!mandateId || !coachId) return { ok: false, error: 'Missing candidate context' }
  if (!CRITERION_KEYS.includes(criterion)) return { ok: false, error: 'Unknown criterion' }
  if (!METHOD_KEYS.includes(method)) return { ok: false, error: 'Unknown evidence method' }
  if (!title) return { ok: false, error: 'Evidence needs a title' }
  if (!(await assessGuard(supabase, user.id, mandateId, coachId))) {
    return { ok: false, error: 'Candidate is not on this mandate shortlist' }
  }

  const { error } = await supabase.from('assessment_evidence').insert({
    user_id: user.id,
    mandate_id: mandateId,
    coach_id: coachId,
    criterion,
    method,
    title,
    detail: String(formData.get('detail') ?? '').trim() || null,
    source: String(formData.get('source') ?? '').trim() || null,
    confidence: clampScore(formData.get('confidence')),
    used_in_recommendation: formData.get('used_in_recommendation') !== 'false',
  })
  if (error) return { ok: false, error: 'Failed to add evidence' }

  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
  return { ok: true }
}

export async function setEvidenceVerificationAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const evidenceId = String(formData.get('evidence_id') ?? '')
  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')
  const status = String(formData.get('verification_status') ?? '')
  if (!VERIFICATION_STATUSES.includes(status as (typeof VERIFICATION_STATUSES)[number])) {
    return { ok: false, error: 'Unknown verification status' }
  }

  const { error } = await supabase
    .from('assessment_evidence')
    .update({ verification_status: status })
    .eq('id', evidenceId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: 'Failed to update verification' }

  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
  return { ok: true }
}

export async function deleteEvidenceAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const evidenceId = String(formData.get('evidence_id') ?? '')
  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')

  const { error } = await supabase
    .from('assessment_evidence')
    .delete()
    .eq('id', evidenceId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: 'Failed to delete evidence' }

  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
  return { ok: true }
}

export async function setEvidenceRecommendationUseAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const evidenceId = String(formData.get('evidence_id') ?? '')
  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')
  const used = formData.get('used_in_recommendation') === 'true'

  const { error } = await supabase
    .from('assessment_evidence')
    .update({ used_in_recommendation: used })
    .eq('id', evidenceId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: 'Failed to update evidence' }

  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
  return { ok: true }
}

export async function saveRecommendationAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')
  const verdictRaw = String(formData.get('verdict') ?? '')
  // Empty string clears the verdict deliberately; anything else must be a known verdict.
  if (verdictRaw !== '' && !RECOMMENDATION_VERDICTS.includes(verdictRaw as (typeof RECOMMENDATION_VERDICTS)[number])) {
    return { ok: false, error: 'Unknown verdict' }
  }
  const verdict = verdictRaw === '' ? null : verdictRaw

  if (!mandateId || !coachId) return { ok: false, error: 'Missing candidate context' }
  if (!(await assessGuard(supabase, user.id, mandateId, coachId))) {
    return { ok: false, error: 'Candidate is not on this mandate shortlist' }
  }

  const { error } = await supabase.from('candidate_recommendations').upsert(
    {
      user_id: user.id,
      mandate_id: mandateId,
      coach_id: coachId,
      verdict,
      confidence: clampScore(formData.get('confidence')),
      summary: String(formData.get('summary') ?? '').trim() || null,
      key_strengths: String(formData.get('key_strengths') ?? '').trim() || null,
      key_risks: String(formData.get('key_risks') ?? '').trim() || null,
      mitigation: String(formData.get('mitigation') ?? '').trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'mandate_id,coach_id' }
  )
  if (error) return { ok: false, error: 'Failed to save recommendation' }

  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
  return { ok: true }
}
