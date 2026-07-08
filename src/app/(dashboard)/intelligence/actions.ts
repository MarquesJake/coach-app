'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/db/activity'
import { createAlert } from '@/lib/db/alerts'
import {
  ASSESSMENT_CRITERIA,
  EVIDENCE_METHODS,
  VERIFICATION_STATUSES as ASSESSMENT_VERIFICATION_STATUSES,
} from '@/lib/assessment/criteria'
import { canAssessCandidate, type AssessmentAccessClient } from '@/lib/assessment/access'
import {
  COMMERCIAL_SURFACES,
  DESTINATIONS,
  INBOX_EVIDENCE_METHOD_OPTIONS,
  INBOX_CRITERIA_OPTIONS,
  INBOX_REVIEW_STATUSES,
  INTAKE_TYPES,
  SENSITIVITY_LEVELS,
  SOURCE_TYPES,
  VERIFICATION_STATUSES,
} from '@/lib/intelligence/inbox'
import {
  CLAIM_SENSITIVITIES,
  CLAIM_VERIFICATION_STATUSES,
  PROFILE_CLAIM_TYPES,
} from '@/lib/profile-claims'

const ENTITY_TYPES = ['coach', 'staff', 'club', 'mandate', 'agent'] as const
const DIRECTIONS = ['Positive', 'Neutral', 'Negative'] as const

function clampConfidence(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null
  return Math.max(0, Math.min(100, Math.round(value)))
}

function enumValue<T extends readonly { key: string }[]>(
  value: string | null | undefined,
  options: T,
  fallback: T[number]['key']
) {
  return options.some((option) => option.key === value) ? value! : fallback
}

function optionalEnum<T extends readonly string[]>(value: string | null | undefined, allowed: T) {
  return allowed.includes(value as T[number]) ? value! : null
}

function normaliseTier(value: string | null | undefined) {
  if (!value) return null
  return value.replace(/^T/i, '')
}

function itemSensitivityToIntelligence(value: string | null | undefined) {
  return ['high', 'confidential', 'legal_review'].includes((value ?? '').toLowerCase()) ? 'High' : 'Standard'
}

function itemSensitivityToClaim(value: string | null | undefined) {
  const normalized = (value ?? '').toLowerCase()
  if (normalized === 'legal_review') return 'confidential'
  return CLAIM_SENSITIVITIES.includes(normalized as (typeof CLAIM_SENSITIVITIES)[number]) ? normalized : 'standard'
}

function itemVerificationToAssessment(value: string | null | undefined) {
  if (value === 'verified') return 'verified'
  if (value === 'disputed') return 'disputed'
  return 'unverified'
}

function itemVerificationToClaim(value: string | null | undefined) {
  const assessmentStatus = itemVerificationToAssessment(value)
  return CLAIM_VERIFICATION_STATUSES.includes(assessmentStatus as (typeof CLAIM_VERIFICATION_STATUSES)[number])
    ? assessmentStatus
    : 'unverified'
}

function firstAllowed(value: string[] | null | undefined, allowed: readonly { key: string }[], fallback: string) {
  return value?.find((key) => allowed.some((option) => option.key === key)) ?? fallback
}

function detailFromInboxItem(item: {
  extracted_signal: string | null
  raw_detail: string | null
  analyst_notes: string | null
}) {
  return [
    item.extracted_signal,
    item.raw_detail ? `Raw context: ${item.raw_detail}` : null,
    item.analyst_notes ? `Analyst note: ${item.analyst_notes}` : null,
  ].filter(Boolean).join('\n\n') || null
}

function inferClaimType(item: {
  intake_type: string
  headline: string
  extracted_signal: string | null
  methodology_criteria: string[]
  direction: string | null
}) {
  const text = `${item.headline} ${item.extracted_signal ?? ''}`.toLowerCase()
  const criteria = new Set(item.methodology_criteria)
  if (text.match(/\b(contract|clause|release|salary|wage|compensation|money|cost)\b/)) return 'contract'
  if (text.match(/\b(available|availability|move|relocate|start|notice)\b/)) return 'availability'
  if (text.match(/\b(family|relocation|wife|partner|children|kids)\b/)) return 'family_relocation'
  if (text.match(/\b(staff|assistant|coach|analyst|fitness)\b/)) return 'staff'
  if (criteria.has('tactical_proposal') || text.match(/\b(model|tactical|formation|press|possession)\b/)) return 'football_model'
  if (criteria.has('media_comms') || text.match(/\b(media|press|communication|interview)\b/)) return 'media_reputation'
  if (criteria.has('personality_profile') || text.match(/\b(leader|leadership|personality|pressure)\b/)) return 'leadership'
  if (item.direction === 'Negative' || criteria.has('cultural_org_fit')) return 'risk'
  return PROFILE_CLAIM_TYPES.includes(item.intake_type as (typeof PROFILE_CLAIM_TYPES)[number]) ? item.intake_type : 'other'
}

