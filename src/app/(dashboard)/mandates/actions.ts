'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMandateDetailForUser } from '@/lib/db/mandate'
import { getDefaultPipelineStage, isValidPipelineStage, MANDATE_PIPELINE_STAGES, sanitisePipelineStage } from '@/lib/constants/mandateStages'
import { logActivity } from '@/lib/db/activity'
import type { Database } from '@/lib/types/db'

/** Step 1 insert omits board_risk_appetite and confidentiality_level (set in Step 2). DB must allow NULL for board_risk_appetite. */
type MandateStep1Insert = Omit<Database['public']['Tables']['mandates']['Insert'], 'board_risk_appetite' | 'confidentiality_level'> & {
  board_risk_appetite?: string | null
  confidentiality_level?: string | null
}

function toText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

/** Returns trimmed string or undefined if blank/null. */
function cleanText(v: FormDataEntryValue | string | null | undefined): string | undefined {
  if (v == null) return undefined
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? undefined : s
}

/** Returns v only if it is in the allowed set; otherwise undefined. */
function cleanEnum<T extends string>(v: string | undefined, allowed: readonly T[]): T | undefined {
  if (v == null || v === '') return undefined
  const trimmed = v.trim()
  return allowed.includes(trimmed as T) ? (trimmed as T) : undefined
}

const MANDATE_STATUS_VALUES = ['Active', 'In Progress', 'Completed', 'On Hold'] as const
const MANDATE_PRIORITY_VALUES = ['High', 'Medium', 'Low'] as const
const BOARD_RISK_APPETITE_VALUES = ['Conservative', 'Moderate', 'Aggressive'] as const
const CONFIDENTIALITY_LEVEL_VALUES = ['Standard', 'High', 'Board Only'] as const
/** Lowercase values allowed by DB constraint mandates_pipeline_stage_check. */
const PIPELINE_STAGE_VALUES = MANDATE_PIPELINE_STAGES

/** Allowed by mandate_shortlist_status_check. */
const SHORTLIST_STATUS_VALUES = ['Under Review', 'Shortlisted', 'In Negotiations', 'Declined'] as const
/** Allowed by mandate_shortlist_risk_rating_check. */
const SHORTLIST_RISK_RATING_VALUES = ['Low', 'Medium', 'High'] as const

function normalizeShortlistStatus(raw: string | null | undefined): (typeof SHORTLIST_STATUS_VALUES)[number] {
  if (!raw || typeof raw !== 'string') return 'Under Review'
  const t = raw.trim()
  if (!t) return 'Under Review'
  const found = SHORTLIST_STATUS_VALUES.find((s) => s.toLowerCase() === t.toLowerCase())
  return found ?? 'Under Review'
}

function normalizeShortlistRiskRating(raw: string | null | undefined): (typeof SHORTLIST_RISK_RATING_VALUES)[number] {
  if (!raw || typeof raw !== 'string') return 'Medium'
  const t = raw.trim()
  if (!t) return 'Medium'
  const found = SHORTLIST_RISK_RATING_VALUES.find((r) => r.toLowerCase() === t.toLowerCase())
  return found ?? 'Medium'
}

function redirectWithMessage(path: string, key: string, message: string): never {
  const params = new URLSearchParams({ [key]: message })
  redirect(`${path}?${params.toString()}`)
}

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { supabase, user }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

/** Delete a mandate (ownership checked). Returns { ok: true } or { ok: false, error: string }. */
export async function deleteMandateAction(mandateId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, user } = await requireUser()
  if (!isUuid(mandateId)) return { ok: false, error: 'Invalid mandate' }
  const { mandateResult } = await getMandateDetailForUser(user.id, mandateId)
  if (mandateResult.error || !mandateResult.data) return { ok: false, error: 'Mandate not found or access denied' }
  const { error: deleteError } = await supabase.from('mandates').delete().eq('id', mandateId).eq('user_id', user.id)
  if (deleteError) return { ok: false, error: deleteError.message }
  revalidatePath('/mandates')
  return { ok: true }
}

const STEP2_PLACEHOLDER = '—'
const REQUIRED_TEXT_DEFAULT = 'Unspecified'

