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
  CLAIM_SENSITIVITIES,
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
    const { supabase, user } = await requireUser()
    const full_name = (formData.get('full_name') as string)?.trim()
    if (!full_name) return { ok: false, error: 'Name is required' }
    const agency_name = (formData.get('agency_name') as string)?.trim() || null
    const base_location = (formData.get('base_location') as string)?.trim() || null
    const marketsStr = (formData.get('markets') as string)?.trim()
    const markets = marketsStr ? marketsStr.split(',').map((value) => value.trim()).filter(Boolean) : []
    const languagesStr = (formData.get('languages') as string)?.trim()
    const languages = languagesStr ? languagesStr.split(',').map((value) => value.trim()).filter(Boolean) : []
    const phone = (formData.get('phone') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim() || null
    const whatsapp = (formData.get('whatsapp') as string)?.trim() || null
    const preferred_contact_channel = (formData.get('preferred_contact_channel') as string)?.trim() || null
    const notes = (formData.get('notes') as string)?.trim() || null
    if (!email && !phone && !whatsapp) {
      return { ok: false, error: 'Add at least one real contact route: email, phone or WhatsApp.' }
    }
    const organizationId = await getInternalOrganizationId(user.id)
    if (!organizationId) return { ok: false, error: 'Internal organisation access is required' }
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
    let contactId: string | null = null
    if (email) {
      const { data: existingContact } = await supabase
        .from('football_contacts')
        .select('id')
        .eq('org_id', organizationId)
        .eq('email', email.toLowerCase())
        .maybeSingle()
      contactId = existingContact?.id ?? null
    }
    if (!contactId) {
      const { data: contact, error: contactError } = await supabase
        .from('football_contacts')
        .insert({
          org_id: organizationId,
          created_by: user.id,
          relationship_owner_id: user.id,
          full_name,
          current_role_title: 'Agent / intermediary',
          current_organization: agency_name,
          email: email?.toLowerCase() ?? null,
          phone: whatsapp ?? phone,
          preferred_channel: preferred_contact_channel,
          stakeholder_group: 'agents',
          expertise: markets,
          default_attribution_permission: 'anonymised_external',
        })
        .select('id')
        .single()
      if (contactError || !contact) {
        await dbDeleteAgent(user.id, id)
        return { ok: false, error: contactError?.message ?? 'Could not create the linked football-network contact' }
      }
      contactId = contact.id
    }
    const { error: linkError } = await supabase
      .from('agents')
      .update({ football_contact_id: contactId })
      .eq('id', id)
      .eq('user_id', user.id)
    if (linkError) {
      await dbDeleteAgent(user.id, id)
      return { ok: false, error: 'Could not connect the agent to the football network' }
    }
    revalidatePath('/agents')
    revalidatePath('/network')
    return { ok: true, data: { id } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateAgentAction(agentId: string, formData: FormData): Promise<Result> {
  try {
    const { supabase, user } = await requireUser()
    const full_name = (formData.get('full_name') as string)?.trim()
    if (!full_name) return { ok: false, error: 'Name is required' }
    const agency_name = (formData.get('agency_name') as string)?.trim() || null
    const base_location = (formData.get('base_location') as string)?.trim() || null
    const marketsStr = (formData.get('markets') as string)?.trim()
    const markets = marketsStr ? marketsStr.split(',').map((value) => value.trim()).filter(Boolean) : []
    const languagesStr = (formData.get('languages') as string)?.trim()
    const languages = languagesStr ? languagesStr.split(',').map((value) => value.trim()).filter(Boolean) : []
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
    const { data: linkedAgent } = await supabase
      .from('agents')
      .select('football_contact_id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (linkedAgent?.football_contact_id) {
      await supabase
        .from('football_contacts')
        .update({
          full_name,
          current_organization: agency_name,
          email: email?.toLowerCase() ?? null,
          phone: whatsapp ?? phone,
          preferred_channel: preferred_contact_channel,
          expertise: markets,
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkedAgent.football_contact_id)
    }
    revalidatePath('/agents')
    revalidatePath(`/agents/${agentId}`)
    revalidatePath(`/agents/${agentId}/coaches`)
    revalidatePath(`/agents/${agentId}/clubs`)
    revalidatePath(`/agents/${agentId}/interactions`)
    revalidatePath(`/agents/${agentId}/deals`)
    revalidatePath('/network')
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
    const claims = (payload.claims ?? [])
      .map((claim) => ({
        ...claim,
        claimed_value: claim.claimed_value.trim(),
        evidence_summary: claim.evidence_summary.trim(),
      }))
      .filter((claim) => claim.claimed_value && claim.evidence_summary)

    if (claims.some((claim) => claim.confidence != null && (claim.confidence < 0 || claim.confidence > 100))) {
      return { ok: false, error: 'Finding confidence must be between 0 and 100' }
    }
    if (claims.length > 0 && !coachId) {
      return { ok: false, error: 'Link a coach before adding findings' }
    }

    const agent = await supabase
      .from('agents')
      .select('id, full_name, agency_name, football_contact_id')
      .eq('id', payload.agent_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!agent.data) return { ok: false, error: 'Agent not found' }
    const agentData = agent.data
    const organizationId = await getInternalOrganizationId(user.id)
    if (!organizationId) return { ok: false, error: 'Internal organisation access is required' }

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

    let contactId = agentData.football_contact_id
    if (!contactId) {
      const { data: contact, error: contactError } = await supabase
        .from('football_contacts')
        .insert({
          org_id: organizationId,
          created_by: user.id,
          relationship_owner_id: user.id,
          full_name: agentData.full_name,
          current_role_title: 'Agent / intermediary',
          current_organization: agentData.agency_name,
          stakeholder_group: 'agents',
          default_attribution_permission: 'anonymised_external',
        })
        .select('id')
        .single()
      if (contactError || !contact) {
        return { ok: false, error: contactError?.message ?? 'Could not create the linked football-network contact' }
      }
      contactId = contact.id
      const { error: agentLinkError } = await supabase
        .from('agents')
        .update({ football_contact_id: contactId })
        .eq('id', payload.agent_id)
        .eq('user_id', user.id)
      if (agentLinkError) return { ok: false, error: 'Could not link the agent to the football network' }
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

    const { data: session, error: sessionError } = await supabase
      .from('intelligence_sessions')
      .insert({
        org_id: organizationId,
        created_by: user.id,
        contact_id: contactId,
        coach_id: coachId,
        title: `${agentData.full_name}: ${payload.topic || payload.interaction_type || 'conversation'}`,
        intake_method: 'analyst_notes',
        occurred_at: payload.occurred_at,
        channel: payload.channel ?? null,
        career_context: payload.club_id ? 'Club context linked to this conversation' : null,
        consent_status: 'not_required',
        analyst_notes: [payload.summary, payload.detail].filter(Boolean).join('\n\n'),
        sensitivity: 'standard',
        processing_status: claims.length > 0 ? 'reviewing' : 'captured',
      })
      .select('id')
      .single()
    if (sessionError || !session) {
      await deleteInteraction(user.id, (interaction as { id: string }).id)
      return { ok: false, error: sessionError?.message ?? 'Failed to create the conversation record' }
    }

    if (coachId) {
      const { data: existingRelationship } = await supabase
        .from('contact_coach_relationships')
        .select('id')
        .eq('org_id', organizationId)
        .eq('contact_id', contactId)
        .eq('coach_id', coachId)
        .eq('relationship_type', 'representative_or_intermediary')
        .maybeSingle()
      if (!existingRelationship) {
        await supabase.from('contact_coach_relationships').insert({
          org_id: organizationId,
          created_by: user.id,
          contact_id: contactId,
          coach_id: coachId,
          club_id: payload.club_id ?? null,
          club_context: payload.club_id ? 'Conversation linked to club context' : 'General representation context',
          role_at_time: agentData.agency_name ? `Agent at ${agentData.agency_name}` : 'Agent / intermediary',
          relationship_type: 'representative_or_intermediary',
          stakeholder_group: 'agents',
          first_hand: true,
          independence_confirmed: false,
          proximity: 'direct',
          topic_credibility: payload.topic ? [payload.topic] : [],
          confidence: payload.reliability_score ?? payload.confidence ?? null,
          notes: 'Relationship captured from an agent interaction. Independence must be assessed during review.',
        })
      }
    }

    if (claims.length > 0 && coachId && currentCoach) {
      const rows: ProfileClaimInsert[] = claims.slice(0, 4).map((claim) => {
        const profileField = isClaimProfileField(claim.profile_field) ? claim.profile_field : null
        const claimType = PROFILE_CLAIM_TYPES.includes(claim.claim_type as (typeof PROFILE_CLAIM_TYPES)[number])
          ? claim.claim_type
          : 'other'
        const sensitivity = CLAIM_SENSITIVITIES.includes(claim.sensitivity as (typeof CLAIM_SENSITIVITIES)[number])
          ? claim.sensitivity ?? 'standard'
          : 'standard'
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
          contact_id: contactId,
          session_id: session.id,
          claim_type: claimType,
          profile_field: profileField,
          current_value: profileField && currentCoach[profileField] != null ? String(currentCoach[profileField]) : null,
          claimed_value: claim.claimed_value,
          evidence_summary: claim.evidence_summary,
          source_type: 'agent_conversation',
          source_name: sourceName || null,
          source_notes: payload.summary,
          source_tier: '2',
          confidence: claim.confidence ?? payload.confidence ?? null,
          sensitivity,
          verification_status: 'unverified',
          statement_type: 'opinion',
          evidence_strength: 'single_source',
          fact_check_status: 'not_applicable',
          external_visibility: 'anonymised_external',
          used_in_recommendation: false,
          review_status: 'pending',
          occurred_at: payload.occurred_at,
        }
      })
      const { error: claimError } = await supabase.from('profile_claims').insert(rows)
      if (claimError) {
        await supabase.from('intelligence_sessions').delete().eq('id', session.id)
        await deleteInteraction(user.id, (interaction as { id: string }).id)
        return { ok: false, error: claimError.message ?? 'Failed to add findings' }
      }
    }

    revalidatePath(`/agents/${payload.agent_id}`)
    revalidatePath(`/agents/${payload.agent_id}/interactions`)
    if (coachId) revalidatePath(`/coaches/${coachId}`)
    revalidatePath('/intelligence')
    revalidatePath('/intelligence/conversations')
    revalidatePath('/intelligence/review')
    revalidatePath('/network')
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