function materialTypeFromInbox(item: { intake_type: string; headline: string }) {
  const text = `${item.intake_type} ${item.headline}`.toLowerCase()
  if (text.includes('presentation')) return 'presentation'
  if (text.includes('training')) return 'training_video'
  if (text.includes('match')) return 'match_video'
  if (text.includes('methodology') || text.includes('model')) return 'methodology'
  if (text.includes('analysis') || text.includes('data')) return 'analysis'
  if (text.includes('media') || text.includes('podcast') || text.includes('interview')) return 'media'
  if (text.includes('reference')) return 'reference_pack'
  return 'other'
}

async function assessGuard(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  mandateId: string,
  coachId: string
) {
  return canAssessCandidate(supabase as unknown as AssessmentAccessClient, userId, mandateId, coachId)
}

async function ownsEntity(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  table: 'coaches' | 'clubs' | 'mandates' | 'agents',
  id: string | null | undefined
) {
  if (!id) return true
  const { data } = await supabase.from(table).select('id').eq('id', id).eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function createIntelligenceItemAction(input: {
  entity_type: string
  entity_id: string
  title: string
  detail?: string | null
  category?: string | null
  source_name?: string | null
  source_type?: string | null
  source_link?: string | null
  source_tier?: string | null
  source_notes?: string | null
  confidence?: number | null
  occurred_at?: string | null
  verified?: boolean
  verified_by?: string | null
  direction?: string | null
  sensitivity?: string | null
  mandate_id?: string | null
}) {
  const { supabase, user } = await requireUser()
  const allowed = ['coach', 'staff', 'club', 'mandate']
  if (!allowed.includes(input.entity_type) || !input.entity_id || !input.title?.trim()) {
    return { data: null, error: 'Invalid entity type, entity id, or title' }
  }
  const verified = input.verified === true
  const verified_at = verified ? new Date().toISOString() : null
  const { data, error } = await supabase
    .from('intelligence_items')
    .insert({
      user_id: user.id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      title: input.title.trim(),
      detail: input.detail?.trim() || null,
      category: input.category?.trim() || null,
      source_name: input.source_name?.trim() || null,
      source_type: input.source_type?.trim() || null,
      source_link: input.source_link?.trim() || null,
      source_tier: input.source_tier?.trim() || null,
      source_notes: input.source_notes?.trim() || null,
      confidence: input.confidence != null ? Math.max(0, Math.min(100, input.confidence)) : null,
      occurred_at: input.occurred_at || null,
      verified,
      verified_at,
      verified_by: input.verified_by?.trim() || null,
      direction: input.direction?.trim() || null,
      sensitivity: input.sensitivity?.trim() || 'Standard',
      mandate_id: input.mandate_id?.trim() || null,
    })
    .select('id')
    .single()
  if (!error) {
    revalidatePath('/intelligence')
    if (input.entity_type === 'coach' && input.entity_id) {
      revalidatePath(`/coaches/${input.entity_id}/risk`)
    }
    await logActivity({
      entityType: input.entity_type,
      entityId: input.entity_id,
      actionType: 'intelligence_added',
      description: 'Intelligence added',
      metadata: { title: input.title.trim() },
    })
    if (input.entity_type === 'coach' && input.entity_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: onList } = await (supabase as any).from('watchlist_coaches').select('coach_id').eq('user_id', user.id).eq('coach_id', input.entity_id).maybeSingle()
      if (onList) {
        await createAlert({
          userId: user.id,
          entityType: 'coach',
          entityId: input.entity_id,
          alertType: 'new_intelligence',
          title: 'New intelligence added',
          detail: input.title?.trim() || input.category?.trim() || undefined,
        })
      }
    }
  }
  return { data: data as { id: string } | null, error: error?.message ?? null }
}