export async function createMandateStep1Action(formData: FormData) {
  const { supabase, user } = await requireUser()

  const clubIdOrName = toText(formData.get('club_id_or_name'))
  const status = toText(formData.get('status'))
  const engagementDate = toText(formData.get('engagement_date'))
  const targetCompletionDate = toText(formData.get('target_completion_date'))
  const priority = toText(formData.get('priority'))
  const budgetBandRaw = toText(formData.get('budget_band'))
  const successionTimelineRaw = toText(formData.get('succession_timeline'))
  const strategicObjectiveRaw = toText(formData.get('strategic_objective'))

  if (!clubIdOrName || !status || !engagementDate || !targetCompletionDate || !priority || !budgetBandRaw || !successionTimelineRaw) {
    redirectWithMessage('/mandates/new', 'error', 'Please complete all required fields')
  }

  if (new Date(engagementDate).getTime() > new Date(targetCompletionDate).getTime()) {
    redirectWithMessage('/mandates/new', 'error', 'Target completion date must be on or after engagement date')
  }

  const statusValue = cleanEnum(status, MANDATE_STATUS_VALUES) ?? 'Active'
  const priorityValue = cleanEnum(priority, MANDATE_PRIORITY_VALUES) ?? 'High'
  const budgetBand = (budgetBandRaw && budgetBandRaw !== STEP2_PLACEHOLDER) ? budgetBandRaw : REQUIRED_TEXT_DEFAULT
  const successionTimeline = (successionTimelineRaw && successionTimelineRaw !== STEP2_PLACEHOLDER) ? successionTimelineRaw : REQUIRED_TEXT_DEFAULT
  const strategicObjective = (strategicObjectiveRaw && strategicObjectiveRaw !== STEP2_PLACEHOLDER) ? strategicObjectiveRaw : STEP2_PLACEHOLDER
  const ownershipStructure = STEP2_PLACEHOLDER
  const keyStakeholders: string[] = []

  let clubId: string | null = null
  let customClubName: string | null = null

  if (clubIdOrName.startsWith('custom:')) {
    const name = clubIdOrName.slice(7).trim()
    if (!name) redirectWithMessage('/mandates/new', 'error', 'Please enter a club name for custom name only')
    customClubName = name
  } else if (isUuid(clubIdOrName)) {
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('id', clubIdOrName)
      .eq('user_id', user.id)
      .single()

    if (clubError || !club) {
      redirectWithMessage('/mandates/new', 'error', 'Please select a valid club')
    }
    clubId = club.id
  } else {
    const { data: newClub, error: createClubError } = await supabase
      .from('clubs')
      .insert({
        user_id: user.id,
        name: clubIdOrName,
        league: 'Other',
        country: 'TBC',
      })
      .select('id')
      .single()

    if (createClubError || !newClub) {
      redirectWithMessage('/mandates/new', 'error', createClubError?.message ?? 'Could not create club')
    }
    clubId = newClub.id
  }

  const pipelineStage = cleanEnum(getDefaultPipelineStage(), PIPELINE_STAGE_VALUES) ?? 'identified'

  const step1Payload: MandateStep1Insert = {
    user_id: user.id,
    club_id: clubId,
    custom_club_name: customClubName,
    pipeline_stage: pipelineStage,
    status: statusValue,
    engagement_date: engagementDate,
    target_completion_date: targetCompletionDate,
    priority: priorityValue,
    ownership_structure: ownershipStructure,
    budget_band: budgetBand,
    strategic_objective: strategicObjective,
    succession_timeline: successionTimeline,
    key_stakeholders: keyStakeholders,
  }

  const payloadForInsert = { ...step1Payload } as Record<string, unknown>
  delete payloadForInsert.board_risk_appetite
  delete payloadForInsert.confidentiality_level

  if (process.env.NODE_ENV === 'development') {
    console.log('MANDATE STEP1 INSERT', payloadForInsert)
  }

  const { data: mandate, error: insertError } = await supabase
    .from('mandates')
    .insert(payloadForInsert as Database['public']['Tables']['mandates']['Insert'])
    .select('id')
    .single()

  if (insertError || !mandate) {
    redirectWithMessage('/mandates/new', 'error', insertError?.message || 'Could not create mandate')
  }

  await logActivity({
    entityType: 'mandate',
    entityId: mandate.id,
    actionType: 'created',
    description: 'Mandate created',
    metadata: clubId ? { club_id: clubId } : { custom_club_name: customClubName },
  })

  revalidatePath('/mandates')
  redirect(`/mandates/${mandate.id}/preferences?success=Step+1+saved`)
}

