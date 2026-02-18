

import { db } from './client'

type MandateInsert = {
  club_id: string
  status: string
  engagement_date: string
  target_completion_date: string
  priority: string
  ownership_structure: string
  budget_band: string
  strategic_objective: string
  board_risk_appetite: string
  succession_timeline: string
  key_stakeholders: string[]
  confidentiality_level: string
}

type ShortlistInsert = {
  coach_id: string
  placement_probability: number
  risk_rating: string
  status: string
}

type DeliverableInsert = {
  item: string
  due_date: string
  status: string
}

export async function getMandatesForUser(userId: string) {
  const supabase = db()
  return supabase
    .from('mandates')
    .select(
      `
      id,
      status,
      priority,
      engagement_date,
      target_completion_date,
      created_at,
      clubs (
        name
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function getMandateDetailForUser(userId: string, mandateId: string) {
  const supabase = db()

  const mandateResult = await supabase
    .from('mandates')
    .select(
      `
      id,
      status,
      priority,
      engagement_date,
      target_completion_date,
      ownership_structure,
      budget_band,
      strategic_objective,
      board_risk_appetite,
      succession_timeline,
      key_stakeholders,
      confidentiality_level,
      clubs (
        name,
        league
      )
    `
    )
    .eq('id', mandateId)
    .eq('user_id', userId)
    .single()

  if (mandateResult.error || !mandateResult.data) {
    return { mandateResult }
  }

  const shortlistResult = await supabase
    .from('mandate_shortlist')
    .select(
      `
      id,
      coach_id,
      placement_probability,
      risk_rating,
      status,
      coaches (
        name,
        club_current,
        nationality
      )
    `
    )
    .eq('mandate_id', mandateId)
    .order('placement_probability', { ascending: false })

  const deliverablesResult = await supabase
    .from('mandate_deliverables')
    .select('id, item, due_date, status')
    .eq('mandate_id', mandateId)
    .order('due_date', { ascending: true })

  return { mandateResult, shortlistResult, deliverablesResult }
}

export async function createMandateForUser(userId: string, input: MandateInsert) {
  const supabase = db()
  return supabase
    .from('mandates')
    .insert({
      user_id: userId,
      ...input,
    })
    .select('id')
    .single()
}

export async function addShortlistForUser(
  userId: string,
  mandateId: string,
  input: ShortlistInsert
) {
  const supabase = db()

  const mandateCheck = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', userId)
    .single()

  if (mandateCheck.error || !mandateCheck.data) {
    return { mandateCheck }
  }

  const insertResult = await supabase.from('mandate_shortlist').insert({
    mandate_id: mandateId,
    ...input,
  })

  return { mandateCheck, insertResult }
}

export async function addDeliverableForUser(
  userId: string,
  mandateId: string,
  input: DeliverableInsert
) {
  const supabase = db()

  const mandateCheck = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', userId)
    .single()

  if (mandateCheck.error || !mandateCheck.data) {
    return { mandateCheck }
  }

  const insertResult = await supabase.from('mandate_deliverables').insert({
    mandate_id: mandateId,
    ...input,
  })

  return { mandateCheck, insertResult }
}