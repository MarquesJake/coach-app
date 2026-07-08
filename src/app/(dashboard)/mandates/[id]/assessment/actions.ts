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
import {
  interviewQuestionByKey,
  referenceQuestionByKey,
  INTERVIEW_FOCUS_LABELS,
  REFERENCE_GROUP_LABELS,
} from '@/lib/assessment/question-banks'

type ActionResult = { ok: true } | { ok: false; error: string }

const CRITERION_KEYS = ASSESSMENT_CRITERIA.map((c) => c.key as string)
const METHOD_KEYS = EVIDENCE_METHODS.map((m) => m.key as string)
const WOULD_HIRE_VALUES = ['yes', 'no', 'mixed', 'unknown'] as const
const MATERIAL_TYPES = [
  'presentation',
  'training_video',
  'match_video',
  'methodology',
  'analysis',
  'media',
  'reference_pack',
  'other',
] as const
const MATERIAL_CONFIDENTIALITY_STATUSES = ['available', 'requested', 'missing', 'withheld'] as const
const MATERIAL_UPLOADED_BY = ['coach', 'analyst', 'agent', 'club', 'unknown'] as const
const ACCESS_REQUEST_STATUSES = ['draft', 'requested', 'approved', 'shared', 'declined', 'withdrawn'] as const

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

async function ownsCoach(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  coachId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('coaches')
    .select('id')
    .eq('id', coachId)
    .eq('user_id', userId)
    .maybeSingle()
  return Boolean(data)
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

export async function addInterviewAnswerAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')
  const questionKey = String(formData.get('question_key') ?? '')
  const answer = String(formData.get('answer') ?? '').trim()
  const interviewer = String(formData.get('interviewer') ?? '').trim() || null
  const usedInRecommendation = formData.get('used_in_recommendation') !== 'false'
  const question = interviewQuestionByKey(questionKey)

  if (!mandateId || !coachId) return { ok: false, error: 'Missing candidate context' }
  if (!question) return { ok: false, error: 'Unknown interview question' }
  if (!answer) return { ok: false, error: 'Interview answer is required' }
  if (!(await assessGuard(supabase, user.id, mandateId, coachId))) {
    return { ok: false, error: 'Candidate is not on this mandate shortlist' }
  }

  const confidence = clampScore(formData.get('confidence'))
  const evidenceTitle = `Interview: ${question.label}`
  const evidenceDetail = `${question.question} ${question.followUp} Answer: ${answer}`
  const evidenceSource = [
    INTERVIEW_FOCUS_LABELS[question.focus],
    interviewer ? `Interviewer: ${interviewer}` : null,
  ].filter(Boolean).join(' · ')

  const { data: evidence, error: evidenceError } = await supabase
    .from('assessment_evidence')
    .insert({
      user_id: user.id,
      mandate_id: mandateId,
      coach_id: coachId,
      criterion: question.criterion,
      method: 'candidate_interview',
      title: evidenceTitle,
      detail: evidenceDetail,
      source: evidenceSource,
      confidence,
      verification_status: 'verified',
      used_in_recommendation: usedInRecommendation,
    })
    .select('id')
    .single()

  if (evidenceError || !evidence) return { ok: false, error: 'Failed to save interview evidence' }

  const { error } = await supabase.from('candidate_interview_answers').insert({
    user_id: user.id,
    mandate_id: mandateId,
    coach_id: coachId,
    evidence_id: evidence.id,
    question_key: question.key,
    question: `${question.question} ${question.followUp}`,
    answer,
    criterion: question.criterion,
    interviewer,
    interview_focus: question.focus,
    confidence,
    verification_status: 'verified',
    used_in_recommendation: usedInRecommendation,
  })

  if (error) return { ok: false, error: 'Failed to save interview answer' }

  revalidatePath(`/mandates/${mandateId}/assessment`)
  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}/board-pack`)
  return { ok: true }
}

export async function addReferenceAnswerAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')
  const questionKey = String(formData.get('question_key') ?? '')
  const answer = String(formData.get('answer') ?? '').trim()
  const referenceName = String(formData.get('reference_name') ?? '').trim() || null
  const referenceRole = String(formData.get('reference_role') ?? '').trim() || null
  const wouldHireRaw = String(formData.get('would_hire_again') ?? 'unknown')
  const wouldHireAgain = WOULD_HIRE_VALUES.includes(wouldHireRaw as (typeof WOULD_HIRE_VALUES)[number])
    ? wouldHireRaw
    : 'unknown'
  const riskFlag = formData.get('risk_flag') === 'true'
  const usedInRecommendation = formData.get('used_in_recommendation') !== 'false'
  const question = referenceQuestionByKey(questionKey)

  if (!mandateId || !coachId) return { ok: false, error: 'Missing candidate context' }
  if (!question) return { ok: false, error: 'Unknown reference question' }
  if (!answer) return { ok: false, error: 'Reference answer is required' }
  if (!(await assessGuard(supabase, user.id, mandateId, coachId))) {
    return { ok: false, error: 'Candidate is not on this mandate shortlist' }
  }

  const confidence = clampScore(formData.get('confidence'))
  const groupLabel = REFERENCE_GROUP_LABELS[question.stakeholderGroup]
  const evidenceTitle = `Reference: ${question.label}`
  const evidenceDetail = `${question.question} Answer: ${answer}`
  const evidenceSource = [
    groupLabel,
    referenceName,
    referenceRole,
    wouldHireAgain !== 'unknown' ? `would hire/work again: ${wouldHireAgain}` : null,
    riskFlag ? 'risk flagged' : null,
  ].filter(Boolean).join(' · ')

  const { data: evidence, error: evidenceError } = await supabase
    .from('assessment_evidence')
    .insert({
      user_id: user.id,
      mandate_id: mandateId,
      coach_id: coachId,
      criterion: question.criterion,
      method: 'references',
      title: evidenceTitle,
      detail: evidenceDetail,
      source: evidenceSource,
      confidence,
      verification_status: 'verified',
      used_in_recommendation: usedInRecommendation,
    })
    .select('id')
    .single()

  if (evidenceError || !evidence) return { ok: false, error: 'Failed to save reference evidence' }

  const { error } = await supabase.from('candidate_reference_answers').insert({
    user_id: user.id,
    mandate_id: mandateId,
    coach_id: coachId,
    evidence_id: evidence.id,
    stakeholder_group: question.stakeholderGroup,
    reference_name: referenceName,
    reference_role: referenceRole,
    question_key: question.key,
    question: question.question,
    answer,
    criterion: question.criterion,
    confidence,
    verification_status: 'verified',
    used_in_recommendation: usedInRecommendation,
    would_hire_again: wouldHireAgain,
    risk_flag: riskFlag,
  })

  if (error) return { ok: false, error: 'Failed to save reference answer' }

  revalidatePath(`/mandates/${mandateId}/assessment`)
  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}/board-pack`)
  return { ok: true }
}