export async function createMandateAction(formData: FormData) {
  const { supabase, user } = await requireUser()

  const clubIdOrName = toText(formData.get('club_id_or_name'))
  const statusValue = cleanEnum(toText(formData.get('status')), MANDATE_STATUS_VALUES)
  const engagementDate = toText(formData.get('engagement_date'))
  const targetCompletionDate = toText(formData.get('target_completion_date'))
  const priorityValue = cleanEnum(toText(formData.get('priority')), MANDATE_PRIORITY_VALUES)
  const ownershipStructure = toText(formData.get('ownership_structure'))
  const budgetBand = toText(formData.get('budget_band'))
  const strategicObjective = toText(formData.get('strategic_objective'))
  const boardRiskAppetite = cleanEnum(toText(formData.get('board_risk_appetite')), BOARD_RISK_APPETITE_VALUES)
  const successionTimeline = toText(formData.get('succession_timeline'))
  const keyStakeholdersInput = toText(formData.get('key_stakeholders'))
  const confidentialityLevel = cleanEnum(toText(formData.get('confidentiality_level')), CONFIDENTIALITY_LEVEL_VALUES)

  if (
    !clubIdOrName ||
    !statusValue ||
    !engagementDate ||
    !targetCompletionDate ||
    !priorityValue ||
    !ownershipStructure ||
    !budgetBand ||
    !strategicObjective ||
    !boardRiskAppetite ||
    !successionTimeline ||
    !confidentialityLevel
  ) {
    redirectWithMessage('/mandates/new', 'error', 'Please complete all required fields with valid values')
  }

  if (new Date(engagementDate).getTime() > new Date(targetCompletionDate).getTime()) {
    redirectWithMessage('/mandates/new', 'error', 'Target completion date must be on or after engagement date')
  }

  let clubId: string | null = null
  let customClubName: string | null = null

  if (clubIdOrName.startsWith('custom:')) {
    const name = clubIdOrName.slice(7).trim()
    if (!name) redirectWithMessage('/mandates/new', 'error', 'Please enter a club name for custom name only')
    customClubName = name
  } else if (isUuid(clubIdOrName)) {
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('id', clubIdOrName)
      .eq('user_id', user.id)
      .single()

    if (clubError || !club) {
      redirectWithMessage('/mandates/new', 'error', 'Please select a valid club')
    }
    clubId = club.id
  } else {
    const { data: newClub, error: createClubError } = await supabase
      .from('clubs')
      .insert({
        user_id: user.id,
        name: clubIdOrName,
        league: 'Other',
        country: 'TBC',
      })
      .select('id')
      .single()

    if (createClubError || !newClub) {
      redirectWithMessage('/mandates/new', 'error', createClubError?.message ?? 'Could not create club')
    }
    clubId = newClub.id
  }

  const keyStakeholders = keyStakeholdersInput
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)

  const pipelineStageFull = cleanEnum(getDefaultPipelineStage(), PIPELINE_STAGE_VALUES) ?? 'identified'
  const { data: mandate, error: insertError } = await supabase
    .from('mandates')
    .insert({
      user_id: user.id,
      club_id: clubId,
      custom_club_name: customClubName,
      pipeline_stage: pipelineStageFull,
      status: statusValue,
      engagement_date: engagementDate,
      target_completion_date: targetCompletionDate,
      priority: priorityValue,
      ownership_structure: ownershipStructure,
      budget_band: budgetBand,
      strategic_objective: strategicObjective,
      board_risk_appetite: boardRiskAppetite,
      succession_timeline: successionTimeline,
      key_stakeholders: keyStakeholders,
      confidentiality_level: confidentialityLevel,
    })
    .select('id')
    .single()

  if (insertError || !mandate) {
    redirectWithMessage('/mandates/new', 'error', insertError?.message || 'Could not create mandate')
  }

  await logActivity({
    entityType: 'mandate',
    entityId: mandate.id,
    actionType: 'created',
    description: 'Mandate created',
    metadata: clubId ? { club_id: clubId } : { custom_club_name: customClubName },
  })

  revalidatePath('/mandates')
  redirect(`/mandates/${mandate.id}?success=Mandate+created`)
}

