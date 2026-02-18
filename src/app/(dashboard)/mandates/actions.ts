'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function toText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
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

export async function createMandateAction(formData: FormData) {
  const { supabase, user } = await requireUser()

  const clubId = toText(formData.get('club_id'))
  const status = toText(formData.get('status'))
  const engagementDate = toText(formData.get('engagement_date'))
  const targetCompletionDate = toText(formData.get('target_completion_date'))
  const priority = toText(formData.get('priority'))
  const ownershipStructure = toText(formData.get('ownership_structure'))
  const budgetBand = toText(formData.get('budget_band'))
  const strategicObjective = toText(formData.get('strategic_objective'))
  const boardRiskAppetite = toText(formData.get('board_risk_appetite'))
  const successionTimeline = toText(formData.get('succession_timeline'))
  const keyStakeholdersInput = toText(formData.get('key_stakeholders'))
  const confidentialityLevel = toText(formData.get('confidentiality_level'))

  if (
    !clubId ||
    !status ||
    !engagementDate ||
    !targetCompletionDate ||
    !priority ||
    !ownershipStructure ||
    !budgetBand ||
    !strategicObjective ||
    !boardRiskAppetite ||
    !successionTimeline ||
    !confidentialityLevel
  ) {
    redirectWithMessage('/mandates/new', 'error', 'Please complete all required fields')
  }

  if (new Date(engagementDate).getTime() > new Date(targetCompletionDate).getTime()) {
    redirectWithMessage('/mandates/new', 'error', 'Target completion date must be on or after engagement date')
  }

  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id')
    .eq('id', clubId)
    .eq('user_id', user.id)
    .single()

  if (clubError || !club) {
    redirectWithMessage('/mandates/new', 'error', 'Please select a valid club')
  }

  const keyStakeholders = keyStakeholdersInput
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const { data: mandate, error: insertError } = await supabase
    .from('mandates')
    .insert({
      user_id: user.id,
      club_id: clubId,
      status,
      engagement_date: engagementDate,
      target_completion_date: targetCompletionDate,
      priority,
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

  const { error } = await supabase.from('mandate_shortlist').insert({
    mandate_id: mandateId,
    coach_id: coachId,
    placement_probability: placementProbability,
    risk_rating: riskRating,
    status,
  })

  if (error) {
    if (error.code === '23505') {
      redirectWithMessage(`/mandates/${mandateId}`, 'shortlist_error', 'Coach is already on this shortlist')
    }
    redirectWithMessage(`/mandates/${mandateId}`, 'shortlist_error', error.message || 'Could not add shortlist coach')
  }

  revalidatePath('/mandates')
  revalidatePath(`/mandates/${mandateId}`)
  redirect(`/mandates/${mandateId}?shortlist_success=Coach+added+to+shortlist`)
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

  const { data: mandate, error: mandateError } = await supabase
    .from('mandates')
    .insert({
      user_id: user.id,
      club_id: club.id,
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
