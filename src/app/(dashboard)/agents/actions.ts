'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/db'
import {
  createAgent as dbCreateAgent,
  updateAgent as dbUpdateAgent,
  deleteAgent as dbDeleteAgent,
  createAgentDeal,
  deleteAgentDeal,
} from '@/lib/db/agents'
import {
  upsertCoachAgent,
  deleteCoachAgent,
  upsertAgentClubRelationship,
  deleteAgentClubRelationship,
} from '@/lib/db/agentLinks'
import {
  createInteraction,
  deleteInteraction,
} from '@/lib/db/agentInteractions'
import {
  CLAIM_REVIEW_STATUSES,
  CLAIM_SENSITIVITIES,
  CLAIM_VERIFICATION_STATUSES,
  PROFILE_CLAIM_TYPES,
  isClaimProfileField,
} from '@/lib/profile-claims'
import { getInternalOrganizationId } from '@/lib/organizations/context'

type Result = { ok: true; data?: { id: string } } | { ok: false; error: string }
type ProfileClaimInsert = Database['public']['Tables']['profile_claims']['Insert']
type InteractionClaimInput = {
  claim_type: string
  profile_field?: string | null
  claimed_value: string
  evidence_summary: string
  confidence?: number | null
  sensitivity?: string | null
  verification_status?: string | null
  used_in_recommendation?: boolean | null
}

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function createAgentAction(formData: FormData): Promise<Result> {
  try {
    const { user } = await requireUser()
    const full_name = (formData.get('full_name') as string)?.trim()
    if (!full_name) return { ok: false, error: 'Name is required' }
    const agency_name = (formData.get('agency_name') as string)?.trim() || null
    const base_location = (formData.get('base_location') as string)?.trim() || null
    const marketsStr = (formData.get('markets') as string)?.trim()
    const markets = marketsStr ? marketsStr.split(/[\s,]+/).filter(Boolean) : []
    const languagesStr = (formData.get('languages') as string)?.trim()
    const languages = languagesStr ? languagesStr.split(/[\s,]+/).filter(Boolean) : []
    const phone = (formData.get('phone') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim() || null
    const whatsapp = (formData.get('whatsapp') as string)?.trim() || null
    const preferred_contact_channel = (formData.get('preferred_contact_channel') as string)?.trim() || null
    const notes = (formData.get('notes') as string)?.trim() || null
    const { data, error } = await dbCreateAgent(user.id, {
      full_name,
      agency_name,
      base_location,
      markets,
      languages,
      phone,
      email,
      whatsapp,
      preferred_contact_channel,
      notes,
    })
    if (error) return { ok: false, error: error.message ?? 'Failed to create agent' }
    const id = (data as { id: string })?.id
    if (!id) return { ok: false, error: 'No id returned' }
    revalidatePath('/agents')
    return { ok: true, data: { id } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateAgentAction(agentId: string, formData: FormData): Promise<Result> {
  try {
    const { user } = await requireUser()
    const full_name = (formData.get('full_name') as string)?.trim()
    if (!full_name) return { ok: false, error: 'Name is required' }
    const agency_name = (formData.get('agency_name') as string)?.trim() || null
    const base_location = (formData.get('base_location') as string)?.trim() || null
    const marketsStr = (formData.get('markets') as string)?.trim()
    const markets = marketsStr ? marketsStr.split(/[\s,]+/).filter(Boolean) : []
    const languagesStr = (formData.get('languages') as string)?.trim()
    const languages = languagesStr ? languagesStr.split(/[\s,]+/).filter(Boolean) : []
    const phone = (formData.get('phone') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim() || null
    const whatsapp = (formData.get('whatsapp') as string)?.trim() || null
    const preferred_contact_channel = (formData.get('preferred_contact_channel') as string)?.trim() || null
    const notes = (formData.get('notes') as string)?.trim() || null
    const reliability_score = formData.get('reliability_score') != null ? parseInt(String(formData.get('reliability_score')), 10) : null
    const influence_score = formData.get('influence_score') != null ? parseInt(String(formData.get('influence_score')), 10) : null
    const responsiveness_score = formData.get('responsiveness_score') != null ? parseInt(String(formData.get('responsiveness_score')), 10) : null
    const risk_flag = formData.get('risk_flag') === 'true' || formData.get('risk_flag') === 'on'
    const risk_notes = (formData.get('risk_notes') as string)?.trim() || null
    const { error } = await dbUpdateAgent(user.id, agentId, {
      full_name,
      agency_name,
      base_location,
      markets,
      languages,
      phone,
      email,
      whatsapp,
      preferred_contact_channel,
      notes,
      reliability_score: Number.isNaN(reliability_score!) ? null : reliability_score,
      influence_score: Number.isNaN(influence_score!) ? null : influence_score,
      responsiveness_score: Number.isNaN(responsiveness_score!) ? null : responsiveness_score,
      risk_flag,
      risk_notes,
    })
    if (error) return { ok: false, error: error.message ?? 'Failed to update agent' }
    revalidatePath('/agents')
    revalidatePath(`/agents/${agentId}`)
    revalidatePath(`/agents/${agentId}/coaches`)
    revalidatePath(`/agents/${agentId}/clubs`)
    revalidatePath(`/agents/${agentId}/interactions`)
    revalidatePath(`/agents/${agentId}/deals`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteAgentAction(agentId: string): Promise<Result> {
  try {
    const { user } = await requireUser()
    const { error } = await dbDeleteAgent(user.id, agentId)
    if (error) return { ok: false, error: error.message ?? 'Failed to delete agent' }
    revalidatePath('/agents')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function upsertCoachAgentAction(payload: {
  id?: string
  coach_id: string
  agent_id: string
  relationship_type?: string
  started_on?: string | null
  ended_on?: string | null
  relationship_strength?: number | null
  confidence?: number | null
  notes?: string | null
}): Promise<Result> {
  try {
    const { user } = await requireUser()
    const { error } = await upsertCoachAgent(user.id, {
      user_id: user.id,
      coach_id: payload.coach_id,
      agent_id: payload.agent_id,
      relationship_type: payload.relationship_type ?? 'Primary',
      started_on: payload.started_on ?? null,
      ended_on: payload.ended_on ?? null,
      relationship_strength: payload.relationship_strength ?? null,
      notes: payload.notes ?? null,
    })
    if (error) return { ok: false, error: error.message ?? 'Failed to save link' }
    revalidatePath(`/agents/${payload.agent_id}`)
    revalidatePath(`/agents/${payload.agent_id}/coaches`)
    revalidatePath(`/coaches/${payload.coach_id}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteCoachAgentAction(id: string, agentId: string, coachId: string): Promise<Result> {
  try {
    const { user } = await requireUser()
    const { error } = await deleteCoachAgent(user.id, id)
    if (error) return { ok: false, error: error.message ?? 'Failed to delete link' }
    revalidatePath(`/agents/${agentId}`)
    revalidatePath(`/agents/${agentId}/coaches`)
    revalidatePath(`/coaches/${coachId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function upsertAgentClubRelationshipAction(payload: {
  id?: string
  agent_id: string
  club_id: string
  relationship_type?: string
  relationship_strength?: number | null
  last_active_on?: string | null
  notes?: string | null
}): Promise<Result> {
  try {
    const { user } = await requireUser()
    const { error } = await upsertAgentClubRelationship(user.id, {
      user_id: user.id,
      agent_id: payload.agent_id,
      club_id: payload.club_id,
      relationship_type: payload.relationship_type ?? 'Intermediary',
      relationship_strength: payload.relationship_strength ?? null,
      notes: payload.notes ?? null,
    })
    if (error) return { ok: false, error: error.message ?? 'Failed to save relationship' }
    revalidatePath(`/agents/${payload.agent_id}`)
    revalidatePath(`/agents/${payload.agent_id}/clubs`)
    revalidatePath(`/clubs/${payload.club_id}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteAgentClubRelationshipAction(id: string, agentId: string, clubId: string): Promise<Result> {
  try {
    const { user } = await requireUser()
    const { error } = await deleteAgentClubRelationship(user.id, id)
    if (error) return { ok: false, error: error.message ?? 'Failed to delete relationship' }
    revalidatePath(`/agents/${agentId}`)
    revalidatePath(`/agents/${agentId}/clubs`)
    revalidatePath(`/clubs/${clubId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function createAgentInteractionAction(payload: {
  agent_id: string
  occurred_at: string
  channel?: string | null
  direction?: string | null
  topic?: string | null
  summary: string
  detail?: string | null
  sentiment?: string | null
  confidence?: number | null
  interaction_type?: string | null
  reliability_score?: number | null
  influence_score?: number | null
  follow_up_date?: string | null
  coach_id?: string | null
  club_id?: string | null
  claims?: InteractionClaimInput[]
}): Promise<Result> {
  try {
    const { supabase, user } = await requireUser()
    const coachId = payload.coach_id ?? null
    const agent = await supabase
      .from('agents')
      .select('id, full_name, agency_name')
      .eq('id', payload.agent_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!agent.data) return { ok: false, error: 'Agent not found' }
    const agentData = agent.data

    let currentCoach: Record<string, unknown> | null = null
    if (coachId) {
      const coach = await supabase
        .from('coaches')
        .select('*')
        .eq('id', coachId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!coach.data) return { ok: false, error: 'Coach not found' }
      currentCoach = coach.data as unknown as Record<string, unknown>
    }

    const { data: interaction, error } = await createInteraction(user.id, {
      agent_id: payload.agent_id,
      occurred_at: payload.occurred_at,
      channel: payload.channel ?? null,
      direction: payload.direction ?? null,
      topic: payload.topic ?? null,
      summary: payload.summary.trim(),
      detail: payload.detail?.trim() ?? null,
      sentiment: payload.sentiment ?? null,
      confidence: payload.confidence ?? null,
      interaction_type: payload.interaction_type ?? null,
      reliability_score: payload.reliability_score ?? null,
      influence_score: payload.influence_score ?? null,
      follow_up_date: payload.follow_up_date ?? null,
      coach_id: payload.coach_id ?? null,
      club_id: payload.club_id ?? null,
    })
    if (error) return { ok: false, error: error.message ?? 'Failed to add interaction' }

    const claims = (payload.claims ?? [])
      .map((claim) => ({
        ...claim,
        claimed_value: claim.claimed_value.trim(),
        evidence_summary: claim.evidence_summary.trim(),
      }))
      .filter((claim) => claim.claimed_value && claim.evidence_summary)

    if (claims.some((claim) => claim.confidence != null && (claim.confidence < 0 || claim.confidence > 100))) {
      return { ok: false, error: 'Claim confidence must be between 0 and 100' }
    }

    if (claims.length > 0) {
      if (!coachId || !currentCoach) return { ok: false, error: 'Link a coach before adding findings' }
      const organizationId = await getInternalOrganizationId(user.id)
      if (!organizationId) return { ok: false, error: 'Internal organisation access is required' }
      const rows: ProfileClaimInsert[] = claims.slice(0, 4).map((claim) => {
        const profileField = isClaimProfileField(claim.profile_field) ? claim.profile_field : null
        const claimType = PROFILE_CLAIM_TYPES.includes(claim.claim_type as (typeof PROFILE_CLAIM_TYPES)[number])
          ? claim.claim_type
          : 'other'
        const sensitivity = CLAIM_SENSITIVITIES.includes(claim.sensitivity as (typeof CLAIM_SENSITIVITIES)[number])
          ? claim.sensitivity ?? 'standard'
          : 'standard'
        const verificationStatus = CLAIM_VERIFICATION_STATUSES.includes(
          claim.verification_status as (typeof CLAIM_VERIFICATION_STATUSES)[number]
        )
          ? claim.verification_status ?? 'unverified'
          : 'unverified'
        const sourceName = [
          agentData.full_name,
          agentData.agency_name ? `(${agentData.agency_name})` : null,
        ].filter(Boolean).join(' ')

        return {
          user_id: user.id,
          org_id: organizationId,
          created_by: user.id,
          entity_type: 'coach',
          entity_id: coachId,
          coach_id: coachId,
          agent_id: payload.agent_id,
          interaction_id: (interaction as { id: string }).id,
          claim_type: claimType,
          profile_field: profileField,
          current_value: profileField && currentCoach[profileField] != null ? String(currentCoach[profileField]) : null,
          claimed_value: claim.claimed_value,
          evidence_summary: claim.evidence_summary,
          source_type: 'agent_conversation',
          source_name: sourceName || null,
          source_notes: payload.summary,
          source_tier: claim.verification_status === 'verified' ? '1' : '2',
          confidence: claim.confidence ?? payload.confidence ?? null,
          sensitivity,
          verification_status: verificationStatus,
          statement_type: 'opinion',
          evidence_strength: verificationStatus === 'disputed' ? 'disputed' : 'single_source',
          fact_check_status: 'not_applicable',
          external_visibility: 'anonymised_external',
          used_in_recommendation: claim.used_in_recommendation !== false,
          occurred_at: payload.occurred_at,
        }
      })
      const { error: claimError } = await supabase.from('profile_claims').insert(rows)
      if (claimError) return { ok: false, error: claimError.message ?? 'Failed to add findings' }
    }

    revalidatePath(`/agents/${payload.agent_id}`)
    revalidatePath(`/agents/${payload.agent_id}/interactions`)
    if (coachId) revalidatePath(`/coaches/${coachId}`)
    revalidatePath('/intelligence')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function reviewProfileClaimAction(payload: {
  id: string
  agent_id?: string | null
  coach_id?: string | null
  review_status: string
  apply_to_profile?: boolean
}): Promise<Result> {
  try {
    const { supabase, user } = await requireUser()
    if (!CLAIM_REVIEW_STATUSES.includes(payload.review_status as (typeof CLAIM_REVIEW_STATUSES)[number])) {
      return { ok: false, error: 'Unknown claim review status' }
    }

    const { data: claim, error: claimError } = await supabase
      .from('profile_claims')
      .select('*')
      .eq('id', payload.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (claimError || !claim) return { ok: false, error: 'Claim not found' }

    const profileField = isClaimProfileField(claim.profile_field) ? claim.profile_field : null
    const targetCoachId = claim.coach_id
    const shouldApply = Boolean(payload.apply_to_profile && targetCoachId && profileField)
    const nextStatus = shouldApply ? 'applied' : payload.review_status
    const now = new Date().toISOString()

    if (shouldApply) {
      const { error: coachError } = await supabase
        .from('coaches')
        .update({
          [profileField as string]: claim.claimed_value,
          last_updated: now,
        })
        .eq('id', targetCoachId as string)
        .eq('user_id', user.id)
      if (coachError) return { ok: false, error: coachError.message ?? 'Failed to update coach profile' }
    }

    const { error } = await supabase
      .from('profile_claims')
      .update({
        review_status: nextStatus,
        reviewed_at: now,
        reviewed_by: user.email ?? user.id,
        applied_at: shouldApply ? now : null,
        updated_at: now,
      })
      .eq('id', payload.id)
      .eq('user_id', user.id)
    if (error) return { ok: false, error: error.message ?? 'Failed to review claim' }

    if (payload.agent_id) {
      revalidatePath(`/agents/${payload.agent_id}`)
      revalidatePath(`/agents/${payload.agent_id}/interactions`)
    }
    if (claim.coach_id) revalidatePath(`/coaches/${claim.coach_id}`)
    revalidatePath('/intelligence')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteAgentInteractionAction(id: string, agentId: string): Promise<Result> {
  try {
    const { user } = await requireUser()
    const { error } = await deleteInteraction(user.id, id)
    if (error) return { ok: false, error: error.message ?? 'Failed to delete interaction' }
    revalidatePath(`/agents/${agentId}`)
    revalidatePath(`/agents/${agentId}/interactions`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function createAgentDealAction(payload: {
  agent_id: string
  deal_type: string
  season?: string | null
  value_band?: string | null
  notes?: string | null
  occurred_on?: string | null
  coach_id?: string | null
  club_id?: string | null
}): Promise<Result> {
  try {
    const { user } = await requireUser()
    const { error } = await createAgentDeal(user.id, {
      agent_id: payload.agent_id,
      deal_type: payload.deal_type,
      season: payload.season ?? null,
      value_band: payload.value_band ?? null,
      notes: payload.notes ?? null,
      occurred_on: payload.occurred_on ?? null,
      coach_id: payload.coach_id ?? null,
      club_id: payload.club_id ?? null,
    })
    if (error) return { ok: false, error: error.message ?? 'Failed to add deal' }
    revalidatePath(`/agents/${payload.agent_id}`)
    revalidatePath(`/agents/${payload.agent_id}/deals`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteAgentDealAction(id: string, agentId: string): Promise<Result> {
  try {
    const { user } = await requireUser()
    const { error } = await deleteAgentDeal(user.id, id)
    if (error) return { ok: false, error: error.message ?? 'Failed to delete deal' }
    revalidatePath(`/agents/${agentId}`)
    revalidatePath(`/agents/${agentId}/deals`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