export async function addShortlistAction(formData: FormData) {
  const { supabase, user } = await requireUser()

  const mandateId = toText(formData.get('mandate_id'))
  const coachId = toText(formData.get('coach_id'))
  const placementProbabilityRaw = toText(formData.get('placement_probability'))
  const riskRating = toText(formData.get('risk_rating'))
  const status = toText(formData.get('status'))
  const notes = toText(formData.get('notes'))

  if (!mandateId || !coachId || !placementProbabilityRaw || !riskRating || !status) {
    redirectWithMessage(`/mandates/${mandateId}`, 'shortlist_error', 'Please complete all shortlist fields')
  }

  const placementProbability = Number.parseInt(placementProbabilityRaw, 10)
  if (Number.isNaN(placementProbability) || placementProbability < 0 || placementProbability > 100) {
    redirectWithMessage(`/mandates/${mandateId}`, 'shortlist_error', 'Placement probability must be between 0 and 100')
  }

  const { data: mandate, error: mandateError } = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()

  if (mandateError || !mandate) {
    redirectWithMessage('/mandates', 'error', 'Mandate not found')
  }

  const normalizedStatus = normalizeShortlistStatus(status)
  const normalizedRiskRating = normalizeShortlistRiskRating(riskRating)

  const { error } = await supabase.from('mandate_shortlist').insert({
    mandate_id: mandateId,
    coach_id: coachId,
    placement_probability: placementProbability,
    risk_rating: normalizedRiskRating,
    status: normalizedStatus,
    notes: notes || null,
  })

  if (error) {
    if (error.code === '23505') {
      redirectWithMessage(`/mandates/${mandateId}`, 'shortlist_error', 'Coach is already on this shortlist')
    }
    redirectWithMessage(`/mandates/${mandateId}`, 'shortlist_error', error.message || 'Could not add shortlist coach')
  }

  await logActivity({
    entityType: 'mandate',
    entityId: mandateId,
    actionType: 'shortlist_added',
    description: 'Candidate added to shortlist',
    metadata: { coach_id: coachId },
  })

  revalidatePath('/mandates')
  revalidatePath(`/mandates/${mandateId}`)
  redirect(`/mandates/${mandateId}?shortlist_success=Coach+added+to+shortlist`)
}

export async function updateShortlistEntryAction(formData: FormData) {
  const { supabase, user } = await requireUser()

  const mandateId = toText(formData.get('mandate_id'))
  const shortlistId = toText(formData.get('shortlist_id'))
  const status = toText(formData.get('status'))
  const notes = toText(formData.get('notes'))

  if (!mandateId || !shortlistId) {
    redirectWithMessage(`/mandates/${mandateId}`, 'shortlist_error', 'Missing shortlist entry id')
  }

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()

  if (!mandate) {
    redirectWithMessage('/mandates', 'error', 'Mandate not found')
  }

  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = normalizeShortlistStatus(status)
  if (notes !== undefined) updates.notes = notes || null

  if (Object.keys(updates).length === 0) {
    revalidatePath(`/mandates/${mandateId}`)
    redirect(`/mandates/${mandateId}?shortlist_success=Updated`)
  }

  const { error } = await supabase
    .from('mandate_shortlist')
    .update(updates)
    .eq('id', shortlistId)
    .eq('mandate_id', mandateId)

  if (error) {
    redirectWithMessage(`/mandates/${mandateId}`, 'shortlist_error', error.message || 'Could not update shortlist entry')
  }

  await logActivity({
    entityType: 'mandate',
    entityId: mandateId,
    actionType: 'shortlist_updated',
    description: 'Shortlist entry updated',
    metadata: { shortlist_id: shortlistId, ...updates },
  })

  revalidatePath('/mandates')
  revalidatePath(`/mandates/${mandateId}`)
  redirect(`/mandates/${mandateId}?shortlist_success=Shortlist+entry+updated`)
}

export async function addDeliverableAction(formData: FormData) {
  const { supabase, user } = await requireUser()

  const mandateId = toText(formData.get('mandate_id'))
  const item = toText(formData.get('item'))
  const dueDate = toText(formData.get('due_date'))
  const status = toText(formData.get('status'))

  if (!mandateId || !item || !dueDate || !status) {
    redirectWithMessage(`/mandates/${mandateId}`, 'deliverable_error', 'Please complete all deliverable fields')
  }

  const { data: mandate, error: mandateError } = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()

  if (mandateError || !mandate) {
    redirectWithMessage('/mandates', 'error', 'Mandate not found')
  }

  const { error } = await supabase.from('mandate_deliverables').insert({
    mandate_id: mandateId,
    item,
    due_date: dueDate,
    status,
  })

  if (error) {
    redirectWithMessage(`/mandates/${mandateId}`, 'deliverable_error', error.message || 'Could not add deliverable')
  }

  revalidatePath('/mandates')
  revalidatePath(`/mandates/${mandateId}`)
  redirect(`/mandates/${mandateId}?deliverable_success=Deliverable+added`)
}