export async function addPrivateMaterialAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const coachId = String(formData.get('coach_id') ?? '')
  const mandateId = String(formData.get('mandate_id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const externalUrl = String(formData.get('external_url') ?? '').trim() || null
  const sourceLabel = String(formData.get('source_label') ?? '').trim() || null
  const materialTypeRaw = String(formData.get('material_type') ?? 'other')
  const materialType = MATERIAL_TYPES.includes(materialTypeRaw as (typeof MATERIAL_TYPES)[number])
    ? materialTypeRaw
    : 'other'
  const uploadedByRaw = String(formData.get('uploaded_by') ?? 'analyst')
  const uploadedBy = MATERIAL_UPLOADED_BY.includes(uploadedByRaw as (typeof MATERIAL_UPLOADED_BY)[number])
    ? uploadedByRaw
    : 'analyst'
  const confidentialityRaw = String(formData.get('confidentiality_status') ?? 'available')
  const confidentialityStatus = MATERIAL_CONFIDENTIALITY_STATUSES.includes(
    confidentialityRaw as (typeof MATERIAL_CONFIDENTIALITY_STATUSES)[number]
  )
    ? confidentialityRaw
    : 'available'

  if (!coachId) return { ok: false, error: 'Missing coach context' }
  if (!title) return { ok: false, error: 'Material needs a title' }
  if (!description && !externalUrl) return { ok: false, error: 'Add a link or describe the material' }
  if (!(await ownsCoach(supabase, user.id, coachId))) {
    return { ok: false, error: 'Coach not found' }
  }

  const { error } = await supabase.from('coach_private_materials').insert({
    user_id: user.id,
    coach_id: coachId,
    title,
    material_type: materialType,
    description,
    external_url: externalUrl,
    source_label: sourceLabel,
    uploaded_by: uploadedBy,
    confidentiality_status: confidentialityStatus,
  })

  if (error) return { ok: false, error: 'Failed to save private material' }

  if (mandateId) revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
  if (mandateId) revalidatePath(`/mandates/${mandateId}/assessment/${coachId}/board-pack`)
  revalidatePath(`/coaches/${coachId}/data`)
  return { ok: true }
}

export async function requestConfidentialAccessAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')
  const requestReason = String(formData.get('request_reason') ?? '').trim()
  const requestedBy = String(formData.get('requested_by') ?? '').trim() || null
  const requesterRole = String(formData.get('requester_role') ?? '').trim() || null
  const clubContext = String(formData.get('club_context') ?? '').trim() || null

  if (!mandateId || !coachId) return { ok: false, error: 'Missing candidate context' }
  if (!requestReason) return { ok: false, error: 'Add why the club needs confidential access' }
  if (!(await assessGuard(supabase, user.id, mandateId, coachId))) {
    return { ok: false, error: 'Candidate is not on this mandate shortlist' }
  }

  const { error } = await supabase.from('confidential_access_requests').insert({
    user_id: user.id,
    mandate_id: mandateId,
    coach_id: coachId,
    requested_by: requestedBy,
    requester_role: requesterRole,
    club_context: clubContext,
    request_reason: requestReason,
    status: 'requested',
  })

  if (error) return { ok: false, error: 'Failed to request confidential access' }

  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
  revalidatePath(`/mandates/${mandateId}/assessment/${coachId}/board-pack`)
  return { ok: true }
}

export async function updateConfidentialAccessStatusAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const requestId = String(formData.get('request_id') ?? '')
  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')
  const statusRaw = String(formData.get('status') ?? '')
  if (!ACCESS_REQUEST_STATUSES.includes(statusRaw as (typeof ACCESS_REQUEST_STATUSES)[number])) {
    return { ok: false, error: 'Unknown access status' }
  }

  const decidedStatuses = ['approved', 'shared', 'declined', 'withdrawn']
  const { error } = await supabase
    .from('confidential_access_requests')
    .update({
      status: statusRaw,
      decided_at: decidedStatuses.includes(statusRaw) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'Failed to update access request' }

  if (mandateId && coachId) {
    revalidatePath(`/mandates/${mandateId}/assessment/${coachId}`)
    revalidatePath(`/mandates/${mandateId}/assessment/${coachId}/board-pack`)
  }
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
