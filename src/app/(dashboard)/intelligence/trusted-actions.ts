'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { canAssessCandidate, type AssessmentAccessClient } from '@/lib/assessment/access'
import { evidenceStrengthLabel } from '@/lib/intelligence/display'
import {
  BENCH_STAGES,
  CAMPAIGN_CONTACT_STAGES,
  CLAIM_REVIEW_STATUSES,
  EVIDENCE_STRENGTHS,
  EXTERNAL_VISIBILITIES,
  FACT_CHECK_STATUSES,
  METHODOLOGY_CRITERIA,
  STAKEHOLDER_GROUPS,
  STATEMENT_TYPES,
  calculateBenchEligibility,
  buildPromotionSnapshot,
  isAllowedValue,
  isClaimPromotable,
  normalizeClaimSafety,
  validateClaimRelationship,
  type BenchStage,
  type EvidenceStrength,
  type ExternalVisibility,
  type FactCheckStatus,
  type MethodologyCriterion,
  type StatementType,
} from '@/lib/intelligence/trusted-network'

type ActionResult = { ok: true; id?: string; message?: string } | { ok: false; error: string }

function text(value: FormDataEntryValue | null) {
  return String(value ?? '').trim()
}

function optionalText(value: FormDataEntryValue | null) {
  return text(value) || null
}

function stringArray(value: FormDataEntryValue | null) {
  return text(value).split(',').map((item) => item.trim()).filter(Boolean)
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function requireInternalContext() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) throw new Error('Internal organisation access is required')
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin', 'analyst'])
    .maybeSingle()
  if (!membership) throw new Error('Analyst access is required')
  return { supabase, db: supabase as any, user, organizationId }
}

