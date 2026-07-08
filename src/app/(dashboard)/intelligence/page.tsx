import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ASSESSMENT_CRITERIA, criterionLabel, methodLabel } from '@/lib/assessment/criteria'
import { claimFieldLabel, claimTypeLabel } from '@/lib/profile-claims'
import { CombinedFeed } from './_components/combined-feed'
import type { IntelFeedItem } from './_components/combined-feed'
import { displayClubName } from '@/lib/display-names'

function safeDate(value: string | null | undefined, fallback: string | null | undefined) {
  return value ?? fallback ?? new Date().toISOString()
}

function sourceTierLabel(value: string | null | undefined) {
  if (!value) return null
  return value.startsWith('T') ? value : `T${value}`
}

function confidenceFromVerification(status: string | null | undefined, fallback?: number | null) {
  if (fallback != null) return fallback
  if (status === 'verified') return 80
  if (status === 'disputed') return 25
  return null
}

function assessmentOriginHref(mandateId: string, coachId: string, criterion: string, params: Record<string, string>) {
  const search = new URLSearchParams({ criterion, ...params })
  return `/mandates/${mandateId}/assessment/${coachId}?${search.toString()}`
}

export default async function IntelligencePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    intelRes,
    interRes,
    claimsRes,
    assessmentEvidenceRes,
    interviewsRes,
    referencesRes,
    materialsRes,
    portalProfilesRes,
    coachesRes,
    agentsRes,
    clubsRes,
    mandatesRes,
  ] = await Promise.all([
    supabase
      .from('intelligence_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(200),
    supabase
      .from('agent_interactions')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(200),
    supabase
      .from('profile_claims')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('assessment_evidence')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('candidate_interview_answers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('candidate_reference_answers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('coach_private_materials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('coach_portal_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(200),
    supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
    supabase.from('agents').select('id, full_name, agency_name').eq('user_id', user.id).order('full_name'),
    supabase.from('clubs').select('id, name').eq('user_id', user.id).order('name'),
    supabase.from('mandates').select('id, custom_club_name, clubs(name)').eq('user_id', user.id).limit(100),
  ])

  const coaches = (coachesRes.data ?? []).map((c) => ({ id: c.id, name: (c as { name: string }).name }))
  const coachMap = new Map(coaches.map((c) => [c.id, c.name]))

  const agents = (agentsRes.data ?? []).map((a) => ({
    id: a.id,
    name: ((a as { full_name?: string | null; agency_name?: string | null }).full_name ?? (a as { agency_name?: string | null }).agency_name ?? 'Agent'),
  }))
  const agentMap = new Map(agents.map((a) => [a.id, a.name]))

  const clubs = (clubsRes.data ?? []).map((c) => ({ id: c.id, name: (c as { name: string }).name }))
  const clubMap = new Map(clubs.map((c) => [c.id, c.name]))

  const mandates = (mandatesRes.data ?? []).map((m) => {
    const clubName = (m.clubs as { name?: string } | null)?.name
    return { id: m.id, label: displayClubName(m.custom_club_name, clubName, m.id) }
  })
  const mandateMap = new Map(mandates.map((m) => [m.id, m.label]))

  const intelItems: IntelFeedItem[] = (intelRes.data ?? []).map((item) => ({
    id: item.id,
    kind: 'intel',
    lane: 'Manual intelligence',
    occurred_at: safeDate(item.occurred_at, item.created_at),
    title: item.title,
    detail: item.detail,
    category: item.category,
    direction: item.direction,
    sensitivity: item.sensitivity,
    confidence: item.confidence,
    source_tier: sourceTierLabel(item.source_tier),
    source_name: item.source_name,
    source_type: item.source_type,
    verified: item.verified,
    entity_type: item.entity_type,
    entity_id: item.entity_id,
    mandate_id: item.mandate_id,
    entity_name: item.entity_type === 'coach' ? coachMap.get(item.entity_id) ?? item.entity_id
      : item.entity_type === 'club' ? clubMap.get(item.entity_id) ?? item.entity_id
      : mandateMap.get(item.entity_id) ?? item.entity_id,
    mandate_label: item.mandate_id ? mandateMap.get(item.mandate_id) ?? null : null,
    coach_id: item.entity_type === 'coach' ? item.entity_id : null,
    coach_name: item.entity_type === 'coach' ? coachMap.get(item.entity_id) ?? null : null,
    origin_table: 'intelligence_items',
    origin_label: 'Manual intelligence note',
    origin_href: item.entity_type === 'coach'
      ? `/coaches/${item.entity_id}/intelligence?entry=${item.id}`
      : item.entity_type === 'club'
        ? `/clubs/${item.entity_id}`
        : item.entity_type === 'mandate'
          ? `/mandates/${item.entity_id}`
          : '/intelligence',
    commercial_surfaces: ['Coach profile', 'Mandate shortlist', 'Head Coach Assessment Pack'],
  }))

  const interactionItems: IntelFeedItem[] = (interRes.data ?? []).map((item) => ({
    id: item.id,
    kind: 'interaction',
    lane: 'Agent conversations',
    occurred_at: safeDate(item.occurred_at, item.created_at),
    title: item.summary,
    summary: item.summary,
    detail: item.detail,
    topic: item.topic,
    category: item.topic,
    direction: item.direction,
    sentiment: item.sentiment,
    interaction_type: item.interaction_type,
    channel: item.channel,
    confidence: item.confidence,
    reliability_score: item.reliability_score,
    influence_score: item.influence_score,
    follow_up_date: item.follow_up_date,
    agent_id: item.agent_id,
    agent_name: agentMap.get(item.agent_id) ?? 'Agent',
    coach_id: item.coach_id,
    coach_name: item.coach_id ? coachMap.get(item.coach_id) ?? null : null,
    club_id: item.club_id,
    club_name: item.club_id ? clubMap.get(item.club_id) ?? null : null,
    source_name: agentMap.get(item.agent_id) ?? 'Agent',
    source_type: item.channel ?? 'Agent conversation',
    origin_table: 'agent_interactions',
    origin_label: 'Agent interaction',
    origin_href: `/agents/${item.agent_id}/interactions?entry=${item.id}`,
    commercial_surfaces: ['Coach profile', 'Private feasibility', 'Confidential access'],
  }))

  const claimItems: IntelFeedItem[] = (claimsRes.data ?? []).map((claim) => ({
    id: claim.id,
    kind: 'claim',
    lane: 'Source-backed claims',
    occurred_at: safeDate(claim.occurred_at, claim.created_at),
    title: `${claimTypeLabel(claim.claim_type)}: ${claimFieldLabel(claim.profile_field)}`,
    detail: claim.evidence_summary || claim.claimed_value,
    category: claimTypeLabel(claim.claim_type),
    sensitivity: claim.sensitivity,
    confidence: claim.confidence,
    source_tier: sourceTierLabel(claim.source_tier),
    source_name: claim.source_name,
    source_type: claim.source_type,
    verification_status: claim.verification_status,
    review_status: claim.review_status,
    used_in_recommendation: claim.used_in_recommendation,
    verified: claim.verification_status === 'verified',
    entity_type: claim.entity_type,
    entity_id: claim.entity_id,
    coach_id: claim.coach_id,
    coach_name: claim.coach_id ? coachMap.get(claim.coach_id) ?? null : null,
    agent_id: claim.agent_id ?? undefined,
    agent_name: claim.agent_id ? agentMap.get(claim.agent_id) ?? null : null,
    origin_table: 'profile_claims',
    origin_label: 'Profile claim',
    origin_href: claim.interaction_id && claim.agent_id
      ? `/agents/${claim.agent_id}/interactions?entry=${claim.interaction_id}`
      : claim.coach_id
        ? `/coaches/${claim.coach_id}#claim-${claim.id}`
        : '/intelligence',
    commercial_surfaces: ['Coach profile', 'Appointment feasibility', 'Head Coach Assessment Pack'],
  }))

  const assessmentItems: IntelFeedItem[] = (assessmentEvidenceRes.data ?? []).map((evidence) => ({
    id: evidence.id,
    kind: 'assessment_evidence',
    lane: 'Assessment evidence',
    occurred_at: evidence.created_at,
    title: evidence.title,
    detail: evidence.detail,
    category: criterionLabel(evidence.criterion),
    confidence: evidence.confidence,
    source_name: evidence.source,
    source_type: methodLabel(evidence.method),
    verification_status: evidence.verification_status,
    used_in_recommendation: evidence.used_in_recommendation,
    verified: evidence.verification_status === 'verified',
    criterion: evidence.criterion,
    criterion_label: criterionLabel(evidence.criterion),
    method: evidence.method,
    method_label: methodLabel(evidence.method),
    coach_id: evidence.coach_id,
    coach_name: coachMap.get(evidence.coach_id) ?? null,
    mandate_id: evidence.mandate_id,
    mandate_label: mandateMap.get(evidence.mandate_id) ?? null,
    origin_table: 'assessment_evidence',
    origin_label: 'Assessment evidence',
    origin_href: assessmentOriginHref(evidence.mandate_id, evidence.coach_id, evidence.criterion, { evidence: evidence.id }),
    commercial_surfaces: ['Assessment workspace', 'Coverage heatmap', 'Head Coach Assessment Pack'],
  }))

  const interviewItems: IntelFeedItem[] = (interviewsRes.data ?? []).map((answer) => ({
    id: answer.id,
    kind: 'interview',
    lane: 'Candidate interviews',
    occurred_at: answer.created_at,
    title: answer.question,
    detail: answer.answer,
    category: criterionLabel(answer.criterion),
    confidence: answer.confidence,
    source_name: answer.interviewer,
    source_type: 'Candidate interview',
    verification_status: answer.verification_status,
    used_in_recommendation: answer.used_in_recommendation,
    verified: answer.verification_status === 'verified',
    criterion: answer.criterion,
    criterion_label: criterionLabel(answer.criterion),
    method: 'candidate_interview',
    method_label: methodLabel('candidate_interview'),
    coach_id: answer.coach_id,
    coach_name: coachMap.get(answer.coach_id) ?? null,
    mandate_id: answer.mandate_id,
    mandate_label: mandateMap.get(answer.mandate_id) ?? null,
    origin_table: 'candidate_interview_answers',
    origin_label: 'Interview answer',
    origin_href: assessmentOriginHref(answer.mandate_id, answer.coach_id, answer.criterion, { interview: answer.id }),
    commercial_surfaces: ['Assessment workspace', 'Interview appendix', 'Head Coach Assessment Pack'],
  }))

  const referenceItems: IntelFeedItem[] = (referencesRes.data ?? []).map((answer) => ({
    id: answer.id,
    kind: 'reference',
    lane: 'References',
    occurred_at: answer.created_at,
    title: answer.question,
    detail: answer.answer,
    category: criterionLabel(answer.criterion),
    direction: answer.risk_flag ? 'Negative' : undefined,
    sensitivity: answer.risk_flag ? 'High' : 'Standard',
    confidence: confidenceFromVerification(answer.verification_status, answer.confidence),
    source_name: [answer.reference_name, answer.reference_role].filter(Boolean).join(', ') || null,
    source_type: `${answer.stakeholder_group} reference`,
    verification_status: answer.verification_status,
    used_in_recommendation: answer.used_in_recommendation,
    verified: answer.verification_status === 'verified',
    criterion: answer.criterion,
    criterion_label: criterionLabel(answer.criterion),
    method: 'references',
    method_label: methodLabel('references'),
    coach_id: answer.coach_id,
    coach_name: coachMap.get(answer.coach_id) ?? null,
    mandate_id: answer.mandate_id,
    mandate_label: mandateMap.get(answer.mandate_id) ?? null,
    origin_table: 'candidate_reference_answers',
    origin_label: 'Reference answer',
    origin_href: assessmentOriginHref(answer.mandate_id, answer.coach_id, answer.criterion, { reference: answer.id }),
    commercial_surfaces: ['Assessment workspace', 'References appendix', 'Board risk'],
  }))

  const materialItems: IntelFeedItem[] = (materialsRes.data ?? []).map((material) => ({
    id: material.id,
    kind: 'material',
    lane: 'Coach-submitted material',
    occurred_at: material.created_at,
    title: material.title,
    detail: material.description,
    category: material.material_type,
    sensitivity: material.confidentiality_status === 'confidential_room' ? 'confidential' : 'Standard',
    confidence: confidenceFromVerification(material.verification_status),
    source_name: material.source_label,
    source_type: material.uploaded_by === 'coach' ? 'Coach upload' : 'Internal upload',
    verification_status: material.verification_status,
    verified: material.verification_status === 'verified',
    coach_id: material.coach_id,
    coach_name: coachMap.get(material.coach_id) ?? null,
    origin_table: 'coach_private_materials',
    origin_label: 'Private material',
    origin_href: `/coach-portal/${material.coach_id}#material-${material.id}`,
    commercial_surfaces: ['Coach portal', 'Confidential access', 'Head Coach Assessment Pack'],
  }))

  const portalItems: IntelFeedItem[] = (portalProfilesRes.data ?? []).map((profile) => {
    const filledFields = [
      profile.football_identity,
      profile.in_possession_model,
      profile.out_of_possession_model,
      profile.training_week,
      profile.session_design_principles,
      profile.player_development_proof,
      profile.presentation_summary,
      profile.video_summary,
      profile.reference_permissions,
    ].filter((value) => typeof value === 'string' && value.trim().length > 0).length

    return {
      id: profile.id,
      kind: 'portal_profile',
      lane: 'Coach portal',
      occurred_at: safeDate(profile.reviewed_at, profile.updated_at),
      title: `${coachMap.get(profile.coach_id) ?? 'Coach'} portal depth profile`,
      detail: profile.personal_statement ?? profile.football_identity ?? profile.presentation_summary,
      category: profile.portal_status,
      sensitivity: profile.visibility_status === 'confidential' ? 'confidential' : 'Standard',
      confidence: Math.min(95, 35 + filledFields * 7),
      source_name: profile.representative_name ?? coachMap.get(profile.coach_id) ?? null,
      source_type: 'Coach-submitted profile',
      verification_status: profile.reviewed_at ? 'verified' : 'unverified',
      verified: Boolean(profile.reviewed_at),
      coach_id: profile.coach_id,
      coach_name: coachMap.get(profile.coach_id) ?? null,
      origin_table: 'coach_portal_profiles',
      origin_label: 'Coach portal profile',
      origin_href: `/coach-portal/${profile.coach_id}`,
      commercial_surfaces: ['Coach portal', 'Coach profile', 'Confidential access'],
    } satisfies IntelFeedItem
  })

  const allItems = [
    ...intelItems,
    ...interactionItems,
    ...claimItems,
    ...assessmentItems,
    ...interviewItems,
    ...referenceItems,
    ...materialItems,
    ...portalItems,
  ].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())

  const criterionCounts = ASSESSMENT_CRITERIA.map((criterion) => ({
    key: criterion.key,
    label: criterion.label,
    count: allItems.filter((item) => item.criterion === criterion.key || item.category === criterion.label).length,
  }))

  return (
    <CombinedFeed
      items={allItems}
      criterionCounts={criterionCounts}
      coaches={coaches}
      agents={agents}
      clubs={clubs}
      mandates={mandates}
    />
  )
}
