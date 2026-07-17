'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/db/activity'
import { isServiceModel } from '@/lib/mandates/appointment-plan'

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
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createMandateBuilderAction(formData: FormData) {
  const { supabase, user } = await requireUser()

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
  const relocationRequired = formData.get('relocation_required') === 'true'
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
    redirect('/mandates/new?error=Please+complete+all+required+fields')
  }
  if (new Date(engagementDate).getTime() > new Date(targetCompletionDate).getTime()) {
    redirect('/mandates/new?error=Target+date+must+be+on+or+after+the+engagement+date')
  }

  // ── Resolve club ──────────────────────────────────────────────────────────
  let clubId: string | null = null
  let customClubName: string | null = null

  if (clubIdOrName.startsWith('custom:')) {
    customClubName = clubIdOrName.slice(7).trim() || null
  } else if (isUuid(clubIdOrName)) {
    const { data: club } = await supabase
      .from('clubs').select('id').eq('id', clubIdOrName).eq('user_id', user.id).single()
    if (!club) redirect('/mandates/new?error=Club+not+found')
    clubId = club.id
  } else if (clubIdOrName) {
    const { data: newClub } = await supabase
      .from('clubs')
      .insert({ user_id: user.id, name: clubIdOrName, league: 'Other', country: 'TBC' })
      .select('id').single()
    if (newClub) clubId = newClub.id
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
    redirect(`/mandates/new?error=${encodeURIComponent(error?.message ?? 'Could not create mandate')}`)
  }

  await logActivity({
    entityType: 'mandate',
    entityId: mandate.id,
    actionType: 'created',
    description: 'Mandate created',
    metadata: clubId ? { club_id: clubId } : { custom_club_name: customClubName },
  })

  revalidatePath('/mandates')
  redirect(`/mandates/${mandate.id}/plan?success=Mandate+created`)
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updateMandateBuilderAction(formData: FormData) {
  const { supabase, user } = await requireUser()

  const mandateId = toText(formData.get('mandate_id'))
  if (!mandateId) redirect('/mandates?error=Missing+mandate+id')

  const { data: existing } = await supabase
    .from('mandates').select('id').eq('id', mandateId).eq('user_id', user.id).single()
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
  const relocationRequired = formData.get('relocation_required') === 'true'
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
      strategic_objective: strategicObjective || undefined,
      tactical_model_required: tacticalModel || undefined,
      pressing_intensity_required: pressingIntensity || undefined,
      build_preference_required: buildPreference || undefined,
      leadership_profile_required: leadershipProfile || undefined,
      budget_band: budgetBand || undefined,
      succession_timeline: successionTimeline || undefined,
      board_risk_appetite: boardRiskAppetite || undefined,
      language_requirements: languageRequirements.length > 0 ? languageRequirements : undefined,
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
    .eq('user_id', user.id)

  if (error) {
    redirect(`/mandates/${mandateId}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/mandates')
  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/plan`)
  revalidatePath(`/mandates/${mandateId}/workspace`)
  revalidatePath(`/mandates/${mandateId}/longlist`)
  redirect(`/mandates/${mandateId}/plan?success=Mandate+updated`)
}