async function ownsCoach(db: any, userId: string, coachId: string) {
  const { data } = await db.from('coaches').select('id').eq('id', coachId).eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

function revalidateCoach(coachId?: string | null) {
  if (!coachId) return
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath(`/coaches/${coachId}/intelligence`)
  revalidatePath('/coaches/bench')
}

export async function createFootballContactAction(formData: FormData): Promise<ActionResult> {
  try {
    const { db, user, organizationId } = await requireInternalContext()
    const fullName = text(formData.get('full_name'))
    if (!fullName) return { ok: false, error: 'Contact name is required.' }
    const email = optionalText(formData.get('email'))
    if (email) {
      const { data: duplicate } = await db.from('football_contacts').select('id').eq('org_id', organizationId).ilike('email', email).maybeSingle()
      if (duplicate) return { ok: false, error: 'A network contact already uses that email address.' }
    }
    const stakeholderGroup = text(formData.get('stakeholder_group')) || 'other'
    if (!isAllowedValue(STAKEHOLDER_GROUPS, stakeholderGroup)) return { ok: false, error: 'Unknown stakeholder group.' }
    const visibility = text(formData.get('default_attribution_permission')) || 'anonymised_external'
    if (!isAllowedValue(EXTERNAL_VISIBILITIES, visibility)) return { ok: false, error: 'Unknown attribution permission.' }
    const { data, error } = await db.from('football_contacts').insert({
      org_id: organizationId,
      created_by: user.id,
      relationship_owner_id: user.id,
      full_name: fullName,
      current_role_title: optionalText(formData.get('current_role')),
      current_organization: optionalText(formData.get('current_organization')),
      email,
      phone: optionalText(formData.get('phone')),
      preferred_channel: optionalText(formData.get('preferred_channel')),
      stakeholder_group: stakeholderGroup,
      expertise: stringArray(formData.get('expertise')),
      reliability_score: optionalNumber(formData.get('reliability_score')),
      conflicts: optionalText(formData.get('conflicts')),
      default_attribution_permission: visibility,
      next_follow_up_at: optionalText(formData.get('next_follow_up_at')),
      follow_up_note: optionalText(formData.get('follow_up_note')),
      retention_review_at: optionalText(formData.get('retention_review_at')),
    }).select('id').single()
    if (error) return { ok: false, error: error.message }
    revalidatePath('/network')
    return { ok: true, id: data.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to create contact.' }
  }
}

export async function createContactCoachRelationshipAction(formData: FormData): Promise<ActionResult> {
  try {
    const { db, user, organizationId } = await requireInternalContext()
    const contactId = text(formData.get('contact_id'))
    const coachId = text(formData.get('coach_id'))
    const relationshipType = text(formData.get('relationship_type'))
    if (!contactId || !coachId || !relationshipType) return { ok: false, error: 'Contact, coach and relationship are required.' }
    if (!(await ownsCoach(db, user.id, coachId))) return { ok: false, error: 'Coach not found.' }
    const { data: contact } = await db.from('football_contacts').select('id').eq('id', contactId).eq('org_id', organizationId).maybeSingle()
    if (!contact) return { ok: false, error: 'Contact not found.' }
    const stakeholderGroup = text(formData.get('stakeholder_group')) || 'other'
    if (!isAllowedValue(STAKEHOLDER_GROUPS, stakeholderGroup)) return { ok: false, error: 'Unknown stakeholder group.' }
    const { data, error } = await db.from('contact_coach_relationships').insert({
      org_id: organizationId,
      created_by: user.id,
      contact_id: contactId,
      coach_id: coachId,
      club_context: optionalText(formData.get('club_context')),
      role_at_time: optionalText(formData.get('role_at_time')),
      relationship_type: relationshipType,
      stakeholder_group: stakeholderGroup,
      started_on: optionalText(formData.get('started_on')),
      ended_on: optionalText(formData.get('ended_on')),
      first_hand: formData.get('first_hand') !== 'false',
      independence_confirmed: formData.get('independence_confirmed') === 'true',
      proximity: text(formData.get('proximity')) || 'direct',
      topic_credibility: stringArray(formData.get('topic_credibility')),
      confidence: optionalNumber(formData.get('confidence')),
      conflict_notes: optionalText(formData.get('conflict_notes')),
      notes: optionalText(formData.get('notes')),
    }).select('id').single()
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/network/${contactId}`)
    revalidateCoach(coachId)
    return { ok: true, id: data.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to link contact and coach.' }
  }
}

export type DraftClaimInput = {
  claimedValue: string
  evidenceSummary: string
  statementType: StatementType
  evidenceStrength: EvidenceStrength
  factCheckStatus: FactCheckStatus
  externalVisibility: ExternalVisibility
  criteria: MethodologyCriterion[]
  confidence?: number | null
  transcriptExcerpt?: string | null
}

export async function createIntelligenceSessionAction(input: {
  title: string
  contactId?: string | null
  coachId?: string | null
  intakeMethod: string
  occurredAt?: string | null
  channel?: string | null
  careerContext?: string | null
  consentStatus?: string | null
  transcriptText?: string | null
  transcriptStoragePath?: string | null
  analystNotes?: string | null
  sensitivity?: string | null
  claims: DraftClaimInput[]
}): Promise<ActionResult> {
  try {
    const { db, user, organizationId } = await requireInternalContext()
    if (!input.title.trim()) return { ok: false, error: 'Conversation title is required.' }
    const allowedMethods = ['analyst_notes', 'pasted_transcript', 'transcript_document', 'audio_recording', 'video_recording']
    if (!allowedMethods.includes(input.intakeMethod)) return { ok: false, error: 'Unknown intake method.' }
    if (['audio_recording', 'video_recording'].includes(input.intakeMethod) && process.env.INTELLIGENCE_RECORDINGS_ENABLED !== 'true') {
      return { ok: false, error: 'Recording uploads are disabled until governance approval is documented.' }
    }
    if (input.coachId && !(await ownsCoach(db, user.id, input.coachId))) return { ok: false, error: 'Coach not found.' }
    if (input.contactId) {
      const { data: contact } = await db.from('football_contacts').select('id').eq('id', input.contactId).eq('org_id', organizationId).maybeSingle()
      if (!contact) return { ok: false, error: 'Contact not found.' }
    }
    const { data: session, error: sessionError } = await db.from('intelligence_sessions').insert({
      org_id: organizationId,
      created_by: user.id,
      contact_id: input.contactId || null,
      coach_id: input.coachId || null,
      title: input.title.trim(),
      intake_method: input.intakeMethod,
      occurred_at: input.occurredAt || new Date().toISOString(),
      channel: input.channel?.trim() || null,
      career_context: input.careerContext?.trim() || null,
      consent_status: input.consentStatus || 'not_required',
      transcript_text: input.transcriptText?.trim() || null,
      transcript_storage_path: input.transcriptStoragePath || null,
      analyst_notes: input.analystNotes?.trim() || null,
      sensitivity: input.sensitivity || 'standard',
      processing_status: 'reviewing',
    }).select('id').single()
    if (sessionError) return { ok: false, error: sessionError.message }

    const validClaims = input.claims.filter((claim) => claim.claimedValue.trim() && claim.evidenceSummary.trim())
    if (validClaims.length && !input.coachId) return { ok: false, error: 'Link a coach before creating draft findings.' }
    if (validClaims.length) {
      const rows = validClaims.map((claim) => {
        const safety = normalizeClaimSafety({
          statementType: claim.statementType,
          evidenceStrength: claim.evidenceStrength,
          factCheckStatus: claim.factCheckStatus,
          externalVisibility: claim.externalVisibility,
          usedInRecommendation: true,
        } as Parameters<typeof normalizeClaimSafety>[0] & { evidenceStrength: EvidenceStrength })
        return {
          user_id: user.id,
          org_id: organizationId,
          created_by: user.id,
          entity_type: 'coach',
          entity_id: input.coachId,
          coach_id: input.coachId,
          contact_id: input.contactId || null,
          session_id: session.id,
          claim_type: 'trusted_network',
          claimed_value: claim.claimedValue.trim(),
          evidence_summary: claim.evidenceSummary.trim(),
          source_type: 'trusted_network_conversation',
          source_name: null,
          source_notes: input.careerContext?.trim() || null,
          confidence: claim.confidence ?? null,
          sensitivity: input.sensitivity === 'legal_review' ? 'confidential' : input.sensitivity || 'standard',
          verification_status: claim.evidenceStrength === 'disputed' ? 'disputed' : 'unverified',
          review_status: 'pending',
          statement_type: safety.statementType,
          evidence_strength: claim.evidenceStrength,
          fact_check_status: safety.factCheckStatus,
          external_visibility: safety.externalVisibility,
          transcript_excerpt: claim.transcriptExcerpt?.trim() || null,
          methodology_criteria: claim.criteria.filter((criterion) => isAllowedValue(METHODOLOGY_CRITERIA, criterion)),
          used_in_recommendation: safety.usedInRecommendation,
          occurred_at: input.occurredAt || new Date().toISOString(),
        }
      })
      const { error: claimError } = await db.from('profile_claims').insert(rows)
      if (claimError) {
        await db.from('intelligence_sessions').update({ processing_status: 'failed', failure_reason: claimError.message }).eq('id', session.id)
        return { ok: false, error: `Conversation saved, but finding drafts failed: ${claimError.message}` }
      }
    }
    revalidatePath('/intelligence/conversations')
    revalidatePath('/intelligence/review')
    revalidateCoach(input.coachId)
    return { ok: true, id: session.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to save conversation.' }
  }
}

export async function reviewTrustedClaimAction(input: {
  claimId: string
  reviewStatus: string
  claimedValue?: string
  evidenceSummary?: string
  statementType?: string
  evidenceStrength?: string
  factCheckStatus?: string
  externalVisibility?: string
  criteria?: string[]
}): Promise<ActionResult> {
  try {
    const { db, user, organizationId } = await requireInternalContext()
    if (!isAllowedValue(CLAIM_REVIEW_STATUSES, input.reviewStatus)) return { ok: false, error: 'Unknown review status.' }
    const { data: claim } = await db.from('profile_claims').select('*').eq('id', input.claimId).eq('org_id', organizationId).maybeSingle()
    if (!claim) return { ok: false, error: 'Claim not found.' }
    const statementType = isAllowedValue(STATEMENT_TYPES, input.statementType) ? input.statementType : claim.statement_type
    const evidenceStrength = isAllowedValue(EVIDENCE_STRENGTHS, input.evidenceStrength) ? input.evidenceStrength : claim.evidence_strength
    const factCheckStatus = isAllowedValue(FACT_CHECK_STATUSES, input.factCheckStatus) ? input.factCheckStatus : claim.fact_check_status
    const externalVisibility = isAllowedValue(EXTERNAL_VISIBILITIES, input.externalVisibility) ? input.externalVisibility : claim.external_visibility
    const safety = normalizeClaimSafety({
      statementType,
      factCheckStatus,
      externalVisibility,
      usedInRecommendation: claim.used_in_recommendation,
    })
    const now = new Date().toISOString()
    const { error } = await db.from('profile_claims').update({
      claimed_value: input.claimedValue?.trim() || claim.claimed_value,
      evidence_summary: input.evidenceSummary?.trim() || claim.evidence_summary,
      review_status: input.reviewStatus,
      statement_type: safety.statementType,
      evidence_strength: evidenceStrength,
      fact_check_status: safety.factCheckStatus,
      external_visibility: safety.externalVisibility,
      methodology_criteria: (input.criteria ?? claim.methodology_criteria ?? []).filter((criterion: string) => isAllowedValue(METHODOLOGY_CRITERIA, criterion)),
      used_in_recommendation: safety.usedInRecommendation,
      verification_status: evidenceStrength === 'disputed' ? 'disputed' : input.reviewStatus === 'accepted' ? 'verified' : claim.verification_status,
      reviewed_at: input.reviewStatus === 'pending' ? null : now,
      reviewed_by: input.reviewStatus === 'pending' ? null : user.email ?? user.id,
      updated_at: now,
    }).eq('id', input.claimId).eq('org_id', organizationId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/intelligence/review')
    revalidatePath('/intelligence/conversations')
    revalidateCoach(claim.coach_id)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to review claim.' }
  }
}

export async function splitTrustedClaimAction(input: {
  claimId: string
  parts: Array<{ claimedValue: string; evidenceSummary: string }>
}): Promise<ActionResult> {
  try {
    const { db, user, organizationId } = await requireInternalContext()
    const parts = input.parts.filter((part) => part.claimedValue.trim() && part.evidenceSummary.trim())
    if (parts.length < 2) return { ok: false, error: 'A split needs at least two complete claims.' }
    const { data: claim } = await db.from('profile_claims').select('*').eq('id', input.claimId).eq('org_id', organizationId).maybeSingle()
    if (!claim) return { ok: false, error: 'Claim not found.' }
    const rows = parts.map((part) => ({
      ...claim,
      id: undefined,
      claimed_value: part.claimedValue.trim(),
      evidence_summary: part.evidenceSummary.trim(),
      review_status: 'pending',
      verification_status: 'unverified',
      reviewed_at: null,
      reviewed_by: null,
      applied_at: null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
    const { error } = await db.from('profile_claims').insert(rows)
    if (error) return { ok: false, error: error.message }
    await db.from('profile_claims').update({ review_status: 'rejected', source_notes: [claim.source_notes, 'Split into narrower finding drafts.'].filter(Boolean).join('\n'), updated_at: new Date().toISOString() }).eq('id', claim.id)
    revalidatePath('/intelligence/review')
    revalidateCoach(claim.coach_id)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to split claim.' }
  }
}

export async function mergeTrustedClaimsAction(input: {
  sourceClaimId: string
  targetClaimId: string
  claimedValue: string
  evidenceSummary: string
}): Promise<ActionResult> {
  try {
    const { db, user, organizationId } = await requireInternalContext()
    if (input.sourceClaimId === input.targetClaimId) return { ok: false, error: 'Select two different claims to merge.' }
    if (!input.claimedValue.trim() || !input.evidenceSummary.trim()) return { ok: false, error: 'Merged claim and evidence summary are required.' }
    const { data: claims } = await db.from('profile_claims').select('*').eq('org_id', organizationId).in('id', [input.sourceClaimId, input.targetClaimId])
    if ((claims ?? []).length !== 2) return { ok: false, error: 'Both claims must belong to this organisation.' }
    const source = claims.find((claim: any) => claim.id === input.sourceClaimId)
    const target = claims.find((claim: any) => claim.id === input.targetClaimId)
    if (source.coach_id !== target.coach_id) return { ok: false, error: 'Only claims about the same coach can be merged.' }
    const now = new Date().toISOString()
    const { data: merged, error } = await db.from('profile_claims').insert({
      user_id: user.id,
      org_id: organizationId,
      created_by: user.id,
      entity_type: source.entity_type,
      entity_id: source.entity_id,
      coach_id: source.coach_id,
      contact_id: source.contact_id,
      session_id: source.session_id,
      claim_type: source.claim_type,
      claimed_value: input.claimedValue.trim(),
      evidence_summary: input.evidenceSummary.trim(),
      source_type: 'analyst_merged_claim',
      source_notes: `Merged from claims ${source.id} and ${target.id}`,
      confidence: Math.min(source.confidence ?? 100, target.confidence ?? 100),
      sensitivity: source.sensitivity === 'confidential' || target.sensitivity === 'confidential' ? 'confidential' : source.sensitivity,
      verification_status: 'unverified',
      review_status: 'pending',
      statement_type: source.statement_type,
      evidence_strength: source.evidence_strength === 'disputed' || target.evidence_strength === 'disputed' ? 'disputed' : 'corroborated',
      fact_check_status: source.fact_check_status === 'requires_legal' || target.fact_check_status === 'requires_legal' ? 'requires_legal' : source.fact_check_status,
      external_visibility: source.external_visibility === 'internal_only' || target.external_visibility === 'internal_only' ? 'internal_only' : 'anonymised_external',
      methodology_criteria: Array.from(new Set([...(source.methodology_criteria ?? []), ...(target.methodology_criteria ?? [])])),
      used_in_recommendation: false,
      occurred_at: source.occurred_at,
    }).select('id').single()
    if (error) return { ok: false, error: error.message }
    await Promise.all([
      db.from('profile_claims').update({ review_status: 'rejected', updated_at: now }).in('id', [source.id, target.id]).eq('org_id', organizationId),
      db.from('claim_relationships').insert([
        { org_id: organizationId, created_by: user.id, source_claim_id: merged.id, target_claim_id: source.id, relationship_type: 'supersedes', rationale: 'Analyst merged overlapping claims', reviewed_by: user.id, reviewed_at: now },
        { org_id: organizationId, created_by: user.id, source_claim_id: merged.id, target_claim_id: target.id, relationship_type: 'supersedes', rationale: 'Analyst merged overlapping claims', reviewed_by: user.id, reviewed_at: now },
      ]),
    ])
    revalidatePath('/intelligence/review')
    revalidateCoach(source.coach_id)
    return { ok: true, id: merged.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to merge claims.' }
  }
}

export async function createClaimRelationshipAction(formData: FormData): Promise<ActionResult> {
  try {
    const { db, user, organizationId } = await requireInternalContext()
    const sourceClaimId = text(formData.get('source_claim_id'))
    const targetClaimId = text(formData.get('target_claim_id'))
    const relationshipType = text(formData.get('relationship_type'))
    const validation = validateClaimRelationship(sourceClaimId, targetClaimId, relationshipType)
    if (validation) return { ok: false, error: validation }
    const { data: claims } = await db.from('profile_claims').select('id').eq('org_id', organizationId).in('id', [sourceClaimId, targetClaimId])
    if ((claims ?? []).length !== 2) return { ok: false, error: 'Both claims must belong to this organisation.' }
    const { data, error } = await db.from('claim_relationships').insert({
      org_id: organizationId,
      created_by: user.id,
      source_claim_id: sourceClaimId,
      target_claim_id: targetClaimId,
      relationship_type: relationshipType,
      rationale: text(formData.get('rationale')) || 'Analyst-reviewed relationship',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }).select('id').single()
    if (error) return { ok: false, error: error.message }
    revalidatePath('/intelligence/review')
    return { ok: true, id: data.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to link claims.' }
  }
}

export async function createReferenceCampaignAction(formData: FormData): Promise<ActionResult> {
  try {
    const { db, user, organizationId } = await requireInternalContext()
    const coachId = text(formData.get('coach_id'))
    const title = text(formData.get('title'))
    if (!title || !coachId) return { ok: false, error: 'Campaign title and coach are required.' }
    if (!(await ownsCoach(db, user.id, coachId))) return { ok: false, error: 'Coach not found.' }
    const { data, error } = await db.from('reference_campaigns').insert({
      org_id: organizationId,
      created_by: user.id,
      owner_id: user.id,
      coach_id: coachId,
      mandate_id: optionalText(formData.get('mandate_id')),
      title,
      status: text(formData.get('status')) || 'draft',
      target_stakeholder_groups: stringArray(formData.get('target_stakeholder_groups')).filter((group) => isAllowedValue(STAKEHOLDER_GROUPS, group)),
      selected_question_keys: stringArray(formData.get('selected_question_keys')),
      evidence_gap: optionalText(formData.get('evidence_gap')),
      next_action: optionalText(formData.get('next_action')),
      next_review_at: optionalText(formData.get('next_review_at')),
    }).select('id').single()
    if (error) return { ok: false, error: error.message }
    revalidateCoach(coachId)
    revalidatePath('/network')
    return { ok: true, id: data.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to create campaign.' }
  }
}

export async function addReferenceCampaignContactAction(formData: FormData): Promise<ActionResult> {
  try {
    const { db, user, organizationId } = await requireInternalContext()
    const campaignId = text(formData.get('campaign_id'))
    const status = text(formData.get('status')) || 'planned'
    if (!campaignId || !isAllowedValue(CAMPAIGN_CONTACT_STAGES, status)) return { ok: false, error: 'Campaign and valid status are required.' }
    const { data: campaign } = await db.from('reference_campaigns').select('id, coach_id').eq('id', campaignId).eq('org_id', organizationId).maybeSingle()
    if (!campaign) return { ok: false, error: 'Campaign not found.' }
    const stakeholderGroup = text(formData.get('stakeholder_group')) || 'other'
    if (!isAllowedValue(STAKEHOLDER_GROUPS, stakeholderGroup)) return { ok: false, error: 'Unknown stakeholder group.' }
    const { data, error } = await db.from('reference_campaign_contacts').insert({
      org_id: organizationId,
      created_by: user.id,
      campaign_id: campaignId,
      contact_id: optionalText(formData.get('contact_id')),
      prospect_name: optionalText(formData.get('prospect_name')),
      prospect_role: optionalText(formData.get('prospect_role')),
      stakeholder_group: stakeholderGroup,
      status,
      selected_question_keys: stringArray(formData.get('selected_question_keys')),
      evidence_gap: optionalText(formData.get('evidence_gap')),
      next_action: optionalText(formData.get('next_action')),
      scheduled_at: optionalText(formData.get('scheduled_at')),
    }).select('id').single()
    if (error) return { ok: false, error: error.message }
    revalidateCoach(campaign.coach_id)
    return { ok: true, id: data.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to add campaign contact.' }
  }
}

async function loadBenchEligibility(db: any, organizationId: string, coachId: string) {
  const [{ data: claims }, { data: relationships }, { data: entry }] = await Promise.all([
    db.from('profile_claims').select('id, contact_id, methodology_criteria, fact_check_status, review_status, reviewed_at').eq('org_id', organizationId).eq('coach_id', coachId).in('review_status', ['accepted', 'applied']).is('deleted_at', null),
    db.from('contact_coach_relationships').select('contact_id, stakeholder_group, first_hand, independence_confirmed').eq('org_id', organizationId).eq('coach_id', coachId),
    db.from('trusted_bench_entries').select('*').eq('org_id', organizationId).eq('coach_id', coachId).maybeSingle(),
  ])
  const claimRows = claims ?? []
  const relationshipRows = relationships ?? []
  const covered = new Set(claimRows.flatMap((claim: any) => claim.methodology_criteria ?? []))
  const groups = new Set(relationshipRows.map((row: any) => row.stakeholder_group))
  const sources = new Set(relationshipRows.filter((row: any) => row.independence_confirmed).map((row: any) => row.contact_id))
  const lastReviewedAt = claimRows.map((claim: any) => claim.reviewed_at).filter(Boolean).sort().at(-1) ?? null
  return calculateBenchEligibility({
    acceptedClaims: claimRows.length,
    firstHandRecommendationCount: relationshipRows.filter((row: any) => row.first_hand).length,
    independentSourceCount: sources.size,
    stakeholderGroups: groups.size,
    criteriaCovered: covered.size,
    unresolvedLegalItems: claimRows.filter((claim: any) => claim.fact_check_status === 'requires_legal').length,
    lastReviewedAt,
    availabilityReviewedAt: entry?.availability_reviewed_at ?? null,
    contractReviewedAt: entry?.contract_reviewed_at ?? null,
    staffReviewedAt: entry?.staff_reviewed_at ?? null,
    workPermitReviewedAt: entry?.work_permit_reviewed_at ?? null,
  })
}

export async function upsertTrustedBenchEntryAction(formData: FormData): Promise<ActionResult> {
  try {
    const { db, user, organizationId } = await requireInternalContext()
    const coachId = text(formData.get('coach_id'))
    const stage = text(formData.get('stage')) as BenchStage
    if (!coachId || !isAllowedValue(BENCH_STAGES, stage)) return { ok: false, error: 'Coach and valid bench stage are required.' }
    if (formData.get('analyst_confirmed') !== 'true') return { ok: false, error: 'An analyst must confirm every stage change.' }
    if (!(await ownsCoach(db, user.id, coachId))) return { ok: false, error: 'Coach not found.' }
    const eligibility = await loadBenchEligibility(db, organizationId, coachId)
    if (stage === 'vetted' && !eligibility.vetted) return { ok: false, error: `Vetted gate incomplete: ${eligibility.vettedMissing.join(', ')}.` }
    if (stage === 'placement_ready' && !eligibility.placementReady) return { ok: false, error: `Placement-ready gate incomplete: ${eligibility.placementMissing.join(', ')}.` }
    const now = new Date().toISOString()
    const { data, error } = await db.from('trusted_bench_entries').upsert({
      org_id: organizationId,
      created_by: user.id,
      coach_id: coachId,
      stage,
      rationale: optionalText(formData.get('rationale')),
      nomination_source_contact_id: optionalText(formData.get('nomination_source_contact_id')),
      stage_confirmed_by: user.id,
      stage_confirmed_at: now,
      last_reviewed_at: now,
      next_review_at: optionalText(formData.get('next_review_at')),
      availability_reviewed_at: optionalText(formData.get('availability_reviewed_at')),
      contract_reviewed_at: optionalText(formData.get('contract_reviewed_at')),
      staff_reviewed_at: optionalText(formData.get('staff_reviewed_at')),
      work_permit_reviewed_at: optionalText(formData.get('work_permit_reviewed_at')),
      updated_at: now,
    }, { onConflict: 'org_id,coach_id' }).select('id').single()
    if (error) return { ok: false, error: error.message }
    revalidateCoach(coachId)
    return { ok: true, id: data.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to update Trusted Bench.' }
  }
}

export async function promoteClaimToAssessmentAction(input: {
  claimId: string
  mandateId: string
  coachId: string
  criterion: string
}): Promise<ActionResult> {
  try {
    const { supabase, db, user, organizationId } = await requireInternalContext()
    if (!isAllowedValue(METHODOLOGY_CRITERIA, input.criterion)) return { ok: false, error: 'Unknown methodology criterion.' }
    const canAssess = await canAssessCandidate(supabase as unknown as AssessmentAccessClient, user.id, input.mandateId, input.coachId)
    if (!canAssess) return { ok: false, error: 'Candidate is not on this mandate shortlist.' }
    const { data: claim } = await db.from('profile_claims').select('*').eq('id', input.claimId).eq('org_id', organizationId).eq('coach_id', input.coachId).maybeSingle()
    if (!claim) return { ok: false, error: 'Claim not found.' }
    if (!isClaimPromotable({
      reviewStatus: claim.review_status,
      statementType: claim.statement_type,
      factCheckStatus: claim.fact_check_status,
      externalVisibility: claim.external_visibility,
      restrictionStatus: claim.restriction_status,
    })) return { ok: false, error: 'Only accepted, externally usable, non-legal claims can be promoted.' }
    const { data: relationship } = claim.contact_id
      ? await db.from('contact_coach_relationships').select('stakeholder_group, role_at_time, proximity, first_hand').eq('org_id', organizationId).eq('contact_id', claim.contact_id).eq('coach_id', input.coachId).limit(1).maybeSingle()
      : { data: null }
    const sourceRole = relationship?.role_at_time || relationship?.stakeholder_group || 'trusted football source'
    const sourceLabel = `Anonymised ${String(sourceRole).replaceAll('_', ' ')} · ${relationship?.proximity || 'source proximity recorded'} · ${evidenceStrengthLabel(claim.evidence_strength)}`
    const snapshot = buildPromotionSnapshot({
      claimText: claim.claimed_value,
      evidenceSummary: claim.evidence_summary,
      sourceRole,
      proximity: relationship?.proximity ?? null,
      firstHand: relationship?.first_hand ?? null,
      externalVisibility: claim.external_visibility,
      evidenceStrength: claim.evidence_strength,
      statementType: claim.statement_type,
      reviewedAt: claim.reviewed_at,
      capturedAt: new Date().toISOString(),
    })
    const { data, error } = await db.from('assessment_evidence').upsert({
      user_id: user.id,
      mandate_id: input.mandateId,
      coach_id: input.coachId,
      criterion: input.criterion,
      method: 'references',
      title: claim.claimed_value,
      detail: claim.evidence_summary,
      source: sourceLabel,
      confidence: claim.confidence,
      verification_status: claim.evidence_strength === 'disputed' ? 'disputed' : 'verified',
      used_in_recommendation: true,
      origin_profile_claim_id: claim.id,
      origin_intelligence_session_id: claim.session_id,
      provenance_snapshot: snapshot,
      promoted_by: user.id,
      promoted_at: new Date().toISOString(),
    }, { onConflict: 'mandate_id,coach_id,criterion,origin_profile_claim_id' }).select('id').single()
    if (error) return { ok: false, error: error.message }
    await db.from('profile_claims').update({ review_status: 'applied', updated_at: new Date().toISOString() }).eq('id', claim.id).eq('org_id', organizationId)
    revalidatePath(`/mandates/${input.mandateId}/assessment`)
    revalidatePath(`/mandates/${input.mandateId}/assessment/${input.coachId}`)
    revalidatePath(`/mandates/${input.mandateId}/assessment/${input.coachId}/board-pack`)
    revalidateCoach(input.coachId)
    return { ok: true, id: data.id, message: 'Finding added to the assessment with a frozen provenance snapshot.' }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to promote claim.' }
  }
}

export async function restrictIntelligenceRecordAction(input: {
  table: 'football_contacts' | 'intelligence_sessions' | 'profile_claims'
  id: string
  reason: string
}): Promise<ActionResult> {
  try {
    const { db, organizationId } = await requireInternalContext()
    const field = input.table === 'profile_claims' ? 'restriction_status' : 'correction_status'
    const { error } = await db.from(input.table).update({
      [field]: 'restricted',
      deletion_reason: input.table === 'profile_claims' ? input.reason.trim() || 'Restricted after correction request' : undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', input.id).eq('org_id', organizationId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/network')
    revalidatePath('/intelligence/conversations')
    revalidatePath('/intelligence/review')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to restrict intelligence.' }
  }
}
