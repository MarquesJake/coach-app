// TODO: Future: migrate filtering from user_id to org_id for multi-tenant support.

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
      pipeline_stage,
      engagement_date,
      target_completion_date,
      budget_band,
      strategic_objective,
      tactical_model_required,
      pressing_intensity_required,
      build_preference_required,
      leadership_profile_required,
      succession_timeline,
      created_at,
      custom_club_name,
      clubs (
        name
      ),
      mandate_shortlist (
        id,
        candidate_stage
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export type BoardSignal = {
  mandateId: string
  topCoach: {
    name: string | null
    score: number
    fitLabel: string
    availStatus: string | null
    ieFlags: string[]
    hasRiskConcern: boolean
  } | null
  secondScore: number | null
  isScored: boolean
}

/** Fetch top-2 longlist entries for all mandates in one query. Group in JS. */
export async function getMandateBoardSignals(
  userId: string,
  mandateIds: string[]
): Promise<BoardSignal[]> {
  if (mandateIds.length === 0) return []
  const supabase = db()

  const { data } = await supabase
    .from('mandate_longlist')
    .select(`
      mandate_id,
      coach_id,
      ranking_score,
      fit_explanation,
      coaches (
        name,
        available_status
      )
    `)
    .in('mandate_id', mandateIds)
    .order('ranking_score', { ascending: false }) as { data: Array<{
      mandate_id: string
      coach_id: string
      ranking_score: number | null
      fit_explanation: string | null
      coaches: { name: string | null; available_status: string | null } | null
    }> | null }

  if (!data) return mandateIds.map((id) => ({ mandateId: id, topCoach: null, secondScore: null, isScored: false }))

  // Group by mandate_id, keep top 2
  const grouped = new Map<string, typeof data>()
  for (const row of data) {
    const list = grouped.get(row.mandate_id) ?? []
    if (list.length < 2) {
      list.push(row)
      grouped.set(row.mandate_id, list)
    }
  }

  return mandateIds.map((id) => {
    const entries = grouped.get(id) ?? []
    if (entries.length === 0) return { mandateId: id, topCoach: null, secondScore: null, isScored: false }

    const top = entries[0]
    const second = entries[1]
    let fitLabel = ''
    let ieFlags: string[] = []
    let hasRiskConcern = false
    try {
      const fit = JSON.parse(top.fit_explanation ?? '{}')
      fitLabel = fit.fitLabel ?? ''
      ieFlags = fit.ieFlags ?? []
      hasRiskConcern = Array.isArray(fit.concerns) && fit.concerns.some((c: string) =>
        /risk|flag|safeguard|legal|integrity/i.test(c)
      )
    } catch { /* ignore */ }

    return {
      mandateId: id,
      isScored: true,
      topCoach: {
        name: top.coaches?.name ?? null,
        score: top.ranking_score ?? 0,
        fitLabel,
        availStatus: top.coaches?.available_status ?? null,
        ieFlags,
        hasRiskConcern,
      },
      secondScore: second?.ranking_score ?? null,
    }
  })
}

/** Fetch mandate row with all fields required by mandateToContext() and the scoring engine. */
export async function getMandateFitFields(userId: string, mandateId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('mandates')
    .select(
      `id, custom_club_name, tactical_model_required, pressing_intensity_required,
       build_preference_required, leadership_profile_required, budget_band,
       strategic_objective, board_risk_appetite, succession_timeline,
       language_requirements, relocation_required, risk_tolerance`
    )
    .eq('id', mandateId)
    .eq('user_id', userId)
    .single()
  return { data, error }
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
      pipeline_stage,
      engagement_date,
      target_completion_date,
      ownership_structure,
      budget_band,
      strategic_objective,
      board_risk_appetite,
      succession_timeline,
      key_stakeholders,
      confidentiality_level,
      custom_club_name,
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
      notes,
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