export async function updateMandateAction(formData: FormData) {
  const { supabase, user } = await requireUser()

  const mandateId = toText(formData.get('mandate_id'))
  if (!mandateId) {
    redirectWithMessage('/mandates', 'error', 'Mandate id required')
  }

  const { data: mandate, error: fetchError } = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !mandate) {
    redirectWithMessage('/mandates', 'error', 'Mandate not found')
  }

  const ownershipStructure = cleanText(formData.get('ownership_structure'))
  const budgetBand = cleanText(formData.get('budget_band'))
  const strategicObjective = cleanText(formData.get('strategic_objective'))
  const boardRiskAppetite = cleanEnum(toText(formData.get('board_risk_appetite')), BOARD_RISK_APPETITE_VALUES)
  const successionTimeline = cleanText(formData.get('succession_timeline'))
  const keyStakeholdersInput = toText(formData.get('key_stakeholders'))
  const confidentialityLevel = cleanEnum(toText(formData.get('confidentiality_level')), CONFIDENTIALITY_LEVEL_VALUES)

  const keyStakeholders = keyStakeholdersInput
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)

  const updates: Record<string, unknown> = {}
  if (ownershipStructure !== undefined) updates.ownership_structure = ownershipStructure
  if (budgetBand !== undefined) updates.budget_band = budgetBand
  if (strategicObjective !== undefined) updates.strategic_objective = strategicObjective
  if (boardRiskAppetite !== undefined) updates.board_risk_appetite = boardRiskAppetite
  if (successionTimeline !== undefined) updates.succession_timeline = successionTimeline
  updates.key_stakeholders = keyStakeholders
  if (confidentialityLevel !== undefined) updates.confidentiality_level = confidentialityLevel

  const status = cleanEnum(toText(formData.get('status')), MANDATE_STATUS_VALUES)
  const priority = cleanEnum(toText(formData.get('priority')), MANDATE_PRIORITY_VALUES)
  if (status !== undefined) updates.status = status
  if (priority !== undefined) updates.priority = priority

  const engagementDate = toText(formData.get('engagement_date'))
  const targetCompletionDate = toText(formData.get('target_completion_date'))
  if (engagementDate) updates.engagement_date = engagementDate
  if (targetCompletionDate) updates.target_completion_date = targetCompletionDate

  if (Object.keys(updates).length === 0) {
    revalidatePath(`/mandates/${mandateId}`)
    redirect(`/mandates/${mandateId}?success=Mandate+updated`)
  }

  const { error } = await supabase
    .from('mandates')
    .update(updates)
    .eq('id', mandateId)
    .eq('user_id', user.id)

  if (error) {
    redirectWithMessage(`/mandates/${mandateId}`, 'error', error.message || 'Could not update mandate')
  }

  revalidatePath('/mandates')
  revalidatePath(`/mandates/${mandateId}`)
  redirect(`/mandates/${mandateId}?success=Mandate+updated`)
}