export async function createIntelligenceInboxItemAction(input: {
  intake_type?: string | null
  headline: string
  raw_detail?: string | null
  extracted_signal?: string | null
  source_type?: string | null
  source_name?: string | null
  source_tier?: string | null
  source_link?: string | null
  source_recorded_at?: string | null
  channel?: string | null
  sensitivity?: string | null
  verification_status?: string | null
  review_status?: string | null
  confidence?: number | null
  direction?: string | null
  methodology_criteria?: string[]
  evidence_methods?: string[]
  coach_id?: string | null
  club_id?: string | null
  mandate_id?: string | null
  agent_id?: string | null
  suggested_destination?: string | null
  commercial_surface?: string | null
  analyst_notes?: string | null
  next_action?: string | null
  due_date?: string | null
}) {
  const { supabase, user } = await requireUser()
  const headline = input.headline?.trim()
  if (!headline) return { data: null, error: 'Headline is required' }

  const coachId = input.coach_id?.trim() || null
  const clubId = input.club_id?.trim() || null
  const mandateId = input.mandate_id?.trim() || null
  const agentId = input.agent_id?.trim() || null

  if (!(await ownsEntity(supabase, user.id, 'coaches', coachId))) return { data: null, error: 'Coach not found' }
  if (!(await ownsEntity(supabase, user.id, 'clubs', clubId))) return { data: null, error: 'Club not found' }
  if (!(await ownsEntity(supabase, user.id, 'mandates', mandateId))) return { data: null, error: 'Mandate not found' }
  if (!(await ownsEntity(supabase, user.id, 'agents', agentId))) return { data: null, error: 'Agent not found' }

  const entity_type = coachId ? 'coach' : clubId ? 'club' : mandateId ? 'mandate' : agentId ? 'agent' : null
  const entity_id = coachId ?? clubId ?? mandateId ?? agentId
  const methodologyCriteria = (input.methodology_criteria ?? [])
    .filter((key) => INBOX_CRITERIA_OPTIONS.some((option) => option.key === key))
  const evidenceMethods = (input.evidence_methods ?? [])
    .filter((key) => INBOX_EVIDENCE_METHOD_OPTIONS.some((option) => option.key === key))

  const { data, error } = await supabase
    .from('intelligence_inbox_items')
    .insert({
      user_id: user.id,
      intake_type: enumValue(input.intake_type, INTAKE_TYPES, 'analyst_note'),
      headline,
      raw_detail: input.raw_detail?.trim() || null,
      extracted_signal: input.extracted_signal?.trim() || null,
      source_type: enumValue(input.source_type, SOURCE_TYPES, 'internal_analyst'),
      source_name: input.source_name?.trim() || null,
      source_tier: input.source_tier ? normaliseTier(input.source_tier) : null,
      source_link: input.source_link?.trim() || null,
      source_recorded_at: input.source_recorded_at || null,
      channel: input.channel?.trim() || null,
      sensitivity: enumValue(input.sensitivity, SENSITIVITY_LEVELS, 'standard'),
      verification_status: enumValue(input.verification_status, VERIFICATION_STATUSES, 'unverified'),
      review_status: enumValue(input.review_status, INBOX_REVIEW_STATUSES, 'captured'),
      confidence: clampConfidence(input.confidence),
      direction: optionalEnum(input.direction, DIRECTIONS),
      methodology_criteria: methodologyCriteria,
      evidence_methods: evidenceMethods,
      entity_type,
      entity_id,
      coach_id: coachId,
      club_id: clubId,
      mandate_id: mandateId,
      agent_id: agentId,
      suggested_destination: enumValue(input.suggested_destination, DESTINATIONS, 'intelligence_item'),
      commercial_surface: enumValue(input.commercial_surface, COMMERCIAL_SURFACES, 'subscription_intelligence'),
      analyst_notes: input.analyst_notes?.trim() || null,
      next_action: input.next_action?.trim() || null,
      due_date: input.due_date || null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/intelligence')
  revalidatePath('/intelligence/inbox')
  await logActivity({
    entityType: entity_type ?? 'intelligence',
    entityId: entity_id ?? data.id,
    actionType: 'intelligence_inbox_captured',
    description: 'Raw intelligence captured',
    metadata: { headline },
  })
  return { data: data as { id: string }, error: null }
}

export async function updateIntelligenceInboxStatusAction(input: {
  id: string
  review_status: string
}) {
  const { supabase, user } = await requireUser()
  const reviewStatus = enumValue(input.review_status, INBOX_REVIEW_STATUSES, 'triage')
  const { error } = await supabase
    .from('intelligence_inbox_items')
    .update({ review_status: reviewStatus, updated_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/intelligence/inbox')
  revalidatePath('/intelligence')
  return { ok: true }
}

export async function promoteInboxItemToIntelligenceAction(input: { id: string }) {
  const { supabase, user } = await requireUser()
  const { data: item, error: itemError } = await supabase
    .from('intelligence_inbox_items')
    .select('*')
    .eq('id', input.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (itemError) return { ok: false, error: itemError.message }
  if (!item) return { ok: false, error: 'Inbox item not found' }
  if (!item.entity_type || !item.entity_id) {
    return { ok: false, error: 'Link the inbox item to a coach, club, mandate, or agent first' }
  }
  if (!ENTITY_TYPES.includes(item.entity_type as (typeof ENTITY_TYPES)[number])) {
    return { ok: false, error: 'Unsupported entity type' }
  }

  const detailParts = [
    item.extracted_signal,
    item.raw_detail ? `Raw context: ${item.raw_detail}` : null,
    item.analyst_notes ? `Analyst note: ${item.analyst_notes}` : null,
  ].filter(Boolean)
  const category = item.methodology_criteria[0] ?? item.intake_type
  const { data: promoted, error: insertError } = await supabase
    .from('intelligence_items')
    .insert({
      user_id: user.id,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      category,
      title: item.headline,
      detail: detailParts.join('\n\n') || null,
      source_type: item.source_type,
      source_name: item.source_name,
      source_link: item.source_link,
      source_tier: normaliseTier(item.source_tier),
      source_notes: item.channel,
      confidence: item.confidence,
      occurred_at: item.source_recorded_at ?? item.created_at,
      verified: item.verification_status === 'verified',
      verified_at: item.verification_status === 'verified' ? new Date().toISOString() : null,
      verified_by: item.verification_status === 'verified' ? 'Coach First analyst' : null,
      direction: item.direction,
      sensitivity: itemSensitivityToIntelligence(item.sensitivity),
      mandate_id: item.mandate_id,
    })
    .select('id')
    .single()

  if (insertError || !promoted) return { ok: false, error: insertError?.message ?? 'Failed to promote item' }

  const { error: updateError } = await supabase
    .from('intelligence_inbox_items')
    .update({
      review_status: 'promoted',
      destination_record_type: 'intelligence_items',
      destination_record_id: promoted.id,
      promoted_at: new Date().toISOString(),
      promoted_by: user.email ?? 'Coach First analyst',
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.id)
    .eq('user_id', user.id)

  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath('/intelligence')
  revalidatePath('/intelligence/inbox')
  if (item.entity_type === 'coach') revalidatePath(`/coaches/${item.entity_id}/intelligence`)
  await logActivity({
    entityType: item.entity_type,
    entityId: item.entity_id,
    actionType: 'intelligence_inbox_promoted',
    description: 'Raw intelligence promoted to cleaned intelligence',
    metadata: { inbox_id: item.id, intelligence_id: promoted.id, title: item.headline },
  })
  return { ok: true, data: { id: promoted.id } }
}

export async function promoteIntelligenceInboxItemAction(input: {
  id: string
  destination?: string | null
}) {
  const { supabase, user } = await requireUser()
  const { data: item, error: itemError } = await supabase
    .from('intelligence_inbox_items')
    .select('*')
    .eq('id', input.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (itemError) return { ok: false, error: itemError.message }
  if (!item) return { ok: false, error: 'Inbox item not found' }
  if (item.review_status === 'promoted') return { ok: false, error: 'This item has already been promoted' }

  const destination = enumValue(input.destination ?? item.suggested_destination, DESTINATIONS, 'intelligence_item')
  const now = new Date().toISOString()
  const detail = detailFromInboxItem(item)
  const sourceLabel = [
    item.source_name,
    item.source_tier ? `T${normaliseTier(item.source_tier)}` : null,
    item.channel,
  ].filter(Boolean).join(' · ') || null

  let destinationRecordType = ''
  let destinationRecordId = ''
  let entityType = item.entity_type ?? 'intelligence'
  let entityId = item.entity_id ?? item.id
  const revalidateTargets: string[] = ['/intelligence', '/intelligence/inbox']

  if (destination === 'intelligence_item') {
    if (!item.entity_type || !item.entity_id) return { ok: false, error: 'Link the inbox item before promoting to the feed' }
    if (!ENTITY_TYPES.includes(item.entity_type as (typeof ENTITY_TYPES)[number])) return { ok: false, error: 'Unsupported entity type' }
    const { data: promoted, error } = await supabase
      .from('intelligence_items')
      .insert({
        user_id: user.id,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        category: item.methodology_criteria[0] ?? item.intake_type,
        title: item.headline,
        detail,
        source_type: item.source_type,
        source_name: item.source_name,
        source_link: item.source_link,
        source_tier: normaliseTier(item.source_tier),
        source_notes: item.channel,
        confidence: item.confidence,
        occurred_at: item.source_recorded_at ?? item.created_at,
        verified: item.verification_status === 'verified',
        verified_at: item.verification_status === 'verified' ? now : null,
        verified_by: item.verification_status === 'verified' ? user.email ?? 'Coach First analyst' : null,
        direction: item.direction,
        sensitivity: itemSensitivityToIntelligence(item.sensitivity),
        mandate_id: item.mandate_id,
      })
      .select('id')
      .single()
    if (error || !promoted) return { ok: false, error: error?.message ?? 'Failed to promote to intelligence feed' }
    destinationRecordType = 'intelligence_items'
    destinationRecordId = promoted.id
    if (item.entity_type === 'coach') revalidateTargets.push(`/coaches/${item.entity_id}/intelligence`)
  } else if (destination === 'profile_claim') {
    if (!item.coach_id) return { ok: false, error: 'Link a coach before promoting to a profile claim' }
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('id', item.coach_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!coach) return { ok: false, error: 'Coach not found' }
    const { data: promoted, error } = await supabase
      .from('profile_claims')
      .insert({
        user_id: user.id,
        entity_type: 'coach',
        entity_id: item.coach_id,
        coach_id: item.coach_id,
        agent_id: item.agent_id,
        claim_type: inferClaimType(item),
        current_value: null,
        claimed_value: item.extracted_signal || item.headline,
        evidence_summary: detail || item.headline,
        source_type: item.source_type,
        source_name: item.source_name,
        source_link: item.source_link,
        source_notes: [item.channel, item.next_action].filter(Boolean).join(' · ') || null,
        source_tier: normaliseTier(item.source_tier),
        confidence: item.confidence,
        sensitivity: itemSensitivityToClaim(item.sensitivity),
        verification_status: itemVerificationToClaim(item.verification_status),
        review_status: item.verification_status === 'verified' ? 'accepted' : 'pending',
        used_in_recommendation: true,
        occurred_at: item.source_recorded_at ?? item.created_at,
      })
      .select('id')
      .single()
    if (error || !promoted) return { ok: false, error: error?.message ?? 'Failed to promote to profile claim' }
    destinationRecordType = 'profile_claims'
    destinationRecordId = promoted.id
    entityType = 'coach'
    entityId = item.coach_id
    revalidateTargets.push(`/coaches/${item.coach_id}`)
  } else if (destination === 'assessment_evidence') {
    if (!item.coach_id || !item.mandate_id) return { ok: false, error: 'Link both a coach and mandate before promoting to assessment evidence' }
    if (!(await assessGuard(supabase, user.id, item.mandate_id, item.coach_id))) {
      return { ok: false, error: 'Candidate is not on this mandate shortlist' }
    }
    const criterion = firstAllowed(item.methodology_criteria, ASSESSMENT_CRITERIA, 'coach_profile')
    const method = firstAllowed(item.evidence_methods, EVIDENCE_METHODS, 'desktop_research')
    if (!ASSESSMENT_VERIFICATION_STATUSES.includes(itemVerificationToAssessment(item.verification_status) as (typeof ASSESSMENT_VERIFICATION_STATUSES)[number])) {
      return { ok: false, error: 'Unsupported verification status' }
    }
    const { data: promoted, error } = await supabase
      .from('assessment_evidence')
      .insert({
        user_id: user.id,
        mandate_id: item.mandate_id,
        coach_id: item.coach_id,
        criterion,
        method,
        title: item.headline,
        detail,
        source: sourceLabel,
        confidence: item.confidence,
        verification_status: itemVerificationToAssessment(item.verification_status),
        used_in_recommendation: true,
      })
      .select('id')
      .single()
    if (error || !promoted) return { ok: false, error: error?.message ?? 'Failed to promote to assessment evidence' }
    destinationRecordType = 'assessment_evidence'
    destinationRecordId = promoted.id
    entityType = 'coach'
    entityId = item.coach_id
    revalidateTargets.push(`/mandates/${item.mandate_id}/assessment`)
    revalidateTargets.push(`/mandates/${item.mandate_id}/assessment/${item.coach_id}`)
    revalidateTargets.push(`/mandates/${item.mandate_id}/assessment/${item.coach_id}/board-pack`)
  } else if (destination === 'private_material') {
    if (!item.coach_id) return { ok: false, error: 'Link a coach before promoting to confidential material' }
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('id', item.coach_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!coach) return { ok: false, error: 'Coach not found' }
    const { data: promoted, error } = await supabase
      .from('coach_private_materials')
      .insert({
        user_id: user.id,
        coach_id: item.coach_id,
        title: item.headline,
        material_type: materialTypeFromInbox(item),
        description: detail || item.analyst_notes || item.raw_detail || null,
        external_url: item.source_link,
        source_label: sourceLabel,
        uploaded_by: item.source_type === 'coach_self_submitted' ? 'coach' : item.source_type === 'agent' ? 'agent' : 'analyst',
        confidentiality_status: ['confidential', 'legal_review'].includes(item.sensitivity) ? 'withheld' : 'available',
        verification_status: itemVerificationToAssessment(item.verification_status),
      })
      .select('id')
      .single()
    if (error || !promoted) return { ok: false, error: error?.message ?? 'Failed to promote to confidential material' }
    destinationRecordType = 'coach_private_materials'
    destinationRecordId = promoted.id
    entityType = 'coach'
    entityId = item.coach_id
    revalidateTargets.push('/coach-portal')
    revalidateTargets.push(`/coach-portal/${item.coach_id}`)
    revalidateTargets.push(`/coaches/${item.coach_id}`)
  } else if (destination === 'agent_interaction') {
    if (!item.agent_id) return { ok: false, error: 'Link an agent before promoting to an agent interaction' }
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('id', item.agent_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!agent) return { ok: false, error: 'Agent not found' }
    const { data: promoted, error } = await supabase
      .from('agent_interactions')
      .insert({
        user_id: user.id,
        agent_id: item.agent_id,
        occurred_at: item.source_recorded_at ?? item.created_at,
        channel: item.channel,
        direction: item.direction,
        topic: item.intake_type,
        summary: item.headline,
        detail,
        sentiment: item.direction,
        confidence: item.confidence,
        interaction_type: item.intake_type === 'agent_call' ? 'Call' : 'Other',
        reliability_score: item.source_tier && Number.parseInt(normaliseTier(item.source_tier) ?? '', 10) <= 2 ? 80 : null,
        influence_score: null,
        follow_up_date: item.due_date,
        coach_id: item.coach_id,
        club_id: item.club_id,
      })
      .select('id')
      .single()
    if (error || !promoted) return { ok: false, error: error?.message ?? 'Failed to promote to agent interaction' }
    destinationRecordType = 'agent_interactions'
    destinationRecordId = promoted.id
    entityType = 'agent'
    entityId = item.agent_id
    revalidateTargets.push(`/agents/${item.agent_id}`)
    revalidateTargets.push(`/agents/${item.agent_id}/interactions`)
    if (item.coach_id) revalidateTargets.push(`/coaches/${item.coach_id}`)
  } else {
    return { ok: false, error: 'Use the structured interview/reference forms for this destination' }
  }

  const { error: updateError } = await supabase
    .from('intelligence_inbox_items')
    .update({
      review_status: 'promoted',
      suggested_destination: destination,
      destination_record_type: destinationRecordType,
      destination_record_id: destinationRecordId,
      promoted_at: now,
      promoted_by: user.email ?? 'Coach First analyst',
      updated_at: now,
    })
    .eq('id', item.id)
    .eq('user_id', user.id)

  if (updateError) return { ok: false, error: updateError.message }

  revalidateTargets.forEach((target) => revalidatePath(target))
  await logActivity({
    entityType,
    entityId,
    actionType: 'intelligence_inbox_promoted',
    description: `Raw intelligence promoted to ${destinationRecordType}`,
    metadata: { inbox_id: item.id, destination, destination_record_id: destinationRecordId, title: item.headline },
  })
  return { ok: true, data: { id: destinationRecordId, record_type: destinationRecordType } }
}
