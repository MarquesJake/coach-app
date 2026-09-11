'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/db/activity'
import { parseDecisionBrief } from '@/lib/mandates/decision-brief'
import type { Json } from '@/lib/types/database'
import { isServiceModel } from '@/lib/mandates/appointment-plan'
import { getInternalOrganizationId } from '@/lib/organizations/context'

function toText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toList(value: FormDataEntryValue | null): string[] {
  return typeof value === 'string'
    ? value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createMandateBuilderAction(formData: FormData) {
  const { supabase, user } = await requireUser()
  const sourceBriefId = toText(formData.get('source_brief_id'))
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return { ok: false as const, error: 'Internal team access is required.' }
  const sourceResult = sourceBriefId ? await supabase.from('club_briefs').select('id,club_id').eq('id', sourceBriefId).eq('service_organization_id', organizationId).is('linked_mandate_id', null).in('status', ['submitted', 'in_review']).maybeSingle() : { data: null, error: null }
  if (sourceBriefId && (sourceResult.error || !sourceResult.data)) return { ok: false as const, error: 'The source brief has changed or is unavailable. Return to club intake before creating an appointment.' }
  if (sourceResult.data && sourceResult.data.club_id !== toText(formData.get('club_id_or_name'))) return { ok: false as const, error: 'An appointment created from a submitted brief must use the same club.' }
  let decisionBrief: Json
  try { decisionBrief = parseDecisionBrief(JSON.parse(toText(formData.get('decision_brief')) || '{}')) } catch { return { ok: false as const, error: 'Check appointment requirements and priorities before saving.' } }

  const clubIdOrName = toText(formData.get('club_id_or_name'))
  const strategicObjective = toText(formData.get('strategic_objective'))
  const tacticalModel = toText(formData.get('tactical_model_required'))
  const pressingIntensity = toText(formData.get('pressing_intensity_required'))
  const buildPreference = toText(formData.get('build_preference_required'))
  const leadershipProfile = toText(formData.get('leadership_profile_required'))
  const budgetBand = toText(formData.get('budget_band'))
  const successionTimeline = toText(formData.get('succession_timeline'))
  const boardRiskAppetite = toText(formData.get('board_risk_appetite'))
  const languageRequirements = toList(formData.get('language_requirements'))
  const relocationRequired = formData.get('relocation_required') === 'true' ? true : formData.get('relocation_required') === 'false' ? false : null
  const serviceModelInput = toText(formData.get('service_model'))
  const serviceModel = isServiceModel(serviceModelInput) ? serviceModelInput : null
  const engagementOwner = toText(formData.get('engagement_owner'))
  const engagementDate = toText(formData.get('engagement_date'))
  const targetCompletionDate = toText(formData.get('target_completion_date'))
  const appointmentSituation = toText(formData.get('ownership_structure'))
  const keyStakeholders = toList(formData.get('key_stakeholders'))
  const confidentialityLevel = toText(formData.get('confidentiality_level'))

  if (!clubIdOrName || !strategicObjective || !tacticalModel || !pressingIntensity ||
      !buildPreference || !leadershipProfile || !budgetBand || !successionTimeline ||
      !serviceModel || !engagementOwner || !engagementDate || !targetCompletionDate ||
      !appointmentSituation || keyStakeholders.length === 0 ||
      !['Standard', 'High', 'Board Only'].includes(confidentialityLevel)) {
    return { ok: false as const, error: 'Please complete all required fields' }
  }
  if (new Date(engagementDate).getTime() > new Date(targetCompletionDate).getTime()) {
    return { ok: false as const, error: 'Target date must be on or after the engagement date' }
  }

  // ── Resolve club ──────────────────────────────────────────────────────────
  let clubId: string | null = null
  let customClubName: string | null = null

  if (clubIdOrName.startsWith('custom:')) {
    customClubName = clubIdOrName.slice(7).trim() || null
  } else if (isUuid(clubIdOrName)) {
    const { data: club } = await supabase
      .from('clubs').select('id').eq('id', clubIdOrName).single()
    if (!club) return { ok: false as const, error: 'Club not found' }
    clubId = club.id
  } else if (clubIdOrName) {
    const { data: newClub } = await supabase
      .from('clubs')
      .insert({ user_id: user.id, name: clubIdOrName, league: 'Other', country: 'TBC' })
      .select('id').single()
    if (!newClub) return { ok: false as const, error: 'Could not save the club. Your brief has not been created.' }
    clubId = newClub.id
  }

  const { data: mandate, error } = await supabase
    .from('mandates')
    .insert({
      user_id: user.id,
      club_id: clubId,
      custom_club_name: customClubName,
      pipeline_stage: 'identified',
      status: 'Active',
      priority: 'High',
      engagement_date: engagementDate,
      target_completion_date: targetCompletionDate,
      ownership_structure: appointmentSituation,
      key_stakeholders: keyStakeholders,
      confidentiality_level: confidentialityLevel,
      decision_brief: decisionBrief,
      strategic_objective: strategicObjective,
      tactical_model_required: tacticalModel,
      pressing_intensity_required: pressingIntensity,
      build_preference_required: buildPreference,
      leadership_profile_required: leadershipProfile,
      budget_band: budgetBand,
      succession_timeline: successionTimeline,
      board_risk_appetite: boardRiskAppetite || 'Moderate',
      language_requirements: languageRequirements,
      relocation_required: relocationRequired,
      service_model: serviceModel,
      engagement_owner: engagementOwner,
    })
    .select('id').single()

  if (error || !mandate) {
    return { ok: false as const, error: 'Could not create the brief. Your draft has been kept; please retry.' }
  }

  await logActivity({
    entityType: 'mandate',
    entityId: mandate.id,
    actionType: 'created',
    description: 'Mandate created',
    metadata: { ...(clubId ? { club_id: clubId } : { custom_club_name: customClubName }), ...(sourceBriefId ? { source_brief_id: sourceBriefId, source_acceptance: 'pending' } : {}) },
  })

  revalidatePath('/mandates')
  return { ok: true as const, redirectTo: sourceBriefId ? `/club-briefs?brief_id=${encodeURIComponent(sourceBriefId)}&created_mandate=${mandate.id}#brief-${encodeURIComponent(sourceBriefId)}` : `/mandates/${mandate.id}/decision?success=Appointment+created` }
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updateMandateBuilderAction(formData: FormData) {
  const { supabase } = await requireUser()

  let decisionBrief: Json
  try { decisionBrief = parseDecisionBrief(JSON.parse(toText(formData.get('decision_brief')) || '{}')) } catch { throw new Error('Invalid appointment requirements') }
  const mandateId = toText(formData.get('mandate_id'))
  if (!mandateId) redirect('/mandates?error=Missing+mandate+id')

  const { data: existing } = await supabase
    .from('mandates').select('id').eq('id', mandateId).single()
  if (!existing) redirect('/mandates?error=Mandate+not+found')

  const strategicObjective = toText(formData.get('strategic_objective'))
  const tacticalModel = toText(formData.get('tactical_model_required'))
  const pressingIntensity = toText(formData.get('pressing_intensity_required'))
  const buildPreference = toText(formData.get('build_preference_required'))
  const leadershipProfile = toText(formData.get('leadership_profile_required'))
  const budgetBand = toText(formData.get('budget_band'))
  const successionTimeline = toText(formData.get('succession_timeline'))
  const boardRiskAppetite = toText(formData.get('board_risk_appetite'))
  const languageRequirements = toList(formData.get('language_requirements'))
  const relocationRequired = formData.get('relocation_required') === 'true' ? true : formData.get('relocation_required') === 'false' ? false : null
  const serviceModelInput = toText(formData.get('service_model'))
  const serviceModel = isServiceModel(serviceModelInput) ? serviceModelInput : null
  const engagementOwner = toText(formData.get('engagement_owner'))
  const engagementDate = toText(formData.get('engagement_date'))
  const targetCompletionDate = toText(formData.get('target_completion_date'))
  const appointmentSituation = toText(formData.get('ownership_structure'))
  const keyStakeholders = toList(formData.get('key_stakeholders'))
  const confidentialityLevel = toText(formData.get('confidentiality_level'))
  if (!serviceModel) redirect(`/mandates/${mandateId}/edit?error=Choose+a+valid+service+model`)
  if (!engagementOwner) redirect(`/mandates/${mandateId}/edit?error=Add+an+internal+owner`)
  if (!engagementDate || !targetCompletionDate || !appointmentSituation || keyStakeholders.length === 0) {
    redirect(`/mandates/${mandateId}/edit?error=Complete+the+appointment+context+and+decision+makers`)
  }
  if (new Date(engagementDate).getTime() > new Date(targetCompletionDate).getTime()) {
    redirect(`/mandates/${mandateId}/edit?error=Target+date+must+follow+the+engagement+date`)
  }
  if (!['Standard', 'High', 'Board Only'].includes(confidentialityLevel)) {
    redirect(`/mandates/${mandateId}/edit?error=Choose+a+valid+confidentiality+level`)
  }

  const { error } = await supabase
    .from('mandates')
    .update({
      decision_brief: decisionBrief,
      strategic_objective: strategicObjective || undefined,
      tactical_model_required: tacticalModel || undefined,
      pressing_intensity_required: pressingIntensity || undefined,
      build_preference_required: buildPreference || undefined,
      leadership_profile_required: leadershipProfile || undefined,
      budget_band: budgetBand || undefined,
      succession_timeline: successionTimeline || undefined,
      board_risk_appetite: boardRiskAppetite || undefined,
      language_requirements: languageRequirements,
      relocation_required: relocationRequired,
      service_model: serviceModel,
      engagement_owner: engagementOwner,
      engagement_date: engagementDate,
      target_completion_date: targetCompletionDate,
      ownership_structure: appointmentSituation,
      key_stakeholders: keyStakeholders,
      confidentiality_level: confidentialityLevel,
    })
    .eq('id', mandateId)

  if (error) {
    redirect(`/mandates/${mandateId}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/mandates')
  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/plan`)
  revalidatePath(`/mandates/${mandateId}/workspace`)
  revalidatePath(`/mandates/${mandateId}/decision`)
  revalidatePath(`/mandates/${mandateId}/candidates`)
  revalidatePath(`/mandates/${mandateId}/longlist`)
  redirect(`/mandates/${mandateId}/decision?success=Appointment+updated`)
}