export async function createDemoMandateAction() {
  if (process.env.NODE_ENV === 'production') {
    redirectWithMessage('/mandates', 'error', 'Demo creation is disabled in production')
  }

  const { supabase, user } = await requireUser()

  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (clubError || !club) {
    redirectWithMessage('/mandates', 'error', 'Create a club first before creating demo mandate')
  }

  const today = new Date()
  const inThirtyDays = new Date(today)
  inThirtyDays.setDate(inThirtyDays.getDate() + 30)

  const toDate = (date: Date) => date.toISOString().slice(0, 10)

  const pipelineStage = cleanEnum(getDefaultPipelineStage(), PIPELINE_STAGE_VALUES) ?? 'identified'
  const { data: mandate, error: mandateError } = await supabase
    .from('mandates')
    .insert({
      user_id: user.id,
      club_id: club.id,
      pipeline_stage: pipelineStage,
      status: 'Active',
      engagement_date: toDate(today),
      target_completion_date: toDate(inThirtyDays),
      priority: 'High',
      ownership_structure: 'Confidential ownership group',
      budget_band: '£2M to £4M annual package',
      strategic_objective: 'Secure a head coach appointment for short term stability and long term growth',
      board_risk_appetite: 'Moderate',
      succession_timeline: 'Appointment required within 30 days',
      key_stakeholders: ['Chair', 'Chief Executive', 'Sporting Director'],
      confidentiality_level: 'High',
    })
    .select('id')
    .single()

  if (mandateError || !mandate) {
    redirectWithMessage('/mandates', 'error', mandateError?.message || 'Could not create demo mandate')
  }

  const { error: deliverableError } = await supabase.from('mandate_deliverables').insert({
    mandate_id: mandate.id,
    item: 'Initial candidate briefing',
    due_date: toDate(today),
    status: 'In Progress',
  })

  if (deliverableError) {
    redirectWithMessage('/mandates', 'error', deliverableError.message || 'Could not create demo deliverable')
  }

  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .order('name', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (coach) {
    await supabase.from('mandate_shortlist').insert({
      mandate_id: mandate.id,
      coach_id: coach.id,
      placement_probability: 72,
      risk_rating: 'Medium',
      status: 'Under Review',
    })
  }

  revalidatePath('/mandates')
  revalidatePath(`/mandates/${mandate.id}`)
  redirect(`/mandates/${mandate.id}?success=Demo+mandate+created`)
}

export async function updateMandateStageAction(
  mandateId: string,
  pipelineStage: string
): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser()
    const sanitized = sanitisePipelineStage(pipelineStage)
    if (!isValidPipelineStage(sanitized)) {
      return { error: 'Invalid pipeline stage' }
    }
    const { error } = await supabase
      .from('mandates')
      .update({ pipeline_stage: sanitized })
      .eq('id', mandateId)
      .eq('user_id', user.id)
    if (error) return { error: error.message }

    await logActivity({
      entityType: 'mandate',
      entityId: mandateId,
      actionType: 'stage_changed',
      description: `Pipeline stage updated`,
      metadata: { pipeline_stage: sanitized },
    })

    revalidatePath('/mandates')
    revalidatePath(`/mandates/${mandateId}`)
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update stage' }
  }
}

const FIT_SIGNAL_VALUES = ['Strong', 'Moderate', 'Weak', 'Unknown'] as const
const CANDIDATE_STAGE_VALUES = ['Tracked', 'Longlist', 'Shortlist', 'Interview', 'Final'] as const
const NETWORK_SOURCE_VALUES = ['Data search', 'Direct recommendation', 'Network suggestion', 'Proactive approach'] as const
const NETWORK_RELATIONSHIP_VALUES = ['Direct', 'Indirect', 'Cold'] as const

export async function updateShortlistWorkspaceAction(formData: FormData) {
  const { supabase, user } = await requireUser()
  const shortlistId = toText(formData.get('shortlist_id'))
  const mandateId = toText(formData.get('mandate_id'))
  if (!shortlistId || !mandateId) return { error: 'Missing fields' }

  // Verify ownership
  const { data: entry } = await supabase
    .from('mandate_shortlist')
    .select('id, mandates!inner(user_id)')
    .eq('id', shortlistId)
    .single()

  if (!entry || (entry.mandates as { user_id: string }).user_id !== user.id) {
    return { error: 'Not found' }
  }

  const update: Record<string, string | null> = {
    candidate_stage: cleanEnum(toText(formData.get('candidate_stage')), CANDIDATE_STAGE_VALUES) ?? 'Longlist',
    network_source: cleanEnum(toText(formData.get('network_source')), NETWORK_SOURCE_VALUES) ?? null,
    network_recommender: cleanText(formData.get('network_recommender')) ?? null,
    network_relationship: cleanEnum(toText(formData.get('network_relationship')), NETWORK_RELATIONSHIP_VALUES) ?? null,
    fit_tactical: cleanEnum(toText(formData.get('fit_tactical')), FIT_SIGNAL_VALUES) ?? null,
    fit_cultural: cleanEnum(toText(formData.get('fit_cultural')), FIT_SIGNAL_VALUES) ?? null,
    fit_level: cleanEnum(toText(formData.get('fit_level')), FIT_SIGNAL_VALUES) ?? null,
    fit_communication: cleanEnum(toText(formData.get('fit_communication')), FIT_SIGNAL_VALUES) ?? null,
    fit_network: cleanEnum(toText(formData.get('fit_network')), FIT_SIGNAL_VALUES) ?? null,
    fit_notes: cleanText(formData.get('fit_notes')) ?? null,
  }

  const { error } = await supabase
    .from('mandate_shortlist')
    .update(update)
    .eq('id', shortlistId)

  if (error) return { error: error.message }

  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/workspace`)
  return {}
}
